# Task Management 后端 - 快速启动指南

## 📋 系统要求

- Node.js 18+
- PostgreSQL 14+

## 🚀 快速启动

### 1. 安装依赖

```bash
cd TaskManagement/backend
npm install
```

### 2. 配置数据库

确保 PostgreSQL 服务已启动：

```bash
# macOS
brew services start postgresql

# 或使用 Docker
docker run -d \
  --name postgres-task \
  -e POSTGRES_DB=task_management \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:14
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并修改数据库连接信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=postgres
```

### 4. 初始化数据库

```bash
# 创建表结构
npm run init-db

# 填充测试数据（可选）
npm run seed-data
```

### 5. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

服务器运行在：`http://localhost:3001`

## 🔍 验证安装

使用 curl 或 Postman 测试：

```bash
# 健康检查
curl http://localhost:3001/api/health

# 获取所有用户
curl http://localhost:3001/api/users

# 获取所有任务
curl http://localhost:3001/api/tasks
```

## 📚 API 文档

详细的 API 接口说明请查看：[API_USAGE.md](./API_USAGE.md)

## 🛠️ 开发命令

```bash
npm run dev          # 开发模式（自动重启）
npm start            # 生产模式
npm run init-db      # 初始化数据库表
npm run seed-data    # 填充测试数据
```

## 🐛 常见问题

### 1. 数据库连接失败

- 确认 PostgreSQL 服务正在运行
- 检查 `.env` 文件中的数据库配置
- 确认数据库 `task_management` 已创建

### 2. 端口被占用

修改 `.env` 文件中的 `PORT` 为其他端口（如 3002）

### 3. 表不存在错误

运行 `npm run init-db` 初始化数据库表结构

## 📦 项目结构

```
TaskManagement/backend/
├── config/
│   └── database.js          # 数据库连接配置
├── models/
│   ├── User.js              # 用户模型
│   └── Task.js              # 任务模型
├── routes/
│   ├── users.js             # 用户路由
│   └── tasks.js             # 任务路由
├── scripts/
│   ├── init-db.js           # 数据库初始化脚本
│   └── seed-data.js         # 测试数据填充脚本
├── .env                     # 环境变量配置
├── .env.example             # 环境变量示例
├── API_USAGE.md             # API 接口文档
├── QUICK_START.md           # 快速启动指南（本文件）
├── package.json             # 项目配置
└── server.js                # 服务器入口文件
```

## 🔐 测试账号

运行 `npm run seed-data` 后会创建以下测试用户：

| 用户名 | 邮箱 | 密码 | 全名 |
|--------|------|------|------|
| john_doe | john@example.com | 123456 | John Doe |
| jane_smith | jane@example.com | 123456 | Jane Smith |
| bob_johnson | bob@example.com | 123456 | Bob Johnson |

## 🎯 下一步

1. 使用 Postman 测试 API 接口
2. 查看 [API_USAGE.md](./API_USAGE.md) 了解所有接口
3. 集成前端应用
4. 添加身份验证（JWT）
5. 实现前端到后端的调用

## 📝 注意事项

- 不要将 `.env` 文件提交到版本控制
- 生产环境请使用强密码
- 建议使用环境变量管理数据库连接信息
