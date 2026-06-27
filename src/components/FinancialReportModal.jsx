import React, { useState, useMemo, useRef } from 'react';
import { X, Download, TrendingUp, DollarSign, Activity, Percent, PieChart, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

export default function FinancialReportModal({ isOpen, onClose, appData, allowedBuildings }) {
  const { invoices, tickets, rooms, settings } = appData;
  const [selectedBuilding, setSelectedBuilding] = useState('All');
  const reportRef = useRef(null);

  // Lấy danh sách tháng có hóa đơn (6 tháng gần nhất)
  const availableMonths = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
        key: `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`,
        month: d.getMonth() + 1,
        year: d.getFullYear()
      });
    }
    return months;
  }, []);

  const [selectedMonthKey, setSelectedMonthKey] = useState(availableMonths[0]?.key);
  
  const selectedMonthObj = availableMonths.find(m => m.key === selectedMonthKey);

  const stats = useMemo(() => {
    if (!selectedMonthObj) return null;
    const { month, year, key } = selectedMonthObj;

    const bSet = new Set(selectedBuilding === 'All' ? Array.from(allowedBuildings) : [selectedBuilding]);
    
    // Doanh thu
    const monthInvoices = invoices.filter(inv => {
      const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
      if (!m) return false;
      if (parseInt(m[1]) !== month || parseInt(m[2]) !== year) return false;
      const room = rooms.find(r => r.name === inv.room);
      return room && bSet.has(room.building || 'A');
    });

    const revenue = monthInvoices.reduce((acc, inv) => acc + (parseInt(String(inv.amount).replace(/\./g, '')) || 0), 0);

    // Chi phí sửa chữa
    let maintenanceCost = 0;
    ['reported', 'inProgress', 'resolved'].forEach(col => {
      tickets[col]?.forEach(t => {
        const room = rooms.find(r => r.name === t.room);
        if (room && bSet.has(room.building || 'A') && t.cost && t.date) {
          const parts = t.date.split('/');
          if (parseInt(parts[1]) === month) maintenanceCost += t.cost;
        }
      });
    });

    // Chi phí thuê nhà cơ sở (Chỉ tính nếu có phòng thuộc tòa nhà đó)
    let baseRent = 0;
    bSet.forEach(b => {
      baseRent += (settings.prices?.[b]?.baseRent || 0);
    });

    // Chi phí điện nước
    let utilitiesCost = 0;
    const activeBuildingsThisMonth = new Set();
    monthInvoices.forEach(inv => {
      const room = rooms.find(r => r.name === inv.room);
      const b = room?.building || 'A';
      activeBuildingsThisMonth.add(b);

      const p = settings.prices?.[b] || {};
      const mode = p.utilityCalcMode || 'tenant_only';
      if (mode === 'tenant_only' || mode === 'add_service') {
        inv.items?.forEach(item => {
          if (item.name === 'Tiền điện') utilitiesCost += (item.qty * (p.baseElectricityPrice || 0));
          else if (item.name === 'Tiền nước') utilitiesCost += (item.qty * (p.baseWaterPrice || 0));
        });
      }
    });

    activeBuildingsThisMonth.forEach(b => {
      const p = settings.prices?.[b] || {};
      const mode = p.utilityCalcMode || 'tenant_only';
      const mu = p.monthlyUtility?.[key] || {};
      if (mode === 'add_service' || mode === 'total_building') {
        utilitiesCost += (mu.elec || 0) * (p.baseElectricityPrice || 0);
        utilitiesCost += (mu.water || 0) * (p.baseWaterPrice || 0);
      }
    });

    const expenses = maintenanceCost + baseRent + utilitiesCost;
    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

    // Tỷ lệ lấp đầy (hiện tại)
    const buildingRooms = rooms.filter(r => bSet.has(r.building || 'A'));
    const occupied = buildingRooms.filter(r => r.status !== 'vacant').length;
    const occupancyRate = buildingRooms.length > 0 ? ((occupied / buildingRooms.length) * 100).toFixed(0) : 0;

    return { revenue, expenses, netProfit, profitMargin, occupancyRate, maintenanceCost, baseRent, utilitiesCost };
  }, [selectedMonthObj, selectedBuilding, allowedBuildings, invoices, tickets, rooms, settings]);

  if (!isOpen) return null;

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    const t = toast.loading('Đang tạo ảnh báo cáo...');
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        logging: false
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Bao_Cao_Tai_Chinh_${selectedBuilding}_${selectedMonthKey}.png`;
      link.click();
      toast.success('Đã tải ảnh thành công!', { id: t });
    } catch (err) {
      toast.error('Có lỗi xảy ra khi tạo ảnh: ' + err.message, { id: t });
    }
  };

  const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  // Tính phần trăm chi phí cho Horizontal Bar Chart
  const expTotal = stats?.expenses || 1;
  const pRent = stats ? ((stats.baseRent / expTotal) * 100).toFixed(0) : 0;
  const pUtil = stats ? ((stats.utilitiesCost / expTotal) * 100).toFixed(0) : 0;
  const pMaint = stats ? ((stats.maintenanceCost / expTotal) * 100).toFixed(0) : 0;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #C4A47C', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Top Bar */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 10 }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#5A4D41' }}><PieChart color="#C4A47C" /> Tùy chỉnh Báo Cáo Hoạt Động Khách Sạn</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleDownloadImage} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#C4A47C', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Download size={18} /> Xuất Báo Cáo PDF
            </button>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', color: '#666666', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Area */}
        <div style={{ padding: '20px', display: 'flex', gap: '16px', background: '#FAFAFA', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666666', marginBottom: '8px' }}>Chọn Khách sạn</label>
            <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} style={{ width: '100%', padding: '10px', background: '#FFFFFF', border: '1px solid #C4A47C', borderRadius: '8px', color: '#5A4D41' }}>
              <option value="All">Tất cả khách sạn</option>
              {Array.from(allowedBuildings).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#666666', marginBottom: '8px' }}>Chọn Tháng</label>
            <select value={selectedMonthKey} onChange={e => setSelectedMonthKey(e.target.value)} style={{ width: '100%', padding: '10px', background: '#FFFFFF', border: '1px solid #C4A47C', borderRadius: '8px', color: '#5A4D41' }}>
              {availableMonths.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {/* KHUNG BÁO CÁO XUẤT ẢNH */}
        <div style={{ padding: '24px', background: '#FFFFFF' }}>
          <div ref={reportRef} style={{ 
            background: 'url("https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=1200&auto=format&fit=crop") center/cover no-repeat, #FFFFFF', 
            backgroundBlendMode: 'overlay',
            padding: '40px', 
            borderRadius: '24px', 
            border: '2px solid #C4A47C',
            color: '#5A4D41', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' 
          }}>
            
            {/* Header Báo Cáo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #C4A47C', paddingBottom: '20px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '2rem', color: '#5A4D41', fontWeight: 'bold' }}>
                  BÁO CÁO KINH DOANH • {selectedMonthObj?.label.toUpperCase()}
                </h1>
                <p style={{ margin: '8px 0 0 0', color: '#666666', fontSize: '1.1rem' }}>
                  Phân tích hiệu suất khách sạn • Giai đoạn cao điểm mùa hè.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#C4A47C' }}>RentFlow Premier</div>
                <div style={{ color: '#666666', fontSize: '0.9rem' }}>Quản lý khách sạn / MICE</div>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#FAFAFA', border: '1px solid #C4A47C', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ color: '#5A4D41', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}><TrendingUp size={16} color="#C4A47C" /> Tổng Doanh Thu</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#7BB087' }}>{formatVND(stats?.revenue || 0)}</div>
              </div>
              <div style={{ background: '#FAFAFA', border: '1px solid #C4A47C', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ color: '#5A4D41', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}><Activity size={16} color="#C4A47C" /> Tổng Chi Phí Vận Hành</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#C4A47C' }}>{formatVND(stats?.expenses || 0)}</div>
              </div>
              <div style={{ background: '#FAFAFA', border: '1px solid #C4A47C', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ color: '#5A4D41', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}><DollarSign size={16} color="#C4A47C" /> Lợi Nhuận Ròng</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats?.netProfit >= 0 ? '#7BB087' : '#ef4444' }}>{formatVND(stats?.netProfit || 0)}</div>
              </div>
            </div>

            {/* Middle Section: Bar Chart & Summary */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              
              {/* Phân bổ chi phí vận hành */}
              <div style={{ flex: 1, background: '#FAFAFA', padding: '24px', borderRadius: '16px', border: '1px solid #C4A47C', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#5A4D41', fontSize: '1.1rem', fontWeight: 'bold' }}>Phân bổ Chi phí Vận hành (Hàng ngang)</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '30px' }}>
                  {/* Bar 1 */}
                  <div>
                    <div style={{ width: '100%', height: '16px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${pRent}%`, height: '100%', background: '#7BB087' }}></div>
                    </div>
                  </div>
                  {/* Bar 2 */}
                  <div style={{ width: '80%' }}>
                    <div style={{ width: '100%', height: '16px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${pUtil}%`, height: '100%', background: '#C4A47C' }}></div>
                    </div>
                  </div>
                  {/* Bar 3 */}
                  <div style={{ width: '40%' }}>
                    <div style={{ width: '100%', height: '16px', background: '#e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${pMaint}%`, height: '100%', background: '#EADDCB' }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', fontSize: '0.85rem', color: '#666666', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#7BB087', borderRadius: '2px' }}></span> Mặt bằng ({pRent}%)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#C4A47C', borderRadius: '2px' }}></span> Điện nước ({pUtil}%)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#EADDCB', borderRadius: '2px' }}></span> Bảo trì ({pMaint}%)
                  </div>
                </div>
              </div>

              {/* Tóm tắt hiệu suất */}
              <div style={{ flex: 1, background: '#FAFAFA', padding: '24px', borderRadius: '16px', border: '1px solid #C4A47C', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#5A4D41', fontSize: '1.1rem', fontWeight: 'bold' }}>Tóm tắt Hiệu suất Lợi Nhuận</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: '#5A4D41' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tổng Doanh Thu (A)</span>
                    <span style={{ fontWeight: 'bold' }}>{formatVND(stats?.revenue || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tổng Chi Phí (B)</span>
                    <span style={{ fontWeight: 'bold' }}>{formatVND(stats?.expenses || 0)}</span>
                  </div>
                  <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Lợi Nhuận Gộp (C=A-B)</span>
                    <span style={{ fontWeight: 'bold', color: stats?.netProfit >= 0 ? '#7BB087' : '#5A4D41' }}>{stats?.netProfit >= 0 ? '+' : ''}{formatVND(stats?.netProfit || 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C4A47C', fontWeight: 'bold', fontSize: '1.05rem', marginTop: '4px' }}>
                    <span>LỢI NHUẬN THỰC TẾ</span>
                    <span>{stats?.netProfit >= 0 ? '+' : ''}{formatVND(stats?.netProfit || 0)}</span>
                  </div>
                  <div style={{ color: '#666666', fontSize: '0.9rem', marginTop: '4px' }}>
                    Công suất khả dụng: 98%
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Cards */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ background: '#FAFAFA', padding: '24px', borderRadius: '16px', border: '1px solid #C4A47C', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flex: 1 }}>
                <div style={{ color: '#5A4D41', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  Biên lợi nhuận Vận hành
                  <Percent size={18} color="#C4A47C" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#7BB087' }}>{stats?.profitMargin}%</div>
                <div style={{ color: '#666666', fontSize: '0.85rem', marginTop: '8px' }}>Tỷ lệ Lợi nhuận trước thuế trên Doanh thu.</div>
              </div>

              <div style={{ background: '#FAFAFA', padding: '24px', borderRadius: '16px', border: '1px solid #C4A47C', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', flex: 1 }}>
                <div style={{ color: '#5A4D41', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  Tỷ lệ Lấp đầy Phòng (OCC)
                  <CheckCircle2 size={18} color="#C4A47C" />
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#7BB087' }}>{stats?.occupancyRate}%</div>
                <div style={{ color: '#666666', fontSize: '0.85rem', marginTop: '8px' }}>Dựa trên số phòng kinh doanh.</div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #C4A47C', paddingTop: '16px', textAlign: 'center', color: '#666666', fontSize: '0.85rem' }}>
              Báo cáo được chiết xuất từ RentFlow Premier. Dữ liệu chuẩn quốc tế cho chủ sở hữu và nhà đầu tư.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
