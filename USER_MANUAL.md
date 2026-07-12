# 📖 HƯỚNG DẪN SỬ DỤNG PHẦN MỀM QUẢN LÝ CHDV (RENTFLOW)
*Tài liệu hướng dẫn toàn diện dành cho Chủ nhà và Quản lý*

---

## 📑 Mục Lục
1. [Giới thiệu chung](#1-giới-thiệu-chung)
2. [Đăng nhập & Xác thực](#2-đăng-nhập--xác-thực)
3. [Quy trình 4 bước cho người mới (Workflow)](#3-quy-trình-4-bước-cho-người-mới-workflow)
4. [Giải thích các Menu Tính Năng](#4-giải-thích-các-menu-tính-năng)
5. [Dành Cho Khách Thuê (Tenant Portal)](#5-dành-cho-khách-thuê-tenant-portal)
6. [Quản lý Dữ liệu & Sao lưu (Excel Backup)](#6-quản-lý-dữ-liệu--sao-lưu-excel-backup)
7. [Mẹo Sử Dụng (Tips)](#7-mẹo-sử-dụng-tips)
8. [Câu Hỏi Thường Gặp (FAQ) & Hỗ Trợ](#8-câu-hỏi-thường-gặp-faq--hỗ-trợ)

---

## 🌟 1. Giới thiệu chung
Chào mừng bạn đến với hệ thống **Quản Lý CHDV (RentFlow)**! Đây là giải pháp phần mềm toàn diện giúp bạn tự động hóa hoàn toàn công việc vận hành căn hộ dịch vụ, nhà trọ. 
Thay vì phải dùng sổ sách hay bảng tính rườm rà, giờ đây mọi thông tin về Khách thuê, Hợp đồng, Hóa đơn (điện, nước), và Báo cáo tài chính đều được quản lý tập trung trên một giao diện hiện đại, trực quan và an toàn.

---

## 🔐 2. Đăng nhập & Xác thực
Hệ thống sử dụng cơ chế bảo mật xác thực tiên tiến của Firebase, mang lại trải nghiệm đăng nhập mượt mà:
- **Đăng nhập bằng Google (Khuyên dùng):** Chỉ với 1 cú click chuột vào nút "Đăng nhập bằng Google", bạn không cần phải nhớ mật khẩu. Hệ thống tự động nhận diện email của bạn để cấp quyền truy cập tương ứng (Admin, Quản lý, hoặc Khách thuê).
- **Tài khoản/Mật khẩu truyền thống:** Bạn vẫn có thể sử dụng Email và Mật khẩu mặc định do Quản trị viên cấp.

---

## 🚀 3. Quy trình 4 bước cho người mới (Workflow)
Nếu bạn là người mới lần đầu sử dụng, hãy thao tác theo thứ tự sau để hệ thống hoạt động trơn tru nhất:

1. **Thiết lập cơ bản:** Vào menu `Cấu hình` -> Khai báo danh sách các Tòa nhà và thiết lập Đơn giá dịch vụ mặc định (Giá điện, giá nước, rác, wifi...).
2. **Khởi tạo không gian:** Vào menu `Quản lý Phòng` -> Tạo các phòng tương ứng cho từng Tòa nhà (Số phòng, diện tích, giá thuê).
3. **Đón khách mới:** Vào menu `Khách & Hóa Đơn` -> Bấm nút **Tạo Hợp Đồng** tại các phòng trống để điền thông tin khách thuê, số điện thoại, CCCD, tiền cọc và ngày hết hạn.
4. **Vận hành hàng tháng:** Cuối tháng, vào menu `Khách & Hóa Đơn` -> Chốt số điện/nước -> Bấm **Tạo Hóa Đơn** và gửi cho khách. Khi khách đóng tiền, chuyển trạng thái hóa đơn sang "Đã thu".

---

## 🛠 4. Giải thích các Menu Tính Năng

### 📊 4.1. Tổng Quan (Dashboard)
- Nơi cung cấp cái nhìn toàn cảnh về tình hình kinh doanh của bạn.
- Hiển thị biểu đồ **Doanh thu & Lợi nhuận**, Tỷ lệ lấp đầy phòng (Số phòng trống / đang thuê / bảo trì).
- Cung cấp nút thao tác nhanh: **Backup Dữ Liệu (Excel)**.

### 🏢 4.2. Quản Lý Phòng
- Trình bày toàn bộ danh sách phòng theo từng Tòa nhà (Nhà A, Nhà B...) dưới dạng thẻ thông tin trực quan.
- Có thể tạo mới, chỉnh sửa nhanh giá thuê, diện tích, tình trạng thiết bị trong phòng.
- Bộ lọc thông minh giúp tìm nhanh các phòng "Trống", "Đang thuê" hoặc "Bảo trì".

### 👥 4.3. Khách & Hóa Đơn
Đây là màn hình bạn sẽ làm việc nhiều nhất, chia làm 2 tab chính:
- **Tab Phòng & Khách Thuê:** Xem thông tin ai đang ở phòng nào, hợp đồng bao giờ hết hạn, tình trạng công nợ hiện tại. Hỗ trợ tạo hợp đồng mới, xem hồ sơ chi tiết của từng khách.
- **Tab Hóa Đơn:** Bảng tổng hợp toàn bộ hóa đơn của tất cả các phòng. Cung cấp bộ lọc theo tháng, tình trạng thanh toán (Chưa thu / Đã thu / Thu một phần). Bấm vào Hóa đơn để xem chi tiết và in biên lai.

### 🔧 4.4. Bảo Trì & Sự Cố (Kanban)
- Nơi quản lý các yêu cầu sửa chữa (Hư bóng đèn, kẹt ống nước...) từ khách hàng hoặc người quản lý ghi nhận.
- Giao diện kéo-thả (Kanban board) trực quan qua 3 cột: `Mới báo` -> `Đang xử lý` -> `Đã hoàn thành`.
- Ghi nhận chi phí sửa chữa để hệ thống tự động hạch toán trừ vào biểu đồ lợi nhuận cuối tháng.

### ⚙️ 4.5. Phân Quyền & Cấu Hình
- **Cấu hình Hệ thống:** Chỉnh sửa thông tin Tòa nhà, Dịch vụ, Số tài khoản ngân hàng.
- **Quản lý Dữ liệu:** Hỗ trợ tính năng "Nạp Dữ Liệu Mẫu" (Mock Data) để người dùng mới dễ dàng làm quen với hệ thống, và "Xóa Trắng Dữ Liệu" khi cần làm lại từ đầu.
- **Phân quyền (Tùy chọn):** Dành cho chủ nhà (Super Admin) cấp tài khoản cho Quản lý / Bảo vệ, giới hạn quyền xem và thao tác.

---

## 📱 5. Dành Cho Khách Thuê (Tenant Portal)
Hệ thống không chỉ dành cho chủ nhà mà còn cung cấp cho mỗi khách thuê một không gian (Portal) riêng biệt. Khi khách thuê truy cập trang web và đăng nhập bằng **chính Email đã ghi trong hợp đồng** (bằng nút Đăng nhập Google), họ có thể:
- Xem chi tiết **Hợp đồng đang thuê** (Ngày bắt đầu, hết hạn, Tiền cọc).
- Theo dõi **Hóa đơn hàng tháng** và chi tiết các khoản phí (Điện, nước, rác...).
- Gửi **Yêu cầu bảo trì/sự cố** trực tiếp kèm hình ảnh cho ban quản lý. Ban quản lý sẽ nhận được thông báo ngay lập tức ở tab Bảo Trì.

---

## 💾 6. Quản lý Dữ liệu & Sao lưu (Excel Backup)
An toàn dữ liệu là ưu tiên hàng đầu của phần mềm.
- **Lưu trữ Cloud:** Mọi thao tác trên phần mềm đều được tự động lưu trữ lên máy chủ Đám mây (Firebase), không sợ mất dữ liệu khi hỏng máy tính hay mất điện.
- **Sao lưu Excel (Backup):** Tại trang Tổng Quan, bạn chỉ cần bấm nút `Backup Dữ Liệu (Excel)`. Hệ thống sẽ xuất toàn bộ dữ liệu (Danh sách phòng, Khách thuê, Hóa đơn, Báo cáo bảo trì...) thành một file Excel chuyên nghiệp. 
- **Thiết kế báo cáo chuẩn:** File Excel được thiết kế đẹp mắt với các tiêu đề báo cáo rõ ràng, số tiền định dạng chuẩn VNĐ và các trạng thái được hệ thống tự động tô màu (Xanh/Đỏ/Cam) giúp bạn dễ dàng in ấn, gửi đối tác hoặc nộp thuế.

---

## 💡 7. Mẹo Sử Dụng (Tips)
> **Giao Diện Sáng/Tối:** Ở góc dưới cùng bên trái thanh menu có biểu tượng Mặt trăng/Mặt trời để chuyển đổi Giao diện Sáng/Tối (Light/Dark mode) giúp bảo vệ mắt khi làm việc ban đêm.
> **Tìm Kiếm Nhanh:** Hầu hết các màn hình đều có thanh tìm kiếm (Ví dụ: Tìm tên khách, số điện thoại, mã phòng). Hãy tận dụng nó thay vì cuộn chuột.
> **Chế độ In Ấn:** Biên lai hóa đơn được thiết kế tương thích hoàn hảo với máy in A4 và máy in nhiệt. Khi xem chi tiết hóa đơn, bạn chỉ cần dùng lệnh In của trình duyệt (Ctrl + P).

---

## ❓ 8. Câu Hỏi Thường Gặp (FAQ) & Hỗ Trợ

**Q1: Dữ liệu của tôi có bị mất khi tắt trình duyệt không?**
- Hoàn toàn không. RentFlow đồng bộ hóa dữ liệu theo thời gian thực (Real-time). Bất kể bạn thao tác trên máy tính, điện thoại hay iPad, dữ liệu luôn được cập nhật và lưu trữ trên hệ thống.

**Q2: Làm sao để dùng thử các tính năng khi chưa có dữ liệu thực tế?**
- Vào menu `Cấu hình`, cuộn xuống phần **Quản lý dữ liệu** và bấm **"Nạp Dữ Liệu Mẫu"**. Hệ thống sẽ tạo ra một bộ dữ liệu giả lập sinh động (Phòng, khách, hóa đơn, sự cố) để bạn thoải mái vọc vạch. Khi đã hiểu cách dùng, bạn chỉ cần bấm **"Xóa Trắng Dữ Liệu"** để bắt đầu dọn dẹp và nhập dữ liệu thật của tòa nhà.

**Q3: Tôi có nhiều tòa nhà cách xa nhau, có quản lý chung được không?**
- Được. Ở phần `Cấu hình`, bạn hãy thêm tên tất cả các Tòa nhà. Sau đó khi tạo phòng, bạn gán phòng đó thuộc Tòa nhà tương ứng. Hệ thống tự động phân loại và báo cáo rành mạch.

**📞 Liên hệ Hỗ Trợ:**
- Email: support@rentflow.vn
- Hotline kỹ thuật: 1900.xxxx
- Website: www.rentflow.vn
