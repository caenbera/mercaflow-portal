"use client";

import { useState } from 'react';
import { Link, usePathname, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '../landing/language-switcher';
import { useAuth } from '@/context/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle, MoreHorizontal, ChevronRight, Users, LayoutGrid, Tag, Trophy, Headset, FileText, Bell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { NavDefinition } from './app-sidebar';
import { NotificationSheetContent } from './notification-sheet';

export function BottomNavBar({ navConfig }: { navConfig: NavDefinition }) {
  const pathname = usePathname();
  const t = useTranslations('NavigationBar');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { role } = useAuth();

  let baseNavItems = role === 'client' ? navConfig.mobile.client : navConfig.mobile.admin;
  if (!role) baseNavItems = [];

  const navItems = baseNavItems.slice(0, 3);

  const bottomBarItems = [
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
                <Sheet key={item.href} open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <SheetTrigger asChild>
                    <button
                        type="button"
                        className="flex flex-col items-center justify-center px-1 pt-2 font-medium text-center group text-muted-foreground hover:text-foreground relative"
                    >
                        <item.icon className="w-5 h-5 mb-1" />
                        <span className="text-[11px] whitespace-normal text-center">{item.label}</span>
                        <span className="absolute top-1.5 right-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                          3
                        </span>
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
                            <span className="text-[11px] whitespace-normal text-center">{item.label}</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-auto w-full rounded-t-2xl p-0">
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


function MoreMenuSheetContent({ onClose, navConfig }: { onClose: () => void, navConfig: NavDefinition }) {
    const { userProfile, role } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('NavigationBar');

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({ title: t('logout'), description: "You have been successfully signed out." });
            router.push('/login');
        } catch (error) {
            toast({ variant: "destructive", title: "Error Signing Out" });
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const clientNavForSuperAdmin = [
        { href: '/client/dashboard', label: t('dashboard'), icon: LayoutGrid },
        ...navConfig.desktop.client.slice(1)
    ]

    return (
        <div className="flex flex-col p-4 max-h-[80vh] overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>
                <div className="flex items-center gap-3">
                    <Avatar>
                        
                        <AvatarFallback>{userProfile ? getInitials(userProfile.businessName) : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{userProfile?.businessName}</span>
                        <span className="text-xs text-muted-foreground capitalize">{role}</span>
                    </div>
                </div>
              </SheetTitle>
              <SheetDescription className="hidden">
                  User account and navigation menu.
              </SheetDescription>
            </SheetHeader>
            <div className="ml-auto -mt-10">
                <LanguageSwitcher />
            </div>

            <Separator className="my-2" />

             {role === 'superadmin' && (
                <>
                <p className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase">{t('adminPanel')}</p>
                 {navConfig.desktop.superadmin.map(item => (
                    <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted text-sm font-medium">
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-muted-foreground" />
                            <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                ))}
                <Separator className="my-2" />
                <p className="px-2 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase">{t('clientPortal')}</p>
                 {clientNavForSuperAdmin.map(item => (
                    <Link key={item.href} href={item.href} onClick={onClose} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted text-sm font-medium">
                        <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-muted-foreground" />
                            <span>{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                ))}
                 <Separator className="my-2" />
                </>
             )}
            <Link href="/client/account" onClick={onClose} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted text-sm font-medium">
                <div className="flex items-center gap-3">
                    <UserCircle className="w-5 h-5 text-muted-foreground" />
                    <span>{t('my_account')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/client/offers" onClick={onClose} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted text-sm font-medium">
                <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-muted-foreground" />
                    <span>{t('offers')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-semibold">{t('new_badge')}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
            </Link>
            <Link href="/client/rewards" onClick={onClose} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted text-sm font-medium">
                <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-muted-foreground" />
                    <span>{t('my_rewards')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link href="/client/support" onClick={onClose} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted text-sm font-medium">
                <div className="flex items-center gap-3">
                    <Headset className="w-5 h-5 text-muted-foreground" />
                    <span>{t('support')}</span>
                </div>
                 <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
             <Link href="/client/invoices" onClick={onClose} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted text-sm font-medium">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span>{t('invoices')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Separator className="my-2" />
            <Button variant="ghost" className="w-full justify-start p-2 text-sm font-medium text-destructive hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="w-5 h-5 mr-3" />
                <span>{t('logout')}</span>
            </Button>
        </div>
    );
}
