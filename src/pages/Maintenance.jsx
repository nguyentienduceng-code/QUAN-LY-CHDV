import { Plus, MoreHorizontal } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StatusBadge from '../components/StatusBadge';
import { useAppData } from '../context/AppDataContext';

import { MessageSquare, Paperclip, User } from 'lucide-react';
import toast from 'react-hot-toast';

const TicketCard = ({ ticket, index }) => (
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
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}><MoreHorizontal size={16} /></button>
        </div>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>{ticket.title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '12px' }}>
          <span style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{ticket.room}</span>
          {ticket.priority === 'high-priority' ? <StatusBadge status="high-priority" text="Khẩn cấp" /> : 
           ticket.priority === 'medium' ? <StatusBadge status="expiring" text="Vừa" /> : 
           <StatusBadge status="occupied" text="Thấp" />}
        </div>
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
  const { tickets, moveTicket, addTicket } = useAppData();

  const handleAddTicket = () => {
    const title = prompt('Nhập tiêu đề sự cố (VD: Hỏng bóng đèn):');
    if (!title) return;
    const room = prompt('Khu vực / Số phòng:') || 'Khu chung';
    addTicket({ title, room, priority: 'medium' });
    toast.success('Đã tạo thẻ bảo trì mới!');
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
                    {tickets[col.id].map((t, i) => <TicketCard key={t.id} index={i} ticket={t} />)}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
