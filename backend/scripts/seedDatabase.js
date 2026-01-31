import { query } from '../config/database.js'
import bcrypt from 'bcrypt'

const seedDatabase = async () => {
  try {
    console.log('Seeding database...')
    
    // 清空现有数据
    await query('DELETE FROM tasks')
    await query('DELETE FROM users')
    console.log('Cleared existing data')
    
    // 创建示例用户
    const passwordHash = await bcrypt.hash('password123', 10)
    
    const users = [
      {
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: passwordHash,
        first_name: 'John',
        last_name: 'Doe'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: passwordHash,
        first_name: 'Jane',
        last_name: 'Smith'
      },
      {
        username: 'bob_wilson',
        email: 'bob@example.com',
        password_hash: passwordHash,
        first_name: 'Bob',
        last_name: 'Wilson'
      }
    ]
    
    const insertedUsers = []
    for (const user of users) {
      const result = await query(
        'INSERT INTO users (username, email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user.username, user.email, user.password_hash, user.first_name, user.last_name]
      )
      insertedUsers.push(result.rows[0])
    }
    
    console.log('Inserted users:', insertedUsers.map(u => ({ id: u.id, username: u.username })))
    
    // 创建示例任务
    const tasks = [
      {
        title: '完成项目文档',
        description: '编写项目的技术文档和用户手册',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
        assigned_to: insertedUsers[0].id,
        created_by: insertedUsers[1].id
      },
      {
        title: '代码审查',
        description: '审查新功能的代码实现',
        status: 'in_progress',
        priority: 'medium',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
        assigned_to: insertedUsers[1].id,
        created_by: insertedUsers[0].id
      },
      {
        title: '修复登录bug',
        description: '修复用户登录时的验证问题',
        status: 'completed',
        priority: 'high',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 昨天
        assigned_to: insertedUsers[2].id,
        created_by: insertedUsers[0].id
      },
      {
        title: '优化数据库查询',
        description: '优化慢查询，提高系统性能',
        status: 'pending',
        priority: 'low',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
        assigned_to: insertedUsers[2].id,
        created_by: insertedUsers[1].id
      },
      {
        title: '设计新功能界面',
        description: '设计新功能的用户界面原型',
        status: 'in_progress',
        priority: 'medium',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
        assigned_to: insertedUsers[0].id,
        created_by: insertedUsers[2].id
      }
    ]
    
    const insertedTasks = []
    for (const task of tasks) {
      const result = await query(
        'INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [task.title, task.description, task.status, task.priority, task.due_date, task.assigned_to, task.created_by]
      )
      insertedTasks.push(result.rows[0])
    }
    
    console.log('Inserted tasks:', insertedTasks.map(t => ({ id: t.id, title: t.title, status: t.status })))
    
    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  }
}

// 如果直接运行此文件，则执行数据填充
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log('Seeding completed')
    process.exit(0)
  })
}

export default seedDatabase