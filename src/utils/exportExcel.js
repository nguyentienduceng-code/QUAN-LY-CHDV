// xlsx-js-style is dynamically imported to avoid loading 868KB upfront
let XLSX = null;
const getXLSX = async () => {
  if (!XLSX) {
    XLSX = await import('xlsx-js-style');
  }
  return XLSX;
};

export const exportAllDataToExcel = async (data) => {
  const XLSX = await getXLSX();
  const { rooms, tenants, contracts, invoices, tickets } = data;

  const wb = XLSX.utils.book_new();

  const buildHeader = (sheet, title) => {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const timeStr = new Date().toLocaleTimeString('vi-VN');
    XLSX.utils.sheet_add_aoa(sheet, [
      ['HỆ THỐNG QUẢN LÝ CHDV - RENTFLOW'],
      [title],
      [`Ngày xuất dữ liệu: ${dateStr} - ${timeStr}`],
      [] // Dòng 4 trống để thở
    ], { origin: 'A1' });
    
    // Merge header cells (A1:I1, A2:I2, A3:I3)
    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];
  };

  // ── Sheet 1: Rooms ──────────────────────────────────────────────
  const roomsSheet = XLSX.utils.json_to_sheet(rooms.map(r => ({
    'Mã Phòng': r.id,
    'Tên Phòng': r.name,
    'Tòa Nhà': String(r.building || '').toLowerCase().startsWith('nhà') ? r.building : `Nhà ${r.building}`,
    'Tầng': r.floor,
    'Diện Tích (m²)': r.area,
    'Giá Thuê (VND)': r.price,
    'Trạng Thái': r.status === 'occupied' ? 'Đã thuê' : (r.status === 'maintenance' ? 'Bảo trì' : 'Trống'),
    'Khách Đang Thuê': r.tenant?.name || ''
  })), { origin: 'A5' });
  
  buildHeader(roomsSheet, 'BÁO CÁO DANH SÁCH PHÒNG');
  roomsSheet['!cols'] = [{wch: 15}, {wch: 20}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 30}];
  roomsSheet['!views'] = [{ state: 'frozen', ySplit: 5 }];
  XLSX.utils.book_append_sheet(wb, roomsSheet, 'Danh Sach Phong');

  // ── Sheet 2: Tenants ─────────────────────────────────────────────
  const tenantsSheet = XLSX.utils.json_to_sheet(tenants.map(t => ({
    'Mã Khách': t.id,
    'Họ và Tên': t.name,
    'Số Điện Thoại': t.phone,
    'Email': t.email || '',
    'CCCD / CMND': t.idCard,
    'Tòa Nhà': String(t.building || '').toLowerCase().startsWith('nhà') ? t.building : `Nhà ${t.building}`,
    'Phòng': t.room,
    'Ngày Hết Hạn HĐ': t.contractEnd || '',
    'Trạng Thái': t.status === 'moved' ? 'Đã chuyển đi' : 'Đang thuê'
  })), { origin: 'A5' });
  
  buildHeader(tenantsSheet, 'BÁO CÁO DANH SÁCH KHÁCH THUÊ');
  tenantsSheet['!cols'] = [{wch: 15}, {wch: 25}, {wch: 15}, {wch: 30}, {wch: 20}, {wch: 15}, {wch: 12}, {wch: 18}, {wch: 15}];
  tenantsSheet['!views'] = [{ state: 'frozen', ySplit: 5 }];
  XLSX.utils.book_append_sheet(wb, tenantsSheet, 'Khach Thue');

  // ── Sheet 3: Contracts ───────────────────────────────────────────
  const contractsSheet = XLSX.utils.json_to_sheet(contracts.map(c => ({
    'Mã Hợp Đồng': c.id,
    'Khách Hàng': c.tenantName,
    'Phòng': c.room,
    'Tiền Cọc (VND)': c.deposit,
    'Ngày Bắt Đầu': c.startDate,
    'Ngày Kết Thúc': c.endDate,
    'Trạng Thái': c.status === 'expired' ? 'Hết hạn' : 'Hiệu lực'
  })), { origin: 'A5' });
  
  buildHeader(contractsSheet, 'BÁO CÁO DANH SÁCH HỢP ĐỒNG');
  contractsSheet['!cols'] = [{wch: 20}, {wch: 30}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}];
  contractsSheet['!views'] = [{ state: 'frozen', ySplit: 5 }];
  XLSX.utils.book_append_sheet(wb, contractsSheet, 'Hop Dong');

  // ── Sheet 4: Invoices – Full detail with meter indices ────────────
  const invoiceRows = [];
  invoices.forEach(inv => {
    const base = {
      'Mã Hóa Đơn': inv.id,
      'Khách Hàng': inv.tenant,
      'Phòng': inv.room,
      'Tổng Tiền (VND)': inv.amount,
      'Hạn Chót': inv.due,
      'Trạng Thái': inv.status === 'paid' ? 'Đã thu' : inv.status === 'partial' ? 'Thu 1 phần' : 'Chưa thu',
    };

    if (inv.items && inv.items.length) {
      const elec = inv.items.find(i => i.id === 2 || i.name?.toLowerCase().includes('điện'));
      const water = inv.items.find(i => i.id === 3 || i.name?.toLowerCase().includes('nước'));

      base['CS Điện T.Trước'] = elec?.oldIndex ?? '--';
      base['CS Điện T.Sau'] = elec?.newIndex ?? '--';
      base['KWh Tiêu Thụ'] = elec?.qty ?? 0;
      base['Đơn Giá Điện'] = elec?.price ?? 0;
      base['Tiền Điện'] = elec?.total ?? 0;

      base['CS Nước T.Trước'] = water?.oldIndex ?? '--';
      base['CS Nước T.Sau'] = water?.newIndex ?? '--';
      base['Khối Nước'] = water?.qty ?? 0;
      base['Đơn Giá Nước'] = water?.price ?? 0;
      base['Tiền Nước'] = water?.total ?? 0;
    } else {
      base['CS Điện T.Trước'] = '--'; base['CS Điện T.Sau'] = '--'; base['KWh Tiêu Thụ'] = 0; base['Đơn Giá Điện'] = 0; base['Tiền Điện'] = 0;
      base['CS Nước T.Trước'] = '--'; base['CS Nước T.Sau'] = '--'; base['Khối Nước'] = 0; base['Đơn Giá Nước'] = 0; base['Tiền Nước'] = 0;
    }
    invoiceRows.push(base);
  });
  const invoicesSheet = XLSX.utils.json_to_sheet(invoiceRows, { origin: 'A5' });
  
  buildHeader(invoicesSheet, 'BẢNG CHI TIẾT HÓA ĐƠN & ĐIỆN NƯỚC');
  invoicesSheet['!cols'] = [{wch: 22}, {wch: 25}, {wch: 12}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
  invoicesSheet['!views'] = [{ state: 'frozen', ySplit: 5 }];
  XLSX.utils.book_append_sheet(wb, invoicesSheet, 'Hoa Don Chi Tiet');

  // ── Sheet 5: Monthly Summary ─────────────────────────────────────
  const monthlyMap = {};
  invoices.forEach(inv => {
    const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
    if (m) {
      const key = `${m[2]}-${m[1]}`; // YYYY-MM for sorting
      const label = `T${parseInt(m[1])}/${m[2]}`;
      if (!monthlyMap[key]) monthlyMap[key] = { 'Tháng': label, 'Tổng Thu (VND)': 0, 'Số HĐ': 0, 'Đã Thu': 0, 'Chưa Thu': 0 };
      const amt = parseInt(inv.amount.toString().replace(/\./g, '')) || 0;
      monthlyMap[key]['Tổng Thu (VND)'] += amt;
      monthlyMap[key]['Số HĐ'] += 1;
      if (inv.status === 'paid') monthlyMap[key]['Đã Thu'] += 1;
      else monthlyMap[key]['Chưa Thu'] += 1;
    }
  });

  const maintenanceCost = ['reported', 'inProgress', 'resolved'].reduce((s, col) =>
    s + (tickets?.[col] || []).reduce((cs, t) => cs + (t.cost || 0), 0), 0);

  const monthlySummary = Object.keys(monthlyMap).sort().map(k => ({
    ...monthlyMap[k]
  }));
  if (monthlySummary.length > 0) {
    monthlySummary[monthlySummary.length - 1]['Chi Phí Bảo Trì'] = maintenanceCost;
  }

  const summarySheet = XLSX.utils.json_to_sheet(monthlySummary, { origin: 'A5' });
  buildHeader(summarySheet, 'BÁO CÁO DOANH THU THEO THÁNG');
  summarySheet['!cols'] = [{wch: 15}, {wch: 22}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 22}];
  summarySheet['!views'] = [{ state: 'frozen', ySplit: 5 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Tong Hop Thang');

  // ── Sheet 6: Maintenance Tickets ────────────────────────────────
  const allTickets = [
    ...(tickets?.reported || []).map(t => ({ ...t, column: 'Mới báo' })),
    ...(tickets?.inProgress || []).map(t => ({ ...t, column: 'Đang xử lý' })),
    ...(tickets?.resolved || []).map(t => ({ ...t, column: 'Đã xong' })),
  ];
  const ticketsSheet = XLSX.utils.json_to_sheet(allTickets.map(t => ({
    'Mã Ticket': t.id,
    'Tiêu Đề': t.title,
    'Phòng / Khu vực': t.room,
    'Mức độ': t.priority,
    'Ngày Báo': t.date,
    'Phụ Trách': t.assignee || 'Chưa giao',
    'Chi Phí (VND)': t.cost || 0,
    'Trạng Thái': t.column
  })), { origin: 'A5' });
  buildHeader(ticketsSheet, 'BÁO CÁO BẢO TRÌ & SỰ CỐ');
  ticketsSheet['!cols'] = [{wch: 15}, {wch: 35}, {wch: 18}, {wch: 12}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 15}];
  ticketsSheet['!views'] = [{ state: 'frozen', ySplit: 5 }];
  XLSX.utils.book_append_sheet(wb, ticketsSheet, 'Bao Tri');

  // ── Apply Styles ─────────────────────────────────────────────────
  const applyStyles = (sheet) => {
    if (!sheet['!ref']) return;
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    // Hàm hỗ trợ tạo ô trống nếu nó chưa tồn tại (để chèn style)
    const ensureCell = (R, C) => {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!sheet[cellAddress]) {
        XLSX.utils.sheet_add_aoa(sheet, [['']], { origin: cellAddress });
      }
      return sheet[cellAddress];
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        // Bỏ qua các ô trống ngoài bảng dữ liệu để tối ưu hiệu suất
        const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (!cell && R < 4) continue; 
        
        const c = ensureCell(R, C);

        // -- Dòng 1: Tên Hệ Thống
        if (R === 0) {
          c.s = { font: { bold: true, color: { rgb: "475569" }, sz: 12 }, alignment: { horizontal: "left" } };
        } 
        // -- Dòng 2: Tiêu đề báo cáo
        else if (R === 1) {
          c.s = { font: { bold: true, color: { rgb: "0F766E" }, sz: 18 }, alignment: { horizontal: "left", vertical: "center" } };
        } 
        // -- Dòng 3: Ngày giờ xuất
        else if (R === 2) {
          c.s = { font: { italic: true, color: { rgb: "94A3B8" }, sz: 11 }, alignment: { horizontal: "left" } };
        } 
        // -- Dòng 4: Dòng trống
        else if (R === 3) {
          // Empty
        }
        // -- Dòng 5: Table Header (Chỉ số mảng R === 4)
        else if (R === 4) {
          c.s = {
            font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
            fill: { fgColor: { rgb: "0F766E" } }, // Xanh Teal đậm (Theme hiện đại)
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: "0F766E" } },
              bottom: { style: 'thin', color: { rgb: "0F766E" } },
              left: { style: 'thin', color: { rgb: "115E59" } }, // Đậm hơn nền 1 chút để tạo vách ngăn
              right: { style: 'thin', color: { rgb: "115E59" } }
            }
          };
        } 
        // -- Dòng 6+: Dữ liệu bảng (Chỉ số R >= 5)
        else if (R >= 5) {
          let align = "left";
          let fontColor = "1E293B"; // Màu chữ xám đen mặc định
          let bold = false;
          
          const val = c.v;
          const headerCell = sheet[XLSX.utils.encode_cell({ r: 4, c: C })];
          const headerText = headerCell ? headerCell.v : "";

          // Tự động nhận diện chuỗi số dạng tiền tệ và chuyển về kiểu Number
          if (typeof val === 'string' && /^\d{4,}(?:\.\d+)?$/.test(val.replace(/\./g, ''))) {
             const num = parseInt(val.replace(/\./g, ''));
             if (!isNaN(num) && num >= 1000) {
               c.v = num;
               c.t = 'n'; // Ép kiểu số cho Excel
             }
          }

          if (c.t === 'n') {
             align = "right";
             c.s = { numFmt: '#,##0 "VNĐ"' }; // Format tiền tệ chuẩn Việt Nam
          } else {
             // Căn giữa cho các cột đặc thù
             const centerHeaders = ['Mã', 'Điện Thoại', 'CCCD', 'Tòa', 'Phòng', 'Ngày', 'Hạn', 'Trạng Thái', 'Mức độ', 'Tháng', 'Tầng'];
             if (centerHeaders.some(h => headerText.includes(h))) {
                align = "center";
             }
             
             // Tô màu trạng thái
             if (headerText.includes('Trạng Thái')) {
               if (['Đã thu', 'Đã thuê', 'Hiệu lực', 'Đã xong'].includes(val)) {
                  fontColor = "16A34A"; bold = true; // Xanh lá
               } else if (['Chưa thu', 'Trống', 'Hết hạn', 'Mới báo'].includes(val)) {
                  fontColor = "DC2626"; bold = true; // Đỏ
               } else if (['Thu 1 phần', 'Đang xử lý'].includes(val)) {
                  fontColor = "D97706"; bold = true; // Cam/Vàng
               } else if (['Bảo trì', 'Đã chuyển đi'].includes(val)) {
                  fontColor = "94A3B8"; bold = true; // Xám nhạt
               }
             }
          }

          // Áp dụng Style và viền mỏng xám cho Cell dữ liệu
          c.s = {
            ...c.s,
            font: { color: { rgb: fontColor }, bold: bold, sz: 11 },
            alignment: { horizontal: align, vertical: "center" },
            border: {
              top: { style: 'thin', color: { rgb: "E2E8F0" } },
              bottom: { style: 'thin', color: { rgb: "E2E8F0" } },
              left: { style: 'thin', color: { rgb: "F1F5F9" } },
              right: { style: 'thin', color: { rgb: "F1F5F9" } }
            }
          };
        }
      }
    }
  };

  wb.SheetNames.forEach(name => {
    applyStyles(wb.Sheets[name]);
  });

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `CHDV_Backup_${dateStr}.xlsx`);
};
