# Google OAuth 2.0 Setup

## Bước 1: Tạo Project
1. Vào https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Đặt tên project → Create

## Bước 2: Enable API
1. Vào "APIs & Services" → "Library"
2. Tìm "Google+ API" → Enable

## Bước 3: Tạo OAuth Credentials
1. Vào "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Chọn "Web application"
4. Thêm:
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5001/api/auth/google/callback`
5. Click "Create"

## Bước 4: Copy Credentials
- Copy **Client ID** và **Client Secret**
- Paste vào file `.env.local`:
```
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Bước 5: Configure OAuth Consent Screen
1. Vào "OAuth consent screen"
2. Chọn "External" → Create
3. Điền thông tin cơ bản
4. Thêm scopes: `email`, `profile`
5. Thêm test users (email của bạn)
6. Save

Done! Restart backend để áp dụng.
