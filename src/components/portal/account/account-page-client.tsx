

"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useAuth } from '@/context/auth-context';
import { useBranches } from '@/hooks/use-branches';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { deleteBranch } from '@/lib/firestore/branches';
import type { Branch } from '@/types';

import { AddBranchDialog } from './add-branch-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Crown, Pencil, Plus, MapPin, Store, Tag, Headset, FileText, LogOut, ChevronRight, MoreVertical, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, getPushSubscription } from '@/lib/notifications';


export function AccountPageClient() {
  const t = useTranslations('ClientAccountPage');
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { branches, loading: branchesLoading } = useBranches();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isNotificationProcessing, setIsNotificationProcessing] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  const loading = authLoading || branchesLoading;
  
  const syncPushSubscriptionState = async () => {
    // Don't run on server or if APIs are not present
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
        setIsNotificationProcessing(false);
        setNotificationPermission('denied'); // Effectively disabled
        return;
    }

    setNotificationPermission(Notification.permission);

    if (Notification.permission === 'granted') {
        const sub = await getPushSubscription();
        setIsNotificationsEnabled(!!sub);
    } else {
        setIsNotificationsEnabled(false);
    }
    setIsNotificationProcessing(false);
  };
  
  useEffect(() => {
    syncPushSubscriptionState();
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    if (!user) return;
    setIsNotificationProcessing(true);

    try {
      if (checked) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await subscribeToPushNotifications(user.uid);
          toast({ title: t('toast_notifications_enabled_title'), description: t('toast_notifications_enabled_desc') });
        } else {
          toast({ variant: 'destructive', title: t('toast_permission_denied_title'), description: t('toast_permission_denied_desc') });
        }
      } else {
        await unsubscribeFromPushNotifications(user.uid);
        toast({ title: t('toast_notifications_disabled_title'), description: t('toast_notifications_disabled_desc') });
      }
    } catch (error) {
        console.error("Error toggling notifications", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not change notification settings." });
    } finally {
        // Crucially, re-sync state from browser after any operation
        await syncPushSubscriptionState();
    }
  };


  const handleSignOut = async () => {
    if (confirm(t('logout_confirm'))) {
      try {
        await signOut(auth);
        toast({ title: "Success", description: "You have been logged out." });
        router.push('/login');
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to log out.' });
      }
    }
  };
  
  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsDialogOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDialogOpen(true);
  };
  
  const handleDeleteBranch = async (branchId: string) => {
    if (!user) return;
    try {
      await deleteBranch(user.uid, branchId);
      toast({ title: t('branch_delete_success') });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: t('branch_delete_error') });
    }
  };

  // --- MOCK DATA from prototype for credit ---
  const creditData = {
    creditLimit: 5000,
    creditUsed: 1250.50
  };
  
  const availableCredit = creditData.creditLimit - creditData.creditUsed;
  const creditPercentage = (creditData.creditUsed / creditData.creditLimit) * 100;
  
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <>
      <AddBranchDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} branch={selectedBranch} />
      <div className="pb-20 md:pb-0">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-[#34495e] text-white p-5 pt-8 pb-12 rounded-b-2xl shadow-lg mb-[-40px] relative z-[1]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white text-primary rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white/30">
              {loading ? <Skeleton className="h-full w-full rounded-full"/> : getInitials(userProfile?.businessName || '')}
            </div>
            <div>
              <h4 className="font-bold text-xl">{loading ? <Skeleton className="h-6 w-40" /> : userProfile?.businessName}</h4>
              <div className="text-xs bg-green-500/90 text-white font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-full mt-1">
                <Crown className="h-3 w-3" /> {t('preferred_client')}
              </div>
              <div className="text-xs mt-1 opacity-75">{loading ? <Skeleton className="h-4 w-24 mt-1" /> : `ID: ${user?.uid.substring(0, 8).toUpperCase()}`}</div>
            </div>
          </div>
        </div>

        {/* Finance Card */}
        <div className="relative z-[2] mx-5 p-5 bg-card rounded-2xl shadow-lg">
           <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-semibold">{t('available_credit')}</div>
                <div className="text-2xl font-extrabold text-primary leading-tight">{loading ? <Skeleton className="h-8 w-32 mt-1"/> : formatCurrency(availableCredit)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase font-semibold">{t('pending_balance')}</div>
                <div className="font-bold text-foreground">{loading ? <Skeleton className="h-5 w-24 ml-auto mt-1" /> : formatCurrency(creditData.creditUsed)}</div>
              </div>
           </div>
           <Progress value={creditPercentage} className="h-2 my-3"/>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('credit_limit', { limit: formatCurrency(creditData.creditLimit)})}</span>
                <span>{t('used_credit', { percent: Math.round(creditPercentage) })}</span>
            </div>
        </div>
        
        {/* Menu Sections */}
        <div className="mt-6 px-5">
            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">{t('account_section_title')}</div>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600"><Store className="h-5 w-5"/></div>
                        <span className="font-semibold text-sm">{t('business_data_item')}</span>
                    </div>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="h-2.5 bg-muted border-y"></div>

                <div className="p-4 bg-card flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600"><MapPin className="h-5 w-5"/></div>
                        <span className="font-semibold text-sm">{t('branches_section_title')}</span>
                    </div>
                    <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleAddBranch}><Plus className="h-4 w-4" /></Button>
                </div>

                <div className="px-4 pb-2">
                    {loading ? (
                        <div className="space-y-2 py-2"><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/></div>
                    ) : branches.length > 0 ? (
                        branches.map((branch, index) => (
                           <div key={branch.id} className="py-3 flex items-start justify-between border-b last:border-0">
                                <div>
                                    <h6 className="font-semibold text-sm">{branch.alias}</h6>
                                    <p className="text-xs text-muted-foreground">{branch.address}, {branch.city}</p>
                                    {index === 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">{t('primary_branch_tag')}</span>}
                                </div>
                                <AlertDialog>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2"><MoreVertical className="h-4 w-4 text-muted-foreground"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => handleEditBranch(branch)}>{t('edit')}</DropdownMenuItem>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive">{t('delete')}</DropdownMenuItem>
                                            </AlertDialogTrigger>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('delete_branch_confirm')}</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the branch "{branch.alias}".</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteBranch(branch.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                           </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">No branches added yet.</p>
                    )}
                </div>
            </div>

            <div className="text-xs font-bold text-muted-foreground uppercase mt-6 mb-2">Ajustes</div>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isNotificationsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500')}>
                            {isNotificationsEnabled ? <Bell className="h-5 w-5"/> : <BellOff className="h-5 w-5"/>}
                        </div>
                        <div>
                            <span className="font-semibold text-sm">Notificaciones Push</span>
                            <p className="text-xs text-muted-foreground">Recibe actualizaciones de pedidos y soporte.</p>
                        </div>
                    </div>
                    <Switch
                        checked={isNotificationsEnabled}
                        onCheckedChange={handleNotificationToggle}
                        disabled={isNotificationProcessing || notificationPermission === 'denied'}
                    />
                </div>
                 {notificationPermission === 'denied' && (
                    <div className="px-4 pb-3 -mt-2 border-t pt-3">
                      <p className="text-xs text-destructive">{t('notifications_blocked')}</p>
                    </div>
                 )}
            </div>

            <div className="text-xs font-bold text-muted-foreground uppercase mt-6 mb-2">{t('more_services_section_title')}</div>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
                {/* Other menu items */}
                 <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 text-red-600"><Tag className="h-5 w-5"/></div>
                        <span className="font-semibold text-sm">{t('offers_item')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-semibold">{t('new_badge')}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                 <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 border-t">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600"><Headset className="h-5 w-5"/></div>
                        <span className="font-semibold text-sm">{t('support_item')}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 border-t">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600"><FileText className="h-5 w-5"/></div>
                        <span className="font-semibold text-sm">{t('invoices_item')}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
            
            <Button variant="outline" className="w-full mt-6 bg-card border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> {t('logout_button')}
            </Button>
        </div>
      </div>
    </>
  );
}
