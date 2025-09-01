
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
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          const claims = tokenResult.claims;
          const userRole: UserRole = claims.superadmin ? 'superadmin' : claims.admin ? 'admin' : 'client';
          setRole(userRole);

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubProfile = onSnapshot(userDocRef, 
            (doc) => {
              if (doc.exists()) {
                setUserProfile({ ...doc.data(), uid: doc.id } as UserProfile);
              } else {
                setUserProfile(null);
              }
              setLoading(false);
            }, 
            (error) => {
               console.error("Error fetching user profile:", error);
               setUserProfile(null);
               setRole(null);
               setLoading(false);
            }
          );
          // This is a cleanup function for the profile listener.
          // It's important to return it so it gets called when the user logs out.
          return () => unsubProfile();

        } catch (error) {
           console.error("Error fetching custom claims:", error);
           setUserProfile(null);
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
