
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
      // Para administradores, intentamos filtrar por la organización de su perfil
      const orgId = userProfile?.organizationId;
      
      if (orgId) {
        q = query(ordersCollection, where('organizationId', '==', orgId), orderBy('createdAt', 'desc'));
      } else if (role === 'superadmin') {
        // El Super Admin sin organización fija ve todo el historial global
        q = query(ordersCollection, orderBy('createdAt', 'desc'));
      } else {
        // Staff sin organización asignada no ve nada
        setOrders([]);
        setLoading(false);
        return;
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
        // Si hay un error de permisos (posiblemente por falta de índice compuesto),
        // registramos el error contextual para el agente.
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
