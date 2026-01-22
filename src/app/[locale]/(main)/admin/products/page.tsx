import { ProductsPageClient } from '@/components/dashboard/products/products-page-client';
import { RoleGuard } from '@/components/auth/role-guard';

export default function ManageProductsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'superadmin', 'purchaser']}>
      <div className="p-4 sm:p-6 lg:p-8">
        <ProductsPageClient />
      </div>
    </RoleGuard>
  );
}
