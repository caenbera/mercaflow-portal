import { MoreHorizontal, Loader2 } from 'lucide-react';
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

type UserClaims = { [key: string]: any };

interface UsersTableProps {
  users: UserProfile[];
  claims: Record<string, UserClaims | null>;
  claimsLoading: boolean;
  onRoleChange: (user: UserProfile, newRole: 'admin' | 'client') => void;
  isUpdating: boolean;
}

export function UsersTable({ users, claims, claimsLoading, onRoleChange, isUpdating }: UsersTableProps) {
  const { user: currentUser } = useAuth();

  const getRoleVariant = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'admin': return 'secondary';
      case 'client':
      default:
        return 'outline';
    }
  };

  const renderClaims = (uid: string) => {
    if (claimsLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    const userClaims = claims[uid];
    if (!userClaims || Object.keys(userClaims).length === 0) {
      return <Badge variant="outline">None</Badge>;
    }
    // A simple way to display claims. Could be a popover for more detail.
    return <code>{JSON.stringify(userClaims)}</code>
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role (Firestore)</TableHead>
          <TableHead>Permisos Reales (Claims)</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? (
          users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell className="font-medium">{user.businessName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleVariant(user.role)} className="capitalize">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                {renderClaims(user.uid)}
              </TableCell>
              <TableCell className="text-right">
                {user.uid !== currentUser?.uid && user.role !== 'superadmin' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isUpdating}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={user.role === 'admin'}
                        onSelect={() => onRoleChange(user, 'admin')}
                      >
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={user.role === 'client'}
                        onSelect={() => onRoleChange(user, 'client')}
                      >
                        Make Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No other users found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
