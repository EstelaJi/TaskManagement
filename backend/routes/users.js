import express from 'express';
import { User, Task } from '../models/index.js';
import { Op } from 'sequelize';
const router = express.Router();
// 获取所有用户
router.get('/', async (req, res) => {
 try {
 const { page = 1, limit = 10, search = '', role } = req.query;
 const offset = (page - 1) * limit;
 const whereClause = {
 [Op.or]: [
 { username: { [Op.iLike]: `%${search}%` } },
 { email: { [Op.iLike]: `%${search}%` } },
 { firstName: { [Op.iLike]: `%${search}%` } },
 { lastName: { [Op.iLike]: `%${search}%` } }
 ]
 };
 if (role) {
 whereClause.role = role;
 }
 const { count, rows: users } = await User.findAndCountAll({
 where: whereClause,
 attributes: { exclude: ['password'] },
 limit: parseInt(limit),
 offset: parseInt(offset),
 order: [['createdAt', 'DESC']]
 });
 res.json({
 users,
 pagination: {
 total: count,
 page: parseInt(page),
 limit: parseInt(limit),
 totalPages: Math.ceil(count / limit)
 }
 });
 }
 catch (error) {
 console.error('Error fetching users:', error);
 res.status(500).json({ error: 'Failed to fetch users', details: error.message });
 }
});
// 获取单个用户
router.get('/:id', async (req, res) => {
 try {
 const { id } = req.params;
 const user = await User.findByPk(id, {
 attributes: { exclude: ['password'] },
 include: [{
 model: Task,
 as: 'tasks',
 attributes: ['id', 'title', 'status', 'priority', 'createdAt']
 }]
 });
 if (!user) {
 return res.status(404).json({ error: 'User not found' });
 }
 res.json(user);
 }
 catch (error) {
 console.error('Error fetching user:', error);
 res.status(500).json({ error: 'Failed to fetch user', details: error.message });
 }
});
// 创建新用户
router.post('/', async (req, res) => {
 try {
 const { username, email, password, firstName, lastName, avatar, role } = req.body;
 // 验证必填字段
 if (!username || !email || !password) {
 return res.status(400).json({ error: 'Username, email, and password are required' });
 }
 // 检查用户名或邮箱是否已存在
 const existingUser = await User.findOne({
 where: {
 [Op.or]: [{ username }, { email }]
 }
 });
 if (existingUser) {
 return res.status(409).json({ error: 'Username or email already exists' });
 }
 const newUser = await User.create({
 username,
 email,
 password,
 firstName,
 lastName,
 avatar,
 role
 });
 // 返回用户信息时不包含密码
 const userResponse = newUser.toJSON();
 delete userResponse.password;
 res.status(201).json(userResponse);
 }
 catch (error) {
 console.error('Error creating user:', error);
 if (error.name === 'SequelizeValidationError') {
 return res.status(400).json({
 error: 'Validation failed',
 details: error.errors.map(e => e.message)
 });
 }
 res.status(500).json({ error: 'Failed to create user', details: error.message });
 }
});
// 更新用户
router.patch('/:id', async (req, res) => {
 try {
 const { id } = req.params;
 const { username, email, password, firstName, lastName, avatar, role, isActive } = req.body;
 const user = await User.findByPk(id);
 if (!user) {
 return res.status(404).json({ error: 'User not found' });
 }
 // 如果要更新用户名或邮箱，检查是否已被其他用户使用
 if (username || email) {
 const existingUser = await User.findOne({
 where: {
 [Op.and]: [
 { id: { [Op.ne]: id } },
 {
 [Op.or]: [
 { username: username || user.username },
 { email: email || user.email }
 ]
 }
 ]
 }
 });
 if (existingUser) {
 return res.status(409).json({ error: 'Username or email already exists' });
 }
 }
 await user.update({
 username: username !== undefined ? username : user.username,
 email: email !== undefined ? email : user.email,
 password: password !== undefined ? password : user.password,
 firstName: firstName !== undefined ? firstName : user.firstName,
 lastName: lastName !== undefined ? lastName : user.lastName,
 avatar: avatar !== undefined ? avatar : user.avatar,
 role: role !== undefined ? role : user.role,
 isActive: isActive !== undefined ? isActive : user.isActive
 });
 const userResponse = user.toJSON();
 delete userResponse.password;
 res.json(userResponse);
 }
 catch (error) {
 console.error('Error updating user:', error);
 if (error.name === 'SequelizeValidationError') {
 return res.status(400).json({
 error: 'Validation failed',
 details: error.errors.map(e => e.message)
 });
 }
 res.status(500).json({ error: 'Failed to update user', details: error.message });
 }
});
// 删除用户
router.delete('/:id', async (req, res) => {
 try {
 const { id } = req.params;
 const user = await User.findByPk(id);
 if (!user) {
 return res.status(404).json({ error: 'User not found' });
 }
 // 软删除：设置 isActive 为 false
 await user.update({ isActive: false });
 // 或者硬删除：
 // await user.destroy();
 res.status(204).send();
 }
 catch (error) {
 console.error('Error deleting user:', error);
 res.status(500).json({ error: 'Failed to delete user', details: error.message });
 }
});
// 获取用户的任务
router.get('/:id/tasks', async (req, res) => {
 try {
 const { id } = req.params;
 const { status, priority, page = 1, limit = 10 } = req.query;
 const offset = (page - 1) * limit;
 const user = await User.findByPk(id);
 if (!user) {
 return res.status(404).json({ error: 'User not found' });
 }
 const whereClause = { userId: id };
 if (status)
 whereClause.status = status;
 if (priority)
 whereClause.priority = priority;
 const { count, rows: tasks } = await Task.findAndCountAll({
 where: whereClause,
 limit: parseInt(limit),
 offset: parseInt(offset),
 order: [['dueDate', 'ASC'], ['priority', 'DESC']]
 });
 res.json({
 tasks,
 pagination: {
 total: count,
 page: parseInt(page),
 limit: parseInt(limit),
 totalPages: Math.ceil(count / limit)
 }
 });
 }
 catch (error) {
 console.error('Error fetching user tasks:', error);
 res.status(500).json({ error: 'Failed to fetch user tasks', details: error.message });
 }
});
export default router;

