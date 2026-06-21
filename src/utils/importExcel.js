import * as XLSX from 'xlsx';

export const downloadImportTemplate = () => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Danh Sach Phong
  const roomsSheet = XLSX.utils.json_to_sheet([
    {
      'Mã Phòng': '101',
      'Tên Phòng': 'Phòng 101',
      'Tòa Nhà': 'A',
      'Tầng': 1,
      'Diện Tích (m²)': 25,
      'Giá Thuê (VND)': 4500000,
      'Trạng Thái': 'Trống'
    }
  ]);
  XLSX.utils.book_append_sheet(wb, roomsSheet, 'Danh Sach Phong');

  // Sheet 2: Khach Thue
  const tenantsSheet = XLSX.utils.json_to_sheet([
    {
      'Mã Khách': 'KH-001',
      'Họ và Tên': 'Nguyễn Văn A',
      'Số Điện Thoại': '0901234567',
      'Email': 'khach1@gmail.com',
      'CCCD / CMND': '079123456789',
      'Tòa Nhà': 'A',
      'Phòng': 'Phòng 101',
      'Ngày Hết Hạn HĐ': '2024-12-31',
      'Trạng Thái': 'Đang thuê'
    }
  ]);
  XLSX.utils.book_append_sheet(wb, tenantsSheet, 'Khach Thue');

  // Sheet 3: Chi So Dien Nuoc
  const metersSheet = XLSX.utils.json_to_sheet([
    {
      'Tòa Nhà': 'A',
      'Phòng': 'Phòng 101',
      'Chỉ Số Điện Cũ': 100,
      'Chỉ Số Điện Mới': 150,
      'Chỉ Số Nước Cũ': 20,
      'Chỉ Số Nước Mới': 25
    }
  ]);
  XLSX.utils.book_append_sheet(wb, metersSheet, 'Chi So Dien Nuoc');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `RentFlow_Template_Import_${dateStr}.xlsx`);
};

export const parseExcelImport = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const result = {
          rooms: [],
          tenants: [],
          meters: [],
          errors: []
        };

        // Parse Rooms
        if (workbook.SheetNames.includes('Danh Sach Phong')) {
          const roomsData = XLSX.utils.sheet_to_json(workbook.Sheets['Danh Sach Phong']);
          result.rooms = roomsData.map((row, index) => {
            if (!row['Mã Phòng'] || !row['Tên Phòng']) {
              result.errors.push(`Phòng (Dòng ${index + 2}): Thiếu Mã Phòng hoặc Tên Phòng`);
            }
            return {
              id: row['Mã Phòng'] !== undefined && row['Mã Phòng'] !== null ? String(row['Mã Phòng']) : '',
              name: row['Tên Phòng'] !== undefined && row['Tên Phòng'] !== null ? String(row['Tên Phòng']) : '',
              building: row['Tòa Nhà'] !== undefined && row['Tòa Nhà'] !== null ? String(row['Tòa Nhà']) : 'A',
              floor: parseInt(row['Tầng']) || 1,
              area: parseFloat(row['Diện Tích (m²)']) || 0,
              price: parseFloat(row['Giá Thuê (VND)']) || 0,
              status: (row['Trạng Thái'] === 'Đã thuê' || row['Trạng Thái'] === 'occupied') ? 'occupied' : (row['Trạng Thái'] === 'Bảo trì' ? 'maintenance' : 'vacant'),
            };
          }).filter(r => r.id && r.name);
        }

        // Parse Tenants
        if (workbook.SheetNames.includes('Khach Thue')) {
          const tenantsData = XLSX.utils.sheet_to_json(workbook.Sheets['Khach Thue']);
          result.tenants = tenantsData.map((row, index) => {
            if (!row['Họ và Tên'] || !row['Phòng']) {
              result.errors.push(`Khách Thuê (Dòng ${index + 2}): Thiếu Họ Tên hoặc Phòng`);
            }
            return {
              id: row['Mã Khách'] ? String(row['Mã Khách']) : `KH-${Date.now()}-${index}`,
              name: String(row['Họ và Tên'] || ''),
              phone: String(row['Số Điện Thoại'] || ''),
              email: String(row['Email'] || ''),
              idCard: String(row['CCCD / CMND'] || ''),
              building: String(row['Tòa Nhà'] || 'A'),
              room: String(row['Phòng'] || ''),
              contractEnd: String(row['Ngày Hết Hạn HĐ'] || ''),
              status: (row['Trạng Thái'] === 'Đã chuyển đi' || row['Trạng Thái'] === 'moved') ? 'moved' : 'active'
            };
          }).filter(t => t.name && t.room);
        }

        // Parse Meters (for billing)
        if (workbook.SheetNames.includes('Chi So Dien Nuoc')) {
          const metersData = XLSX.utils.sheet_to_json(workbook.Sheets['Chi So Dien Nuoc']);
          result.meters = metersData.map((row, index) => {
            if (!row['Phòng'] || row['Chỉ Số Điện Mới'] === undefined) {
              result.errors.push(`Chỉ Số (Dòng ${index + 2}): Thiếu Phòng hoặc Chỉ Số Điện Mới`);
            }
            return {
              building: String(row['Tòa Nhà'] || 'A'),
              room: String(row['Phòng'] || ''),
              oldElec: parseFloat(row['Chỉ Số Điện Cũ']) || 0,
              newElec: parseFloat(row['Chỉ Số Điện Mới']) || 0,
              oldWater: parseFloat(row['Chỉ Số Nước Cũ']) || 0,
              newWater: parseFloat(row['Chỉ Số Nước Mới']) || 0
            };
          }).filter(m => m.room);
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
