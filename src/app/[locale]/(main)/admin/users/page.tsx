
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { useUsers } from '@/hooks/use-users';
import { useOrganization } from '@/context/organization-context';
import { UsersTable } from '@/components/dashboard/users/users-table';
import { RoleGuard } from '@/components/auth/role-guard';
import type { UserProfile, UserRole } from '@/types';
import { updateUserProfile, addAdminInvite } from '@/lib/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { InviteAdminForm } from '@/components/dashboard/users/invite-admin-form';
import { Users, ShieldCheck, Building2 } from 'lucide-react';

export default function ManageUsersPage() {
  const t = useTranslations('AdminUsersPage');
  const { activeOrg, activeOrgId } = useOrganization();
  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (user: UserProfile, newRole: UserRole) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(user.uid, { role: newRole });
      toast({
        title: "Éxito",
        description: `El rol de ${user.businessName || user.email} ha sido actualizado.`
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error al actualizar rol",
        description: error.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvite = async (email: string, role: UserRole) => {
    try {
      // Si estamos en el contexto de un edificio, vinculamos la invitación a ese edificio
      await addAdminInvite(email, role, activeOrgId || undefined);
      toast({
        title: "Invitación Enviada",
        description: `${email} ha sido pre-aprobado como ${role}${activeOrg ? ` para ${activeOrg.name}` : ''}.`
      })
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Error al enviar invitación",
        description: error.message || "Ocurrió un error inesperado.",
      });
    }
  };
  
  return (
    <RoleGuard allowedRoles={['superadmin', 'admin']}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-slate-900">
                    <Users className="text-primary h-8 w-8" />
                    {activeOrg ? t('title_with_org', { orgName: activeOrg.name }) : t('title')}
                </h1>
                <p className="text-slate-500 mt-1">
                    {activeOrg 
                        ? t('desc_with_org') 
                        : t('desc_global')}
                </p>
            </div>
            {activeOrg && (
                <div className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t('local_access_label')}</span>
                </div>
            )}
        </div>
        
        <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('invite_title')}
                </CardTitle>
                <CardDescription className="text-slate-500">
                    {activeOrg 
                        ? t('invite_desc_with_org', { orgName: activeOrg.name })
                        : t('invite_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <InviteAdminForm onInvite={handleInvite} />
            </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800">{t('all_users_title')}</CardTitle>
            <CardDescription>{t('all_users_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             {usersLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
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
