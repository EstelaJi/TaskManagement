import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

const seedDatabase = async () => {
  try {
    console.log('🌱 开始填充测试数据...')

    const password_hash = await bcrypt.hash('123456', 10)

    const createUserSQL = `
      INSERT INTO users (username, email, password_hash, full_name)
      VALUES 
        ('john_doe', 'john@example.com', $1, 'John Doe'),
        ('jane_smith', 'jane@example.com', $1, 'Jane Smith'),
        ('bob_johnson', 'bob@example.com', $1, 'Bob Johnson')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, username
    `

    const usersResult = await pool.query(createUserSQL, [password_hash])
    const users = usersResult.rows

    if (users.length > 0) {
      console.log(`✅ 成功创建 ${users.length} 个用户`)
    } else {
      const existingUsers = await pool.query('SELECT id, username FROM users LIMIT 3')
      users.push(...existingUsers.rows)
      console.log('ℹ️  使用现有用户数据')
    }

    const johnId = users[0]?.id || 1
    const janeId = users[1]?.id || 2
    const bobId = users[2]?.id || 3

    const createTasksSQL = `
      INSERT INTO tasks (user_id, title, description, status, priority, due_date)
      VALUES 
        ($1, '完成项目报告', '编写项目进度报告并提交给上级', 'pending', 'high', '2024-01-20 18:00:00'),
        ($1, '回复客户邮件', '处理客户的咨询邮件', 'completed', 'medium', '2024-01-15 12:00:00'),
        ($1, '准备会议材料', '为下周的团队会议准备演示文稿', 'pending', 'medium', NULL),
        ($2, '代码审查', '审查团队成员提交的代码', 'in_progress', 'high', '2024-01-18 17:00:00'),
        ($2, '更新文档', '更新项目的技术文档', 'pending', 'low', NULL),
        ($2, '测试新功能', '测试新开发的功能模块', 'completed', 'high', '2024-01-14 18:00:00'),
        ($3, '设计数据库', '设计新功能的数据库表结构', 'in_progress', 'high', '2024-01-19 12:00:00'),
        ($3, '修复Bug', '修复用户反馈的已知问题', 'pending', 'medium', '2024-01-17 16:00:00'),
        ($3, '优化性能', '优化系统的响应速度', 'pending', 'low', NULL),
        ($3, '部署新版本', '将最新版本部署到生产环境', 'pending', 'high', '2024-01-21 10:00:00')
      ON CONFLICT DO NOTHING
    `

    await pool.query(createTasksSQL, [johnId, janeId, bobId])
    console.log('✅ 成功创建测试任务')

    const countUsers = await pool.query('SELECT COUNT(*) as count FROM users')
    const countTasks = await pool.query('SELECT COUNT(*) as count FROM tasks')

    console.log('\n📊 数据库统计：')
    console.log(`   用户数量: ${countUsers.rows[0].count}`)
    console.log(`   任务数量: ${countTasks.rows[0].count}`)

    console.log('\n🎉 测试数据填充完成！')

  } catch (error) {
    console.error('❌ 填充测试数据失败:', error.message)
    console.error('详细错误:', error.stack)
  } finally {
    await pool.end()
  }
}

seedDatabase()
