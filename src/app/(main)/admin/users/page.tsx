
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from "@/context/language-context";
import { useTranslation } from "@/lib/i18n";
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from '@/components/dashboard/users/users-table';
import { RoleGuard } from '@/components/auth/role-guard';
import type { UserProfile } from '@/types';
import { updateUserRole } from '@/lib/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { InviteAdminForm } from '@/components/dashboard/users/invite-admin-form';
import { addAdminInvite } from '@/lib/firestore/users';

export default function ManageUsersPage() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);
  const { users, loading } = useUsers();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (user: UserProfile, newRole: 'admin' | 'client') => {
    setIsUpdating(true);
    try {
      await updateUserRole(user.uid, newRole);
      toast({
        title: "Success",
        description: `${user.businessName}'s role has been updated. The user must sign out and sign back in to see the changes.`
      });
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
             {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <UsersTable 
                  users={users} 
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
