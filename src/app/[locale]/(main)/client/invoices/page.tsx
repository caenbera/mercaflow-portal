import { InvoicesPageClient } from '@/components/portal/invoices/invoices-page-client';
import { RoleGuard } from '@/components/auth/role-guard';

export default function InvoicesPage() {
  return (
    <RoleGuard allowedRoles={['client', 'admin', 'superadmin']}>
      <InvoicesPageClient />
    </RoleGuard>
  );
}
