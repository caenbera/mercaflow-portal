
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getSupplier } from '@/lib/firestore/suppliers';
import { getProducts } from '@/lib/firestore/products';
import { SupplierDetailPageClient } from '@/components/admin/suppliers/supplier-detail-page-client';
import type { Product, Supplier } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

function SupplierDetailSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Skeleton className="h-8 w-1/4" />
            <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-2xl" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-96 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
}


export default function SupplierDetailPage() {
  const params = useParams();
  const { supplierId } = params as { supplierId: string };

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Use Promise.all to fetch supplier and products in parallel for better performance
        const [supplierData, allProductsData] = await Promise.all([
          getSupplier(supplierId),
          getProducts(),
        ]);

        if (!supplierData) {
          notFound();
          return;
        }

        const supplierProducts = allProductsData.filter(p => p.supplierId === supplierData.id);

        setSupplier(supplierData);
        setProducts(supplierProducts);

      } catch (error) {
        console.error("Error fetching supplier details:", error);
        // Let the error boundary or FirebaseErrorListener handle UI
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supplierId]);

  if (loading) {
    return <SupplierDetailSkeleton />;
  }
  
  if (!supplier) {
    // This case is mostly handled by notFound(), but as a fallback.
    return <div className="p-8">Supplier could not be loaded.</div>;
  }

  return (
     <div className="p-4 sm:p-6 lg:p-8">
        <SupplierDetailPageClient supplier={supplier} products={products} />
    </div>
  );
}
