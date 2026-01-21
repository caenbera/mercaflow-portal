
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
import { MoreHorizontal, UserPlus, Search, Crown, Star, Pencil, History, CheckCircle, XCircle } from 'lucide-react';
import type { UserProfile, UserStatus, ClientTier } from '@/types';
import { ClientFormDialog } from './new-client-dialog';
import { useUsers } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/firestore/users';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};


const getTierIcon = (tier?: ClientTier) => {
    switch (tier) {
        case 'gold': return <Crown className="h-4 w-4 text-yellow-500" title="Gold Client" />;
        case 'silver': return <Star className="h-4 w-4 text-gray-400" title="Silver Client" />;
        default: return null;
    }
};

export function ClientsPageClient() {
  const t = useTranslations('ClientsPage');
  const { users, loading } = useUsers();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);

  const clientUsers = useMemo(() => {
    return users.filter(user => user.role === 'client');
  }, [users]);
  

  const handleEdit = (client: UserProfile) => {
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

  return (
    <>
      <ClientFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} client={selectedClient} />
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
                         ) : clientUsers.length > 0 ? (
                            clientUsers.map(client => {
                                const creditLimit = client.creditLimit || 0;
                                const creditUsed = 0; // TODO: Calculate this from orders/invoices
                                const creditUsage = creditLimit > 0 ? Math.round((creditUsed / creditLimit) * 100) : 0;
                                let creditColor = "bg-green-500";
                                if (creditUsage > 85) creditColor = "bg-red-500";
                                else if (creditUsage > 50) creditColor = "bg-yellow-500";
                                
                                return (
                                    <TableRow key={client.uid}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 rounded-lg">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{client.businessName.substring(0,2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <Link href={`/admin/clients/${client.uid}`}>
                                                      <span className="font-bold hover:underline cursor-pointer">{client.businessName}</span>
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                      ID: {client.uid.substring(0,6)}
                                                      {getTierIcon(client.tier)}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{client.contactPerson || '-'}</div>
                                            <div className="text-xs text-muted-foreground">{client.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="w-32">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{formatCurrency(creditUsed)}</span>
                                                    <span>{t('credit_limit')}: {formatCurrency(creditLimit)}</span>
                                                </div>
                                                <Progress value={creditUsage} className={`h-1.5 mt-1 ${creditColor}`} />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {client.status === 'active' && <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">{t('status_active')}</Badge>}
                                            {client.status === 'pending_approval' && <Badge variant="outline" className="bg-yellow-100 text-yellow-600 border-yellow-200">{t('status_pending_approval')}</Badge>}
                                            {client.status === 'blocked' && <Badge variant="destructive">{t('status_blocked')}</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
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
                                                     {client.status === 'blocked' && (
                                                        <DropdownMenuItem onSelect={() => handleStatusChange(client, 'active')}><CheckCircle className="mr-2 h-4 w-4" />{t('action_unblock')}</DropdownMenuItem>
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
