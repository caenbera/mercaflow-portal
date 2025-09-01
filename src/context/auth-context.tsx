
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
      setLoading(true); // Start loading whenever auth state changes
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          // 1. Force refresh the token to get the latest custom claims. This is critical.
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          const claims = tokenResult.claims;
          const userRole: UserRole = claims.superadmin ? 'superadmin' : claims.admin ? 'admin' : 'client';
          setRole(userRole);

          // 2. Set up a listener for the user's profile document from Firestore.
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubProfile = onSnapshot(userDocRef, 
            (doc) => {
              if (doc.exists()) {
                setUserProfile({ ...doc.data(), uid: doc.id } as UserProfile);
              } else {
                console.error("User profile document does not exist.");
                setUserProfile(null);
              }
              // 3. Only set loading to false after both claims and profile are fetched.
              setLoading(false);
            }, 
            (error) => {
               console.error("Error fetching user profile:", error);
               // In case of error, log out the user's state and stop loading
               setUser(null);
               setUserProfile(null);
               setRole(null);
               setLoading(false);
            }
          );
          // Return the profile listener's unsubscribe function to be called on cleanup
          return () => unsubProfile();
        } catch (error) {
           console.error("Error fetching user claims:", error);
           setUser(null);
           setUserProfile(null);
           setRole(null);
           setLoading(false);
        }
      } else {
        // No user is signed in. Clear all state and finish loading.
        setUser(null);
        setUserProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    // This is the main unsubscribe function for the auth state listener
    return () => unsubscribe();
  }, []);

  const value = { user, userProfile, role, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
