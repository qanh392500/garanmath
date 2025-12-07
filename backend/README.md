# Backend API Documentation

## Authentication Endpoints

Base URL: `http://localhost:5001/api/auth`

### 1. Signup
**POST** `/signup`

Tạo tài khoản mới và gửi email xác thực.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "isVerified": false
  }
}
```

### 2. Verify Email
**POST** `/verify-email`

Xác thực email bằng mã 6 chữ số.

**Request Body:**
```json
{
  "code": "123456"
}
```

### 3. Login
**POST** `/login`

Đăng nhập vào hệ thống.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 4. Logout
**POST** `/logout`

Đăng xuất và xóa cookie.

### 5. Forgot Password
**POST** `/forgot-password`

Gửi link reset password qua email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 6. Reset Password
**POST** `/reset-password/:token`

Reset password với token từ email.

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

### 7. Check Auth
**GET** `/check-auth`

Kiểm tra trạng thái đăng nhập (yêu cầu token).

**Response:**
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "isVerified": true
  }
}
```

## Environment Variables

Tạo file `.env` dựa trên `.env.example`:

```
MONGO_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

SMTP_PASSWORD=your_gmail_app_password
SMTP_NAME=YourAppName
SMTP_EMAIL=your_email@gmail.com
CLIENT_URL=http://localhost:5173
```

## Run Server

```bash
npm run dev    # Development mode with nodemon
npm start      # Production mode
```
