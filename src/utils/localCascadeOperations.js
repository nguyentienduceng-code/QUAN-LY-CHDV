/**
 * Local Storage Cascade Operations
 * Handles cascade delete and update operations for localStorage mode
 */

/**
 * Cascade delete tenant in local mode
 * Removes tenant and all related contracts, invoices, and updates room status
 */
export const localCascadeDeleteTenant = (
  tenantId,
  { tenants, contracts, invoices, rooms },
  { setTenants, setContracts, setInvoices, setRooms }
) => {
  // Find tenant to get room info
  const tenant = tenants.find(t => t.id === tenantId);
  if (!tenant) {
    throw new Error('Khách thuê không tồn tại');
  }

  const tenantRoom = tenant.room;
  const tenantEmail = tenant.email;

  // 1. Remove tenant
  setTenants(prev => prev.filter(t => t.id !== tenantId));

  // 2. Remove all contracts for this tenant
  setContracts(prev => prev.filter(c => {
    // Match by tenant name, email, or room
    return !(
      c.tenant === tenant.name ||
      c.tenantEmail === tenantEmail ||
      c.tenantId === tenantId ||
      (c.room === tenantRoom && c.tenant === tenant.name)
    );
  }));

  // 3. Remove all invoices for this tenant
  setInvoices(prev => prev.filter(inv => {
    // Match by tenant name, email, or room
    return !(
      inv.tenant === tenant.name ||
      inv.tenantEmail === tenantEmail ||
      inv.tenantId === tenantId ||
      (inv.room === tenantRoom && inv.tenant === tenant.name)
    );
  }));

  // 4. Update room status to 'available'
  if (tenantRoom) {
    setRooms(prev => prev.map(room => {
      if (room.name === tenantRoom) {
        return { ...room, status: 'available' };
      }
      return room;
    }));
  }

  return {
    success: true,
    deletedTenantId: tenantId,
    updatedRoom: tenantRoom
  };
};

/**
 * Cascade update when room name changes
 * Updates all related tenants, contracts, invoices
 */
export const localCascadeUpdateRoomName = (
  oldRoomName,
  newRoomName,
  { tenants, contracts, invoices },
  { setTenants, setContracts, setInvoices }
) => {
  // Update tenants
  setTenants(prev => prev.map(t => {
    if (t.room === oldRoomName) {
      return { ...t, room: newRoomName };
    }
    return t;
  }));

  // Update contracts
  setContracts(prev => prev.map(c => {
    if (c.room === oldRoomName) {
      return { ...c, room: newRoomName };
    }
    return c;
  }));

  // Update invoices
  setInvoices(prev => prev.map(inv => {
    if (inv.room === oldRoomName) {
      return { ...inv, room: newRoomName };
    }
    return inv;
  }));

  return { success: true };
};

/**
 * Cascade delete room
 * Prevents deletion if room has active tenants
 */
export const localCascadeDeleteRoom = (
  roomId,
  { rooms, tenants },
  { setRooms }
) => {
  const room = rooms.find(r => r.id === roomId);
  if (!room) {
    throw new Error('Phòng không tồn tại');
  }

  // Check if room has active tenants
  const hasActiveTenants = tenants.some(t => t.room === room.name && t.status === 'active');
  if (hasActiveTenants) {
    throw new Error('Không thể xóa phòng có khách đang thuê. Vui lòng chuyển khách đi trước.');
  }

  // Delete room
  setRooms(prev => prev.filter(r => r.id !== roomId));

  return { success: true, deletedRoomId: roomId };
};

/**
 * Cascade update when tenant moves to new room
 * Updates contracts and invoices
 */
export const localCascadeUpdateTenantRoom = (
  tenantId,
  oldRoom,
  newRoom,
  { contracts, invoices, rooms },
  { setContracts, setInvoices, setRooms }
) => {
  // Update contracts
  setContracts(prev => prev.map(c => {
    if (c.tenantId === tenantId || (c.room === oldRoom && c.status === 'active')) {
      return { ...c, room: newRoom };
    }
    return c;
  }));

  // Update invoices
  setInvoices(prev => prev.map(inv => {
    if (inv.tenantId === tenantId || (inv.room === oldRoom && inv.status !== 'paid')) {
      return { ...inv, room: newRoom };
    }
    return inv;
  }));

  // Update old room status to available
  if (oldRoom) {
    setRooms(prev => prev.map(room => {
      if (room.name === oldRoom) {
        return { ...room, status: 'available' };
      }
      return room;
    }));
  }

  // Update new room status to occupied
  if (newRoom) {
    setRooms(prev => prev.map(room => {
      if (room.name === newRoom) {
        return { ...room, status: 'occupied' };
      }
      return room;
    }));
  }

  return { success: true };
};
