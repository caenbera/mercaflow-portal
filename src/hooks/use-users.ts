
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserProfile } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Hook para obtener usuarios.
 * @param forceGlobal Si es true, ignora el edificio activo y muestra todos (solo para Super Admin)
 */
export function useUsers(forceGlobal: boolean = false) {
  const { user, role, loading: authLoading } = useAuth();
  const { activeOrgId } = useOrganization();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (authLoading || !user || role === null) {
        return;
    }

    const usersCollection = collection(db, 'users');
    let q;

    // Si pedimos global y somos superadmin, o si simplemente no hay edificio seleccionado
    if ((forceGlobal || !activeOrgId) && role === 'superadmin') {
      q = query(usersCollection);
    } else if (activeOrgId) {
      // Vista Edificio: Solo usuarios de esta organización
      q = query(
        usersCollection, 
        where('organizationId', '==', activeOrgId)
      );
    } else {
      setUsers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const usersData: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Excluir al superadmin actual de la lista para evitar auto-modificación accidental
          if (data.role !== 'superadmin' || doc.id !== user.uid) {
            usersData.push({ uid: doc.id, ...data } as UserProfile);
          }
        });
        
        // Ordenamos en el cliente para evitar errores de índices faltantes en el servidor
        usersData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setUsers(usersData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: usersCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, role, authLoading, activeOrgId, forceGlobal]);

  return { users, loading, error };
}
