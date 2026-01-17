# Task Management API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **Content-Type**: `application/json`

## 数据库设置

### 1. 安装 PostgreSQL

确保已安装 PostgreSQL 数据库

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. 初始化数据库

运行以下命令创建数据库表并插入示例数据：

```bash
cd backend
npm run init-db
```

其他可用命令：

```bash
# 重置数据库（删除表、重新创建并插入示例数据）
npm run reset-db

# 只插入示例数据
npm run seed-db
```

### 4. 启动服务器

```bash
npm run dev
```

## API 接口

### Users 接口

#### 1. 获取所有用户

**请求**
```
GET /api/users
```

**响应示例**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-17T10:00:00.000Z",
    "updated_at": "2024-01-17T10:00:00.000Z"
  }
]
```

#### 2. 获取单个用户

**请求**
```
GET /api/users/:id
```

**响应示例**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "created_at": "2024-01-17T10:00:00.000Z",
  "updated_at": "2024-01-17T10:00:00.000Z"
}
```

#### 3. 创建用户

**请求**
```
POST /api/users
Content-Type: application/json

{
  "username": "new_user",
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User"
}
```

**响应示例**
```json
{
  "id": 3,
  "username": "new_user",
  "email": "newuser@example.com",
  "full_name": "New User",
  "created_at": "2024-01-17T10:00:00.000Z",
  "updated_at": "2024-01-17T10:00:00.000Z"
}
```

#### 4. 更新用户

**请求**
```
PATCH /api/users/:id
Content-Type: application/json

{
  "full_name": "Updated Name",
  "email": "updated@example.com"
}
```

**响应示例**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "updated@example.com",
  "full_name": "Updated Name",
  "created_at": "2024-01-17T10:00:00.000Z",
  "updated_at": "2024-01-17T10:05:00.000Z"
}
```

#### 5. 删除用户

**请求**
```
DELETE /api/users/:id
```

**响应**
- 状态码: 204 No Content

### Tasks 接口

#### 1. 获取所有任务

**请求**
```
GET /api/tasks
```

**查询参数**
- `user_id` (可选): 按用户ID筛选
- `status` (可选): 按状态筛选 (pending, in_progress, completed)
- `category` (可选): 按分类筛选

**示例**
```
GET /api/tasks?user_id=1&status=pending
```

**响应示例**
```json
[
  {
    "id": 1,
    "title": "Learn Vue 3 basics",
    "description": "Know the core concepts and Composition API of Vue 3",
    "status": "pending",
    "category": "learning",
    "priority": "high",
    "due_date": null,
    "user_id": 1,
    "created_at": "2024-01-17T10:00:00.000Z",
    "updated_at": "2024-01-17T10:00:00.000Z"
  }
]
```

#### 2. 获取单个任务

**请求**
```
GET /api/tasks/:id
```

**响应示例**
```json
{
  "id": 1,
  "title": "Learn Vue 3 basics",
  "description": "Know the core concepts and Composition API of Vue 3",
  "status": "pending",
  "category": "learning",
  "priority": "high",
  "due_date": null,
  "user_id": 1,
  "created_at": "2024-01-17T10:00:00.000Z",
  "updated_at": "2024-01-17T10:00:00.000Z"
}
```

#### 3. 创建任务

**请求**
```
POST /api/tasks
Content-Type: application/json

{
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "category": "work",
  "priority": "medium",
  "due_date": "2024-12-31T23:59:59.000Z",
  "user_id": 1
}
```

**字段说明**
- `title` (必填): 任务标题
- `description` (可选): 任务描述
- `status` (可选): 任务状态，默认 'pending'，可选值: 'pending', 'in_progress', 'completed'
- `category` (可选): 任务分类
- `priority` (可选): 任务优先级，默认 'medium'，可选值: 'low', 'medium', 'high'
- `due_date` (可选): 截止日期 (ISO 8601 格式)
- `user_id` (可选): 关联的用户ID

**响应示例**
```json
{
  "id": 5,
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "category": "work",
  "priority": "medium",
  "due_date": "2024-12-31T23:59:59.000Z",
  "user_id": 1,
  "created_at": "2024-01-17T10:00:00.000Z",
  "updated_at": "2024-01-17T10:00:00.000Z"
}
```

#### 4. 更新任务

**请求**
```
PATCH /api/tasks/:id
Content-Type: application/json

{
  "title": "Updated Task Title",
  "status": "in_progress",
  "priority": "high"
}
```

**响应示例**
```json
{
  "id": 1,
  "title": "Updated Task Title",
  "description": "Know the core concepts and Composition API of Vue 3",
  "status": "in_progress",
  "category": "learning",
  "priority": "high",
  "due_date": null,
  "user_id": 1,
  "created_at": "2024-01-17T10:00:00.000Z",
  "updated_at": "2024-01-17T10:05:00.000Z"
}
```

#### 5. 删除任务

**请求**
```
DELETE /api/tasks/:id
```

**响应**
- 状态码: 204 No Content

### Health Check

**请求**
```
GET /api/health
```

**响应示例**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## 错误响应

### 400 Bad Request
```json
{
  "error": "Title is required"
}
```

### 404 Not Found
```json
{
  "error": "Task not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch tasks"
}
```

## Postman 测试示例

### 1. 创建用户
- Method: POST
- URL: http://localhost:3001/api/users
- Body (raw JSON):
```json
{
  "username": "test_user",
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User"
}
```

### 2. 创建任务
- Method: POST
- URL: http://localhost:3001/api/tasks
- Body (raw JSON):
```json
{
  "title": "Complete project",
  "description": "Finish the task management project",
  "status": "pending",
  "category": "project",
  "priority": "high",
  "user_id": 1
}
```

### 3. 获取所有任务
- Method: GET
- URL: http://localhost:3001/api/tasks

### 4. 更新任务状态
- Method: PATCH
- URL: http://localhost:3001/api/tasks/1
- Body (raw JSON):
```json
{
  "status": "completed"
}
```

### 5. 删除任务
- Method: DELETE
- URL: http://localhost:3001/api/tasks/1
