
"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, UserPlus, Search, Crown, Star, Pencil, History } from 'lucide-react';
import { clients } from '@/lib/placeholder-data';
import type { Client } from '@/types';
import { NewClientDialog } from './new-client-dialog';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export function ClientsPageClient() {
  const t = useTranslations('ClientsPage');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <NewClientDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('new_client_button')}
          </Button>
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
                            <TableHead>{t('header_ytd_sales')}</TableHead>
                            <TableHead>{t('header_status')}</TableHead>
                            <TableHead className="text-right">{t('header_actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map(client => {
                            const creditUsage = Math.round((client.creditUsed / client.creditLimit) * 100);
                            let creditColor = "bg-green-500";
                            if (creditUsage > 85) creditColor = "bg-red-500";
                            else if (creditUsage > 50) creditColor = "bg-yellow-500";
                            
                            return (
                                <TableRow key={client.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 rounded-lg" style={{backgroundColor: client.color}}>
                                                <AvatarFallback className="bg-transparent text-white font-bold">{client.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <Link href={`/admin/clients/${client.id}`}>
                                                  <span className="font-bold hover:underline cursor-pointer">{client.name}</span>
                                                </Link>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                  ID: {client.id}
                                                  {client.tier === 'gold' && <Crown className="h-4 w-4 text-yellow-500" title={t('tier_gold')} />}
                                                  {client.tier === 'silver' && <Star className="h-4 w-4 text-gray-400" title={t('tier_silver')} />}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{client.contact}</div>
                                        <div className="text-xs text-muted-foreground">{client.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-32">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{formatCurrency(client.creditUsed)}</span>
                                                <span>{t('credit_limit')}: {formatCurrency(client.creditLimit)}</span>
                                            </div>
                                            <Progress value={creditUsage} className={`h-1.5 mt-1 ${creditColor}`} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold">{formatCurrency(client.totalSales)}</TableCell>
                                    <TableCell>
                                        {client.status === 'active' && <Badge variant="outline" className="bg-green-100 text-green-700">{t('status_active')}</Badge>}
                                        {client.status === 'blocked' && <Badge variant="destructive">{t('status_blocked')}</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" title={t('action_edit')} /></Button>
                                        <Button variant="ghost" size="icon"><History className="h-4 w-4" title={t('action_view_orders')} /></Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
             </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
