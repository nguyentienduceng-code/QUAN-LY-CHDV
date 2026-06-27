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

  const COLORS = ['#ef4444', '#3b82f6', '#f59e0b'];
  const pieData = stats ? [
    { name: 'Mặt bằng', value: stats.baseRent },
    { name: 'Điện nước', value: stats.utilitiesCost },
    { name: 'Bảo trì', value: stats.maintenanceCost }
  ].filter(d => d.value > 0) : [];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-glass)', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><PieChart className="text-accent" /> Tùy chỉnh Báo Cáo</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleDownloadImage} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Download size={18} /> Tải Ảnh (Gửi Đầu Tư)
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px', display: 'flex', gap: '16px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Chọn Tòa Nhà</label>
            <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}>
              <option value="All">Tất cả tòa nhà</option>
              {Array.from(allowedBuildings).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Chọn Tháng</label>
            <select value={selectedMonthKey} onChange={e => setSelectedMonthKey(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}>
              {availableMonths.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {/* KHUNG BÁO CÁO XUẤT ẢNH */}
        <div style={{ padding: '24px', background: '#050505' }}>
          <div ref={reportRef} style={{ 
            background: 'url("https://images.unsplash.com/photo-1617115852579-3e3a479eb29f?q=80&w=1200&auto=format&fit=crop") center/cover no-repeat, linear-gradient(135deg, #0a0a0a 0%, #000000 100%)', 
            backgroundBlendMode: 'overlay',
            padding: '40px', 
            borderRadius: '24px', 
            border: '2px solid #a97142', /* Matte Bronze */
            color: '#fff', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(169, 113, 66, 0.2)' 
          }}>
            
            {/* Header Báo Cáo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(169, 113, 66, 0.5)', paddingBottom: '20px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  BÁO CÁO KINH DOANH
                </h1>
                <p style={{ margin: '8px 0 0 0', color: '#d4af37', fontSize: '1.1rem', fontWeight: '500' }}>
                  {selectedMonthObj?.label.toUpperCase()} • {selectedBuilding === 'All' ? 'TỔNG HỢP TOÀN HỆ THỐNG' : `TÒA NHÀ: ${selectedBuilding.toUpperCase()}`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #bf953f, #fcf6ba, #b38728)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RentFlow Premier</div>
                <div style={{ color: '#a97142', fontSize: '0.9rem' }}>Quản lý chung hộ cao cấp</div>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid #8c5a2b', padding: '20px', borderRadius: '16px', boxShadow: 'inset 0 0 15px rgba(169, 113, 66, 0.1)' }}>
                <div style={{ color: '#d4af37', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}><TrendingUp size={16} /> Tổng Doanh Thu</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#b76e79', textShadow: '0 0 10px rgba(183, 110, 121, 0.3)' }}>{formatVND(stats?.revenue || 0)}</div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid #8c5a2b', padding: '20px', borderRadius: '16px', boxShadow: 'inset 0 0 15px rgba(169, 113, 66, 0.1)' }}>
                <div style={{ color: '#d4af37', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}><Activity size={16} /> Tổng Chi Phí Vận Hành</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6', textShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }}>{formatVND(stats?.expenses || 0)}</div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid #8c5a2b', padding: '20px', borderRadius: '16px', boxShadow: 'inset 0 0 15px rgba(169, 113, 66, 0.1)' }}>
                <div style={{ color: '#d4af37', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}><DollarSign size={16} /> Lợi Nhuận Ròng</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats?.netProfit >= 0 ? '#b76e79' : '#f87171', textShadow: stats?.netProfit >= 0 ? '0 0 10px rgba(183, 110, 121, 0.3)' : 'none' }}>{formatVND(stats?.netProfit || 0)}</div>
              </div>
            </div>

            {/* Charts & Secondary Stats */}
            <div style={{ display: 'flex', gap: '30px' }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)', padding: '24px', borderRadius: '16px', border: '1px solid #8c5a2b', boxShadow: 'inset 0 0 15px rgba(169, 113, 66, 0.1)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#d4af37', fontSize: '1.1rem', fontWeight: 'bold' }}>Phân bổ Chi phí Vận hành</h3>
                {pieData.length > 0 ? (
                  <div style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => {
                            const customColors = ['#1e3a8a', '#a97142', '#d4af37'];
                            return <Cell key={`cell-${index}`} fill={customColors[index % customColors.length]} />;
                          })}
                        </Pie>
                        <Tooltip formatter={(value) => formatVND(value)} contentStyle={{ background: '#0a0a0a', border: '1px solid #a97142', borderRadius: '8px', color: '#d4af37' }} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#d4af37' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a97142' }}>Không có phát sinh chi phí</div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(0,0,0,0.7)', padding: '24px', borderRadius: '16px', border: '1px solid #8c5a2b', boxShadow: 'inset 0 0 15px rgba(169, 113, 66, 0.1)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ color: '#d4af37', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><Percent size={18} /> Biên lợi nhuận Vận hành</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#b76e79', textShadow: '0 0 10px rgba(183, 110, 121, 0.3)' }}>{stats?.profitMargin}%</div>
                  <div style={{ color: '#a97142', fontSize: '0.85rem', marginTop: '8px' }}>Tỷ lệ Lợi nhuận trước thuế trên Doanh thu.</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.7)', padding: '24px', borderRadius: '16px', border: '1px solid #8c5a2b', boxShadow: 'inset 0 0 15px rgba(169, 113, 66, 0.1)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ color: '#d4af37', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}><CheckCircle2 size={18} /> Tỷ lệ Lấp đầy Phòng (OCC)</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#b76e79', textShadow: '0 0 10px rgba(183, 110, 121, 0.3)' }}>{stats?.occupancyRate}%</div>
                  <div style={{ color: '#a97142', fontSize: '0.85rem', marginTop: '8px' }}>Dựa trên số phòng kinh doanh.</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(169, 113, 66, 0.5)', paddingTop: '20px', textAlign: 'center', color: '#a97142', fontSize: '0.85rem' }}>
              Báo cáo được chiết xuất từ RentFlow Premier. Dữ liệu chuẩn quốc tế cho chủ sở hữu và nhà đầu tư.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
