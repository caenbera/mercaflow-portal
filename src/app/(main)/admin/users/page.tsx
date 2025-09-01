
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from "@/context/language-context";
import { useTranslation } from "@/lib/i18n";
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from '@/components/dashboard/users/users-table';
import { RoleGuard } from '@/components/auth/role-guard';
import type { UserProfile } from '@/types';
import { updateUserRole, addAdminInvite } from '@/lib/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { InviteAdminForm } from '@/components/dashboard/users/invite-admin-form';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { useAuth } from '@/context/auth-context';

type UserClaims = { [key: string]: any };

export default function ManageUsersPage() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);
  const { user } = useAuth();
  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [claims, setClaims] = useState<Record<string, UserClaims | null>>({});
  const [claimsLoading, setClaimsLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      if (!users.length || !user) return;
      
      setClaimsLoading(true);
      const getUserClaims = httpsCallable(functions, 'getUserClaims');
      const claimsPromises = users.map(async (userToFetch) => {
        try {
          const result: any = await getUserClaims({ uid: userToFetch.uid });
          return { uid: userToFetch.uid, claims: result.data.claims };
        } catch (error) {
          console.error(`Failed to get claims for user ${userToFetch.uid}:`, error);
          return { uid: userToFetch.uid, claims: { error: 'Failed to load' } };
        }
      });
      
      const results = await Promise.all(claimsPromises);
      const newClaims = results.reduce((acc, result) => {
        acc[result.uid] = result.claims;
        return acc;
      }, {} as Record<string, UserClaims | null>);
      
      setClaims(newClaims);
      setClaimsLoading(false);
    };

    if (!usersLoading) {
      fetchClaims();
    }
  }, [users, usersLoading, user]);


  const handleRoleChange = async (user: UserProfile, newRole: 'admin' | 'client') => {
    setIsUpdating(true);
    try {
      await updateUserRole(user.uid, newRole);
      toast({
        title: "Success",
        description: `${user.businessName}'s role has been updated. Claims will update shortly, but the user must sign out and sign back in to see the changes.`
      });
      // In a real app, you might want to re-trigger claims fetching here after a delay.
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error updating role",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInviteAdmin = async (email: string) => {
    try {
      await addAdminInvite(email);
      toast({
        title: "Admin Pre-Approved",
        description: `${email} is now pre-approved. They will become an admin as soon as they sign up with this email.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not pre-approve this email.",
      });
    }
  };
  
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-bold">{t('users_title')}</h1>

        <Card>
          <CardHeader>
            <CardTitle>Invite New Admin</CardTitle>
            <CardDescription>
              Pre-approve an email address to become an admin. Once they sign up using this email, they will automatically be granted admin privileges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteAdminForm onInvite={handleInviteAdmin} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('users_card_title')}</CardTitle>
            <CardDescription>{t('users_card_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
             {usersLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <UsersTable 
                  users={users} 
                  claims={claims}
                  claimsLoading={claimsLoading}
                  onRoleChange={handleRoleChange}
                  isUpdating={isUpdating}
                />
              )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
