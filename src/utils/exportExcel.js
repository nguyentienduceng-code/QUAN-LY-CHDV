import * as XLSX from 'xlsx';

export const exportAllDataToExcel = (data) => {
  const { rooms, tenants, contracts, invoices } = data;

  const wb = XLSX.utils.book_new();

  // Rooms Sheet
  const roomsSheet = XLSX.utils.json_to_sheet(rooms.map(r => ({
    'Mã Phòng': r.id,
    'Tên Phòng': r.name,
    'Tòa Nhà': r.building,
    'Tầng': r.floor,
    'Diện Tích': r.area,
    'Giá Thuê': r.price,
    'Trạng Thái': r.status
  })));
  XLSX.utils.book_append_sheet(wb, roomsSheet, 'Danh Sach Phong');

  // Tenants Sheet
  const tenantsSheet = XLSX.utils.json_to_sheet(tenants.map(t => ({
    'Mã Khách': t.id,
    'Họ và Tên': t.name,
    'Số Điện Thoại': t.phone,
    'CCCD': t.idCard,
    'Phòng': t.room,
    'Ngày Hết Hạn': t.contractEnd || '',
    'Trạng Thái': t.status
  })));
  XLSX.utils.book_append_sheet(wb, tenantsSheet, 'Khach Thue');

  // Contracts Sheet
  const contractsSheet = XLSX.utils.json_to_sheet(contracts.map(c => ({
    'Mã HĐ': c.id,
    'Khách Hàng': c.tenantName,
    'Phòng': c.room,
    'Tiền Cọc': c.deposit,
    'Ngày Bắt Đầu': c.startDate,
    'Ngày Kết Thúc': c.endDate,
    'Trạng Thái': c.status
  })));
  XLSX.utils.book_append_sheet(wb, contractsSheet, 'Hop Dong');

  // Invoices Sheet
  const invoicesSheet = XLSX.utils.json_to_sheet(invoices.map(i => ({
    'Mã Hóa Đơn': i.id,
    'Khách Hàng': i.tenant,
    'Phòng': i.room,
    'Tổng Tiền': i.amount,
    'Hạn Chót': i.due,
    'Trạng Thái': i.status
  })));
  XLSX.utils.book_append_sheet(wb, invoicesSheet, 'Hoa Don');

  // Save the file
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Backup_QuanLyCHDV_${dateStr}.xlsx`);
};
