# Backend API (MongoDB)

## 📋 Tổng quan

Backend này sử dụng **MongoDB** và chạy trên **port 5001**. Đây là backend chính của ứng dụng.

## 🏗️ Cấu trúc

```
backend/
├── config/           # Configuration (Passport, etc.)
├── controllers/      # Business logic
│   ├── auth.controller.js      # Authentication
│   ├── admin.controller.js     # Admin management
│   ├── apikey.controller.js    # API key management
│   └── generate.controller.js   # AI generation
├── db/               # Database
│   ├── connectDB.js  # MongoDB connection
│   └── models/       # Mongoose models
├── middleware/       # Express middleware
│   ├── verifyToken.js   # JWT verification
│   └── verifyAdmin.js   # Admin role check
├── routes/           # API routes
│   ├── auth.route.js
│   ├── admin.route.js
│   ├── apikey.route.js
│   └── generate.route.js
├── utils/            # Utilities
│   ├── encryption.js         # API key encryption
│   ├── aiHelpers.js          # AI helper functions
│   └── generateTokenAndSetCookie.js
└── index.js          # Main server file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/check-auth` - Kiểm tra auth
- `POST /api/auth/verify-email` - Xác thực email

### Admin
- `POST /api/admin/promote-me` - Nâng cấp lên admin
- `GET /api/admin/users` - Lấy danh sách users
- `DELETE /api/admin/users/:id` - Xóa user
- `POST /api/admin/rag/sync` - Sync RAG

### API Key
- `GET /api/user/apikey` - Lấy API key
- `POST /api/user/apikey` - Lưu API key
- `DELETE /api/user/apikey` - Xóa API key
- `POST /api/test-apikey` - Test API key

### AI Generation
- `POST /api/generate` - Generate GeoGebra commands
- `POST /api/chat` - Chat để modify commands

## 🔐 Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/garanmath
PORT=5001
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
ADMIN_SECRET=garanmath2024
ENCRYPTION_KEY=01234567890123456789012345678901
```

## 🚀 Chạy Server

```bash
npm run backend
```

## 📝 Lưu ý

- Backend này thay thế cho `server/index.js` (SQLite - port 3001)
- Tất cả frontend calls đã chuyển sang port 5001
- Database: MongoDB thay vì SQLite
