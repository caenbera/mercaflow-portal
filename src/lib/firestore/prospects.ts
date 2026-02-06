import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Prospect, ProspectVisit } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type ProspectInput = Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>;
type VisitInput = Omit<ProspectVisit, 'id' | 'date'>;

export const addProspect = (prospectData: ProspectInput) => {
  const prospectsCollection = collection(db, 'prospects');
  const dataWithTimestamp = {
    ...prospectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(prospectsCollection, dataWithTimestamp).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: prospectsCollection.path,
      operation: 'create',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const updateProspect = (prospectId: string, prospectData: Partial<ProspectInput>) => {
  const prospectDoc = doc(db, 'prospects', prospectId);
  const dataWithTimestamp = {
    ...prospectData,
    updatedAt: serverTimestamp(),
  };
  return updateDoc(prospectDoc, dataWithTimestamp).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: prospectDoc.path,
      operation: 'update',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const deleteProspect = (prospectId: string) => {
  const prospectDoc = doc(db, 'prospects', prospectId);
  return deleteDoc(prospectDoc).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: prospectDoc.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw serverError;
  });
};

export const addProspectVisit = (prospectId: string, visitData: VisitInput) => {
    const visitsCollection = collection(db, 'prospects', prospectId, 'visits');
    const dataWithTimestamp = {
      ...visitData,
      date: serverTimestamp(),
    };
    return addDoc(visitsCollection, dataWithTimestamp).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: visitsCollection.path,
          operation: 'create',
          requestResourceData: dataWithTimestamp,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
      });
}
