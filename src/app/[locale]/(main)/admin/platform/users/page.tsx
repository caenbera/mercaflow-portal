
"use client";

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { useUsers } from '@/hooks/use-users';
import { useOrganizations } from '@/hooks/use-organizations';
import { UsersTable } from '@/components/dashboard/users/users-table';
import { RoleGuard } from '@/components/auth/role-guard';
import type { UserProfile, UserRole } from '@/types';
import { updateUserProfile, deleteUser } from '@/lib/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { Globe, Users, ShieldCheck, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GlobalUsersManagementPage() {
  const t = useTranslations('AdminUsersPage');
  const { users, loading: usersLoading } = useUsers(true);
  const { organizations, loading: orgsLoading } = useOrganizations();
  const { toast } = useToast();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const loading = usersLoading || orgsLoading;

  // Mapa de IDs de organización a Nombres para mostrar en la tabla
  const orgMap = useMemo(() => {
    const map: Record<string, string> = {};
    organizations.forEach(org => {
      map[org.id] = org.name;
    });
    return map;
  }, [organizations]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleRoleChange = async (user: UserProfile, newRole: UserRole) => {
    setIsUpdating(true);
    try {
      await updateUserProfile(user.uid, { role: newRole });
      toast({
        title: "Éxito",
        description: `El rol de ${user.contactPerson || user.email} ha sido actualizado.`
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

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente a ${user.email}? Esta acción es irreversible.`)) return;
    setIsUpdating(true);
    try {
      await deleteUser(user.uid);
      toast({ title: "Usuario eliminado del ecosistema" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <RoleGuard allowedRoles={['superadmin']}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-3 text-slate-900">
                    <Globe className="text-primary h-8 w-8" />
                    Directorio Maestro de Usuarios
                </h1>
                <p className="text-slate-500 mt-1">
                    Supervisión global de todos los propietarios y personal registrados en MercaFlow.
                </p>
            </div>
            
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 shadow-sm self-start">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Auditoría Global</span>
            </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por nombre, correo o empresa..." 
                    className="pl-10 h-11 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-11 bg-white">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 opacity-50" />
                        <SelectValue placeholder="Filtrar por Rol" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="client">Propietarios (Admins)</SelectItem>
                    <SelectItem value="picker">Operarios (Pickers)</SelectItem>
                    <SelectItem value="purchaser">Compradores</SelectItem>
                    <SelectItem value="salesperson">Vendedores</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Usuarios Activos</CardTitle>
                    <CardDescription>Mostrando {filteredUsers.length} de {users.length} registros totales.</CardDescription>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-2xl font-black text-primary">{users.length}</span>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Cuentas Totales</p>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {loading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : (
                <UsersTable 
                  users={filteredUsers} 
                  onRoleChange={handleRoleChange}
                  onDeleteUser={handleDeleteUser}
                  isUpdating={isUpdating}
                  orgMap={orgMap}
                  isGlobalView={true}
                />
              )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
