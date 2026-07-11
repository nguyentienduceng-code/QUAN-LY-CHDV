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
  })));
  roomsSheet['!cols'] = [{wch: 15}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 25}];
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
  })));
  tenantsSheet['!cols'] = [{wch: 15}, {wch: 25}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
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
  })));
  contractsSheet['!cols'] = [{wch: 20}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
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

    // Extract electricity & water meter readings from items
    if (inv.items && inv.items.length) {
      const elec = inv.items.find(i => i.id === 2 || i.name?.includes('điện'));
      const water = inv.items.find(i => i.id === 3 || i.name?.includes('nước'));

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
      base['CS Điện T.Trước'] = '--';
      base['CS Điện T.Sau'] = '--';
      base['KWh Tiêu Thụ'] = 0;
      base['Đơn Giá Điện'] = 0;
      base['Tiền Điện'] = 0;
      base['CS Nước T.Trước'] = '--';
      base['CS Nước T.Sau'] = '--';
      base['Khối Nước'] = 0;
      base['Đơn Giá Nước'] = 0;
      base['Tiền Nước'] = 0;
    }
    invoiceRows.push(base);
  });
  const invoicesSheet = XLSX.utils.json_to_sheet(invoiceRows);
  invoicesSheet['!cols'] = [{wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
  XLSX.utils.book_append_sheet(wb, invoicesSheet, 'Hoa Don Chi Tiet');

  // ── Sheet 5: Monthly Summary ─────────────────────────────────────
  const monthlyMap = {};
  invoices.forEach(inv => {
    const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
    if (m) {
      const key = `${m[2]}-${m[1]}`; // YYYY-MM for sorting
      const label = `T${parseInt(m[1])}/${m[2]}`;
      if (!monthlyMap[key]) monthlyMap[key] = { 'Tháng': label, 'Tổng Thu (VND)': 0, 'Số HĐ': 0, 'Đã Thu': 0, 'Chưa Thu': 0 };
      const amt = parseInt(inv.amount.replace(/\./g, '')) || 0;
      monthlyMap[key]['Tổng Thu (VND)'] += amt;
      monthlyMap[key]['Số HĐ'] += 1;
      if (inv.status === 'paid') monthlyMap[key]['Đã Thu'] += 1;
      else monthlyMap[key]['Chưa Thu'] += 1;
    }
  });

  // Add maintenance expenses
  const maintenanceCost = ['reported', 'inProgress', 'resolved'].reduce((s, col) =>
    s + (tickets?.[col] || []).reduce((cs, t) => cs + (t.cost || 0), 0), 0);

  const monthlySummary = Object.keys(monthlyMap).sort().map(k => ({
    ...monthlyMap[k]
  }));
  if (monthlySummary.length > 0) {
    monthlySummary[monthlySummary.length - 1]['Chi Phí Bảo Trì'] = maintenanceCost;
  }

  const summarySheet = XLSX.utils.json_to_sheet(monthlySummary);
  summarySheet['!cols'] = [{wch: 15}, {wch: 15}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 15}];
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
  })));
  ticketsSheet['!cols'] = [{wch: 15}, {wch: 25}, {wch: 15}, {wch: 10}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}];
  XLSX.utils.book_append_sheet(wb, ticketsSheet, 'Bao Tri');

  // ── Apply Styles ─────────────────────────────────────────────────
  const applyStyles = (sheet) => {
    if (!sheet['!ref']) return;
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[cellAddress];
        if (!cell) continue;

        if (R === 0) {
          cell.s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1C2D42" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: { style: 'thin', color: { auto: 1 } }, bottom: { style: 'thin', color: { auto: 1 } }, left: { style: 'thin', color: { auto: 1 } }, right: { style: 'thin', color: { auto: 1 } } }
          };
        } else {
          cell.s = {
            alignment: { vertical: "center" },
            border: { top: { style: 'thin', color: { rgb: "E2E8F0" } }, bottom: { style: 'thin', color: { rgb: "E2E8F0" } }, left: { style: 'thin', color: { rgb: "E2E8F0" } }, right: { style: 'thin', color: { rgb: "E2E8F0" } } }
          };
          // Format numbers with thousands separators if they are actual numbers
          if (typeof cell.v === 'number') {
            cell.s.numFmt = "#,##0";
          }
          // Also try to format strings that look like big numbers (e.g. from invoices)
          if (typeof cell.v === 'string' && /^\d{4,}$/.test(cell.v.replace(/\./g, ''))) {
             const num = parseInt(cell.v.replace(/\./g, ''));
             if (!isNaN(num)) {
               cell.v = num;
               cell.t = 'n';
               cell.s.numFmt = "#,##0";
             }
          }
        }
      }
    }
  };

  wb.SheetNames.forEach(name => {
    applyStyles(wb.Sheets[name]);
  });

  // ── Save ─────────────────────────────────────────────────────────
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `CHDV_Backup_${dateStr}.xlsx`);
};
