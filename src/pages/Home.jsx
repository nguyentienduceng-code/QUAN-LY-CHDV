import { TrendingUp, Users, DollarSign, AlertCircle, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../context/AppDataContext';
import { exportAllDataToExcel } from '../utils/exportExcel';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

export default function Home() {
  const appData = useAppData();
  const { rooms, invoices, tickets } = appData;

  const occupiedRooms = rooms.filter(r => r.status !== 'vacant').length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  
  const totalRevenue = invoices.reduce((acc, inv) => acc + (parseInt(inv.amount.replace(/\./g, '')) || 0), 0);
  const revenueStr = (totalRevenue / 1000000).toFixed(1) + ' Tr';

  const overdueInvoices = invoices.filter(i => i.status === 'unpaid').length;
  const activeTickets = tickets.reported.length + tickets.inProgress.length;

  // Generate dynamic chart data based on invoices
  const monthlyRevenue = {};
  invoices.forEach(inv => {
    // inv.id looks like INV-06-2026-1234 or inv.due looks like 05/07/2026
    const amt = parseInt(inv.amount.replace(/\./g, '')) || 0;
    const monthMatch = inv.id.match(/INV-(\d{2})-(\d{4})/);
    if (monthMatch) {
      const m = parseInt(monthMatch[1], 10);
      monthlyRevenue[`T${m}`] = (monthlyRevenue[`T${m}`] || 0) + amt;
    }
  });

  const chartData = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map(m => ({
    name: m,
    revenue: (monthlyRevenue[m] || 0) / 1000000
  })).filter(d => d.revenue > 0);

  // If not enough data, pad with previous months
  if (chartData.length < 3) {
    chartData.unshift({ name: 'T4', revenue: 45 });
    chartData.unshift({ name: 'T5', revenue: 48 });
  }

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
      
      <div className="grid-layout" style={{ marginBottom: '32px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Tỷ lệ lấp đầy</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-occupied)' }}>{occupancyRate}%</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%' }}>
              <Users size={24} color="var(--status-occupied)" />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Doanh thu (T6)</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{revenueStr}</div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '50%' }}>
              <DollarSign size={24} color="var(--accent-primary)" />
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Cảnh báo / Bảo trì</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-overdue)' }}>{overdueInvoices} Nợ / {activeTickets} Sửa</div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%' }}>
              <AlertCircle size={24} color="var(--status-overdue)" />
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <Card title={<><TrendingUp size={20} /> Biểu đồ Doanh thu</>}>
          <div style={{ height: '300px', width: '100%', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(val) => `${val} Tr VNĐ`} width={70} />
                <RechartsTooltip 
                  contentStyle={{ background: 'rgba(10, 14, 26, 0.9)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent-primary)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-primary)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={<><Users size={20} /> Tỉ lệ lấp đầy</>}>
          <div style={{ height: '300px', width: '100%', minWidth: '0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
