# Resource Management Backend

Backend quản lý và đăng ký tài nguyên cho Học viện, xây dựng trên **Node.js**, **Express**, và **MongoDB**. Hệ thống hỗ trợ sinh viên, giảng viên đặt lịch sử dụng phòng học, thiết bị; quản trị viên quản lý tài nguyên, người dùng và báo cáo.

---

## 📌 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [Biến môi trường](#-biến-môi-trường)
- [Scripts](#-scripts)
- [Tài liệu API](#-tài-liệu-api)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)

---

## ✅ Tính năng

### Đối với Quản trị viên

- Quản lý người dùng: tạo, cập nhật, vô hiệu hóa tài khoản.
- Quản lý tài nguyên: tạo loại tài nguyên, điều chỉnh lịch khả dụng.
- Phê duyệt/ từ chối đăng ký sử dụng tài nguyên.
- Theo dõi báo cáo sự cố và cập nhật trạng thái xử lý.
- Dashboard thống kê: tỷ lệ sử dụng, mức độ lỗi, số phiên đặt lịch.

### Đối với Sinh viên / Giảng viên

- Xác thực JWT, đăng ký, đăng nhập, quên mật khẩu.
- Quản lý tài khoản cá nhân, đổi mật khẩu.
- Tìm kiếm, lọc tài nguyên và gửi yêu cầu đặt lịch.
- Báo cáo sự cố kèm hình ảnh.
- Nhận thông báo về trạng thái đặt lịch, phê duyệt, nhắc lịch.

---

## 🛠 Công nghệ sử dụng

| Mục           | Công nghệ                                    |
| ------------- | -------------------------------------------- |
| Runtime       | Node.js >= 18                                |
| Framework     | Express.js                                   |
| Cơ sở dữ liệu | MongoDB + Mongoose                           |
| Xác thực      | JSON Web Tokens (JWT), Passport (tùy chọn)   |
| Upload        | Multer + Cloudinary                          |
| Gửi email     | Nodemailer (cấu hình qua `utils/mailConfig`) |

---

## 💻 Yêu cầu hệ thống

- Node.js >= 18
- npm >= 9
- MongoDB (Atlas hoặc self-hosted)
- Đã cài đặt `git`

---

## 🚀 Hướng dẫn cài đặt

```bash
git clone https://github.com/PhamHaThang/resource-management-backend
cd resource-management-backend

npm install

cp .env.example .env
# Chỉnh sửa .env theo [Biến môi trường](#-biến-môi-trường)

npm run dev
# Server mặc định tại http://localhost:5000
```

Production build:

```bash
npm run build
npm start
```

---

## 🔐 Biến môi trường

```ini
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/resource-management

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Mail (bắt buộc)
SMTP_USER =
SMTP_PASS =
MAIL_FROM =
MAIL_FROM =

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend
FRONTEND_RESET_PASSWORD_URL=https://frontend.example.com/reset-password
```

---

## 📜 Scripts

| Lệnh          | Mô tả                     |
| ------------- | ------------------------- |
| `npm run dev` | Chạy server với nodemon   |
| `npm start`   | Chạy bản build production |

---

---

## 📘 Tài liệu API

- Postman collection (`docs/ResourceManagement.postman_collection.json`).

---

## 🗂 Cấu trúc thư mục

```text
.
├── config/                 # Cấu hình kết nối DB, cloudinary, rate-limit,...
├── controllers/            # Controller Express (mỏng, gọi service)
├── services/               # Business logic
├── middlewares/            # Auth, upload, validation, error handler
├── models/                 # Mongoose schema/model
├── routes/                 # Khai báo routes
├── utils/                  # Tiện ích (mail, logger, helper)
├── docs/                   # Tài liệu API, sơ đồ
├── server.js               # Khởi tạo app/HTTP server
└── package.json
```

---
