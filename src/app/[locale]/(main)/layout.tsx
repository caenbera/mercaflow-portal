"use client";

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { BottomNavBar } from '@/components/layout/bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sprout, 
  ShoppingCart, 
  LayoutGrid, 
  Trophy, 
  Target, 
  Share2 
} from 'lucide-react';
import { useRouter } from '@/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const t = useTranslations('NavigationBar');

  const navConfig = {
    mobile: {
      client: [
        { href: '/client/new-order', label: t('newOrder'), icon: ShoppingCart },
        { href: '/client/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/client/rewards', label: t('my_rewards'), icon: Trophy },
      ],
      admin: [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/admin/orders', label: t('manageOrders'), icon: ShoppingCart },
        { href: '/admin/sales', label: t('prospects'), icon: Target },
      ],
      salesperson: [
        { href: '/admin/sales', label: t('prospects'), icon: Target },
        { href: '/admin/network', label: t('supplyNetwork'), icon: Share2 },
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
      ]
    }
  };

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
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        {isMobile && <BottomNavBar navConfig={navConfig} />}
      </div>
    </SidebarProvider>
  );
}
