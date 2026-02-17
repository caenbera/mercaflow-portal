
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
  const { user, role, loading: authLoading } = useAuth();
  const { activeOrgId } = useOrganization();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Es CRÍTICO esperar a que el auth y el rol estén resueltos antes de consultar
    if (authLoading || !user || role === null) {
        return;
    }

    const usersCollection = collection(db, 'users');
    let q;

    if (activeOrgId) {
      // Vista Edificio: Solo usuarios de esta organización
      // Eliminamos temporalmente el orderBy para descartar problemas de índices
      q = query(
        usersCollection, 
        where('organizationId', '==', activeOrgId)
      );
    } else if (role === 'superadmin') {
      // Vista Plataforma: Todos los usuarios
      // Eliminamos temporalmente el orderBy para descartar problemas de índices
      q = query(usersCollection);
    } else {
      // Otros casos: lista vacía por seguridad si no hay contexto de admin
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
        
        // Ordenamos manualmente en el cliente por ahora para garantizar éxito en la carga
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
  }, [user, role, authLoading, activeOrgId]);

  return { users, loading, error };
}
