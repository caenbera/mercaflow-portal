
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
import { Globe, ShieldCheck } from 'lucide-react';

export default function GlobalUsersManagementPage() {
  const t = useTranslations('AdminUsersPage');
  // Usamos forceGlobal = true para ver a todos los usuarios de la plataforma
  const { users, loading: usersLoading } = useUsers(true);
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
      // Invitación a nivel plataforma (sin vincular a un edificio específico por defecto aquí)
      await addAdminInvite(email, role);
      toast({
        title: "Invitación Enviada",
        description: `${email} ha sido pre-aprobado como ${role} global.`
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
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-slate-900">
                <Globe className="text-primary h-8 w-8" />
                Gestión de Usuarios Global
            </h1>
            <p className="text-slate-500 mt-1">
                Control total de todos los usuarios registrados en la plataforma MercaFlow.
            </p>
        </div>
        
        <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Pre-Aprobar Acceso Maestro
                </CardTitle>
                <CardDescription className="text-slate-500">
                    Invita a nuevos dueños de negocio o administradores de alto nivel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <InviteAdminForm onInvite={handleInvite} />
            </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800">Directorio Maestro de Usuarios</CardTitle>
            <CardDescription>Visualiza y gestiona los privilegios de cada cuenta en el ecosistema.</CardDescription>
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
