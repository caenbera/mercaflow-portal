
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sprout, LayoutDashboard, ShoppingCart, Apple, Package, Users, History, Loader2 } from 'lucide-react';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarSeparator } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useTranslation } from '@/lib/i18n';

// Componente para el estado de carga (opcional pero recomendado)
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
  const { role, loading } = useAuth(); // ¡Importamos 'loading'!
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = useTranslation(locale);

  // Definimos todos los enlaces en un solo lugar para mayor claridad
  const navLinks = {
    client: [
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
  
  // 1. Manejar el estado de carga PRIMERO
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
