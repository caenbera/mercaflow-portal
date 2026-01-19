
"use client";

import type { Client, ClientNote } from '@/types';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { clientNotes, clientOrders } from '@/lib/placeholder-data';

import {
  ArrowLeft,
  Crown,
  Eye,
  FileText,
  Lock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Send,
  User,
  Star
} from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

interface ClientDetailPageClientProps {
  client: Client;
}

export function ClientDetailPageClient({ client }: ClientDetailPageClientProps) {
  const t = useTranslations('ClientsPage');

  const creditUsage = Math.min((client.creditUsed / client.creditLimit) * 100, 100);
  let creditHealthColor = "bg-green-500";
  if (creditUsage > 50) creditHealthColor = "bg-yellow-500";
  if (creditUsage > 85) creditHealthColor = "bg-red-500";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Button variant="ghost" asChild className="mb-2 -ml-4">
              <Link href="/admin/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('back_to_list')}
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-2xl text-2xl font-bold" style={{ backgroundColor: client.color }}>
                <AvatarFallback className="bg-transparent text-white">
                  {client.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold font-headline">{client.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t('status_active')}</Badge>
                  {client.tier === 'gold' && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Crown className="mr-1 h-3 w-3"/>{t('tier_gold')}</Badge>}
                  <span className="text-sm text-muted-foreground">ID: {client.id} &bull; {t('since')} {client.memberSince}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 self-start sm:self-center">
            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />{t('edit_button')}</Button>
            <Button><Plus className="mr-2 h-4 w-4" />{t('new_order_button')}</Button>
          </div>
        </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('contact_details_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><User />{t('contact_label')}</span> <span className="font-semibold">{client.contact}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><Mail />{t('email_label')}</span> <span className="font-semibold text-primary">{client.email}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><Phone />{t('phone_label')}</span> <span className="font-semibold">(305) 555-0123</span></div>
                <div className="text-muted-foreground flex items-center gap-2 pt-2 border-t">{t('address_label')}</div>
                <div className="p-2 bg-muted rounded-md text-muted-foreground">{client.address}</div>
                {client.gateCode && <div className="p-2 bg-red-50 text-red-700 rounded-md font-semibold flex items-center gap-2"><Lock className="h-4 w-4"/>{t('gate_code_label')}: {client.gateCode}</div>}
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('credit_status_title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{t('current_debt_label')}</p>
                <p className="text-2xl font-bold">{formatCurrency(client.creditUsed)}</p>
                <Progress value={creditUsage} className={`h-2 mt-2 ${creditHealthColor}`} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>$0</span>
                  <span>{t('credit_limit_label')}: {formatCurrency(client.creditLimit)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><FileText />{t('terms_label')}</span> <span className="font-semibold">{client.paymentTerms}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><Star />{t('pricelist_label')}</span> <span className="font-semibold text-yellow-600">{client.priceList}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
            <Card>
                <Tabs defaultValue="orders" className="w-full">
                    <CardHeader>
                        <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="orders">{t('orders_history_tab')}</TabsTrigger>
                        <TabsTrigger value="products">{t('top_products_tab')}</TabsTrigger>
                        <TabsTrigger value="notes">{t('crm_notes_tab')}</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="orders">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>{t('order_id_header')}</TableHead>
                                    <TableHead>{t('date_header')}</TableHead>
                                    <TableHead>{t('items_header')}</TableHead>
                                    <TableHead>{t('total_header')}</TableHead>
                                    <TableHead>{t('header_status')}</TableHead>
                                    <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clientOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-bold text-primary">{order.id}</TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell>{order.items} items</TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                                            <TableCell><Badge className="bg-primary">{order.status}</Badge></TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="products">
                           <p className="text-sm text-muted-foreground mb-4">{t('top_products_subtitle')}</p>
                           {/* Add top products content here */}
                        </TabsContent>
                         <TabsContent value="notes">
                            <div className="flex gap-2 mb-4">
                                <Input placeholder={t('add_note_placeholder')} />
                                <Button><Send className="h-4 w-4"/></Button>
                            </div>
                            <div className="space-y-3">
                                {clientNotes.map((note, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Avatar className="h-8 w-8" style={{backgroundColor: note.color}}>
                                        <AvatarFallback className="text-white bg-transparent text-xs">{note.author.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="font-semibold">{note.author}</span>
                                            <span>&bull;</span>
                                            <span>{note.date}</span>
                                        </div>
                                        <p className="text-sm">{note.text}</p>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
      </div>
    </div>
  );
}
