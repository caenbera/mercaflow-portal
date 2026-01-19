import { suppliers } from '@/lib/placeholder-data';
import { SupplierDetailPageClient } from '@/components/admin/suppliers/supplier-detail-page-client';
import { notFound } from 'next/navigation';

export default function SupplierDetailPage({ params }: { params: { supplierId: string } }) {
  const supplier = suppliers.find(s => s.id === params.supplierId);

  if (!supplier) {
    notFound();
  }

  return (
     <div className="p-4 sm:p-6 lg:p-8">
        <SupplierDetailPageClient supplier={supplier} />
    </div>
  );
}
