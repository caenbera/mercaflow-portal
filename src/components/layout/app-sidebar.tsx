"use client";

import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { LayoutGrid, ShoppingCart, Package, Users, History, Home, ClipboardList, Leaf, Truck, ShoppingBag, Boxes, UserCircle, Trophy, Headset } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '../ui/skeleton';
import { BottomNavBar } from './bottom-nav';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export interface NavDefinition {
  desktop: {
    client: NavItem[];
    admin: NavItem[];
    superadmin: NavItem[];
    picker: NavItem[];
    purchaser: NavItem[];
  };
  mobile: {
    client: NavItem[];
    admin: NavItem[];
    picker: NavItem[];
    purchaser: NavItem[];
  }
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <SidebarSeparator className="my-2" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function AppSidebar() {
  const { role, loading } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const t = useTranslations('NavigationBar');

  // This object is used by the mobile BottomNavBar, do not remove.
   const navConfig: NavDefinition = {
    desktop: {
      client: [], // Desktop rendering is now handled by groups below
      admin: [],
      superadmin: [],
      picker: [],
      purchaser: [],
    },
    mobile: {
      client: [
        { href: '/client/dashboard', label: t('home'), icon: Home },
        { href: '/client/new-order', label: t('myOrder'), icon: ClipboardList },
        { href: '/client/history', label: t('history'), icon: History },
      ],
       admin: [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/admin/orders', label: t('manageOrders'), icon: ShoppingCart },
        { href: '/admin/products', label: t('manageProducts'), icon: Package },
      ],
      picker: [
        { href: '/admin/picking', label: t('picking'), icon: Boxes },
      ],
      purchaser: [
        { href: '/admin/purchasing', label: t('purchasing'), icon: ShoppingBag },
      ]
    }
  };

  const navItems = {
    client: [
      { href: '/client/dashboard', label: t('dashboard'), icon: LayoutGrid },
      { href: '/client/new-order', label: t('newOrder'), icon: ShoppingCart },
      { href: '/client/history', label: t('orderHistory'), icon: History },
      { href: '/client/account', label: t('my_account'), icon: UserCircle },
    ],
    management: [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/admin/orders', label: t('manageOrders'), icon: ShoppingCart },
        { href: '/admin/clients', label: t('manageClients'), icon: Users },
        { href: '/admin/support', label: t('support'), icon: Headset },
    ],
    catalog: [
        { href: '/admin/products', label: t('manageProducts'), icon: Package },
        { href: '/admin/suppliers', label: t('suppliers'), icon: Truck },
        { href: '/admin/rewards', label: t('rewards'), icon: Trophy },
    ],
    procurement: [
        { href: '/admin/purchasing', label: t('purchasing'), icon: ShoppingBag },
        { href: '/admin/purchase-orders', label: t('purchaseOrders'), icon: ClipboardList },
    ],
    warehouse: [
        { href: '/admin/picking', label: t('picking'), icon: Boxes },
    ],
    administration: [
        { href: '/admin/users', label: t('manageUsers'), icon: Users },
    ],
  };

  
  if (loading && isMobile) {
    return null; // On mobile, we show a full-screen loader from the layout, so we don't need a skeleton here.
  }

  if (loading && !isMobile) {
    return (
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-3 text-sidebar-foreground">
            <Leaf className="h-6 w-6" />
            <span className="font-bold font-headline text-xl">Fresh Hub</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarSkeleton />
        </SidebarContent>
      </Sidebar>
    );
  }
  
  if (isMobile) {
    return <BottomNavBar navConfig={navConfig} />;
  }

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname.startsWith(item.href)}
          tooltip={item.label}
        >
          <Link href={item.href}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };
  
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground">
          <Leaf className="h-6 w-6" />
          <span className="font-bold font-headline text-xl">Fresh Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {role === 'superadmin' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_management')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.management)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_catalog')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.catalog)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_procurement')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.procurement)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_warehouse')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.warehouse)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_administration')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.administration)}</SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>{t('clientPortal')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.client)}</SidebarMenu>
            </SidebarGroup>
          </>
        )}

        {role === 'admin' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_management')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.management)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_catalog')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.catalog)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_procurement')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.procurement)}</SidebarMenu>
            </SidebarGroup>
          </>
        )}

        {role === 'purchaser' && (
           <>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_procurement')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.procurement)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t('group_catalog')}</SidebarGroupLabel>
              <SidebarMenu>{renderNavItems(navItems.catalog.filter(item => item.href.includes('/products')))}</SidebarMenu>
            </SidebarGroup>
          </>
        )}

        {role === 'picker' && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('group_warehouse')}</SidebarGroupLabel>
            <SidebarMenu>{renderNavItems(navItems.warehouse)}</SidebarMenu>
          </SidebarGroup>
        )}
        
        {role === 'client' &&
            <SidebarGroup>
                <SidebarGroupLabel>{t('clientPortal')}</SidebarGroupLabel>
                <SidebarMenu>
                    {renderNavItems(navItems.client)}
                </SidebarMenu>
            </SidebarGroup>
        }
      </SidebarContent>
    </Sidebar>
  );
}
