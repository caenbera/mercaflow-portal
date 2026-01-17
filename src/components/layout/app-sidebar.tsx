import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { Sprout, LayoutDashboard, ShoppingCart, Apple, Package, Users, History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
      <div className="h-8 w-full bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
      <div className="h-8 w-full bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
      <div className="h-8 w-full bg-gray-200 rounded animate-pulse dark:bg-gray-700"></div>
    </div>
  );
}


export function AppSidebar() {
  const { role, loading } = useAuth();
  const pathname = usePathname();
  const t = useTranslations('Dashboard');

  const navLinks = {
    client: [
      { href: '/client/dashboard', label: t('sidebar_dashboard'), icon: LayoutDashboard },
      { href: '/client/new-order', label: t('sidebar_new_order'), icon: ShoppingCart },
      { href: '/client/history', label: t('sidebar_order_history'), icon: History },
    ],
    admin: [
      { href: '/admin/dashboard', label: t('sidebar_dashboard'), icon: LayoutDashboard },
      { href: '/admin/orders', label: t('sidebar_manage_orders'), icon: Package },
      { href: '/admin/products', label: t('sidebar_manage_products'), icon: Apple },
    ],
    superadmin: [
      { href: '/admin/users', label: t('sidebar_manage_users'), icon: Users },
    ],
  };

  const renderNavItems = (items: { href: string; label: string; icon: React.ElementType }[]) => {
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
  
  if (loading) {
    return (
      <>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Fresh Hub</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarSkeleton />
        </SidebarContent>
      </>
    );
  }

  let content;

  if (role === 'superadmin') {
    content = (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar_admin_panel')}</SidebarGroupLabel>
          <SidebarMenu>
            {renderNavItems([...navLinks.admin, ...navLinks.superadmin])}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar_client_portal')}</SidebarGroupLabel>
          <SidebarMenu>
            {renderNavItems(navLinks.client)}
          </SidebarMenu>
        </SidebarGroup>
      </>
    );
  } else if (role === 'admin') {
    content = (
      <SidebarGroup>
        <SidebarGroupLabel>{t('sidebar_admin_panel')}</SidebarGroupLabel>
        <SidebarMenu>
          {renderNavItems(navLinks.admin)}
        </SidebarMenu>
      </SidebarGroup>
    );
  } else {
    content = (
      <SidebarGroup>
        <SidebarGroupLabel>{t('sidebar_client_portal')}</SidebarGroupLabel>
        <SidebarMenu>
          {renderNavItems(navLinks.client)}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">Fresh Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {content}
      </SidebarContent>
    </>
  );
}
