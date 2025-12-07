# Setup Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Setup MongoDB
- Install MongoDB locally hoặc dùng MongoDB Atlas
- Copy connection string vào `.env.local`

## 3. Setup Google OAuth
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới
3. Enable Google+ API
4. Tạo OAuth 2.0 credentials
5. Thêm Authorized redirect URIs: `http://localhost:5001/api/auth/google/callback`
6. Copy Client ID và Client Secret vào `.env.local`

## 4. Cấu hình .env.local
Điền đầy đủ các biến môi trường trong file `.env.local`

## 5. Run Project
```bash
npm start
```

Hoặc chạy riêng:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run backend
```

## 6. Access
- Frontend: http://localhost:5173
- Backend: http://localhost:5001
