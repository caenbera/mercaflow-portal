"use client";

import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
      if (firebaseUser) {
        setUser(firebaseUser);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const profileData = { ...doc.data(), uid: doc.id } as UserProfile;
            setUserProfile(profileData);
            // The role from Firestore is the single source of truth.
            setRole(profileData.role || 'client');
          } else {
            // User exists in Auth, but not in Firestore. Default to client.
            // This can happen if the user document is not created yet or was deleted.
            // For this app, we'll assume a 'client' role if no document is found.
            setUserProfile(null);
            setRole('client');
          }
          setLoading(false);
        }, (error) => {
           console.error("Error getting user profile:", error);
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
