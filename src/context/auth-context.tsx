
"use client";

import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean; // El estado de carga es clave
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
});

const SUPER_ADMIN_EMAIL = 'superadmin@thefreshhub.com';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          // Force refresh the token to get the latest custom claims.
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          const claims = tokenResult.claims;
          
          let userRole: UserRole = 'client'; // Default to client
          
          // The email check for superadmin acts as a failsafe
          if (firebaseUser.email === SUPER_ADMIN_EMAIL || claims.superadmin) {
            userRole = 'superadmin';
          } else if (claims.admin) {
            userRole = 'admin';
          }
          
          setRole(userRole);

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubProfile = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              setUserProfile({ ...doc.data(), uid: doc.id } as UserProfile);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          }, (error) => {
             console.error("Error al obtener perfil:", error);
             setLoading(false);
          });

          return () => unsubProfile();
        } catch (error) {
           console.error("Error al obtener claims del usuario:", error);
           setUser(null);
           setRole(null);
           setLoading(false);
        }
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
