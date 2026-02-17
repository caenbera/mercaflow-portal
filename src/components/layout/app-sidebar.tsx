
"use client";

import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
  ChevronRight, Trophy, Building2, Globe, Store, Share2, Plus, Lock,
  Target, UserCog, Eye
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import type { OrganizationType, Organization } from '@/types';
import { Badge } from '@/components/ui/badge';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const CollapsibleSidebarGroup = ({ title, items, defaultOpen = false, icon: Icon }: { title: string; items: NavItem[]; defaultOpen?: boolean; icon?: React.ElementType }) => {
  const pathname = usePathname();
  const isActiveGroup = items.some(item => pathname.startsWith(item.href));

  if (items.length === 0) return null;

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
  const { activeOrgId, setActiveOrgId } = useOrganization();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const t = useTranslations('NavigationBar');

  const loading = authLoading || orgsLoading;

  const getModuleItems = (org: Organization) => {
    const isMyTestOrg = org.ownerId === user?.uid;
    const agreements = org.adminAgreements || { catalog: false, operations: false, finance: false };

    const modules: any = {
      management: [
          { href: `/admin/dashboard`, label: t('dashboard'), icon: LayoutGrid },
          { href: `/admin/orders`, label: t('manageOrders'), icon: ShoppingCart },
          { href: `/admin/clients`, label: t('manageClients'), icon: Users },
          { href: `/admin/support`, label: t('support'), icon: Headset },
      ],
      sales: [
          { href: `/admin/sales`, label: t('prospects'), icon: Target },
          { href: `/admin/network`, label: "Red de Suministro", icon: Share2 },
      ],
      administration: [
          { href: `/admin/users`, label: t('manageUsers'), icon: UserCog },
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
      clientView: [
          { href: `/client/new-order`, label: t('clientPortal'), icon: Eye },
      ]
    };

    // Si NO es mi edificio de prueba, aplicamos filtros de convenio
    if (!isMyTestOrg) {
      if (!agreements.operations) {
        modules.management = modules.management.filter((m: any) => m.href !== '/admin/orders');
        modules.sales = [];
        modules.administration = [];
        modules.procurement = [];
        modules.warehouse = [];
      }
      if (!agreements.catalog) {
        modules.catalog = [];
      }
    }

    if (org.type === 'retailer') {
      modules.management.push({ href: `/admin/store`, label: "Tienda B2C", icon: Globe });
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
    const orgTypes: OrganizationType[] = ['importer', 'distributor', 'wholesaler', 'retailer'];

    return (
      <div className="space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('manageOrganizations')}>
                  <Link href="/admin/organizations">
                    <Building2 />
                    <span>Gestión de Edificios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('manageUsers')}>
                  <Link href="/admin/users">
                    <Users />
                    <span>Gestión de Usuarios Global</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {orgTypes.map((type) => {
          const typeOrgs = organizations.filter(o => o.type === type);
          if (typeOrgs.length === 0) return null;

          return (
            <SidebarGroup key={type}>
              <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t(`group_level_${type}` as any)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {typeOrgs.map((org) => {
                    const isMyTestOrg = org.ownerId === user?.uid;
                    const isActive = activeOrgId === org.id;
                    const OrgIcon = getOrgTypeIcon(org.type);
                    const modules = getModuleItems(org);
                    
                    const hasSomeAccess = isMyTestOrg || Object.values(org.adminAgreements || {}).some(v => v);

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
                                isActive ? "bg-primary/10 text-primary border border-primary/20" : ""
                              )}
                            >
                              <OrgIcon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{org.name}</span>
                              {isMyTestOrg && <Badge variant="outline" className="text-[8px] h-3 px-1 ml-auto bg-yellow-400/10 text-yellow-600 border-yellow-400/20">TEST</Badge>}
                              {!isMyTestOrg && !hasSomeAccess && <Lock className="h-3 w-3 ml-auto text-muted-foreground/50" />}
                              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-4 py-1 space-y-1">
                              {hasSomeAccess ? (
                                <>
                                  <CollapsibleSidebarGroup title={t('group_management')} items={modules.management} icon={LayoutGrid} />
                                  <CollapsibleSidebarGroup title={t('group_sales')} items={modules.sales} icon={Target} />
                                  <CollapsibleSidebarGroup title={t('group_catalog')} items={modules.catalog} icon={Package} />
                                  <CollapsibleSidebarGroup title={t('group_procurement')} items={modules.procurement} icon={ShoppingBag} />
                                  <CollapsibleSidebarGroup title={t('group_warehouse')} items={modules.warehouse} icon={Boxes} />
                                  <CollapsibleSidebarGroup title={t('group_administration')} items={modules.administration} icon={UserCog} />
                                  <Separator className="my-1 opacity-50" />
                                  <SidebarMenu>
                                    <SidebarMenuItem>
                                      <SidebarMenuButton asChild tooltip={t('clientPortal')}>
                                        <Link href="/client/new-order" className="text-primary font-bold">
                                          <Eye className="text-primary" />
                                          <span>Ver como Cliente</span>
                                        </Link>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  </SidebarMenu>
                                </>
                              ) : (
                                <div className="p-2 text-[10px] text-muted-foreground italic">
                                  Sin convenios de acceso activos para este cliente.
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('loading')}...</p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
