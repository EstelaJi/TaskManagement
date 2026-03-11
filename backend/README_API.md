# Task Management API

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password

CORS_ORIGIN=http://localhost:5173
```

### 3. 创建数据库

在 PostgreSQL 中创建数据库：

```sql
CREATE DATABASE task_management;
```

### 4. 运行数据库 schema

可以通过两种方式创建表：

**方式一：使用 Sequelize 自动同步（开发环境）**

修改 `models/index.js` 中的 `sync` 选项：

```javascript
await sequelize.sync({ force: true }) // 会删除所有表并重建
// 或
await sequelize.sync({ alter: true }) // 会修改表结构以匹配模型
```

**方式二：运行 SQL 文件**

```bash
psql -U postgres -d task_management -f sql/schema.sql
```

### 5. 启动服务器

```bash
npm run dev
# 或
npm start
```

### 6. 测试 API

导入 Postman 集合：
- 文件位置：`postman/Task Management API.postman_collection.json`

## API 端点

### Users API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/users` | 获取所有用户（支持分页、搜索、过滤） |
| GET | `/api/users/:id` | 获取单个用户（包含任务列表） |
| POST | `/api/users` | 创建新用户 |
| PATCH | `/api/users/:id` | 更新用户信息 |
| DELETE | `/api/users/:id` | 删除用户（软删除） |
| GET | `/api/users/:id/tasks` | 获取用户的所有任务 |

### Tasks API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/tasks` | 获取所有任务（支持分页、搜索、过滤） |
| GET | `/api/tasks/:id` | 获取单个任务 |
| POST | `/api/tasks` | 创建新任务 |
| PATCH | `/api/tasks/:id` | 更新任务 |
| DELETE | `/api/tasks/:id` | 删除任务（软删除） |
| POST | `/api/tasks/batch-delete` | 批量删除任务 |
| GET | `/api/tasks/stats/summary` | 获取任务统计信息 |

## 请求示例

### 创建用户

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 创建任务

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the task management project",
    "status": "pending",
    "priority": "high",
    "userId": 1,
    "tags": ["work", "urgent"]
  }'
```

### 获取所有任务

```bash
curl "http://localhost:3001/api/tasks?page=1&limit=10&status=pending&priority=high"
```

## 数据库模型

### User 表字段

- `id` - 主键
- `username` - 用户名（唯一）
- `email` - 邮箱（唯一）
- `password` - 密码（加密存储）
- `firstName` - 名
- `lastName` - 姓
- `avatar` - 头像URL
- `role` - 角色 (admin/user)
- `isActive` - 是否激活
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

### Task 表字段

- `id` - 主键
- `title` - 任务标题
- `description` - 任务描述
- `status` - 状态 (pending/in_progress/completed/cancelled)
- `priority` - 优先级 (low/medium/high/urgent)
- `category` - 分类
- `dueDate` - 截止日期
- `userId` - 关联用户ID
- `tags` - 标签数组
- `isActive` - 是否激活
- `createdAt` - 创建时间
- `updatedAt` - 更新时间
