
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, or } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { OrganizationConnection } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useConnections(orgId: string | null) {
  const [connections, setConnections] = useState<OrganizationConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setConnections([]);
      setLoading(false);
      return;
    }

    const connectionsCollection = collection(db, 'connections');
    // Query connections where orgId is either the requester or the receiver
    const q = query(
      connectionsCollection,
      or(
        where('fromOrgId', '==', orgId),
        where('toOrgId', '==', orgId)
      )
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const connectionsData: OrganizationConnection[] = [];
        querySnapshot.forEach((doc) => {
          connectionsData.push({ id: doc.id, ...doc.data() } as OrganizationConnection);
        });
        setConnections(connectionsData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: connectionsCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orgId]);

  return { connections, loading };
}
