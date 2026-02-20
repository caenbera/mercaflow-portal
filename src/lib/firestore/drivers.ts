
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
import type { DriverProfile } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const addDriver = (data: Omit<DriverProfile, 'id' | 'createdAt'>) => {
  const coll = collection(db, 'drivers');
  const finalData = {
    ...data,
    status: 'active',
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

export const updateDriver = (id: string, data: Partial<DriverProfile>) => {
  const driverDoc = doc(db, 'drivers', id);
  return updateDoc(driverDoc, data).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: driverDoc.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteDriver = (id: string) => {
  const driverDoc = doc(db, 'drivers', id);
  return deleteDoc(driverDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: driverDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};
