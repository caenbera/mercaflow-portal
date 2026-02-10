'use client';

import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase/config';
import type { Prospect } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

type Props = {
  params: { prospectId: string };
};

export default function ProspectDetailPage({ params }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !params.prospectId) return;

    const fetchProspect = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'prospects', params.prospectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProspect({ id: docSnap.id, ...docSnap.data() } as Prospect);
        } else {
          setError('Prospect not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch prospect details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProspect();
  }, [user, params.prospectId]);

  return (
    <div className="p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Prospects
      </Button>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {error && <p className="text-destructive">{error}</p>}

      {prospect && (
        <div>
          <h1 className="text-3xl font-bold">{prospect.name}</h1>
          <p className="text-muted-foreground">{prospect.address}</p>
          <div className="mt-4 p-4 border rounded-lg">
            <h2 className="font-semibold">Details</h2>
            <p>Status: {prospect.status}</p>
            <p>Zone: {prospect.zone}</p>
            <p>Category: {prospect.category}</p>
             {/* More details will be added here in the future */}
          </div>
        </div>
      )}
    </div>
  );
}
