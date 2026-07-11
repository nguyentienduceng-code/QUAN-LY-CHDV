# 🚀 Lộ Trình Phát Triển RentFlow (Roadmap & Backlog)

Tài liệu này lưu trữ các kế hoạch nâng cấp và các lỗi cần khắc phục trong tương lai để đưa ứng dụng đạt chuẩn thương mại hóa 100%.

## ✅ Phase A: Khắc phục lỗi nghiêm trọng (Đã hoàn thành 11/07/2026)
- Xóa thư viện `puppeteer` thừa khỏi production (Tiết kiệm ~25MB cài đặt).
- Áp dụng kỹ thuật `Dynamic Import / Lazy Load` cho thư viện xuất Excel `xlsx-js-style` (Tiết kiệm ~868KB tải trang ban đầu).
- Hủy bỏ chế độ Mock Login (Đăng nhập giả) trên môi trường Production để vá lỗ hổng bảo mật.
- Kết nối thành công Firebase API Keys thông qua Vercel CLI.

---

## 🟡 Phase B: Tối ưu Hóa Cơ Sở Dữ Liệu & Bảo Mật (Next Actions)

Đây là các vấn đề cần ưu tiên xử lý trong các lần cập nhật tiếp theo:

1. **Thêm Phân Trang (Pagination) cho Super Admin & Danh sách Khách:**
   - **Vấn đề:** Hiện tại hàm `getDocs(collection(...))` đang tải toàn bộ dữ liệu. Nếu có 10,000 khách, ứng dụng sẽ bị treo.
   - **Giải pháp:** Sử dụng hàm `limit()`, `startAfter()` của Firestore kết hợp UI phân trang.

2. **Thêm Composite Indexes cho Firestore:**
   - **Vấn đề:** Một số truy vấn gộp (ví dụ: `where('ownerId', '==', ...) + where('room', '==', ...)` ) đang hoạt động chậm nếu dữ liệu lớn.
   - **Giải pháp:** Cần triển khai các bộ chỉ mục (Indexes) trên Firebase Console.

3. **Rate Limiting (Chống Spam API):**
   - **Vấn đề:** Chưa có giới hạn số lần click/call API từ frontend. Kẻ xấu có thể spam tạo dữ liệu.
   - **Giải pháp:** Bật tính năng Firebase App Check (reCAPTCHA) để chặn bot.

4. **Bảo Mật Đăng Ký (Email Verification & Password Policy):**
   - **Vấn đề:** Mật khẩu đang quá dễ (123456) và email không cần xác minh.
   - **Giải pháp:** Ép độ dài mật khẩu (>= 8 ký tự), và gọi hàm `sendEmailVerification()` sau khi đăng ký.

5. **Gỡ bỏ hoàn toàn Dev Backdoor:**
   - **Giải pháp:** Đưa component `DevBackdoor.jsx` ra khỏi thư mục biên dịch của Production bằng Vite Configuration.

---

## 🟢 Phase C & D: Tính năng Thương Mại & Mở Rộng

1. **Tích hợp cổng thanh toán (MoMo / VNPay / ZaloPay):**
   - Xây dựng API trung gian (Cloud Functions) để nhận Webhook thanh toán từ ngân hàng khi người dùng mua Gói PRO.

2. **Tự động hóa bằng Cloud Functions:**
   - Gửi Email tự động cho khách thuê khi đến hạn đóng tiền.
   - Backup (Sao lưu) dữ liệu Firestore ra Google Cloud Storage mỗi đêm.

3. **Giao diện Skeleton Loading:**
   - Thay thế vòng xoay "Đang tải" (Spinner) bằng giao diện khung xương (Skeleton) để tạo cảm giác mượt mà hơn cho người dùng cuối.

4. **Audit Logs (Lịch sử thao tác):**
   - Lưu lại lịch sử chi tiết: Ai, ngày nào, đã sửa thông tin gì (để Admin dễ dàng truy vết).
