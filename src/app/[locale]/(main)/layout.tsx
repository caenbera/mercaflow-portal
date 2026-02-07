"use client";

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    // This effect ensures only authenticated users can access main layout routes.
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    // Show a full-screen loader while auth context is resolving.
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex items-center gap-3 text-2xl font-semibold font-headline text-primary">
            <Sprout className="h-8 w-8 animate-spin" />
            <span>Authenticating...</span>
        </div>
        <div className="space-y-2 w-full max-w-sm">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
        </div>
      </div>
    );
  }

  if (!user) {
    // While redirecting, render nothing to prevent a flash of content.
    return null; 
  }

  // Once loading is false and user exists, render the full layout.
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="relative flex min-h-svh flex-1 flex-col bg-background">
        {!isMobile && <DashboardHeader />}
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
