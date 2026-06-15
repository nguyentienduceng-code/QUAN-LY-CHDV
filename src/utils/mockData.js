export const generateMockData = (firstBuilding = 'A') => {
  const rooms = [];
  const tenants = [];
  const contracts = [];
  const invoices = [];

  const building = firstBuilding;
  const price = 4000000;

  for (let floor = 1; floor <= 3; floor++) {
    for (let i = 1; i <= 3; i++) {
      const roomName = `${floor}0${i}`;
      const isVacant = roomName === '303'; // Only 303 is vacant
      const roomId = parseInt(`100${floor}0${i}`);
      
      rooms.push({
        id: roomId,
        name: roomName,
        building: building,
        type: 'Studio',
        price: price,
        status: isVacant ? 'vacant' : 'occupied',
        area: 30,
        amenities: ['Máy lạnh', 'Tủ lạnh', 'Giường nệm', 'Tủ quần áo']
      });

      if (!isVacant) {
        const tenantId = `TEN-${roomId}`;
        const tenantName = `Khách Phòng ${roomName}`;
        const tenantEmail = `khach${roomName}@gmail.com`;
        
        tenants.push({
          id: tenantId,
          name: tenantName,
          email: tenantEmail,
          phone: `090000${roomName}`,
          idCard: `0790000${roomName}`,
          room: roomName,
          building: building,
          status: 'active',
          note: 'Khách test hệ thống'
        });

        contracts.push({
          id: `CTR-2026-${roomName}`,
          tenant: tenantName,
          room: roomName,
          startDate: '01/01/2026',
          endDate: '31/12/2026',
          deposit: '4.000.000',
          status: 'active'
        });

        invoices.push({
          id: `INV-06-2026-${roomName}`,
          tenant: tenantName,
          room: roomName,
          amount: '4.500.000',
          due: '05/07/2026',
          status: roomName === '101' ? 'paid' : 'unpaid',
          items: [
            { id: 1, name: 'Tiền phòng', qty: 1, price: 4000000, total: 4000000 },
            { id: 2, name: 'Tiền điện', qty: 100, price: 3500, total: 350000 },
            { id: 3, name: 'Phí dịch vụ', qty: 1, price: 150000, total: 150000 }
          ]
        });
      }
    }
  }

  const tickets = {
    reported: [
      { id: 'TKT-001', room: '101', title: 'Hư vòi nước', desc: 'Vòi nước bồn rửa chén bị rỉ', priority: 'high', date: '15/06/2026' }
    ],
    inProgress: [],
    resolved: []
  };

  return { rooms, tenants, contracts, invoices, tickets };
};
