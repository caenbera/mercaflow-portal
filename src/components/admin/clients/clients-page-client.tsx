
"use client";

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, UserPlus, Search, Crown, Star, Pencil, History, CheckCircle, XCircle, Trash2, Shield, Award, Share2, Globe } from 'lucide-react';
import type { UserProfile, UserStatus, ClientTier } from '@/types';
import { ClientFormDialog } from './new-client-dialog';
import { useUsers } from '@/hooks/use-users';
import { useOrganizations } from '@/hooks/use-organizations';
import { useConnections } from '@/hooks/use-connections';
import { useOrganization } from '@/context/organization-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, deleteUser } from '@/lib/firestore/users';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const getTierIcon = (tier?: ClientTier) => {
  switch (tier) {
      case 'gold':
          return <Crown className="h-4 w-4 text-yellow-600 fill-yellow-400" />;
      case 'silver':
          return <Star className="h-4 w-4 text-slate-500 fill-slate-400" />;
      case 'bronze':
          return <Shield className="h-4 w-4 text-orange-700 fill-orange-500" />;
      case 'standard':
          return <Award className="h-4 w-4 text-blue-600 fill-blue-400" />;
      default:
          return null;
  }
};

export function ClientsPageClient() {
  const t = useTranslations('ClientsPage');
  const { activeOrgId } = useOrganization();
  const { users, loading: usersLoading } = useUsers();
  const { organizations, loading: orgsLoading } = useOrganizations();
  const { connections, loading: connLoading } = useConnections(activeOrgId);
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [clientToDelete, setClientToDelete] = useState<UserProfile | null>(null);

  const loading = usersLoading || orgsLoading || connLoading;

  // Combinar Clientes Locales y Clientes de Red
  const allClients = useMemo(() => {
    if (loading) return [];

    // 1. Clientes Locales (Usuarios registrados con rol 'client')
    const localClients = users.filter(user => user.role === 'client').map(u => ({
        ...u,
        isNetwork: false,
    }));

    // 2. Clientes de Red (Edificios que nos han agregado como proveedores)
    const networkClients = connections
        .filter(c => c.toOrgId === activeOrgId && c.status === 'accepted')
        .map(conn => {
            const org = organizations.find(o => o.id === conn.fromOrgId);
            if (!org) return null;
            
            // Adaptamos el objeto Organization al formato de UserProfile para la tabla
            return {
                uid: org.id,
                businessName: org.name,
                contactPerson: org.name,
                email: org.contactEmail || org.ownerEmail || 'N/A',
                phone: org.phone || 'N/A',
                address: org.address || '',
                status: 'active' as UserStatus,
                tier: 'standard' as ClientTier,
                creditLimit: 0,
                createdAt: org.createdAt,
                role: 'client' as any,
                isNetwork: true,
                orgType: org.type
            };
        })
        .filter(Boolean) as (UserProfile & { isNetwork: boolean, orgType?: string })[];

    return [...localClients, ...networkClients];
  }, [users, connections, organizations, activeOrgId, loading]);
  

  const handleEdit = (client: any) => {
    if (client.isNetwork) {
        toast({ title: "Acceso Directo", description: "Este cliente es un edificio vinculado. Puedes editar sus condiciones desde el menú de Red." });
        return;
    }
    setSelectedClient(client);
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = async (client: UserProfile, newStatus: UserStatus) => {
    try {
      await updateUserProfile(client.uid, { status: newStatus });
      toast({ 
          title: t('toast_status_updated_title'), 
          description: t('toast_status_updated_desc', { clientName: client.businessName, newStatus: newStatus })
      });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not update the client's status." });
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteUser(clientToDelete.uid);
      toast({
        title: t('toast_delete_success_title'),
        description: t('toast_delete_success_desc', { clientName: clientToDelete.businessName }),
      });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error", description: "Could not delete client." });
    } finally {
      setClientToDelete(null);
    }
  };


  return (
    <>
      <ClientFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} client={selectedClient} />
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('delete_confirm_desc', { clientName: clientToDelete?.businessName })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                    {t('delete_button_confirm')}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-4">
             <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('search_placeholder')} className="pl-8" />
                </div>
                 <Select>
                    <SelectTrigger className="w-full sm:w-auto">
                        <SelectValue placeholder={t('status_label')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                         <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                </Select>
                 <Select>
                    <SelectTrigger className="w-full sm:w-auto">
                        <SelectValue placeholder={t('sort_label')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="sales">Highest Sales</SelectItem>
                         <SelectItem value="risk">Credit Risk</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('header_client')}</TableHead>
                            <TableHead>{t('header_contact')}</TableHead>
                            <TableHead>{t('header_credit_status')}</TableHead>
                            <TableHead>{t('header_status')}</TableHead>
                            <TableHead className="text-right">{t('header_actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {loading ? (
                             Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={`skl-${i}`}>
                                    <TableCell colSpan={5}><Skeleton className="h-10 w-full"/></TableCell>
                                </TableRow>
                             ))
                         ) : allClients.length > 0 ? (
                            allClients.map((client: any) => {
                                const creditLimit = client.creditLimit || 0;
                                const creditUsed = 0; 
                                const creditUsage = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;
                                let creditColorClass = 'bg-green-500';
                                if (creditUsage > 85) {
                                    creditColorClass = 'bg-red-500';
                                } else if (creditUsage > 50) {
                                    creditColorClass = 'bg-yellow-500';
                                }
                                
                                return (
                                    <TableRow key={client.uid} className={cn(client.isNetwork && "bg-primary/5")}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 rounded-lg">
                                                    <AvatarFallback className={cn("font-bold", client.isNetwork ? "bg-slate-900 text-primary" : "bg-primary/10 text-primary")}>
                                                        {client.businessName.substring(0,2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Link href={client.isNetwork ? `/admin/network` : `/admin/clients/${client.uid}`}>
                                                            <span className="font-bold hover:underline cursor-pointer">{client.businessName}</span>
                                                        </Link>
                                                        {client.isNetwork && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Globe className="h-3.5 w-3.5 text-primary" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('client_type_network')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                      <TooltipProvider>
                                                        <Tooltip>
                                                          <TooltipTrigger asChild>
                                                            <span className="cursor-pointer underline decoration-dotted">ID</span>
                                                          </TooltipTrigger>
                                                          <TooltipContent>
                                                            <p>{client.uid}</p>
                                                          </TooltipContent>
                                                        </Tooltip>
                                                      </TooltipProvider>
                                                      {!client.isNetwork && getTierIcon(client.tier)}
                                                      {client.isNetwork && <span className="text-[10px] font-bold text-slate-400 uppercase">{client.orgType}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-sm">{client.contactPerson || '-'}</div>
                                            <div className="text-xs text-muted-foreground">{client.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-32">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{formatCurrency(creditUsed)}</span>
                                                    <span>{t('credit_limit')}: {formatCurrency(creditLimit)}</span>
                                                </div>
                                                <Progress value={creditUsage} className="h-1.5 mt-1" indicatorClassName={creditColorClass} />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {client.status === 'active' && <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('status_active')}</Badge>}
                                                {client.status === 'pending_approval' && <Badge variant="outline" className="bg-yellow-100 text-yellow-600 border-yellow-200">{t('status_pending_approval')}</Badge>}
                                                {client.status === 'blocked' && <Badge variant="destructive">{t('status_blocked')}</Badge>}
                                                {client.isNetwork && <span className="text-[9px] font-bold text-primary uppercase ml-1">{t('client_type_network')}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {!client.isNetwork ? (
                                                        <>
                                                            <DropdownMenuItem onSelect={() => handleEdit(client)}><Pencil className="mr-2 h-4 w-4"/>{t('action_edit')}</DropdownMenuItem>
                                                            <DropdownMenuItem><History className="mr-2 h-4 w-4"/>{t('action_view_orders')}</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel>{t('change_status_label')}</DropdownMenuLabel>
                                                            {client.status === 'pending_approval' && (
                                                                <DropdownMenuItem onSelect={() => handleStatusChange(client, 'active')}><CheckCircle className="mr-2 h-4 w-4" />{t('action_activate')}</DropdownMenuItem>
                                                            )}
                                                            {client.status === 'active' && (
                                                                <DropdownMenuItem onSelect={() => handleStatusChange(client, 'blocked')} className="text-destructive focus:text-destructive"><XCircle className="mr-2 h-4 w-4" />{t('action_block')}</DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => setClientToDelete(client)} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {t('action_delete')}
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <DropdownMenuItem asChild>
                                                                <Link href="/admin/network"><Share2 className="mr-2 h-4 w-4" /> Gestionar Red</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem><History className="mr-2 h-4 w-4"/> Ver Historial</DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No clients found.</TableCell>
                             </TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
