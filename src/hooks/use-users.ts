
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserProfile } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Hook para obtener usuarios.
 * Si hay un edificio activo en el contexto, filtra solo los usuarios de ese edificio.
 * Si no hay edificio activo y el usuario es superadmin, muestra todos los usuarios (Vista Plataforma).
 */
export function useUsers() {
  const { user, role } = useAuth();
  const { activeOrgId } = useOrganization();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    const usersCollection = collection(db, 'users');
    let q;

    if (activeOrgId) {
      // Vista Edificio: Solo usuarios de esta organización
      q = query(
        usersCollection, 
        where('organizationId', '==', activeOrgId),
        orderBy('createdAt', 'desc')
      );
    } else if (role === 'superadmin') {
      // Vista Plataforma: Todos los usuarios
      q = query(usersCollection, orderBy('createdAt', 'desc'));
    } else {
      // Otros casos: lista vacía por seguridad
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
  }, [user, role, activeOrgId]);

  return { users, loading, error };
}
