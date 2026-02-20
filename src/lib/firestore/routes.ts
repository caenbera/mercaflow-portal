
'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Route } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const createRoute = (data: Omit<Route, 'id' | 'createdAt'>) => {
  const coll = collection(db, 'routes');
  const finalData = {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  return addDoc(coll, finalData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: coll.path,
      operation: 'create',
      requestResourceData: finalData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const updateRoute = (id: string, data: Partial<Route>) => {
  const routeDoc = doc(db, 'routes', id);
  return updateDoc(routeDoc, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: routeDoc.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteRoute = (id: string) => {
  const routeDoc = doc(db, 'routes', id);
  return deleteDoc(routeDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: routeDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
