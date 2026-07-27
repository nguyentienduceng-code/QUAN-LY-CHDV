import { doc, runTransaction, writeBatch, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Transaction-safe update for Room
 * Prevents race conditions when multiple users update the same room
 */
export const updateRoomTransaction = async (roomId, updates, ownerId) => {
  const roomRef = doc(db, 'rooms', String(roomId));

  return await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);

    if (!roomDoc.exists()) {
      throw new Error('Phòng không tồn tại');
    }

    // Verify ownership
    const roomData = roomDoc.data();
    if (roomData.ownerId !== ownerId) {
      throw new Error('Không có quyền chỉnh sửa phòng này');
    }

    // Apply updates with timestamp
    const dataToUpdate = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // Convert price to number if exists
    if ('price' in dataToUpdate) {
      dataToUpdate.price = Number(String(dataToUpdate.price).replace(/[^0-9.-]+/g, '')) || 0;
    }

    transaction.update(roomRef, dataToUpdate);

    return { success: true, data: dataToUpdate };
  });
};

/**
 * Transaction-safe update for Invoice
 * Prevents race conditions when updating invoice status or amount
 */
export const updateInvoiceTransaction = async (invoiceId, updates, ownerId) => {
  const invoiceRef = doc(db, 'invoices', String(invoiceId));

  return await runTransaction(db, async (transaction) => {
    const invoiceDoc = await transaction.get(invoiceRef);

    if (!invoiceDoc.exists()) {
      throw new Error('Hóa đơn không tồn tại');
    }

    // Verify ownership
    const invoiceData = invoiceDoc.data();
    if (invoiceData.ownerId !== ownerId) {
      throw new Error('Không có quyền chỉnh sửa hóa đơn này');
    }

    // Apply updates with timestamp
    const dataToUpdate = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    // Convert amount to number if exists
    if ('amount' in dataToUpdate) {
      dataToUpdate.amount = Number(String(dataToUpdate.amount).replace(/[^0-9.-]+/g, '')) || 0;
    }

    transaction.update(invoiceRef, dataToUpdate);

    return { success: true, data: dataToUpdate };
  });
};

/**
 * Transaction-safe update for Tenant
 * Prevents race conditions when updating tenant info
 */
export const updateTenantTransaction = async (tenantId, updates, ownerId) => {
  const tenantRef = doc(db, 'tenants', String(tenantId));

  return await runTransaction(db, async (transaction) => {
    const tenantDoc = await transaction.get(tenantRef);

    if (!tenantDoc.exists()) {
      throw new Error('Khách thuê không tồn tại');
    }

    // Verify ownership
    const tenantData = tenantDoc.data();
    if (tenantData.ownerId !== ownerId) {
      throw new Error('Không có quyền chỉnh sửa khách thuê này');
    }

    // Apply updates with timestamp
    const dataToUpdate = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    transaction.update(tenantRef, dataToUpdate);

    return { success: true, data: dataToUpdate };
  });
};

/**
 * Transaction-safe update for Contract
 * Prevents race conditions when updating contract status
 */
export const updateContractTransaction = async (contractId, updates, ownerId) => {
  const contractRef = doc(db, 'contracts', String(contractId));

  return await runTransaction(db, async (transaction) => {
    const contractDoc = await transaction.get(contractRef);

    if (!contractDoc.exists()) {
      throw new Error('Hợp đồng không tồn tại');
    }

    // Verify ownership
    const contractData = contractDoc.data();
    if (contractData.ownerId !== ownerId) {
      throw new Error('Không có quyền chỉnh sửa hợp đồng này');
    }

    // Apply updates with timestamp
    const dataToUpdate = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    transaction.update(contractRef, dataToUpdate);

    return { success: true, data: dataToUpdate };
  });
};

/**
 * Cascade delete tenant with all related data
 * Uses batched writes for atomic operation
 */
export const deleteTenantCascade = async (tenantId, ownerId) => {
  // First, get the tenant data to know which room to update
  const tenantRef = doc(db, 'tenants', String(tenantId));
  const tenantDoc = await getDocs(query(collection(db, 'tenants'), where('id', '==', tenantId)));

  if (tenantDoc.empty) {
    throw new Error('Khách thuê không tồn tại');
  }

  const tenantData = tenantDoc.docs[0].data();
  const tenantRoom = tenantData.room;

  // Create batch for atomic operations
  const batch = writeBatch(db);

  // 1. Delete tenant
  batch.delete(doc(db, 'tenants', String(tenantId)));

  // 2. Delete all contracts for this tenant
  const contractsSnap = await getDocs(
    query(collection(db, 'contracts'), where('tenantId', '==', tenantId), where('ownerId', '==', ownerId))
  );
  contractsSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 3. Delete all invoices for this tenant
  const invoicesSnap = await getDocs(
    query(collection(db, 'invoices'), where('tenantId', '==', tenantId), where('ownerId', '==', ownerId))
  );
  invoicesSnap.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 4. Update room status to 'available' if tenant had a room
  if (tenantRoom) {
    const roomsSnap = await getDocs(
      query(collection(db, 'rooms'), where('name', '==', tenantRoom), where('ownerId', '==', ownerId))
    );
    roomsSnap.forEach(doc => {
      batch.update(doc.ref, {
        status: 'available',
        updatedAt: serverTimestamp()
      });
    });
  }

  // Commit all operations atomically
  await batch.commit();

  return { success: true, deletedTenantId: tenantId, updatedRoom: tenantRoom };
};

/**
 * Batch update multiple documents atomically
 * Useful for bulk operations like updating all rooms in a building
 */
export const batchUpdate = async (collection, updates) => {
  const batch = writeBatch(db);

  updates.forEach(({ docId, data }) => {
    const docRef = doc(db, collection, String(docId));
    batch.update(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();

  return { success: true, updatedCount: updates.length };
};
