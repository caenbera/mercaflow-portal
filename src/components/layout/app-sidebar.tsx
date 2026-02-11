"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAuth } from '@/context/auth-context';
import { LayoutGrid, ShoppingCart, Package, Users, History, Home, ClipboardList, Leaf, Truck, ShoppingBag, Boxes, UserCircle, Trophy, Headset, ChevronRight, Tag, FileText } from 'lucide-react';
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
    client: Record<string, NavItem[]>;
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
    salesperson: NavItem[];
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

const CollapsibleSidebarGroup = ({ title, items, defaultOpen = false }: { title: string; items: NavItem[]; defaultOpen?: boolean }) => {
  const pathname = usePathname();
  const isActiveGroup = items.some(item => pathname.startsWith(item.href));

  return (
    <Collapsible defaultOpen={defaultOpen || isActiveGroup} className="w-full">
      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2 h-8 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <span>{title}</span>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="pl-3 py-1">
          {items.map((item) => (
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
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
};


export function AppSidebar() {
  const { role, loading } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const t = useTranslations('NavigationBar');

  const navItems = {
    client: {
      store: [
        { href: '/client/new-order', label: t('newOrder'), icon: ShoppingCart },
        { href: '/client/offers', label: t('offers'), icon: Tag },
        { href: '/client/rewards', label: t('my_rewards'), icon: Trophy },
      ],
      activity: [
        { href: '/client/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/client/history', label: t('orderHistory'), icon: History },
        { href: '/client/invoices', label: t('invoices'), icon: FileText },
      ],
      account: [
        { href: '/client/account', label: t('my_account'), icon: UserCircle },
        { href: '/client/support', label: t('support'), icon: Headset },
      ],
    },
    management: [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/admin/orders', label: t('manageOrders'), icon: ShoppingCart },
        { href: '/admin/clients', label: t('manageClients'), icon: Users },
        { href: '/admin/support', label: t('support'), icon: Headset },
    ],
    sales: [
        { href: '/admin/sales', label: t('prospects'), icon: Users },
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

  const allSuperAdminItems = [
    ...navItems.management,
    ...navItems.sales,
    ...navItems.catalog,
    ...navItems.procurement,
    ...navItems.warehouse,
    ...navItems.administration,
  ];

  // This object is used by the mobile BottomNavBar, do not remove.
   const navConfig: NavDefinition = {
    desktop: {
      client: navItems.client,
      admin: [
        ...navItems.management,
        ...navItems.sales,
        ...navItems.catalog,
        ...navItems.procurement,
      ],
      superadmin: allSuperAdminItems,
      picker: navItems.warehouse,
      purchaser: [
        ...navItems.procurement,
        ...navItems.catalog.filter(item => item.href.includes('/products')),
      ]
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
      ],
      salesperson: [
        { href: '/admin/sales', label: t('prospects'), icon: Users },
      ]
    }
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
  
  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground">
          <Leaf className="h-6 w-6" />
          <span className="font-bold font-headline text-xl">Fresh Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        {role === 'superadmin' && (
          <>
            <CollapsibleSidebarGroup title={t('group_management')} items={navItems.management} defaultOpen />
            <CollapsibleSidebarGroup title={t('group_sales')} items={navItems.sales} />
            <CollapsibleSidebarGroup title={t('group_catalog')} items={navItems.catalog} />
            <CollapsibleSidebarGroup title={t('group_procurement')} items={navItems.procurement} />
            <CollapsibleSidebarGroup title={t('group_warehouse')} items={navItems.warehouse} />
            <CollapsibleSidebarGroup title={t('group_administration')} items={navItems.administration} />
            <SidebarSeparator className="my-2" />
            <Collapsible defaultOpen={pathname.startsWith('/client')} className="w-full">
                <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2 h-8 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <span>{t('clientPortal')}</span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-3 py-1">
                    <CollapsibleSidebarGroup title={t('group_store')} items={navItems.client.store} />
                    <CollapsibleSidebarGroup title={t('group_activity')} items={navItems.client.activity} />
                    <CollapsibleSidebarGroup title={t('group_account')} items={navItems.client.account} />
                </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {role === 'admin' && (
          <>
            <CollapsibleSidebarGroup title={t('group_management')} items={navItems.management} defaultOpen />
            <CollapsibleSidebarGroup title={t('group_sales')} items={navItems.sales} />
            <CollapsibleSidebarGroup title={t('group_catalog')} items={navItems.catalog} />
            <CollapsibleSidebarGroup title={t('group_procurement')} items={navItems.procurement} />
          </>
        )}
        
        {role === 'salesperson' && (
          <CollapsibleSidebarGroup title={t('group_sales')} items={navItems.sales} defaultOpen />
        )}

        {role === 'purchaser' && (
           <>
            <CollapsibleSidebarGroup title={t('group_procurement')} items={navItems.procurement} defaultOpen />
            <CollapsibleSidebarGroup title={t('group_catalog')} items={navItems.catalog.filter(item => item.href.includes('/products'))} />
          </>
        )}

        {role === 'picker' && (
          <CollapsibleSidebarGroup title={t('group_warehouse')} items={navItems.warehouse} defaultOpen />
        )}
        
        {role === 'client' && (
            <>
                <CollapsibleSidebarGroup title={t('group_store')} items={navItems.client.store} defaultOpen/>
                <CollapsibleSidebarGroup title={t('group_activity')} items={navItems.client.activity} />
                <CollapsibleSidebarGroup title={t('group_account')} items={navItems.client.account} />
            </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
