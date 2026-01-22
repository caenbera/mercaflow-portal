"use client";

import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { LayoutGrid, ShoppingCart, Package, Users, History, Home, ClipboardList, Leaf, Truck, ShoppingBag, Boxes, UserCircle } from 'lucide-react';
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

  const navConfig: NavDefinition = {
    desktop: {
      client: [
        { href: '/client/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/client/new-order', label: t('newOrder'), icon: ShoppingCart },
        { href: '/client/history', label: t('orderHistory'), icon: History },
        { href: '/client/account', label: t('my_account'), icon: UserCircle },
      ],
      admin: [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/admin/orders', label: t('manageOrders'), icon: ShoppingCart },
        { href: '/admin/products', label: t('manageProducts'), icon: Package },
        { href: '/admin/clients', label: t('manageClients'), icon: Users },
        { href: '/admin/purchasing', label: t('purchasing'), icon: ShoppingBag },
        { href: '/admin/suppliers', label: t('suppliers'), icon: Truck },
      ],
      superadmin: [
        { href: '/admin/users', label: t('manageUsers'), icon: Users },
      ],
      picker: [
        { href: '/admin/picking', label: t('picking'), icon: Boxes },
      ],
      purchaser: [
        { href: '/admin/purchasing', label: t('purchasing'), icon: ShoppingBag },
        { href: '/admin/products', label: t('manageProducts'), icon: Package },
      ]
    },
    mobile: {
      client: [
        { href: '/client/dashboard', label: t('home'), icon: Home },
        { href: '/client/new-order', label: t('myOrder'), icon: ClipboardList },
        { href: '/client/history', label: t('history'), icon: History },
        { href: '/client/account', label: t('my_account'), icon: UserCircle },
      ],
       admin: [
        { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
        { href: '/admin/orders', label: t('manageOrders'), icon: ShoppingCart },
        { href: '/admin/products', label: t('manageProducts'), icon: Package },
        { href: '/admin/clients', label: t('manageClients'), icon: Users },
        { href: '/admin/purchasing', label: t('purchasing'), icon: ShoppingBag },
        { href: '/admin/suppliers', label: t('suppliers'), icon: Truck },
      ],
      picker: [
        { href: '/admin/picking', label: t('picking'), icon: Boxes },
      ],
      purchaser: [
        { href: '/admin/purchasing', label: t('purchasing'), icon: ShoppingBag },
        { href: '/admin/products', label: t('manageProducts'), icon: Package },
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
    // The "More" button in BottomNavBar will handle showing the account link
    let mobileNavItems = [];
    if (role === 'client') mobileNavItems = navConfig.mobile.client;
    else if (role === 'purchaser') mobileNavItems = navConfig.mobile.purchaser;
    else mobileNavItems = navConfig.mobile.admin;
    
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
        { (role === 'superadmin') &&
            <SidebarGroup>
                <SidebarGroupLabel>{t('adminPanel')}</SidebarGroupLabel>
                <SidebarMenu>
                    {renderNavItems([...navConfig.desktop.admin, ...navConfig.desktop.superadmin])}
                </SidebarMenu>
            </SidebarGroup>
        }
        { (role === 'admin') &&
            <SidebarGroup>
                <SidebarGroupLabel>{t('adminPanel')}</SidebarGroupLabel>
                <SidebarMenu>
                    {renderNavItems(navConfig.desktop.admin)}
                </SidebarMenu>
            </SidebarGroup>
        }

        { (role === 'purchaser') &&
            <SidebarGroup>
                <SidebarGroupLabel>{t('procurement')}</SidebarGroupLabel>
                <SidebarMenu>
                    {renderNavItems(navConfig.desktop.purchaser)}
                </SidebarMenu>
            </SidebarGroup>
        }

        { (role === 'superadmin' || role === 'picker') &&
          <SidebarGroup>
              <SidebarGroupLabel>{t('warehouseOps')}</SidebarGroupLabel>
              <SidebarMenu>
                  {renderNavItems(navConfig.desktop.picker)}
              </SidebarMenu>
          </SidebarGroup>
        }

        { (role === 'superadmin' || role === 'admin' || role === 'picker' || role === 'purchaser') && <SidebarSeparator /> }

        { (role === 'client' || role === 'superadmin') &&
            <SidebarGroup>
                <SidebarGroupLabel>{t('clientPortal')}</SidebarGroupLabel>
                <SidebarMenu>
                    {renderNavItems(navConfig.desktop.client)}
                </SidebarMenu>
            </SidebarGroup>
        }
      </SidebarContent>
    </Sidebar>
  );
}
