
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Prospect, ProspectVisit } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type ProspectInput = Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>;
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

export const findProspectByNameAndCity = async (name: string, city: string): Promise<(Prospect & { id: string }) | null> => {
  const q = query(
    collection(db, 'prospects'),
    where('name', '==', name),
    where('city', '==', city),
    limit(1)
  );

  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Prospect & { id: string };
    }
    return null;
  } catch (error) {
    console.error("Error finding prospect:", error);
    // You might want to handle permission errors specifically here if needed
    return null;
  }
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
