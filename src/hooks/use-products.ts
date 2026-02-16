
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useOrganization } from '@/context/organization-context';

export function useProducts() {
  const { activeOrgId } = useOrganization();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeOrgId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const productsCollection = collection(db, 'products');
    // Filtramos por organización. No usamos orderBy para evitar requerir índices compuestos inmediatos.
    const q = query(
      productsCollection, 
      where('organizationId', '==', activeOrgId)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() } as Product);
        });
        
        // Ordenamos en el cliente para mayor estabilidad inicial
        productsData.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setProducts(productsData);
        setLoading(false);
      },
      (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: productsCollection.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(serverError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOrgId]);

  return { products, loading, error };
}
