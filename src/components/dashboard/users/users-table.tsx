
import { MoreHorizontal, Trash2, ShieldAlert, Building2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserProfile, UserRole } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface UsersTableProps {
  users: UserProfile[];
  onRoleChange: (user: UserProfile, newRole: any) => void;
  onDeleteUser?: (user: UserProfile) => void;
  isUpdating: boolean;
  orgMap?: Record<string, string>;
  isGlobalView?: boolean;
}

export function UsersTable({ 
  users, 
  onRoleChange, 
  onDeleteUser,
  isUpdating, 
  orgMap, 
  isGlobalView = false 
}: UsersTableProps) {
  const { user: currentUser } = useAuth();
  const t = useTranslations('AdminUsersPage');

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin': 
        return <Badge className="bg-slate-900 text-white border-none">Super Admin</Badge>;
      case 'client': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Propietario</Badge>;
      case 'picker':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Picker</Badge>;
      case 'purchaser':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Comprador</Badge>;
      case 'salesperson':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Vendedor</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="font-bold py-4">Usuario / Contacto</TableHead>
            <TableHead className="font-bold">Email</TableHead>
            {isGlobalView && <TableHead className="font-bold">Edificio / Negocio</TableHead>}
            <TableHead className="font-bold">Rol</TableHead>
            <TableHead className="text-right pr-6 font-bold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.uid} className="hover:bg-slate-50 transition-colors">
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{user.contactPerson || user.businessName || 'Sin nombre'}</span>
                    {user.businessName && user.businessName !== user.contactPerson && (
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">{user.businessName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{user.email}</span>
                </TableCell>
                {isGlobalView && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className={cn(
                            "text-sm font-medium",
                            user.organizationId ? "text-slate-700" : "text-slate-400 italic"
                        )}>
                            {user.organizationId ? (orgMap?.[user.organizationId] || 'Cargando...') : 'Sin asignar'}
                        </span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell className="text-right pr-6">
                  {user.uid !== currentUser?.uid && user.role !== 'superadmin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isUpdating} className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Control de Acceso</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onSelect={() => onRoleChange(user, 'client')}>
                          Convertir en Propietario (Admin)
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onRoleChange(user, 'picker')}>
                          Cambiar a Picker
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onRoleChange(user, 'salesperson')}>
                          Cambiar a Vendedor
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={() => onDeleteUser?.(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Cuenta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isGlobalView ? 5 : 4} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                    <ShieldAlert className="h-8 w-8 opacity-20" />
                    <p>No se encontraron usuarios con estos criterios.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
