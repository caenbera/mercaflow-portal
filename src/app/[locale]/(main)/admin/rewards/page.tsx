
import { RewardsPageClient } from '@/components/admin/rewards/rewards-page-client';
import { RoleGuard } from '@/components/auth/role-guard';

export default function RewardsAdminPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin']}>
      <RewardsPageClient />
    </RoleGuard>
  );
}
