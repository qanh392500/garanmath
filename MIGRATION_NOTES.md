# Migration Notes: SQLite → MongoDB

## Tình trạng hiện tại

### Trước đây (Server cũ - SQLite)
- **Location**: `server/index.js`
- **Port**: 3001
- **Database**: SQLite (`server/database.js`)
- **Routes**: Đầy đủ (auth, admin, apikey, generate, chat)
- **Status**: ⚠️ **DEPRECATED** - Không còn được sử dụng

### Hiện tại (Backend mới - MongoDB)
- **Location**: `backend/index.js`
- **Port**: 5001
- **Database**: MongoDB
- **Routes**: Đầy đủ (auth, admin, apikey, generate, chat)
- **Status**: ✅ **ACTIVE** - Đang sử dụng

## Tại sao phải thêm routes vào backend mới?

1. **Frontend đã chuyển sang port 5001**
   - Tất cả API calls trong frontend đã được cập nhật để gọi `localhost:5001`
   - Frontend không còn gọi `localhost:3001` nữa

2. **Backend mới chỉ có auth routes ban đầu**
   - Khi tạo backend mới, chỉ có authentication routes
   - Thiếu routes cho: admin, apikey, generate, chat
   - → Frontend gọi các routes này → 404 Not Found

3. **Migration từ SQLite sang MongoDB**
   - Server cũ dùng SQLite (file-based database)
   - Backend mới dùng MongoDB (NoSQL database)
   - Cần migrate logic từ SQLite queries sang MongoDB queries

## Cấu trúc hiện tại

```
backend/                    # ✅ Backend mới (MongoDB) - ACTIVE
├── controllers/
│   ├── auth.controller.js      # Authentication
│   ├── admin.controller.js     # Admin management
│   ├── apikey.controller.js    # API key management
│   └── generate.controller.js  # AI generation
├── routes/
│   ├── auth.route.js
│   ├── admin.route.js
│   ├── apikey.route.js
│   └── generate.route.js
└── index.js

server/                     # ⚠️ Server cũ (SQLite) - DEPRECATED
├── index.js               # Có thể xóa sau khi confirm không cần
├── database.js
├── rag_service.js
└── knowledge_base.js
```

## Clean Code Recommendations

1. **Xóa server cũ** (nếu không cần):
   - Có thể xóa folder `server/` nếu chắc chắn không dùng nữa
   - Hoặc giữ lại nhưng thêm comment DEPRECATED

2. **Tổ chức lại backend**:
   - Đã có cấu trúc tốt: controllers, routes, middleware, utils
   - Có thể thêm services folder cho business logic

3. **Environment variables**:
   - Đảm bảo `.env` có đầy đủ:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `CLIENT_URL`
     - `ADMIN_SECRET` (optional)

## Next Steps

1. ✅ Backend mới đã có đầy đủ routes
2. ⚠️ Cần test kỹ để đảm bảo tất cả features hoạt động
3. 🗑️ Có thể xóa `server/` folder sau khi confirm

