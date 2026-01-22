
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from '@/components/dashboard/users/users-table';
import { RoleGuard } from '@/components/auth/role-guard';
import type { UserProfile, UserRole } from '@/types';
import { updateUserProfile, addAdminInvite } from '@/lib/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { InviteAdminForm } from '@/components/dashboard/users/invite-admin-form';

export default function ManageUsersPage() {
  const t = useTranslations('Dashboard');
  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (user: UserProfile, newRole: 'admin' | 'client') => {
    setIsUpdating(true);
    try {
      await updateUserProfile(user.uid, { role: newRole });
      toast({
        title: "Success",
        description: `${user.businessName}'s role has been updated. They will need to sign out and sign back in to see the changes.`
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error updating role",
        description: error.message || "An unexpected error occurred. This could be a permissions issue.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvite = async (email: string, role: UserRole) => {
    try {
      await addAdminInvite(email, role);
      toast({
        title: "Invite Sent",
        description: `${email} has been pre-approved as a(n) ${role}. They can now sign up.`
      })
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error sending invite",
        description: error.message || "An unexpected error occurred. This could be a permissions issue.",
      });
    }
  };
  
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-headline font-bold">{t('users_title')}</h1>
        
        <Card>
            <CardHeader>
                <CardTitle>Pre-Approve Admin / Staff</CardTitle>
                <CardDescription>
                    Invite a new admin or staff member. They will be prompted to create an account with the role you assign.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <InviteAdminForm onInvite={handleInvite} />
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

