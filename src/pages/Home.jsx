import { TrendingUp, Users, DollarSign, AlertCircle, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../context/AppDataContext';
import { exportAllDataToExcel } from '../utils/exportExcel';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

export default function Home() {
  const appData = useAppData();
  const { rooms, invoices, tickets, settings } = appData;

  const occupiedRooms = rooms.filter(r => r.status !== 'vacant').length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  
  const totalRevenue = invoices.reduce((acc, inv) => acc + (parseInt(inv.amount.replace(/\./g, '')) || 0), 0);
  
  const maintenanceCost = ['reported', 'inProgress', 'resolved'].reduce((sum, col) => {
    return sum + tickets[col].reduce((colSum, t) => colSum + (t.cost || 0), 0);
  }, 0);

  const uniqueInvoiceMonths = new Set(invoices.map(inv => {
    const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
    return m ? `${m[1]}-${m[2]}` : null;
  }).filter(Boolean));

  let totalBaseRent = 0;
  uniqueInvoiceMonths.forEach(() => {
    settings.buildings.forEach(b => {
      totalBaseRent += (settings.prices?.[b]?.baseRent || 0);
    });
  });

  let totalBaseUtilCost = 0;
  invoices.forEach(inv => {
    const room = rooms.find(r => r.name === inv.room);
    const b = room?.building || 'A';
    const p = settings.prices?.[b] || {};
    inv.items?.forEach(item => {
      if (item.name === 'Tiền điện') totalBaseUtilCost += (item.qty * (p.baseElectricityPrice || 0));
      else if (item.name === 'Tiền nước') totalBaseUtilCost += (item.qty * (p.baseWaterPrice || 0));
    });
  });

  const totalExpenses = maintenanceCost + totalBaseRent + totalBaseUtilCost;

  const revenueStr = (totalRevenue / 1000000).toFixed(1) + ' Tr';
  const expensesStr = (totalExpenses / 1000000).toFixed(1) + ' Tr';

  const overdueInvoices = invoices.filter(i => i.status === 'unpaid').length;
  const activeTickets = tickets.reported.length + tickets.inProgress.length;

  // Build per-month bar chart data: always show 6 months around now
  const now = new Date();
  const chartMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
    const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
    chartMonths.push({ label, key, month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const chartData = chartMonths.map(({ label, month, year }) => {
    // Sum revenue for this month/year
    const rev = invoices.reduce((s, inv) => {
      const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
      if (m && parseInt(m[1]) === month && parseInt(m[2]) === year) {
        return s + (parseInt(inv.amount.replace(/\./g, '')) || 0);
      }
      return s;
    }, 0);
    
    // Sum expenses for this month/year
    const mCost = ['reported', 'inProgress', 'resolved'].reduce((s, col) => {
      return s + tickets[col].reduce((cs, t) => {
        if (t.cost && t.date) {
          const parts = t.date.split('/');
          if (parseInt(parts[1]) === month) return cs + t.cost;
        }
        return cs;
      }, 0);
    }, 0);

    const bRent = settings.buildings.reduce((sum, b) => sum + (settings.prices?.[b]?.baseRent || 0), 0);
    
    const monthInvoices = invoices.filter(inv => {
      const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
      return m && parseInt(m[1]) === month && parseInt(m[2]) === year;
    });

    let bUtil = 0;
    monthInvoices.forEach(inv => {
      const room = rooms.find(r => r.name === inv.room);
      const b = room?.building || 'A';
      const p = settings.prices?.[b] || {};
      inv.items?.forEach(item => {
        if (item.name === 'Tiền điện') bUtil += (item.qty * (p.baseElectricityPrice || 0));
        else if (item.name === 'Tiền nước') bUtil += (item.qty * (p.baseWaterPrice || 0));
      });
    });

    const exp = mCost + (monthInvoices.length > 0 ? bRent : 0) + bUtil;

    return { name: label, revenue: Math.round(rev / 1000000 * 10) / 10, expenses: Math.round(exp / 1000000 * 10) / 10 };
  });

  const pieData = [
    { name: 'Đã thuê', value: occupiedRooms, color: '#10b981' }, // status-occupied
    { name: 'Phòng trống', value: rooms.length - occupiedRooms, color: '#3b82f6' } // accent-primary
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Tổng quan hệ thống</h1>
        <button onClick={() => {
          exportAllDataToExcel(appData);
          toast.success('Đã xuất file Backup Excel thành công!');
        }} style={{ padding: '8px 16px', background: 'var(--status-occupied)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <Download size={16} /> Backup Dữ Liệu (Excel)
        </button>
      </div>
      
      <div className="grid-layout" style={{ marginBottom: '32px', gridTemplateColumns: '1fr' }}>
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: 'var(--accent-primary)' }}><DollarSign size={24} /> Bảng Tổng Hợp Doanh Thu & Lợi Nhuận</div>}>
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', fontSize: '1.1rem', fontWeight: '500' }}>Tổng Doanh Thu (Thu từ hóa đơn khách)</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', textAlign: 'right', color: 'var(--status-occupied)', fontSize: '1.2rem', fontWeight: 'bold' }}>+{revenueStr}</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px', borderBottom: '1px dashed var(--border-glass)', color: 'var(--text-secondary)' }}>
                    <div style={{ marginLeft: '16px' }}>- Chi phí thuê khoán trả chủ</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px dashed var(--border-glass)', textAlign: 'right', color: 'var(--status-overdue)' }}>-{(totalBaseRent / 1000000).toFixed(1)} Tr</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px', borderBottom: '1px dashed var(--border-glass)', color: 'var(--text-secondary)' }}>
                    <div style={{ marginLeft: '16px' }}>- Chi phí Điện/Nước theo đơn giá gốc</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px dashed var(--border-glass)', textAlign: 'right', color: 'var(--status-overdue)' }}>-{(totalBaseUtilCost / 1000000).toFixed(1)} Tr</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                    <div style={{ marginLeft: '16px' }}>- Chi phí bảo trì, sửa chữa phát sinh</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', textAlign: 'right', color: 'var(--status-overdue)' }}>-{(maintenanceCost / 1000000).toFixed(1)} Tr</td>
                </tr>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <td style={{ padding: '20px 16px', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>LỢI NHUẬN THỰC TẾ</td>
                  <td style={{ padding: '20px 16px', textAlign: 'right', fontSize: '1.5rem', fontWeight: 'bold', color: (totalRevenue - totalExpenses) >= 0 ? 'var(--status-occupied)' : 'var(--status-overdue)' }}>
                    {((totalRevenue - totalExpenses) / 1000000).toFixed(1)} Tr
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <Card title={<><TrendingUp size={20} /> Thu Chi Từng Tháng (Triệu VNĐ)</>}>
          <div style={{ height: '280px', width: '100%', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1}>
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}Tr`} width={36} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val, name) => [`${val} Tr VNĐ`, name === 'revenue' ? 'Doanh thu' : 'Chi phí']}
                />
                <Legend formatter={(v) => v === 'revenue' ? 'Doanh thu' : 'Chi phí'} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="revenue" name="revenue" fill="var(--status-occupied-text)" radius={[4,4,0,0]} maxBarSize={32} />
                <Bar dataKey="expenses" name="expenses" fill="var(--status-overdue-text)" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={<><Users size={20} /> Tỉ lệ lấp đầy</>}>
          <div style={{ height: '300px', width: '100%', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ background: 'rgba(10, 14, 26, 0.9)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={<><AlertTriangle size={20} /> Sự kiện sắp tới & Nhiệm vụ cấp bách</>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rooms.filter(r => r.status === 'expiring').slice(0, 2).map((room, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Phòng {room.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sắp hết hạn hợp đồng</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusBadge status="expiring" text="Gia hạn" />
                  <button onClick={() => toast.success('Đã tạo thông báo nhắc gia hạn qua Zalo!')} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>Nhắc ngay</button>
                </div>
              </div>
            ))}
            
            {invoices.filter(inv => inv.status === 'unpaid').slice(0, 2).map((inv, i) => (
              <div key={`inv-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-glass)' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Phòng {inv.room}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quá hạn thu tiền</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusBadge status="overdue" text="Nhắc nợ" />
                  <button onClick={() => toast.success('Đã gửi nhắc nợ qua Zalo thành công!')} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}>Gửi Zalo</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
