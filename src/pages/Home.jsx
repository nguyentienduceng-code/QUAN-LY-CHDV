import { useState, useMemo } from 'react';
import { TrendingUp, Users, DollarSign, AlertCircle, AlertTriangle, Download, Upload, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../context/AppDataContext';
import { exportAllDataToExcel } from '../utils/exportExcel';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import ImportModal from '../components/ImportModal';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const appData = useAppData();
  const { rooms, tenants, invoices, tickets, settings } = appData;

  const allowedBuildingsSet = useMemo(() => {
    return new Set(
      (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff' || !user?.allowedBuildings || user.allowedBuildings.includes('all')) 
      ? settings.buildings 
      : settings.buildings.filter(b => user.allowedBuildings.includes(b))
    );
  }, [user, settings.buildings]);

  const [activeBuilding, setActiveBuilding] = useState('All');

  const selectedBuildingsSet = useMemo(() => {
    if (activeBuilding === 'All') {
      return allowedBuildingsSet;
    }
    return new Set([activeBuilding]);
  }, [activeBuilding, allowedBuildingsSet]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => selectedBuildingsSet.has(r.building || 'A'));
  }, [rooms, selectedBuildingsSet]);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const room = rooms.find(r => r.name === inv.room);
      return room && selectedBuildingsSet.has(room.building || 'A');
    });
  }, [invoices, rooms, selectedBuildingsSet]);

  const filteredTickets = useMemo(() => {
    const filterTickets = (ticketList) => ticketList.filter(t => {
      const room = rooms.find(r => r.name === t.room);
      return room && selectedBuildingsSet.has(room.building || 'A');
    });
    return {
      reported: filterTickets(tickets.reported),
      inProgress: filterTickets(tickets.inProgress),
      resolved: filterTickets(tickets.resolved)
    };
  }, [tickets, rooms, selectedBuildingsSet]);

  const filteredTenantsCount = useMemo(() => {
    return tenants.filter(t => {
      const room = rooms.find(r => r.name === t.room);
      return room && selectedBuildingsSet.has(room.building || 'A');
    }).length;
  }, [tenants, rooms, selectedBuildingsSet]);

  const occupiedRooms = useMemo(() => {
    return filteredRooms.filter(r => r.status !== 'vacant').length;
  }, [filteredRooms]);

  const occupancyRate = useMemo(() => {
    return filteredRooms.length > 0 ? Math.round((occupiedRooms / filteredRooms.length) * 100) : 0;
  }, [filteredRooms, occupiedRooms]);
  
  const totalRevenue = useMemo(() => {
    return filteredInvoices.reduce((acc, inv) => acc + (parseInt(inv.amount.replace(/\./g, '')) || 0), 0);
  }, [filteredInvoices]);
  
  const maintenanceCost = useMemo(() => {
    return ['reported', 'inProgress', 'resolved'].reduce((sum, col) => {
      return sum + filteredTickets[col].reduce((colSum, t) => colSum + (t.cost || 0), 0);
    }, 0);
  }, [filteredTickets]);

  const uniqueInvoiceMonths = useMemo(() => {
    return new Set(filteredInvoices.map(inv => {
      const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
      return m ? `${m[1]}-${m[2]}` : null;
    }).filter(Boolean));
  }, [filteredInvoices]);

  const totalBaseRent = useMemo(() => {
    let rent = 0;
    uniqueInvoiceMonths.forEach(() => {
      selectedBuildingsSet.forEach(b => {
        rent += (settings.prices?.[b]?.baseRent || 0);
      });
    });
    return rent;
  }, [uniqueInvoiceMonths, selectedBuildingsSet, settings.prices]);

  const totalBaseUtilCost = useMemo(() => {
    let cost = 0;

    // Group invoices by month-building to count service utility once per month per building
    const monthBuildingSet = {};

    filteredInvoices.forEach(inv => {
      const room = filteredRooms.find(r => r.name === inv.room);
      const b = room?.building || 'A';
      const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
      if (!m) return;
      const monthKey = `${String(m[1]).padStart(2, '0')}-${m[2]}`;
      const p = settings.prices?.[b] || {};
      const mode = p.utilityCalcMode || 'tenant_only';

      // Count tenant usage for tenant_only and add_service modes
      if (mode === 'tenant_only' || mode === 'add_service') {
        inv.items?.forEach(item => {
          if (item.name === 'Tiền điện') cost += (item.qty * (p.baseElectricityPrice || 0));
          else if (item.name === 'Tiền nước') cost += (item.qty * (p.baseWaterPrice || 0));
        });
      }

      // Track unique month-building combos for service/total cost
      const mbKey = `${monthKey}_${b}`;
      if (!monthBuildingSet[mbKey]) {
        monthBuildingSet[mbKey] = { monthKey, b };
      }
    });

    // Add per-month service or total building utility cost
    Object.values(monthBuildingSet).forEach(({ monthKey, b }) => {
      const p = settings.prices?.[b] || {};
      const mode = p.utilityCalcMode || 'tenant_only';
      const mu = p.monthlyUtility?.[monthKey] || {};

      if (mode === 'add_service') {
        cost += (mu.elec || 0) * (p.baseElectricityPrice || 0);
        cost += (mu.water || 0) * (p.baseWaterPrice || 0);
      } else if (mode === 'total_building') {
        // For total_building mode, the monthly entry IS the full cost basis
        cost += (mu.elec || 0) * (p.baseElectricityPrice || 0);
        cost += (mu.water || 0) * (p.baseWaterPrice || 0);
      }
    });

    return cost;
  }, [filteredInvoices, filteredRooms, settings.prices]);

  const totalExpenses = maintenanceCost + totalBaseRent + totalBaseUtilCost;

  const revenueStr = (totalRevenue / 1000000).toFixed(1) + ' Tr';
  const expensesStr = (totalExpenses / 1000000).toFixed(1) + ' Tr';

  const overdueInvoices = filteredInvoices.filter(i => i.status === 'unpaid').length;
  const activeTickets = filteredTickets.reported.length + filteredTickets.inProgress.length;

  const chartData = useMemo(() => {
    const now = new Date();
    const chartMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
      const key = `${d.getMonth() + 1}-${d.getFullYear()}`;
      chartMonths.push({ label, key, month: d.getMonth() + 1, year: d.getFullYear() });
    }

    return chartMonths.map(({ label, month, year }) => {
      const rev = filteredInvoices.reduce((s, inv) => {
        const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
        if (m && parseInt(m[1]) === month && parseInt(m[2]) === year) {
          return s + (parseInt(inv.amount.replace(/\./g, '')) || 0);
        }
        return s;
      }, 0);
      
      const mCost = ['reported', 'inProgress', 'resolved'].reduce((s, col) => {
        return s + filteredTickets[col].reduce((cs, t) => {
          if (t.cost && t.date) {
            const parts = t.date.split('/');
            if (parseInt(parts[1]) === month) return cs + t.cost;
          }
          return cs;
        }, 0);
      }, 0);

      let bRent = 0;
      selectedBuildingsSet.forEach(b => {
        bRent += (settings.prices?.[b]?.baseRent || 0);
      });
      
      const monthInvoices = filteredInvoices.filter(inv => {
        const m = inv.id.match(/INV-(\d{2})-(\d{4})/);
        return m && parseInt(m[1]) === month && parseInt(m[2]) === year;
      });

      let bUtil = 0;
      const activeBuildingsThisMonth = new Set();

      monthInvoices.forEach(inv => {
        const room = filteredRooms.find(r => r.name === inv.room);
        const b = room?.building || 'A';
        activeBuildingsThisMonth.add(b);

        const p = settings.prices?.[b] || {};
        const mode = p.utilityCalcMode || 'tenant_only';

        if (mode === 'tenant_only' || mode === 'add_service') {
          inv.items?.forEach(item => {
            if (item.name === 'Tiền điện') bUtil += (item.qty * (p.baseElectricityPrice || 0));
            else if (item.name === 'Tiền nước') bUtil += (item.qty * (p.baseWaterPrice || 0));
          });
        }
      });

      // Build the month key format MM-YYYY matching monthlyUtility storage
      const chartMonthKey = `${String(month).padStart(2, '0')}-${year}`;

      activeBuildingsThisMonth.forEach(b => {
        const p = settings.prices?.[b] || {};
        const mode = p.utilityCalcMode || 'tenant_only';
        const mu = p.monthlyUtility?.[chartMonthKey] || {};

        if (mode === 'add_service') {
          bUtil += (mu.elec || 0) * (p.baseElectricityPrice || 0);
          bUtil += (mu.water || 0) * (p.baseWaterPrice || 0);
        } else if (mode === 'total_building') {
          bUtil += (mu.elec || 0) * (p.baseElectricityPrice || 0);
          bUtil += (mu.water || 0) * (p.baseWaterPrice || 0);
        }
      });

      const exp = mCost + (monthInvoices.length > 0 ? bRent : 0) + bUtil;

      return { name: label, revenue: Math.round(rev / 1000000 * 10) / 10, expenses: Math.round(exp / 1000000 * 10) / 10 };
    });
  }, [filteredInvoices, filteredTickets, selectedBuildingsSet, settings.prices, filteredRooms]);

  const pieData = useMemo(() => {
    return filteredRooms.length > 0 ? [
      { name: 'Đã thuê', value: occupiedRooms, color: '#10b981' },
      { name: 'Phòng trống', value: filteredRooms.length - occupiedRooms, color: '#3b82f6' }
    ] : [
      { name: 'Chưa có phòng', value: 1, color: 'var(--bg-secondary)' }
    ];
  }, [filteredRooms, occupiedRooms]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ margin: 0 }}>Tổng quan hệ thống</h1>
        <div className="page-header-actions">
          <button onClick={() => setIsImportOpen(true)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Upload size={16} /> Nhập Dữ Liệu
          </button>
          <button onClick={() => {
            exportAllDataToExcel(appData);
            toast.success('Đã xuất file Backup Excel thành công!');
          }} style={{ padding: '8px 16px', background: 'var(--status-occupied)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Download size={16} /> Backup Dữ Liệu (Excel)
          </button>
        </div>
      </div>
      
      {/* Building selector buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {['All', ...Array.from(allowedBuildingsSet)].map(b => (
          <button
            key={b}
            onClick={() => setActiveBuilding(b)}
            style={{
              padding: '8px 20px',
              background: activeBuilding === b ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: activeBuilding === b ? '#fff' : 'var(--text-secondary)',
              border: activeBuilding === b ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
              borderRadius: '20px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            {b === 'All' ? 'Tất cả Tòa' : (String(b).toLowerCase().startsWith('nhà') ? b : `Nhà ${b}`)}
          </button>
        ))}
      </div>

      {/* Quick stats summary */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng Số Khách Thuê</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{filteredTenantsCount} người</span>
        </div>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phòng Đang Thuê</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--status-occupied-text)' }}>{occupiedRooms} / {filteredRooms.length} phòng</span>
        </div>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phòng Trống</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--status-vacant-text)' }}>{filteredRooms.length - occupiedRooms} / {filteredRooms.length} phòng</span>
        </div>
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
                    <div style={{ marginLeft: '16px' }}>- Chi phí Điện/Nước gốc (bao gồm dịch vụ chung)</div>
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
            {filteredRooms.filter(r => r.status === 'expiring').slice(0, 2).map((room, i) => (
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
            
            {filteredInvoices.filter(inv => inv.status === 'unpaid').slice(0, 2).map((inv, i) => (
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
          
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '12px' }}>
              <Bell size={18} /> Đăng thông báo nội bộ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Tiêu đề thông báo..." 
                id="ann-title"
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} 
              />
              <textarea 
                placeholder="Nội dung thông báo (hiển thị trên app Khách thuê)..." 
                id="ann-msg"
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', minHeight: '60px', resize: 'vertical' }} 
              ></textarea>
              <button 
                onClick={() => {
                  const titleInput = document.getElementById('ann-title');
                  const msgInput = document.getElementById('ann-msg');
                  if (!titleInput.value || !msgInput.value) {
                    toast.error('Vui lòng nhập đủ tiêu đề và nội dung!');
                    return;
                  }
                  const newAnn = {
                    id: Date.now(),
                    title: titleInput.value,
                    message: msgInput.value,
                    date: new Date().toLocaleDateString('vi-VN')
                  };
                  const currentAnns = appData?.settings?.announcements || [];
                  appData.setSettings({ announcements: [newAnn, ...currentAnns] });
                  toast.success('Đã đăng thông báo cho tất cả khách thuê!');
                  titleInput.value = '';
                  msgInput.value = '';
                }}
                style={{ padding: '10px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Gửi thông báo ngay
              </button>
            </div>
          </div>
        </Card>
      </div>

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
}
