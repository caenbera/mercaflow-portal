
"use client";

import { useRouter, Link } from '@/navigation';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/context/auth-context';
import { useOrganization } from '@/context/organization-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '../landing/language-switcher';
import { useTranslations, useLocale } from 'next-intl';
import { NotificationBell } from './notification-bell';
import { Building2, ChevronRight, Share2, Link as LinkIcon, UserPlus } from 'lucide-react';

export function DashboardHeader() {
  const { user, userProfile, role } = useAuth();
  const { activeOrg } = useOrganization();
  const router = useRouter();
  const { toast } = useToast();
  const locale = useLocale();
  const t = useTranslations('Dashboard');
  const tNav = useTranslations('NavigationBar');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Signing Out",
        description: "There was a problem signing you out. Please try again.",
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const copyInviteLink = () => {
    if (!activeOrg?.slug) return;
    const inviteUrl = `${window.location.origin}/${locale}/signup?org=${activeOrg.slug}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({ 
      title: "Enlace de Invitación Copiado", 
      description: "Envía este enlace para que nuevos usuarios se registren bajo tu marca." 
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-3">
      <SidebarTrigger />
      
      {/* Context Indicator */}
      <div className="hidden md:flex items-center gap-2 text-sm ml-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>Ecosistema</span>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
        {activeOrg ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
                <span className="font-bold text-slate-800 leading-none">{activeOrg.name}</span>
                <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Nivel: {activeOrg.type}</span>
            </div>
            
            <div 
                className="flex items-center gap-2 bg-primary text-white px-3 py-1 rounded-lg border shadow-sm cursor-pointer hover:bg-primary/90 transition-colors group"
                onClick={copyInviteLink}
                title="Copiar enlace de invitación (Signup)"
            >
                <UserPlus className="h-3 w-3 text-white group-hover:scale-110 transition-transform" />
                <span className="font-mono text-[11px] font-bold text-white uppercase">Invitar</span>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground italic">Selecciona un edificio</span>
        )}
      </div>

      <div className="relative ml-auto flex-1 md:grow-0"></div>
      
      <div className="flex items-center gap-3">
        <NotificationBell />
        <LanguageSwitcher />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full border-2 border-primary/20"
            >
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {userProfile ? getInitials(userProfile.businessName) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-bold truncate">{userProfile?.businessName}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{role}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/client/account" className="cursor-pointer">{tNav('my_account')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">{t('header_support')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer font-semibold">
              {t('header_logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
