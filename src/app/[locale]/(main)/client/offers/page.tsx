import { OffersPageClient } from '@/components/portal/offers/offers-page-client';
import { RoleGuard } from '@/components/auth/role-guard';

export default function OffersPage() {
  return (
    <RoleGuard allowedRoles={['client', 'admin', 'superadmin']}>
      <OffersPageClient />
    </RoleGuard>
  );
}
