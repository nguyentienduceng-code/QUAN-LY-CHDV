// =============================================================================
// DỮ LIỆU MẪU — RENTFLOW
// Mục đích: Minh họa cách hệ thống hoạt động cho người dùng mới.
// Người dùng có thể Xóa Trắng và nhập dữ liệu thực của mình.
// =============================================================================

// ── 1. THÔNG TIN KHÁCH THUÊ (chỉnh tên / SĐT / CCCD theo thực tế) ──────────
const TENANTS_INFO = [
  { name: 'Nguyễn Văn An',    phone: '0901234001', idCard: '079123400101' }, // Phòng 101
  { name: 'Trần Thị Bích',    phone: '0901234002', idCard: '079123400202' }, // Phòng 102
  { name: 'Lê Minh Châu',     phone: '0901234003', idCard: '079123400303' }, // Phòng 103
  { name: 'Phạm Hồng Dương',  phone: '0901234004', idCard: '079123400404' }, // Phòng 201
  { name: 'Hoàng Thị Emm',    phone: '0901234005', idCard: '079123400505' }, // Phòng 202
  { name: 'Vũ Quốc Hùng',     phone: '0901234006', idCard: '079123400606' }, // Phòng 203
  { name: 'Đặng Thị Kim',     phone: '0901234007', idCard: '079123400707' }, // Phòng 301
  { name: 'Bùi Thanh Long',   phone: '0901234008', idCard: '079123400808' }, // Phòng 302
  // Phòng 303 để trống — xem mục 3 bên dưới
];

// ── 2. GIÁ PHÒNG & ĐƠN GIÁ ĐIỆN/NƯỚC/DỊCH VỤ (chỉnh theo thực tế) ─────────
const ROOM_PRICE     = 4_000_000; // VNĐ/tháng
const ELEC_PRICE     = 3_500;     // VNĐ/kWh (giá thu khách)
const SERVICE_FEE    = 150_000;   // VNĐ/tháng — Rác + Wifi + Quản lý
// Lưu ý: Giá nước tính theo đầu người, cấu hình tại Cài đặt > Đơn Giá Thu

// ── 3. SỐ KWH ĐIỆN MỖI PHÒNG trong tháng mẫu (thay số thực mỗi tháng) ──────
// Format: [roomName]: số kWh đã dùng
const ELEC_USAGE = {
  '101': 120, // kWh — Phòng đôi, dùng nhiều máy lạnh
  '102': 85,  // kWh — Phòng đơn
  '103': 95,  // kWh — Phòng đơn
  '201': 110, // kWh — Phòng đôi
  '202': 70,  // kWh — Phòng đơn, ít dùng điện
  '203': 130, // kWh — Phòng đôi, dùng nhiều
  '301': 90,  // kWh — Phòng đơn
  '302': 105, // kWh — Phòng đôi
};

// ── 4. TRẠNG THÁI PHÒNG (occupied / expiring / vacant) ──────────────────────
// expiring = sắp hết hạn hợp đồng (hiển thị cảnh báo trên Tổng quan)
const ROOM_STATUS = {
  '101': 'occupied',  // Đang thuê bình thường
  '102': 'expiring',  // SẮP HẾT HẠN — cần liên hệ gia hạn
  '103': 'occupied',
  '201': 'occupied',
  '202': 'expiring',  // SẮP HẾT HẠN
  '203': 'occupied',
  '301': 'occupied',
  '302': 'occupied',
  '303': 'vacant',   // PHÒNG TRỐNG — đang tìm khách mới
};

// ── 5. TRẠNG THÁI HÓA ĐƠN ──────────────────────────────────────────────────
// paid = đã thu   |   unpaid = chưa thu   |   partial = thu một phần
const INVOICE_STATUS = {
  '101': 'paid',    // Đã thu đủ
  '102': 'paid',    // Đã thu đủ
  '103': 'unpaid',  // Chưa thu — nhắc khách
  '201': 'paid',
  '202': 'unpaid',  // Chưa thu
  '203': 'partial', // Mới thu một phần
  '301': 'paid',
  '302': 'unpaid',
};

// =============================================================================
// KHÔNG CẦN CHỈNH PHÍA DƯỚI — Hệ thống tự tổng hợp từ các mục trên
// =============================================================================

export const generateMockData = (firstBuilding = 'A') => {
  const rooms     = [];
  const tenants   = [];
  const contracts = [];
  const invoices  = [];

  const building = firstBuilding;

  // Tháng hóa đơn: lấy tháng hiện tại
  const now          = new Date();
  const invoiceMonth = String(now.getMonth() + 1).padStart(2, '0');
  const invoiceYear  = now.getFullYear();
  const dueDate      = `05/${String(now.getMonth() + 2).padStart(2, '0')}/${invoiceYear}`;

  const contractStart = '01/01/2026';
  const contractEnd   = '31/12/2026';
  const contractEndExpiring = '31/07/2026'; // Hợp đồng sắp hết — khoảng 2-3 tuần nữa

  let tenantIndex = 0;

  for (let floor = 1; floor <= 3; floor++) {
    for (let i = 1; i <= 3; i++) {
      const roomName = `${floor}0${i}`;
      const roomId   = parseInt(`100${floor}0${i}`);
      const status   = ROOM_STATUS[roomName] || 'occupied';
      const isVacant = status === 'vacant';

      // ── Phòng ──────────────────────────────────────────────
      rooms.push({
        id:        roomId,
        name:      roomName,
        building:  building,
        floor:     floor,
        type:      floor === 1 ? 'Studio Đôi' : 'Studio Đơn',
        price:     ROOM_PRICE,
        status:    status,
        area:      floor === 1 ? 35 : 28,
        amenities: ['Máy lạnh', 'Tủ lạnh', 'Giường nệm', 'Tủ quần áo', 'Nóng lạnh'],
      });

      if (!isVacant) {
        const info       = TENANTS_INFO[tenantIndex];
        const tenantId   = `TEN-${roomId}`;
        const tenantName = info.name;
        const tenantEmail = `khach.phong${roomName}@gmail.com`;

        // ── Khách thuê ───────────────────────────────────────
        tenants.push({
          id:       tenantId,
          name:     tenantName,
          email:    tenantEmail,
          phone:    info.phone,
          idCard:   info.idCard,
          room:     roomName,
          building: building,
          status:   'active',
          note:     status === 'expiring'
            ? 'Hợp đồng sắp hết hạn — cần liên hệ gia hạn trước 31/07/2026'
            : 'Khách thuê ổn định',
        });

        // ── Hợp đồng ────────────────────────────────────────
        contracts.push({
          id:        `CTR-2026-${roomName}`,
          tenant:    tenantName,
          room:      roomName,
          startDate: contractStart,
          endDate:   status === 'expiring' ? contractEndExpiring : contractEnd,
          deposit:   '4.000.000',
          status:    status === 'expiring' ? 'expiring' : 'active',
        });

        // ── Hóa đơn (chi tiết từng khoản) ───────────────────
        const elecQty   = ELEC_USAGE[roomName] || 100;
        const elecTotal = elecQty * ELEC_PRICE;
        // Phòng đôi tính 2 người nước, phòng đơn 1 người
        const waterQty   = floor === 1 ? 2 : 1; // số người
        const waterPrice = 80_000;               // VNĐ/người/tháng
        const waterTotal = waterQty * waterPrice;

        const subtotal = ROOM_PRICE + elecTotal + waterTotal + SERVICE_FEE;

        // Hiển thị số tiền tổng dạng "x.xxx.xxx"
        const fmtVND = (n) => n.toLocaleString('vi-VN').replace(/\./g, '.').replace(/,/g, '.');

        invoices.push({
          id:     `INV-${invoiceMonth}-${invoiceYear}-${roomName}`,
          tenant: tenantName,
          room:   roomName,
          amount: fmtVND(subtotal),
          due:    dueDate,
          status: INVOICE_STATUS[roomName] || 'unpaid',
          items: [
            {
              // ── Khoản 1: Tiền phòng ─────────────────────────
              // Chỉnh: price = giá phòng (VNĐ/tháng), qty luôn = 1
              id: 1, name: 'Tiền phòng', qty: 1,
              price: ROOM_PRICE, total: ROOM_PRICE,
            },
            {
              // ── Khoản 2: Tiền điện ──────────────────────────
              // Chỉnh: qty = số kWh tháng này (đọc từ đồng hồ điện)
              //        price = đơn giá điện/kWh cấu hình tại Cài đặt
              id: 2, name: 'Tiền điện',
              qty:   elecQty,
              price: ELEC_PRICE,
              total: elecTotal,
            },
            {
              // ── Khoản 3: Tiền nước ──────────────────────────
              // Chỉnh: qty = số người trong phòng
              //        price = đơn giá nước/người/tháng tại Cài đặt
              id: 3, name: 'Tiền nước',
              qty:   waterQty,
              price: waterPrice,
              total: waterTotal,
            },
            {
              // ── Khoản 4: Phí dịch vụ ────────────────────────
              // Gồm: Rác, Wifi, Bảo vệ, Vệ sinh hành lang...
              // Chỉnh: price = tổng phí dịch vụ/phòng/tháng tại Cài đặt
              id: 4, name: 'Phí dịch vụ (Rác + Wifi + QL)',
              qty:   1,
              price: SERVICE_FEE,
              total: SERVICE_FEE,
            },
          ],
        });

        tenantIndex++;
      }
    }
  }

  // ── Bảo trì (Kanban 3 cột) ────────────────────────────────────────────────
  const tickets = {
    reported: [
      // Sự cố mới báo — chưa xử lý
      {
        id: 'TKT-001', room: '103',
        title: 'Điều hòa không làm lạnh',
        desc:  'Máy lạnh bật nhưng chỉ thổi gió, không lạnh. Khách phản ánh từ tối qua.',
        priority: 'high',
        date: `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${invoiceYear}`,
        cost: 0,
      },
      {
        id: 'TKT-002', room: '201',
        title: 'Bóng đèn hành lang tầng 2 hỏng',
        desc:  '2 bóng đèn LED hành lang tầng 2 bị hỏng, tối lúc đêm.',
        priority: 'low',
        date: `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${invoiceYear}`,
        cost: 0,
      },
    ],
    inProgress: [
      // Đang xử lý — thợ đã nhận việc
      {
        id: 'TKT-003', room: '102',
        title: 'Rò rỉ vòi nước bồn rửa tay',
        desc:  'Vòi nước bị nhỏ giọt liên tục. Thợ đã xuống kiểm tra, chờ phụ kiện thay thế.',
        priority: 'medium',
        date: `${String(now.getDate() - 2).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${invoiceYear}`,
        cost: 0,
      },
    ],
    resolved: [
      // Đã xử lý xong — ghi lại chi phí thực tế
      {
        id: 'TKT-004', room: '301',
        title: 'Khóa cửa chính bị kẹt',
        desc:  'Khóa bị kẹt, không mở được từ bên ngoài. Đã thay ổ khóa mới.',
        priority: 'high',
        date: `${String(now.getDate() - 5).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${invoiceYear}`,
        // Chỉnh: cost = chi phí thực tế đã bỏ ra (VNĐ)
        cost: 250_000,
      },
      {
        id: 'TKT-005', room: '203',
        title: 'Bình nóng lạnh hỏng',
        desc:  'Bình nóng lạnh mất điện trở, nước không nóng. Đã thay điện trở mới.',
        priority: 'medium',
        date: `${String(now.getDate() - 8).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${invoiceYear}`,
        cost: 350_000,
      },
    ],
  };

  return { rooms, tenants, contracts, invoices, tickets };
};
