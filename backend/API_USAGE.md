# Task Management API 接口文档

## 前置要求

1. 确保 PostgreSQL 数据库已安装并运行
2. 创建数据库：`createdb task_management`
3. 配置 `.env` 文件中的数据库连接信息

## 安装依赖

```bash
cd TaskManagement/backend
npm install
```

## 初始化数据库

```bash
# 创建表结构
npm run init-db

# 填充测试数据
npm run seed-data
```

## 启动服务器

```bash
npm run dev
```

服务器将运行在: `http://localhost:3001`

---

## API 接口

### 健康检查

```
GET /api/health
```

**响应示例：**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

## 用户接口 (Users)

### 1. 获取所有用户

```
GET /api/users
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "created_at": "2024-01-17T10:00:00.000Z",
      "updated_at": "2024-01-17T10:00:00.000Z"
    }
  ]
}
```

### 2. 获取单个用户

```
GET /api/users/:id
```

**路径参数：**
- `id`: 用户ID

### 3. 创建新用户

```
POST /api/users
Content-Type: application/json
```

**请求体：**
```json
{
  "username": "test_user",
  "email": "test@example.com",
  "password": "123456",
  "full_name": "Test User"
}
```

**必填字段：**
- `username`: 用户名 (唯一)
- `email`: 邮箱 (唯一)
- `password`: 密码

**可选字段：**
- `full_name`: 全名

### 4. 更新用户

```
PATCH /api/users/:id
Content-Type: application/json
```

**请求体（可更新部分或全部字段）：**
```json
{
  "username": "new_username",
  "email": "newemail@example.com",
  "password": "newpassword",
  "full_name": "New Full Name"
}
```

### 5. 删除用户

```
DELETE /api/users/:id
```

---

## 任务接口 (Tasks)

### 1. 获取所有任务

```
GET /api/tasks
```

**查询参数（可选）：**
- `user_id`: 用户ID，过滤特定用户的任务
- `status`: 任务状态 (pending, in_progress, completed)
- `priority`: 优先级 (low, medium, high)

**示例：**
```
GET /api/tasks?user_id=1&status=pending&priority=high
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "title": "完成项目报告",
      "description": "编写项目进度报告并提交给上级",
      "status": "pending",
      "priority": "high",
      "due_date": "2024-01-20T18:00:00.000Z",
      "completed_at": null,
      "created_at": "2024-01-17T10:00:00.000Z",
      "updated_at": "2024-01-17T10:00:00.000Z"
    }
  ]
}
```

### 2. 获取单个任务

```
GET /api/tasks/:id
```

**路径参数：**
- `id`: 任务ID

### 3. 创建新任务

```
POST /api/tasks
Content-Type: application/json
```

**请求体：**
```json
{
  "user_id": 1,
  "title": "完成项目报告",
  "description": "编写项目进度报告并提交给上级",
  "status": "pending",
  "priority": "high",
  "due_date": "2024-01-20T18:00:00.000Z"
}
```

**必填字段：**
- `user_id`: 用户ID
- `title`: 任务标题

**可选字段：**
- `description`: 任务描述
- `status`: 状态 (默认: pending)
- `priority`: 优先级 (默认: medium)
- `due_date`: 截止日期

### 4. 更新任务

```
PATCH /api/tasks/:id
Content-Type: application/json
```

**请求体（可更新部分或全部字段）：**
```json
{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "status": "completed",
  "priority": "medium",
  "due_date": "2024-01-25T18:00:00.000Z",
  "completed_at": "2024-01-20T12:00:00.000Z"
}
```

### 5. 删除任务

```
DELETE /api/tasks/:id
```

### 6. 获取用户任务统计

```
GET /api/tasks/user/:user_id/stats
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {"status": "pending", "count": 5},
    {"status": "in_progress", "count": 2},
    {"status": "completed", "count": 3}
  ]
}
```

---

## Postman 测试示例

### 1. 创建用户

**请求：**
```
POST http://localhost:3001/api/users
Content-Type: application/json

{
  "username": "test_user",
  "email": "test@example.com",
  "password": "123456",
  "full_name": "Test User"
}
```

### 2. 创建任务

**请求：**
```
POST http://localhost:3001/api/tasks
Content-Type: application/json

{
  "user_id": 1,
  "title": "学习 Node.js",
  "description": "学习 Express 和 PostgreSQL",
  "status": "in_progress",
  "priority": "high"
}
```

### 3. 获取用户的所有待完成任务

**请求：**
```
GET http://localhost:3001/api/tasks?user_id=1&status=pending
```

---

## 错误响应格式

### 404 资源未找到
```json
{
  "success": false,
  "error": "User not found"
}
```

### 400 请求参数错误
```json
{
  "success": false,
  "error": "user_id and title are required"
}
```

### 500 服务器错误
```json
{
  "success": false,
  "error": "详细错误信息"
}
```

---

## 数据库表结构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| email | VARCHAR(100) | 邮箱（唯一） |
| password_hash | VARCHAR(255) | 密码哈希 |
| full_name | VARCHAR(100) | 全名 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### tasks 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | SERIAL | 主键 |
| user_id | INTEGER | 用户ID（外键） |
| title | VARCHAR(200) | 任务标题 |
| description | TEXT | 任务描述 |
| status | VARCHAR(20) | 状态 (pending, in_progress, completed) |
| priority | VARCHAR(20) | 优先级 (low, medium, high) |
| due_date | TIMESTAMP | 截止日期 |
| completed_at | TIMESTAMP | 完成时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
