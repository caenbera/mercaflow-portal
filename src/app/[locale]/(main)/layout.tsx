"use client";

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout } from 'lucide-react';
import { usePathname, useRouter } from '@/navigation';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect handles redirection AFTER loading is complete.
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user && role) {
      // Redirect to the appropriate dashboard after login
      const currentPath = pathname;
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/signup') {
         if (role === 'admin' || role === 'superadmin') {
            router.replace('/admin/dashboard');
         } else {
            router.replace('/client/dashboard');
         }
      }
    }
  }, [user, loading, role, router, pathname]);

  if (loading) {
    // Show a full-screen loader while auth context is resolving.
    // This prevents rendering any child components prematurely.
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
    // This prevents a brief flash of content if the redirect hasn't happened yet.
    return null; 
  }

  // Once loading is false and user exists, render the full layout.
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
