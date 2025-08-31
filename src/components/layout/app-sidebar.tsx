import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sprout, LayoutDashboard, ShoppingCart, Apple, Package, Users, History } from 'lucide-react';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';

export function AppSidebar() {
  const { role } = useAuth();
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  const clientNav = [
    { href: '/portal', label: t('sidebar_new_order'), icon: ShoppingCart },
    { href: '/portal/history', label: t('sidebar_order_history'), icon: History },
  ];

  const adminNav = [
    { href: '/dashboard', label: t('sidebar_dashboard'), icon: LayoutDashboard },
    { href: '/dashboard/orders', label: t('sidebar_manage_orders'), icon: Package },
    { href: '/dashboard/products', label: t('sidebar_manage_products'), icon: Apple },
  ];

  const superAdminNav = [
    { href: '/dashboard/users', label: t('sidebar_manage_users'), icon: Users },
  ];

  const getNavItems = () => {
    switch (role) {
      case 'superadmin':
        return [...adminNav, ...superAdminNav];
      case 'admin':
        return adminNav;
      case 'client':
        return clientNav;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">Fresh Hub</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
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
      </SidebarContent>
    </>
  );
}
