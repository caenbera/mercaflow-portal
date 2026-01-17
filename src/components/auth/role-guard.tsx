"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!role || !allowedRoles.includes(role)) {
      // Redirect to a safe default page if the role is not allowed
      // This could be the login page or a generic "access denied" page
      router.push('/login'); 
    }
  }, [role, loading, allowedRoles, router]);


  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  // If the role is not allowed, render nothing to prevent content flashing
  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  // If the role is allowed, render the children components
  return <>{children}</>;
}
