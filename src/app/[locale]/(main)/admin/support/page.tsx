// src/app/[locale]/(main)/admin/support/page.tsx
import { RoleGuard } from '@/components/auth/role-guard';
import { SupportPageClient } from '@/components/admin/support/support-page-client';

export default function AdminSupportPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <div className="p-4 sm:p-6 lg:p-8">
        <SupportPageClient />
      </div>
    </RoleGuard>
  );
}
