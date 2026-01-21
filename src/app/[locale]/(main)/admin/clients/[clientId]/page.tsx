'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { ClientDetailPageClient } from '@/components/admin/clients/client-detail-page-client';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserProfile } from '@/lib/firestore/users';
import type { UserProfile, Order } from '@/types';
import { useAllOrders } from '@/hooks/use-all-orders';

function ClientDetailSkeleton() {
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


export default function ClientDetailPage() {
  const params = useParams();
  const { clientId } = params as { clientId: string };
  const { orders, loading: ordersLoading } = useAllOrders();

  const [client, setClient] = useState<UserProfile | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const clientData = await getUserProfile(clientId);

        if (!clientData) {
          notFound();
          return;
        }

        setClient(clientData);

      } catch (error) {
        // Errors are now emitted from getUserProfile and thrown by FirebaseErrorListener.
        console.error("Error fetching client details:", error);
      } finally {
        // The main loading state will be set to false once orders are also processed.
      }
    }

    fetchData();
  }, [clientId]);

  useEffect(() => {
    if (!ordersLoading && client) {
      const filteredOrders = orders.filter(order => order.userId === clientId);
      setClientOrders(filteredOrders);
      setLoading(false); // Now we can stop loading
    }
  }, [orders, ordersLoading, client, clientId]);

  if (loading) {
    return <ClientDetailSkeleton />;
  }
  
  if (!client) {
    return <div className="p-8 font-semibold text-center">Client could not be loaded. This might be a permission issue or the client does not exist.</div>;
  }

  return (
     <div className="p-4 sm:p-6 lg:p-8">
        <ClientDetailPageClient client={client} orders={clientOrders} />
    </div>
  );
}
