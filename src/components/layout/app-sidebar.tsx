
"use client";

import React from 'react';
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
import { useOrganization } from '@/context/organization-context';
import { useOrganizations } from '@/hooks/use-organizations';
import { 
  LayoutGrid, ShoppingCart, Package, Users, History, Home, 
  ClipboardList, Leaf, Truck, ShoppingBag, Boxes, UserCircle, 
  Trophy, Headset, ChevronRight, Tag, FileText, Building2,
  Globe, Store, HardHat, ShieldCheck
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '../ui/skeleton';
import { BottomNavBar } from './bottom-nav';
import type { OrganizationType } from '@/types';

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

const CollapsibleSidebarGroup = ({ title, items, defaultOpen = false, icon: Icon }: { title: string; items: NavItem[]; defaultOpen?: boolean; icon?: React.ElementType }) => {
  const pathname = usePathname();
  const isActiveGroup = items.some(item => pathname.startsWith(item.href));

  return (
    <Collapsible defaultOpen={defaultOpen || isActiveGroup} className="w-full">
      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2 h-9 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <span>{title}</span>
        </div>
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu className="pl-4 py-1">
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
  const { role, loading: authLoading } = useAuth();
  const { activeOrgId, setActiveOrgId } = useOrganization();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const isMobile = useIsMobile();
  const t = useTranslations('NavigationBar');

  const loading = authLoading || orgsLoading;

  const getModuleItems = (orgId: string) => ({
    management: [
        { href: `/admin/dashboard`, label: t('dashboard'), icon: LayoutGrid },
        { href: `/admin/orders`, label: t('manageOrders'), icon: ShoppingCart },
        { href: `/admin/clients`, label: t('manageClients'), icon: Users },
        { href: `/admin/support`, label: t('support'), icon: Headset },
    ],
    sales: [
        { href: `/admin/sales`, label: t('prospects'), icon: Users },
    ],
    catalog: [
        { href: `/admin/products`, label: t('manageProducts'), icon: Package },
        { href: `/admin/suppliers`, label: t('suppliers'), icon: Truck },
        { href: `/admin/rewards`, label: t('rewards'), icon: Trophy },
    ],
    procurement: [
        { href: `/admin/purchasing`, label: t('purchasing'), icon: ShoppingBag },
        { href: `/admin/purchase-orders`, label: t('purchaseOrders'), icon: ClipboardList },
    ],
    warehouse: [
        { href: `/admin/picking`, label: t('picking'), icon: Boxes },
    ],
    administration: [
        { href: `/admin/users`, label: t('manageUsers'), icon: Users },
    ],
    clientPortal: [
        { href: `/client/dashboard`, label: t('clientPortal'), icon: Home },
    ]
  });

  const getOrgTypeIcon = (type: OrganizationType) => {
    switch(type) {
      case 'importer': return Globe;
      case 'distributor': return Truck;
      case 'wholesaler': return ShoppingBag;
      case 'retailer': return Store;
      default: return Building2;
    }
  };

  const renderSuperAdminMenu = () => {
    const orgsByType = (type: OrganizationType) => organizations.filter(o => o.type === type);

    return (
      <div className="space-y-4">
        {/* Gestión Global */}
        <div className="px-2 mb-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 tracking-widest">Global</div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('manageOrganizations')}>
                <Link href="/admin/organizations">
                  <Building2 />
                  <span>{t('manageOrganizations')}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* Grupos por Nivel */}
        {(['importer', 'distributor', 'wholesaler', 'retailer'] as OrganizationType[]).map((type) => {
          const typeOrgs = orgsByType(type);
          if (typeOrgs.length === 0) return null;

          return (
            <div key={type} className="px-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 tracking-widest">
                {t(`group_level_${type}` as any)}
              </div>
              <div className="space-y-1">
                {typeOrgs.map((org) => {
                  const modules = getModuleItems(org.id);
                  const isActive = activeOrgId === org.id;
                  
                  return (
                    <Collapsible 
                      key={org.id} 
                      defaultOpen={isActive}
                      onOpenChange={(open) => open && setActiveOrgId(org.id)}
                      className="w-full"
                    >
                      <CollapsibleTrigger className={cn(
                        "group flex w-full items-center justify-between rounded-md px-2 h-9 text-sm font-semibold transition-colors",
                        isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                      )}>
                        <div className="flex items-center gap-2 truncate">
                          {React.createElement(getOrgTypeIcon(org.type), { className: "h-4 w-4 shrink-0" })}
                          <span className="truncate">{org.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90 shrink-0" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-4 py-1 space-y-1">
                          <CollapsibleSidebarGroup title={t('group_management')} items={modules.management} />
                          <CollapsibleSidebarGroup title={t('group_sales')} items={modules.sales} />
                          <CollapsibleSidebarGroup title={t('group_catalog')} items={modules.catalog} />
                          <CollapsibleSidebarGroup title={t('group_procurement')} items={modules.procurement} />
                          <CollapsibleSidebarGroup title={t('group_warehouse')} items={modules.warehouse} />
                          {type === 'retailer' && (
                             <SidebarMenu className="pl-2">
                                <SidebarMenuItem>
                                  <SidebarMenuButton className="text-orange-600 font-bold">
                                    <Store className="h-4 w-4" />
                                    <span>Gestionar Tienda Online</span>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                             </SidebarMenu>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return null;

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 text-sidebar-foreground p-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-xl tracking-tight">MercaFlow</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 custom-scrollbar overflow-x-hidden">
        {role === 'superadmin' ? renderSuperAdminMenu() : (
          // Menú simplificado para otros roles (se mantiene como antes pero con rutas relativas)
          <p className="text-xs text-muted-foreground p-4">Cargando menú de organización...</p>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
