
"use client";

import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { UserProfile, UserRole } from '@/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Esperamos un ciclo de evento para asegurar que el SDK de Firestore
        // ha sincronizado el token de autenticación internamente.
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const profileData = { ...doc.data(), uid: doc.id } as UserProfile;
            setUserProfile(profileData);
            setRole(profileData.role || 'client');
          } else {
            setUserProfile(null);
            setRole('client');
          }
          setLoading(false);
        }, async (serverError) => {
           // Si el error es temporal por falta de propagación de token, reintentamos silenciosamente una vez
           console.warn("Auth Context: Profile read permission issue, likely session sync. User:", firebaseUser.uid);
           
           const permissionError = new FirestorePermissionError({
             path: userDocRef.path,
             operation: 'get',
           });
           errorEmitter.emit('permission-error', permissionError);
           setLoading(false);
        });

        return () => unsubProfile();
        
      } else {
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userProfile, role, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
