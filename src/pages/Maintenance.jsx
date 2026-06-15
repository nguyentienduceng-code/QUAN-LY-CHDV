import { Plus, MoreHorizontal } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StatusBadge from '../components/StatusBadge';
import { useAppData } from '../context/AppDataContext';

import { MessageSquare, Paperclip, User, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';

const COST_CATEGORIES = [
  'Vật tư / Linh kiện',
  'Nhân công',
  'Thuê thiết bị',
  'Phí dịch vụ',
  'Chi phí khác',
];

const EditTicketModal = ({ ticket, onClose, onSave }) => {
  const [cost, setCost] = useState(ticket.cost || 0);
  const [assignee, setAssignee] = useState(ticket.assignee || '');
  const [description, setDescription] = useState(ticket.description || '');
  const [costCategory, setCostCategory] = useState(ticket.costCategory || COST_CATEGORIES[0]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '460px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px' }}>Cập nhật Yêu cầu</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ticket.id} • {ticket.room}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Title display */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Sự cố</div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{ticket.title}</div>
        </div>

        {/* Assignee */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Người phụ trách</label>
          <input type="text" value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Tên thợ / Kỹ thuật viên" style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Mô tả công việc đã thực hiện</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="VD: Đã thay bóng đèn LED 12W, kiểm tra điện hành lang tầng 2..."
            rows={3}
            style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-main)', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        {/* Cost Section */}
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--status-overdue)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} /> Chi phí phát sinh
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Loại chi phí</label>
              <select
                value={costCategory}
                onChange={e => setCostCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem' }}
              >
                {COST_CATEGORIES.map(c => <option key={c} value={c} style={{ background: 'var(--bg-card)' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Số tiền (VND)</label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(parseFloat(e.target.value) || 0)}
                placeholder="VD: 500000"
                style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          {cost > 0 && (
            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ≈ <strong style={{ color: 'var(--status-overdue)' }}>{cost.toLocaleString('vi-VN')} đ</strong> — {costCategory}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
          <button onClick={() => { onSave(ticket.id, { cost, assignee, description, costCategory }); onClose(); }} style={{ padding: '10px 18px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Lưu thông tin</button>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';

const TicketCard = ({ ticket, index, onEdit }) => (
  <Draggable draggableId={ticket.id} index={index}>
    {(provided) => (
      <div 
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          border: '1px solid var(--border-glass)',
          marginBottom: '12px',
          cursor: 'grab',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          ...provided.draggableProps.style
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ticket.id}</span>
          <button onClick={() => onEdit(ticket)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}><MoreHorizontal size={16} /></button>
        </div>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>{ticket.title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '12px' }}>
          <span style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{ticket.room}</span>
          {ticket.priority === 'high-priority' ? <StatusBadge status="high-priority" text="Khẩn cấp" /> : 
           ticket.priority === 'medium' ? <StatusBadge status="expiring" text="Vừa" /> : 
           <StatusBadge status="occupied" text="Thấp" />}
        </div>
        {ticket.cost > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--status-overdue)', fontWeight: '600', background: 'rgba(239, 68, 68, 0.1)', padding: '5px 8px', borderRadius: '4px', width: 'fit-content' }}>
              <DollarSign size={13} /> {ticket.cost.toLocaleString('vi-VN')} đ
              {ticket.costCategory && <span style={{ opacity: 0.75 }}>— {ticket.costCategory}</span>}
            </div>
            {ticket.description && (
              <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4', paddingLeft: '4px', borderLeft: '2px solid var(--border-glass)' }}>
                {ticket.description}
              </div>
            )}
          </div>
        )}
        {!ticket.cost && ticket.description && (
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4', paddingLeft: '6px', borderLeft: '2px solid var(--border-glass)' }}>
            {ticket.description}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: ticket.assignee ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            <User size={14} /> {ticket.assignee || 'Chưa giao'}
          </div>
          <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
            {ticket.attached && <Paperclip size={14} />}
            {ticket.comments > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                <MessageSquare size={14} /> {ticket.comments}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </Draggable>
);

export default function Maintenance() {
  const { tickets, moveTicket, addTicket, updateTicket } = useAppData();
  const [editingTicket, setEditingTicket] = useState(null);

  const handleAddTicket = () => {
    const title = prompt('Nhập tiêu đề sự cố (VD: Hỏng bóng đèn):');
    if (!title) return;
    const room = prompt('Khu vực / Số phòng:') || 'Khu chung';
    addTicket({ title, room, priority: 'medium', cost: 0 });
    toast.success('Đã tạo thẻ bảo trì mới!');
  };

  const handleSaveEdit = (id, data) => {
    updateTicket(id, data);
    toast.success('Đã cập nhật thông tin bảo trì!');
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    moveTicket(source.droppableId, destination.droppableId, source.index, destination.index);
  };

  const columns = [
    { id: 'reported', title: 'Mới tiếp nhận (Reported)' },
    { id: 'inProgress', title: 'Đang xử lý (In Progress)' },
    { id: 'resolved', title: 'Đã hoàn thành (Resolved)' }
  ];

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Quản Lý Bảo Trì (Kanban)</h1>
        <button onClick={handleAddTicket} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
          <Plus size={16} /> Tạo Yêu Cầu
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', flex: 1, overflow: 'hidden' }}>
          {columns.map(col => (
            <div key={col.id} className="kanban-column" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{col.title}</h3>
                <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>{tickets[col.id].length}</span>
              </div>
              
              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}
                  >
                    {tickets[col.id].map((t, i) => <TicketCard key={t.id} index={i} ticket={t} onEdit={setEditingTicket} />)}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {editingTicket && (
        <EditTicketModal ticket={editingTicket} onClose={() => setEditingTicket(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
