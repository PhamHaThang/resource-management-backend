# Resource Management Backend

Hệ thống Quản lý và Đăng ký Tài nguyên - Backend
Đây là backend cho dự án Hệ thống Quản lý và Đăng ký Tài nguyên Học viện, được xây dựng bằng Node.js, Express, và MongoDB. Hệ thống cho phép sinh viên và giảng viên xem, tìm kiếm và đăng ký sử dụng các tài nguyên (phòng học, thiết bị), đồng thời cung cấp cho quản trị viên các công cụ để quản lý người dùng, tài nguyên, và xem báo cáo thống kê.

Mục lục
Tính năng chính

Công nghệ sử dụng

Hướng dẫn cài đặt

Cấu hình Biến môi trường

Tài liệu API

Cấu trúc thư mục

Tính năng chính
Đối với Quản trị viên (Admin)
Quản lý Người dùng: Thêm, sửa, xóa, và quản lý trạng thái các tài khoản người dùng.

Quản lý Tài nguyên: Quản lý vòng đời của tài nguyên và các loại tài nguyên.

Quản lý Đặt lịch: Phê duyệt hoặc từ chối các yêu cầu đặt tài nguyên từ người dùng.

Quản lý Báo cáo Sự cố: Theo dõi và cập nhật trạng thái các sự cố được báo cáo.

Dashboard Thống kê: Xem các báo cáo trực quan về tình hình sử dụng tài nguyên và các số liệu khác.

Đối với Người dùng (Student/Teacher)
Xác thực: Đăng ký, đăng nhập an toàn bằng JWT, quên mật khẩu.

Quản lý Tài khoản: Xem và cập nhật thông tin cá nhân, đổi mật khẩu.

Xem và Đặt lịch: Tìm kiếm, lọc tài nguyên và gửi yêu cầu đặt lịch sử dụng.

Báo cáo Sự cố: Gửi báo cáo kèm hình ảnh về các sự cố gặp phải khi sử dụng tài nguyên.

Thông báo: Nhận thông báo về trạng thái đặt lịch và các cập nhật khác.

Công nghệ sử dụng
Nền tảng: Node.js

Framework: Express.js

Cơ sở dữ liệu: MongoDB với Mongoose ODM

Xác thực: JSON Web Tokens (JWT)

Upload File: Multer và Cloudinary

Gửi Email: Nodemailer

Validation: Middleware tùy chỉnh

Hướng dẫn cài đặt
Clone repository:

git clone [https://your-repository-url.git](https://your-repository-url.git)
cd resource-management-backend

Cài đặt các dependencies:

npm install

Tạo file .env:
Tạo một file .env ở thư mục gốc và điền các biến môi trường cần thiết. Xem mục Cấu hình Biến môi trường để biết chi tiết.

Chạy server ở chế độ development:

npm start

Server sẽ chạy tại http://localhost:5000 (hoặc cổng bạn đã cấu hình).

Chạy tests (nếu có):

npm test

Cấu hình Biến môi trường
Bạn cần tạo một file .env ở thư mục gốc của dự án với các biến sau:

# Server

PORT=5000

# MongoDB

MONGO_URI=your_mongodb_connection_string

# JSON Web Token

JWT_SECRET=your_jwt_secret_key

# Cloudinary (để upload ảnh)

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer (để gửi email)

SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Frontend URL (để reset mật khẩu)

FRONTEND_RESET_PASSWORD_URL=[http://your-frontend-domain.com/reset-password](http://your-frontend-domain.com/reset-password)

Tài liệu API
Chúng tôi cung cấp một bộ sưu tập Postman chi tiết để bạn dễ dàng kiểm thử các endpoint.

Vui lòng tham khảo file ResourceManagementAPI.postman_collection.json trong repository (nếu có) để import vào Postman.

Cấu trúc thư mục
Dự án được tổ chức theo cấu trúc module hóa để dễ dàng bảo trì và mở rộng:

.
├── config/ # Cấu hình (database, cloudinary)
├── controllers/ # Logic xử lý cho các routes
├── middlewares/ # Các middleware (xác thực, validation, xử lý lỗi)
├── models/ # Định nghĩa Schema cho MongoDB
├── routes/ # Định tuyến các API endpoint
├── utils/ # Các hàm tiện ích (gửi mail, xử lý lỗi)
├── server.js # File khởi tạo server
└── package.json
