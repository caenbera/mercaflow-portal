
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

export default function ManageUsersPage() {
  const { locale } = useLanguage();
  const t = useTranslation(locale);
  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (user: UserProfile, newRole: 'admin' | 'client') => {
    setIsUpdating(true);
    try {
      await updateUserRole(user.uid, newRole);
      toast({
        title: "Success",
        description: `${user.businessName}'s role has been updated. They will need to sign out and sign back in to see the changes.`
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
  
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-headline font-bold">{t('users_title')}</h1>

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
