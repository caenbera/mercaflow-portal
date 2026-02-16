
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Order } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useAllOrders() {
  const { user } = useAuth();
  const { activeOrgId } = useOrganization();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !activeOrgId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const ordersCollection = collection(db, 'orders');
    const q = query(
      ordersCollection,
      where('organizationId', '==', activeOrgId)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData: Order[] = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() } as Order);
        });
        
        ordersData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setOrders(ordersData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: ordersCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, activeOrgId]);

  return { orders, loading, error };
}
