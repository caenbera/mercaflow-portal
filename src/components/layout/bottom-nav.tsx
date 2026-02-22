
"use client";

import React, { useState, useMemo } from 'react';
import { Link, usePathname, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '../landing/language-switcher';
import { useAuth } from '@/context/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LogOut, 
  UserCircle, 
  MoreHorizontal, 
  ChevronRight, 
  LayoutGrid, 
  Tag, 
  Trophy, 
  Headset, 
  FileText, 
  Bell, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  ShoppingBag, 
  Boxes, 
  ClipboardList, 
  History, 
  Share2, 
  Target, 
  UserCog,
  Building2,
  Fingerprint,
  Globe,
  Store,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { NavDefinition, NavItem } from './app-sidebar'; 
import { NotificationSheetContent } from './notification-sheet';
import { useNotifications } from '@/context/notification-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useOrganization } from '@/context/organization-context';
import { useOrganizations } from '@/hooks/use-organizations';
import { cn } from '@/lib/utils';
import type { Organization, OrganizationType } from '@/types';

export function BottomNavBar({ navConfig }: { navConfig: NavDefinition }) {
  const pathname = usePathname();
  const t = useTranslations('NavigationBar');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { role } = useAuth();
  const { unreadCount, markAllAsRead } = useNotifications();

  let baseNavItems: NavItem[] = [];
  
  if (role === 'client') {
    baseNavItems = navConfig.mobile.client;
  } else if (role === 'admin' || role === 'superadmin') {
    baseNavItems = navConfig.mobile.admin;
  } else if (role === 'salesperson') {
    baseNavItems = navConfig.mobile.salesperson;
  }

  const navItems = baseNavItems.slice(0, 3);

  const bottomBarItems: NavItem[] = [
    ...navItems,
    { href: '#notifications', label: t('notifications'), icon: Bell },
    { href: '#more', label: t('more'), icon: MoreHorizontal },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 z-40 w-full h-16 bg-card border-t md:hidden" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
        <div className="grid h-full grid-cols-5 mx-auto">
          {bottomBarItems.map((item) => {
            const isActive = item.href.startsWith('#') ? false : pathname.startsWith(item.href);

            if (item.href === '#notifications') {
              return (
                <Sheet key={item.href} open={isNotificationsOpen} onOpenChange={(open) => {
                    setIsNotificationsOpen(open);
                    if (open && unreadCount > 0) {
                      markAllAsRead();
                    }
                }}>
                  <SheetTrigger asChild>
                    <button
                        type="button"
                        className="flex flex-col items-center justify-center px-1 pt-2 font-medium text-center group text-muted-foreground hover:text-foreground relative"
                    >
                        <item.icon className="w-5 h-5 mb-1" />
                        <span className="text-[11px] whitespace-normal text-center leading-tight">{item.label}</span>
                        {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount}
                          </span>
                        )}
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[90dvh] max-h-[90dvh] p-0 flex flex-col">
                    <NotificationSheetContent />
                  </SheetContent>
                </Sheet>
              );
            }

            if (item.href === '#more') {
              return (
                 <Sheet key={item.href} open={isMoreSheetOpen} onOpenChange={setIsMoreSheetOpen}>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            className="flex flex-col items-center justify-center px-1 pt-2 font-medium text-center group text-muted-foreground hover:text-foreground"
                        >
                            <item.icon className="w-5 h-5 mb-1" />
                            <span className="text-[11px] whitespace-normal text-center leading-tight">{item.label}</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh] w-full rounded-t-[32px] p-0 overflow-hidden">
                      <MoreMenuSheetContent 
                        onClose={() => setIsMoreSheetOpen(false)}
                        navConfig={navConfig}
                      />
                    </SheetContent>
                  </Sheet>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-1 pt-2 font-medium text-center group ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[11px] leading-tight whitespace-normal text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-16 md:hidden" />
    </>
  );
}

function MoreMenuLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted text-sm font-medium transition-colors"
    >
      <div className="flex items-center gap-3">
          {React.createElement(item.icon, { className: "w-5 h-5 text-primary" })}
          <span className="text-slate-700">{item.label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </Link>
  );
}

function MoreMenuSheetContent({ onClose, navConfig }: { onClose: () => void, navConfig: NavDefinition }) {
    const { userProfile, role } = useAuth();
    const { activeOrgId, setActiveOrgId } = useOrganization();
    const { organizations } = useOrganizations();
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('NavigationBar');

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({ title: t('logout'), description: "Has cerrado sesión correctamente." });
            router.push('/login');
        } catch (error) {
            toast({ variant: "destructive", title: "Error al cerrar sesión" });
        }
    };

    const getInitials = (name: string | undefined | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

    const getModuleItems = (org: Organization) => {
      const agreements = org.adminAgreements || { catalog: false, operations: false, finance: false, sales: false };
      const modules: Record<string, NavItem[]> = {
        management: [
            { href: `/admin/dashboard`, label: t('dashboard'), icon: LayoutGrid },
            { href: `/admin/orders`, label: t('manageOrders'), icon: ShoppingCart },
            { href: `/admin/clients`, label: t('manageClients'), icon: Users },
            { href: `/admin/support`, label: t('support'), icon: Headset },
            { href: `/admin/store`, label: t('b2cStore'), icon: Fingerprint },
        ],
        sales: [
            { href: `/admin/sales`, label: t('prospects'), icon: Target },
            { href: `/admin/network`, label: t('supplyNetwork'), icon: Share2 },
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
        clientPortal: [
            { href: `/client/new-order`, label: t('newOrder'), icon: ShoppingCart },
            { href: `/client/offers`, label: t('offers'), icon: Tag },
            { href: `/client/dashboard`, label: t('dashboard'), icon: LayoutGrid },
            { href: `/client/history`, label: t('orderHistory'), icon: History },
            { href: `/client/rewards`, label: t('my_rewards'), icon: Trophy },
        ]
      };

      if (!agreements.operations) modules.management = modules.management.filter(m => m.href !== '/admin/orders');
      if (!agreements.catalog) modules.catalog = [];
      if (!agreements.sales) modules.sales = modules.sales.filter(m => m.href !== '/admin/sales');

      return modules;
    };

    const orgTypes: OrganizationType[] = ['importer', 'distributor', 'wholesaler', 'retailer'];

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(userProfile?.businessName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{userProfile?.businessName || 'Usuario'}</span>
                          <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full inline-block w-fit">{role || 'user'}</span>
                      </div>
                  </div>
                  <LanguageSwitcher />
              </div>
            </div>

            <Separator className="my-4" />
            
            <div className="flex-grow overflow-y-auto px-4 pb-24">
              {role === 'superadmin' ? (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="platform" className="border-none">
                    <AccordionTrigger className="px-2 py-3 text-[10px] font-black text-primary uppercase tracking-widest hover:no-underline">
                      {t('platform')}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="flex flex-col gap-1">
                        <MoreMenuLink item={{ href: '/admin/organizations', label: t('manageBuildings'), icon: Building2 }} onClose={onClose} />
                        <MoreMenuLink item={{ href: '/admin/platform/users', label: t('manageUsersGlobal'), icon: Users }} onClose={onClose} />
                        <MoreMenuLink item={{ href: '/driver', label: 'Terminal de Conductor', icon: Navigation }} onClose={onClose} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {orgTypes.map((type) => {
                    const typeOrgs = organizations.filter(o => o.type === type);
                    if (typeOrgs.length === 0) return null;

                    return (
                      <AccordionItem value={`level-${type}`} key={type} className="border-none">
                        <AccordionTrigger className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:no-underline">
                          {t(`group_level_${type}` as any)}
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="space-y-4">
                            {typeOrgs.map(org => {
                              const isActive = activeOrgId === org.id;
                              const modules = getModuleItems(org);
                              return (
                                <div key={org.id} className={cn("border rounded-2xl overflow-hidden shadow-sm transition-all", isActive ? "border-primary/50" : "border-slate-100")}>
                                  <button 
                                    className={cn(
                                      "w-full flex items-center justify-between p-3 text-sm font-bold transition-colors",
                                      isActive ? "bg-primary text-white" : "bg-slate-50 text-slate-700"
                                    )}
                                    onClick={() => setActiveOrgId(org.id)}
                                  >
                                    <div className="flex items-center gap-3">
                                      {React.createElement(getOrgTypeIcon(org.type), { className: "h-4 w-4" })}
                                      {org.name}
                                    </div>
                                    {isActive ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-30" />}
                                  </button>
                                  {isActive && (
                                    <div className="p-2 space-y-1 bg-white">
                                      <Accordion type="single" collapsible className="w-full">
                                        {Object.entries(modules).map(([groupKey, items]) => (
                                          items.length > 0 && (
                                            <AccordionItem key={groupKey} value={groupKey} className="border-none">
                                              <AccordionTrigger className="px-2 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:no-underline">
                                                {t(`group_${groupKey}` as any)}
                                              </AccordionTrigger>
                                              <AccordionContent className="pb-1">
                                                <div className="flex flex-col gap-1 border-l-2 border-primary/10 ml-2 pl-2">
                                                  {items.map(item => <MoreMenuLink key={item.href} item={item} onClose={onClose} />)}
                                                </div>
                                              </AccordionContent>
                                            </AccordionItem>
                                          )
                                        ))}
                                      </Accordion>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    {(role === 'client' ? navConfig.mobile.client : navConfig.mobile.admin).map(item => <MoreMenuLink key={item.href} item={item} onClose={onClose} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t sticky bottom-0">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/5" 
                onClick={handleSignOut}
              >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span>{t('logout')}</span>
              </Button>
            </div>
        </div>
    );
}
