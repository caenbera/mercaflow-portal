"use client";

import React, { useState } from 'react';
import { Link, usePathname, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
  Fingerprint
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { NavDefinition, NavItem } from './app-sidebar'; 
import { NotificationSheetContent } from './notification-sheet';
import { useNotifications } from '@/notifications/notification-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function BottomNavBar({ navConfig }: { navConfig: NavDefinition }) {
  const pathname = usePathname();
  const t = useTranslations('NavigationBar');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { role } = useAuth();
  const { unreadCount, markAllAsRead } = useNotifications();

  let baseNavItems: NavItem[];
  
  if (role === 'client') {
    baseNavItems = navConfig.mobile.client;
  } else if (role === 'admin' || role === 'superadmin') {
    baseNavItems = navConfig.mobile.admin;
  } else if (role === 'salesperson') {
    baseNavItems = navConfig.mobile.salesperson;
  } else {
    baseNavItems = [];
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

function MoreMenuSheetContent({ onClose }: { onClose: () => void }) {
    const { userProfile, role } = useAuth();
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

    const navGroups = {
      platform: {
        label: t('platform'),
        items: [
          { href: '/admin/organizations', label: t('manageBuildings'), icon: Building2 },
          { href: '/admin/platform/users', label: t('manageUsersGlobal'), icon: Users },
        ]
      },
      management: {
        label: t('group_management'),
        items: [
          { href: '/admin/dashboard', label: t('dashboard'), icon: LayoutGrid },
          { href: '/admin/orders', label: t('manageOrders'), icon: ShoppingCart },
          { href: '/admin/clients', label: t('manageClients'), icon: Users },
          { href: '/admin/support', label: t('support'), icon: Headset },
          { href: '/admin/store', label: t('b2cStore'), icon: Fingerprint },
        ]
      },
      sales: {
        label: t('group_sales'),
        items: [
          { href: '/admin/sales', label: t('prospects'), icon: Target },
          { href: '/admin/network', label: t('supplyNetwork'), icon: Share2 }
        ]
      },
      catalog: {
        label: t('group_catalog'),
        items: [
          { href: '/admin/products', label: t('manageProducts'), icon: Package },
          { href: '/admin/suppliers', label: t('suppliers'), icon: Truck },
          { href: '/admin/rewards', label: t('rewards'), icon: Trophy },
        ]
      },
      procurement: {
        label: t('group_procurement'),
        items: [
          { href: '/admin/purchasing', label: t('purchasing'), icon: ShoppingBag },
          { href: '/admin/purchase-orders', label: t('purchaseOrders'), icon: ClipboardList },
        ]
      },
      warehouse: {
        label: t('group_warehouse'),
        items: [{ href: '/admin/picking', label: t('picking'), icon: Boxes }]
      },
      administration: {
        label: t('group_administration'),
        items: [{ href: '/admin/users', label: t('manageUsers'), icon: UserCog }]
      },
      client: {
        label: t('clientPortal'),
        groups: [
          {
            label: t('group_store'),
            items: [
              { href: '/client/new-order', label: t('newOrder'), icon: ShoppingCart },
              { href: '/client/offers', label: t('offers'), icon: Tag },
              { href: '/client/rewards', label: t('my_rewards'), icon: Trophy },
            ]
          },
          {
            label: t('group_activity'),
            items: [
              { href: '/client/dashboard', label: t('dashboard'), icon: LayoutGrid },
              { href: '/client/history', label: t('orderHistory'), icon: History },
              { href: '/client/invoices', label: t('invoices'), icon: FileText },
            ]
          },
          {
            label: t('group_account'),
            items: [
              { href: '/client/account', label: t('my_account'), icon: UserCircle },
              { href: '/client/support', label: t('support'), icon: Headset },
            ]
          }
        ]
      }
    };
    
    const adminVisibleGroups = ['management', 'sales', 'catalog', 'procurement'];
    const superAdminVisibleGroups = ['platform', 'management', 'sales', 'catalog', 'procurement', 'warehouse', 'administration'];

    const getVisibleGroups = () => {
      if (role === 'superadmin') return superAdminVisibleGroups;
      if (role === 'admin') return adminVisibleGroups;
      if (role === 'salesperson') return ['sales'];
      return [];
    }

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
            
            <div className="flex-grow overflow-y-auto px-4 pb-20">
              {role === 'client' ? (
                <Accordion type="multiple" defaultValue={[navGroups.client.groups[0].label]} className="w-full">
                  {navGroups.client.groups.map(group => (
                      <AccordionItem value={group.label} key={group.label} className="border-none">
                        <AccordionTrigger className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:no-underline opacity-70">
                          {group.label}
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="flex flex-col gap-1">
                             {group.items.map(item => <MoreMenuLink key={item.href} item={item} onClose={onClose} />)}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              ) : (
                <Accordion type="multiple" defaultValue={['platform', 'management']} className="w-full">
                  {getVisibleGroups().map(key => {
                    const group = navGroups[key as keyof typeof navGroups];
                    if (!group || !('items' in group)) return null;
                    return (
                      <AccordionItem value={key} key={key} className="border-none">
                        <AccordionTrigger className="px-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:no-underline opacity-70">
                          {group.label}
                        </AccordionTrigger>
                        <AccordionContent className="pb-2">
                          <div className="flex flex-col gap-1">
                             {group.items.map(item => <MoreMenuLink key={item.href} item={item} onClose={onClose} />)}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              )}

              {role === 'superadmin' && (
                  <>
                      <Separator className="my-4" />
                      <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="client-portal" className="border-none">
                              <AccordionTrigger className="px-2 py-3 text-[10px] font-black text-primary uppercase tracking-widest hover:no-underline">
                                  {navGroups.client.label}
                              </AccordionTrigger>
                              <AccordionContent className="pb-0">
                                  <div className="space-y-4 pt-2">
                                      {navGroups.client.groups.map(subGroup => (
                                          <div key={subGroup.label}>
                                              <p className="px-2 text-[9px] font-bold text-slate-400 uppercase mb-1">{subGroup.label}</p>
                                              <div className="flex flex-col gap-1 border-l-2 border-slate-100 ml-2 pl-2">
                                                  {subGroup.items.map(item => <MoreMenuLink key={item.href} item={item} onClose={onClose} />)}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                      </Accordion>
                  </>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t sticky bottom-0">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/5 hover:text-destructive" 
                onClick={handleSignOut}
              >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span>{t('logout')}</span>
              </Button>
            </div>
        </div>
    );
}