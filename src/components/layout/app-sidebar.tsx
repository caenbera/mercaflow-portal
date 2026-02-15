
"use client";

import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
  LayoutGrid, ShoppingCart, Package, Users,
  ClipboardList, Leaf, Truck, ShoppingBag, Boxes, Headset, 
  ChevronRight, Trophy, Building2, Globe, Store, Share2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import type { OrganizationType } from '@/types';
import { Badge } from '@/components/ui/badge';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
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
  const { user, role, loading: authLoading } = useAuth();
  const { activeOrgId, setActiveOrgId, activeOrg } = useOrganization();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const t = useTranslations('NavigationBar');

  const loading = authLoading || orgsLoading;

  const getModuleItems = (orgId: string, orgType: OrganizationType) => {
    const modules: any = {
      management: [
          { href: `/admin/dashboard`, label: t('dashboard'), icon: LayoutGrid },
          { href: `/admin/orders`, label: t('manageOrders'), icon: ShoppingCart },
          { href: `/admin/clients`, label: t('manageClients'), icon: Users },
          { href: `/admin/network`, label: "Red de Suministro", icon: Share2 },
          { href: `/admin/support`, label: t('support'), icon: Headset },
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
      ]
    };

    // Módulo especial para Minoristas
    if (orgType === 'retailer') {
      modules.management.push({ href: `/admin/store`, label: "Gestión Tienda B2C", icon: Globe });
    }

    return modules;
  };

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
        <div className="px-2 mb-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 tracking-widest">Alcaldía (Platform)</div>
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

        {(['importer', 'distributor', 'wholesaler', 'retailer'] as OrganizationType[]).map((type) => {
          const typeOrgs = orgsByType(type);
          if (typeOrgs.length === 0) return null;

          return (
            <div key={type} className="px-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 tracking-widest">
                {t(`group_level_${type}` as any)}
              </div>
              <SidebarMenu className="space-y-1">
                {typeOrgs.map((org) => {
                  const isOwner = org.ownerId === user?.uid;
                  const isActive = activeOrgId === org.id;
                  
                  if (!isOwner) {
                    return (
                      <SidebarMenuItem key={org.id}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive} 
                          onClick={() => setActiveOrgId(org.id)}
                          className="opacity-80"
                        >
                          <Link href="/admin/organizations">
                            {React.createElement(getOrgTypeIcon(org.type))}
                            <span className="truncate">{org.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  const modules = getModuleItems(org.id, org.type);
                  return (
                    <SidebarMenuItem key={org.id}>
                      <Collapsible 
                        defaultOpen={isActive}
                        onOpenChange={(open) => open && setActiveOrgId(org.id)}
                        className="w-full group/collapsible"
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton 
                            isActive={isActive}
                            className={cn(
                              "transition-colors",
                              isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {React.createElement(getOrgTypeIcon(org.type), { className: "h-4 w-4 shrink-0" })}
                              <span className="truncate">{org.name}</span>
                              <Badge variant="outline" className="text-[8px] h-3 px-1 bg-yellow-400/10 text-yellow-600 border-yellow-400/20">TEST</Badge>
                            </div>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="pl-4 py-1 space-y-1">
                            <CollapsibleSidebarGroup title={t('group_management')} items={modules.management} />
                            <CollapsibleSidebarGroup title={t('group_catalog')} items={modules.catalog} />
                            <CollapsibleSidebarGroup title={t('group_procurement')} items={modules.procurement} />
                            <CollapsibleSidebarGroup title={t('group_warehouse')} items={modules.warehouse} />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
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
          <p className="text-xs text-muted-foreground p-4">Cargando menú de organización...</p>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
