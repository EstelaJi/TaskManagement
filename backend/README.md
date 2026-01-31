# Task Management API

这是一个基于 Node.js、Express 和 PostgreSQL 的任务管理系统后端 API。

## 设置

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env
```

编辑 `.env` 文件，设置你的 PostgreSQL 数据库连接信息：
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3001
```

3. 设置数据库（首次运行）：
```bash
npm run setup-db
```
这将创建必要的数据库表，并询问是否要填充示例数据。

4. 启动服务器：
```bash
npm run dev
```

## API 端点

### 用户管理

#### 获取所有用户
```
GET /api/users
```

#### 获取单个用户
```
GET /api/users/:id
```

#### 创建新用户
```
POST /api/users
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password_hash": "hashed_password",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### 更新用户
```
PATCH /api/users/:id
Content-Type: application/json

{
  "username": "john_doe_updated",
  "email": "john_updated@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### 删除用户
```
DELETE /api/users/:id
```

### 任务管理

#### 获取所有任务
```
GET /api/tasks
```

#### 获取单个任务
```
GET /api/tasks/:id
```

#### 创建新任务
```
POST /api/tasks
Content-Type: application/json

{
  "title": "完成项目文档",
  "description": "编写项目的技术文档和用户手册",
  "status": "pending",
  "priority": "high",
  "due_date": "2023-12-31T23:59:59.000Z",
  "assigned_to": 1,
  "created_by": 2
}
```

#### 更新任务
```
PATCH /api/tasks/:id
Content-Type: application/json

{
  "title": "完成项目文档（更新）",
  "status": "in_progress",
  "priority": "medium"
}
```

#### 删除任务
```
DELETE /api/tasks/:id
```

### 健康检查

```
GET /api/health
```

## 数据库模式

### users 表
- id (SERIAL, PRIMARY KEY)
- username (VARCHAR(50), UNIQUE, NOT NULL)
- email (VARCHAR(100), UNIQUE, NOT NULL)
- password_hash (VARCHAR(255), NOT NULL)
- first_name (VARCHAR(50))
- last_name (VARCHAR(50))
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### tasks 表
- id (SERIAL, PRIMARY KEY)
- title (VARCHAR(255), NOT NULL)
- description (TEXT)
- status (VARCHAR(20), DEFAULT 'pending')
- priority (VARCHAR(20), DEFAULT 'medium')
- due_date (TIMESTAMP)
- assigned_to (INTEGER, REFERENCES users(id))
- created_by (INTEGER, REFERENCES users(id))
- created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

## 示例数据

你可以使用提供的种子脚本来填充示例数据：

```bash
npm run seed-db
```

这将创建 3 个示例用户和 5 个示例任务。

或者，你也可以在设置数据库时选择填充示例数据：

```bash
npm run setup-db
```

这个命令会询问是否要填充示例数据。

## 错误处理

API 使用标准的 HTTP 状态码：
- 200: 成功
- 201: 创建成功
- 204: 删除成功
- 400: 请求错误
- 404: 资源未找到
- 409: 资源冲突（如用户名或邮箱已存在）
- 500: 服务器内部错误

所有错误响应都包含一个错误消息：
```json
{
  "error": "错误描述"
}
```