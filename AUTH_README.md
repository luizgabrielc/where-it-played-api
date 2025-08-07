# Authentication System Setup

This project now includes a complete authentication system with login and register functionality using Neon PostgreSQL.

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL='postgresql://neondb_owner:**************@ep-calm-feather-ac9k5o57-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Installation

Install the required dependencies:

```bash
pnpm install
```

## Database Setup

The database tables will be automatically created when the application starts. The system creates a `users` table with the following structure:

- `id`: Serial primary key
- `email`: Unique email address
- `password`: Hashed password
- `name`: User's full name
- `created_at`: Timestamp when user was created
- `updated_at`: Timestamp when user was last updated

## API Endpoints

### Register User
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Response:**
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Login User
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Get User Profile (Protected Route)
- **GET** `/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
  ```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Authentication**: Secure token-based authentication with 24-hour expiration
3. **Input Validation**: All inputs are validated using class-validator decorators
4. **Unique Email Constraint**: Database-level constraint ensures unique email addresses
5. **Error Handling**: Proper error responses for invalid credentials, duplicate emails, etc.

## Usage Examples

### Register a new user:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Access protected route:
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Project Structure

```
src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── database/
│   ├── database.service.ts
│   ├── database-init.service.ts
│   └── database.module.ts
└── app.module.ts
```

## Running the Application

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

The application will automatically initialize the database tables on startup. 