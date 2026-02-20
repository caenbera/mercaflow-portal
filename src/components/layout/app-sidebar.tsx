
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
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import { useOrganizations } from '@/hooks/use-organizations';
import { 
  LayoutGrid, ShoppingCart, Package, Users,
  ClipboardList, Leaf, Truck, ShoppingBag, Boxes, Headset, 
  ChevronRight, Trophy, Building2, Globe, Store, Share2, Plus, Lock,
  Target, UserCog, Eye, History, FileText, UserCircle, Tag, Navigation
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

const CollapsibleSidebarGroup = ({ title, items, defaultOpen = false, icon: Icon, activeColor }: { title: string; items: NavItem[]; defaultOpen?: boolean; icon?: React.ElementType; activeColor?: string }) => {
  const pathname = usePathname();
  const isActiveGroup = items.some(item => pathname.startsWith(item.href));

  if (items.length === 0) return null;

  return (
    <Collapsible defaultOpen={defaultOpen || isActiveGroup} className="w-full">
      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md px-2 h-9 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn("h-4 w-4", isActiveGroup && activeColor)} />}
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
                  <item.icon className={cn(pathname.startsWith(item.href) && activeColor)} />
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
    const agreements = org.adminAgreements || { catalog: false, operations: false, finance: false, sales: false };

    const modules: any = {
      management: [
          { href: `/admin/dashboard`, label: t('dashboard'), icon: LayoutGrid },
          { href: `/admin/orders`, label: t('manageOrders'), icon: ShoppingCart },
          { href: `/admin/clients`, label: t('manageClients'), icon: Users },
          { href: `/admin/support`, label: t('support'), icon: Headset },
      ],
      sales: [
          { href: `/admin/sales`, label: t('prospects'), icon: Target },
          { href: `/admin/network`, label: t('supplyNetwork'), icon: Share2 },
      ],
      logistics: [
          { href: `/admin/logistics`, label: 'Logística & Delivery', icon: Truck },
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
      clientPortal: {
        store: [
          { href: `/client/new-order`, label: t('newOrder'), icon: ShoppingCart },
          { href: `/client/offers`, label: t('offers'), icon: Tag },
          { href: `/client/rewards`, label: t('my_rewards'), icon: Trophy },
        ],
        activity: [
          { href: `/client/dashboard`, label: t('dashboard'), icon: LayoutGrid },
          { href: `/client/history`, label: t('orderHistory'), icon: History },
          { href: `/client/invoices`, label: t('invoices'), icon: FileText },
        ],
        account: [
          { href: `/client/account`, label: t('my_account'), icon: UserCircle },
          { href: `/client/support`, label: t('support'), icon: Headset },
        ]
      }
    };

    if (!agreements.operations) {
      modules.management = modules.management.filter((m: any) => m.href !== '/admin/orders');
      modules.administration = [];
      modules.procurement = [];
      modules.warehouse = [];
      modules.logistics = [];
    }
    
    if (!agreements.catalog) {
      modules.catalog = [];
    }
    
    if (!agreements.sales) {
      modules.sales = modules.sales.filter((m: any) => m.href !== '/admin/sales');
    }

    if (org.type === 'retailer') {
      modules.management.push({ href: `/admin/store`, label: t('b2cStore'), icon: Globe });
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
          <SidebarGroupLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('platform')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('manageBuildings')} onClick={() => setActiveOrgId(null)}>
                  <Link href="/admin/organizations"><Building2 /><span>{t('manageBuildings')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('manageUsersGlobal')} onClick={() => setActiveOrgId(null)}>
                  <Link href="/admin/platform/users"><Users /><span>{t('manageUsersGlobal')}</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Terminal de Conductor">
                  <Link href="/driver"><Navigation /><span>Terminal de Conductor</span></Link>
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
                    const isActive = activeOrgId === org.id;
                    const OrgIcon = getOrgTypeIcon(org.type);
                    const modules = getModuleItems(org);
                    
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
                              className={cn("transition-colors", isActive ? "bg-primary/10 text-primary border border-primary/20" : "")}
                            >
                              <OrgIcon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{org.name}</span>
                              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 shrink-0" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="pl-4 py-1 space-y-1">
                                <CollapsibleSidebarGroup title={t('group_management')} items={modules.management} icon={LayoutGrid} />
                                <CollapsibleSidebarGroup title="Logística" items={modules.logistics} icon={Truck} activeColor="text-primary" />
                                <CollapsibleSidebarGroup title={t('group_sales')} items={modules.sales} icon={Target} activeColor="text-primary" />
                                <CollapsibleSidebarGroup title={t('group_catalog')} items={modules.catalog} icon={Package} />
                                <CollapsibleSidebarGroup title={t('group_procurement')} items={modules.procurement} icon={ShoppingBag} />
                                <CollapsibleSidebarGroup title={t('group_warehouse')} items={modules.warehouse} icon={Boxes} />
                                <CollapsibleSidebarGroup title={t('group_administration')} items={modules.administration} icon={UserCog} />
                                
                                <Separator className="my-2 opacity-30" />
                                <div className="px-2 py-1 text-[9px] font-bold text-primary/70 uppercase tracking-widest flex items-center gap-2">
                                  <Users className="h-3 w-3" /> {t('clientPortal')}
                                </div>
                                <CollapsibleSidebarGroup title={t('group_store')} items={modules.clientPortal.store} icon={ShoppingCart} activeColor="text-primary" />
                                <CollapsibleSidebarGroup title={t('group_activity')} items={modules.clientPortal.activity} icon={History} activeColor="text-primary" />
                                <CollapsibleSidebarGroup title={t('group_account')} items={modules.clientPortal.account} icon={UserCircle} activeColor="text-primary" />
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
