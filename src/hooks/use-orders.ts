
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/auth-context';
import type { Order } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Hook para obtener los pedidos del usuario actual.
 * Si es Admin/SuperAdmin, obtiene los pedidos del edificio activo.
 * Si es Cliente final (customer), obtiene sus propios pedidos.
 */
export function useOrders() {
  const { user, userProfile, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const ordersCollection = collection(db, 'orders');
    let q;

    // Lógica de filtrado según el rol
    if (role === 'admin' || role === 'superadmin' || role === 'picker') {
      // Para administradores, mostramos los pedidos del edificio en el que están trabajando
      const orgId = userProfile?.organizationId;
      if (!orgId && role !== 'superadmin') {
        setLoading(false);
        return;
      }
      
      // Super Admin puede ver todo, pero por defecto filtramos por la organización activa para no saturar
      if (orgId) {
        q = query(ordersCollection, where('organizationId', '==', orgId), orderBy('createdAt', 'desc'));
      } else {
        q = query(ordersCollection, orderBy('createdAt', 'desc'));
      }
    } else {
      // Para Clientes (client) o Consumidores (customer), solo sus propios pedidos
      q = query(
        ordersCollection,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData: Order[] = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(ordersData);
        setLoading(false);
      },
      (serverError) => {
        // Silenciar error si el Super Admin aún no tiene pedidos propios y la regla es restrictiva
        if (role === 'superadmin' && serverError.code === 'permission-denied') {
            setOrders([]);
            setLoading(false);
            return;
        }

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
  }, [user, userProfile, role]);

  return { orders, loading, error };
}
