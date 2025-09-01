
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sprout, LayoutDashboard, ShoppingCart, Apple, Package, Users, History } from 'lucide-react';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';

export function AppSidebar() {
  const { role } = useAuth();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  const clientNav = [
    { href: '/client/new-order', label: t('sidebar_new_order'), icon: ShoppingCart },
    { href: '/client/history', label: t('sidebar_order_history'), icon: History },
  ];

  const adminNav = [
    { href: '/admin/dashboard', label: t('sidebar_dashboard'), icon: LayoutDashboard },
    { href: '/admin/orders', label: t('sidebar_manage_orders'), icon: Package },
    { href: '/admin/products', label: t('sidebar_manage_products'), icon: Apple },
  ];

  const superAdminNav = [
    { href: '/admin/users', label: t('sidebar_manage_users'), icon: Users },
  ];

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
  
  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">Fresh Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {role === 'superadmin' ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>{t('sidebar_admin_panel')}</SidebarGroupLabel>
              <SidebarMenu>
                {renderNavItems(adminNav)}
                {renderNavItems(superAdminNav)}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>{t('sidebar_client_portal')}</SidebarGroupLabel>
               <SidebarMenu>
                {renderNavItems(clientNav)}
              </SidebarMenu>
            </SidebarGroup>
          </>
        ) : role === 'admin' ? (
          <SidebarMenu>
            {renderNavItems(adminNav)}
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            {renderNavItems(clientNav)}
          </SidebarMenu>
        )}
      </SidebarContent>
    </>
  );
}
