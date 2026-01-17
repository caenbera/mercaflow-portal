"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from '@/navigation';
import { Sprout } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to be resolved
    }

    if (user && role) {
      // User is logged in, redirect to their respective dashboard
      if (role === 'admin' || role === 'superadmin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/client/dashboard');
      }
    } else {
      // No user, redirect to login
      router.replace('/login');
    }
  }, [user, role, loading, router]);

  // Show a loading skeleton while the redirection is happening
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex items-center gap-3 text-2xl font-semibold font-headline text-primary">
          <Sprout className="h-8 w-8 animate-spin" />
          <span>Loading Portal...</span>
      </div>
       <div className="space-y-2 w-full max-w-sm">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
        </div>
    </div>
  );
}
