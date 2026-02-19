
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
        return <Badge className="bg-slate-900 text-white border-none">{t('role_superadmin')}</Badge>;
      case 'client': 
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t('role_owner')}</Badge>;
      case 'picker':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{t('role_picker')}</Badge>;
      case 'purchaser':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('role_purchaser')}</Badge>;
      case 'salesperson':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{t('role_salesperson')}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="font-bold py-4">{t('table_header_user_contact')}</TableHead>
            <TableHead className="font-bold">{t('table_header_email')}</TableHead>
            {isGlobalView && <TableHead className="font-bold">{t('table_header_org')}</TableHead>}
            <TableHead className="font-bold">{t('table_header_role')}</TableHead>
            <TableHead className="text-right pr-6 font-bold">{t('table_header_actions')}</TableHead>
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
                            {user.organizationId ? (orgMap?.[user.organizationId] || '...') : '-'}
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
                        <DropdownMenuLabel>{t('menu_access_control')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onSelect={() => onRoleChange(user, 'client')}>
                          {t('table_action_make_client')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onRoleChange(user, 'picker')}>
                          {t('invite_role_picker')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onRoleChange(user, 'salesperson')}>
                          {t('invite_role_salesperson')}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={() => onDeleteUser?.(user)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('menu_delete_account')}
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
                    <p>{t('table_no_results')}</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
