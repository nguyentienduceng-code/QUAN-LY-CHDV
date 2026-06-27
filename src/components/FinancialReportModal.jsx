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
        <div style={{ padding: '24px', background: '#0f172a' }}>
          <div ref={reportRef} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            {/* Header Báo Cáo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '2rem', background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  BÁO CÁO TÀI CHÍNH
                </h1>
                <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '1.1rem' }}>
                  {selectedMonthObj?.label.toUpperCase()} • {selectedBuilding === 'All' ? 'TỔNG HỢP TOÀN HỆ THỐNG' : `TÒA NHÀ: ${selectedBuilding.toUpperCase()}`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>RentFlow</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Bản quyền phần mềm</div>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '20px', borderRadius: '16px' }}>
                <div style={{ color: '#34d399', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={16} /> TỔNG DOANH THU</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{formatVND(stats?.revenue || 0)}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px', borderRadius: '16px' }}>
                <div style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16} /> TỔNG CHI PHÍ</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{formatVND(stats?.expenses || 0)}</div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '20px', borderRadius: '16px' }}>
                <div style={{ color: '#60a5fa', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16} /> LỢI NHUẬN RÒNG</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats?.netProfit >= 0 ? '#34d399' : '#f87171' }}>{formatVND(stats?.netProfit || 0)}</div>
              </div>
            </div>

            {/* Charts & Secondary Stats */}
            <div style={{ display: 'flex', gap: '30px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#e2e8f0', fontSize: '1.1rem' }}>Chi tiết Phân bổ Chi phí</h3>
                {pieData.length > 0 ? (
                  <div style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatVND(value)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#cbd5e1' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Không có phát sinh chi phí</div>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Percent size={18} /> Biên lợi nhuận</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats?.profitMargin}%</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '8px' }}>Tỷ lệ Lợi nhuận / Doanh thu</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} /> Tỷ lệ Lấp đầy</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats?.occupancyRate}%</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '8px' }}>Dựa trên số phòng đang có khách thuê</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Báo cáo được trích xuất tự động từ Hệ thống RentFlow. Dữ liệu mang tính chất tham khảo cho chủ sở hữu và nhà đầu tư.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
