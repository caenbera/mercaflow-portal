import { PurchasingPageClient } from '@/components/admin/purchasing/purchasing-page-client';
import { RoleGuard } from '@/components/auth/role-guard';

export default function PurchasingPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin', 'purchaser']}>
      <div className="p-4 sm:p-6 lg:p-8">
        <PurchasingPageClient />
      </div>
    </RoleGuard>
  );
}
