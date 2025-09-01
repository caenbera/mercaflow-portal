
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
          // Force refresh the token to get the latest custom claims. This is crucial.
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

          // Listen for profile changes in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubProfile = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const profileData = { ...doc.data(), uid: doc.id } as UserProfile;
              // If the role in firestore is different from the claim, it might indicate a recent change.
              // For simplicity, we trust the claim determined above.
              setUserProfile(profileData);
            } else {
              // This can happen briefly during sign up before the user document is created.
              setUserProfile(null);
            }
            // We are ready to show the UI only after claims and profile are checked.
            setLoading(false);
          }, (error) => {
             console.error("Error getting user profile:", error);
             setLoading(false);
          });

          return () => unsubProfile();
        } catch (error) {
           console.error("Error getting user claims:", error);
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
