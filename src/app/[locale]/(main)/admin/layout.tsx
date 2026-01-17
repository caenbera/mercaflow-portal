"use client";

import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      {children}
    </RoleGuard>
  );
}
