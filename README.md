# Lil Flow - Web Application for Productivity Management with Gamification

##  Giới thiệu
**Lil Flow** là ứng dụng web quản lý năng suất kết hợp yếu tố game hóa, giúp người dùng (đặc biệt là học sinh, sinh viên) quản lý thời gian và duy trì động lực học tập/làm việc thông qua việc chăm sóc thú cưng ảo.

 **Live Demo**: [Đang cập nhật]
 **Repository**: https://github.com/gb-rizu212/thanh-truc-DACN

##  Tính năng chính
###  Công cụ roductivity 
- **Pomodoro Timer**: Bộ đếm thời gian tập trung với cơ chế thưởng
- **Task Management**: Quản lý công việc theo ngày/tháng
- **Notes System**: Ghi chú có tổ chức theo thư mục
- **Mood Journal**: Nhật ký tâm trạng và theo dõi cảm xúc

###  Gamification 
- **Virtual Pet**: Thú cưng ảo với 5 chỉ số động (đói, hạnh phúc, sức khỏe, năng lượng, kinh nghiệm)
- **Decay System**: Chỉ số tự động thay đổi theo thời gian thực
- **Shop & Inventory**: Cửa hàng mua vật phẩm và kho lưu trữ
- **Reward System**: Nhận vàng, XP khi hoàn thành timer/task

###  Room-based Interface
- **Home**: Tổng quan pet, shop, inventory
- **Office**: Timer Pomodoro, task management, calendar
- **Kitchen**: Sử dụng vật phẩm từ kho
- **Bedroom**: Mood tracking, journal
- **Pics Room**: Motivation media, notes editor
- **Games Room**: 4 mini-games giải trí

##  Công nghệ sử dụng
### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- LocalStorage cho dữ liệu tạm thời
- Responsive Design

### Backend
- **Node.js** với **Express.js** framework
- **MySQL** database (mysql2 driver)
- **JWT** (jsonwebtoken) cho authentication
- **CORS** middleware
- **dotenv** cho environment variables

### Database Schema
- `users`: Thông tin tài khoản
- `pets`: Trạng thái thú cưng
- `items`: Danh mục vật phẩm
- `inventory`: Kho đồ của người dùng

##  Cài đặt và test file

### Cần có các file sau
- Node.js (v14+)
- MySQL
- npm
- express.js, jwwt, cors 

### Bước 1: Vào terminal, gõ cụm: [cd "______ (địa chỉ file)\backend" ] 
hoặc bạn có thể vào thư mục "backend" -> click chuột phải -> open in terminal
### Bước 2: Khi terminal  trỏ đến thư mục backend -> chạy lệnh [ node server_test.js ]
nếu terminal hiện ra các console log kết nối thành công -> bạn đã chạy server thành công.
### Bước 3: Vào trình duyệt, gõ [localhost:3000] -> trang giới thiệu
### Bước 4: Test trang web với acc test:
- username: test
- mật khẩu: 123
nếu bạn được dưa vào trang chủ, xin chúc mừng bạn đã chạy server thành công! 

## Manual testing checklist
- Đăng ký/Đăng nhập thành công
- Timer hoạt động và thưởng đúng
- Decay system tính toán chính xác
- Mua bán vật phẩm không lỗi
- Tất cả game hoạt động bình thường

## Câu hỏi thường gặp (FAQ)
Q: Tôi có thể thay đổi tốc độ decay không?
A: Có, chỉnh sửa hàm applyDecay trong backend/routes/pet.js

Q: Làm sao để thêm vật phẩm mới?
A: Thêm record vào bảng items trong database

## Liên hệ tác giả
- Tên: Tống Thị Thanh Trúc
- Lớp: 23CNTT2
- Email: parkryeoki@gmail
- GitHub: gb-rizu212

## Giấy phép
Dự án được phát triển cho mục đích học thuật và mã nguồn mở dưới giấy phép MIT.

MIT License

Copyright (c) 2025 Tống Thị Thanh Trúc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Nếu sử dụng dự án cho nghiên cứu, vui lòng trích dẫn:
Tống Thị Thanh Trúc. (2025). Lil Flow - Web Application for Productivity Management with Gamification. 
Đại học Sư phạm Đà Nẵng.

## Lời cảm ơn
-Xin chân thành cảm ơn:
- Cô Vũ Thị Trà - Giảng viên hướng dẫn tận tình
- Khoa Toán - Tin - Đại học Sư phạm Đà Nẵng
- Cộng đồng mã nguồn mở - Vì những công cụ tuyệt vời
- Gia đình và bạn bè - Đã hỗ trợ và động viên
