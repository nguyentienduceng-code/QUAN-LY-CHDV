import { useState, useCallback } from 'react';
import { query, collection, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Custom hook for Firestore pagination
 * Prevents loading all documents at once, improving performance with large datasets
 */
export const usePagination = (collectionName, pageSize = 50) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Load first page
   */
  const loadFirstPage = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      let q = collection(db, collectionName);

      // Apply filters
      const constraints = [];
      if (filters.ownerId) {
        constraints.push(where('ownerId', '==', filters.ownerId));
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.room) {
        constraints.push(where('room', '==', filters.room));
      }

      // Add ordering
      if (filters.orderByField) {
        constraints.push(orderBy(filters.orderByField, filters.orderDirection || 'desc'));
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      // Add limit
      constraints.push(limit(pageSize));

      q = query(q, ...constraints);

      const snapshot = await getDocs(q);
      const docs = [];
      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() });
      });

      setDocuments(docs);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);

      return docs;
    } catch (err) {
      console.error('Error loading first page:', err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [collectionName, pageSize]);

  /**
   * Load next page
   */
  const loadNextPage = useCallback(async (filters = {}) => {
    if (!hasMore || !lastVisible) return;

    setLoading(true);
    setError(null);

    try {
      let q = collection(db, collectionName);

      // Apply filters
      const constraints = [];
      if (filters.ownerId) {
        constraints.push(where('ownerId', '==', filters.ownerId));
      }
      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.room) {
        constraints.push(where('room', '==', filters.room));
      }

      // Add ordering
      if (filters.orderByField) {
        constraints.push(orderBy(filters.orderByField, filters.orderDirection || 'desc'));
      } else {
        constraints.push(orderBy('createdAt', 'desc'));
      }

      // Start after last document
      constraints.push(startAfter(lastVisible));
      constraints.push(limit(pageSize));

      q = query(q, ...constraints);

      const snapshot = await getDocs(q);
      const docs = [];
      snapshot.forEach(doc => {
        docs.push({ id: doc.id, ...doc.data() });
      });

      setDocuments(prev => [...prev, ...docs]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
      setCurrentPage(prev => prev + 1);
      setLoading(false);

      return docs;
    } catch (err) {
      console.error('Error loading next page:', err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [collectionName, pageSize, hasMore, lastVisible]);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setDocuments([]);
    setLastVisible(null);
    setHasMore(true);
    setCurrentPage(1);
    setError(null);
  }, []);

  return {
    documents,
    loading,
    error,
    hasMore,
    currentPage,
    loadFirstPage,
    loadNextPage,
    reset
  };
};

/**
 * Client-side pagination hook for already loaded data
 * Useful for local mode or when data is already fetched
 */
export const useClientPagination = (data = [], pageSize = 50) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const reset = () => {
    setCurrentPage(1);
  };

  return {
    currentData,
    currentPage,
    totalPages,
    pageSize,
    totalItems: data.length,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    nextPage,
    previousPage,
    reset
  };
};
