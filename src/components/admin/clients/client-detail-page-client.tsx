
"use client";

import { useState } from 'react';
import type { UserProfile, Order, ClientTier, ClientNote } from '@/types';
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
import { ClientFormDialog } from './new-client-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Star,
  Shield,
  Award,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';
import { useClientNotes } from '@/hooks/use-notes';
import { addClientNote, deleteClientNote } from '@/lib/firestore/notes';
import { useToast } from '@/hooks/use-toast';


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

interface ClientDetailPageClientProps {
  client: UserProfile;
  orders: Order[];
}

export function ClientDetailPageClient({ client, orders }: ClientDetailPageClientProps) {
  const t = useTranslations('ClientsPage');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { userProfile: adminProfile } = useAuth();
  const { toast } = useToast();

  const { notes, loading: notesLoading } = useClientNotes(client.uid);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<ClientNote | null>(null);

  
  const creditLimit = client.creditLimit || 0;
  const creditUsed = 0; // TODO: Calculate from orders/invoices
  const creditUsage = creditLimit > 0 ? Math.min(Math.round((creditUsed / creditLimit) * 100), 100) : 0;
  
  let creditHealthColor = "bg-green-500";
  if (creditUsage > 85) creditHealthColor = "bg-red-500";
  else if (creditUsage > 50) creditHealthColor = "bg-yellow-500";

  const handleAddNote = async () => {
    if (!newNote.trim() || !adminProfile) return;
    setIsSubmittingNote(true);
    try {
      await addClientNote(client.uid, {
        text: newNote,
        authorId: adminProfile.uid,
        authorName: adminProfile.contactPerson || adminProfile.businessName,
      });
      setNewNote('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add note.",
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };
  
  const handleDeleteConfirmed = async () => {
    if (!noteToDelete) return;
    try {
      await deleteClientNote(client.uid, noteToDelete.id);
      toast({ title: "Note deleted" });
      setNoteToDelete(null);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete note.",
      });
    }
  };


  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge className="bg-[#e3f2fd] text-[#2196f3] hover:bg-[#e3f2fd]/80">Nuevo</Badge>;
      case 'processing': return <Badge className="bg-orange-100 text-orange-600">En Proceso</Badge>;
      case 'shipped': return <Badge className="bg-[#fff3e0] text-[#ff9800] hover:bg-[#fff3e0]/80">En Ruta</Badge>;
      case 'delivered': return <Badge className="bg-[#e8f5e9] text-[#2ecc71] hover:bg-[#e8f5e9]/80">Entregado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <ClientFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} client={client} />
       <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_note_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_note_confirm_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive hover:bg-destructive/90">
              {t('delete_note_confirm_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <Avatar className="h-20 w-20 rounded-2xl text-2xl font-bold">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {client.businessName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold font-headline">{client.businessName}</h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 capitalize">{client.status || 'active'}</Badge>
                    <Badge variant="outline" className="border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80">
                        {getTierIcon(client.tier)}
                        <span className="ml-1 capitalize">{client.tier}</span>
                    </Badge>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="text-sm text-muted-foreground cursor-pointer underline decoration-dotted">ID</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{client.uid}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="text-sm text-muted-foreground">&bull; {t('since')} {format(client.createdAt.toDate(), 'PPP')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-start sm:self-center">
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />{t('edit_button')}</Button>
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
                  <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><User />{t('contact_label')}</span> <span className="font-semibold">{client.contactPerson}</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><Mail />{t('email_label')}</span> <span className="font-semibold text-primary">{client.email}</span></div>
                  <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center gap-2"><Phone />{t('phone_label')}</span> <span className="font-semibold">{client.phone}</span></div>
                  <div className="text-muted-foreground flex items-center gap-2 pt-2 border-t">{t('address_label')}</div>
                  <div className="p-2 bg-muted rounded-md text-muted-foreground">{client.address}</div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('credit_status_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">{t('current_debt_label')}</p>
                  <p className="text-2xl font-bold">{formatCurrency(creditUsed)}</p>
                  <Progress value={creditUsage} className="h-2 mt-2" indicatorClassName={creditHealthColor} />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>$0</span>
                    <span>{t('credit_limit_label')}: {formatCurrency(creditLimit)}</span>
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
                                      {orders.length > 0 ? orders.map(order => (
                                          <TableRow key={order.id}>
                                              <TableCell className="font-bold text-primary">#{order.id.substring(0,7).toUpperCase()}</TableCell>
                                              <TableCell>{format(order.createdAt.toDate(), 'dd MMM yyyy')}</TableCell>
                                              <TableCell>{order.items.length} items</TableCell>
                                              <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                                              <TableCell>{getStatusBadge(order.status)}</TableCell>
                                              <TableCell>
                                                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                                              </TableCell>
                                          </TableRow>
                                      )) : (
                                        <TableRow>
                                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No orders found for this client.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </TabsContent>
                          <TabsContent value="products">
                             <p className="text-sm text-muted-foreground mb-4">{t('top_products_subtitle')}</p>
                             {/* Add top products content here */}
                          </TabsContent>
                           <TabsContent value="notes">
                              <div className="flex gap-2 mb-4">
                                  <Input 
                                    placeholder={t('add_note_placeholder')} 
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    disabled={isSubmittingNote}
                                  />
                                  <Button onClick={handleAddNote} disabled={isSubmittingNote || !newNote.trim()}>
                                    <Send className="h-4 w-4"/>
                                  </Button>
                              </div>
                              <div className="space-y-3">
                                  {notesLoading ? (
                                    <p className="text-center text-muted-foreground py-4">Loading notes...</p>
                                  ) : notes.length > 0 ? (
                                    notes.map((note) => (
                                    <div key={note.id} className="group flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Avatar className="h-8 w-8 text-xs">
                                            <AvatarFallback className="bg-primary text-primary-foreground">{note.authorName?.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">{note.authorName}</span>
                                                <span>&bull;</span>
                                                {note.createdAt ? (
                                                  <span>{formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true, locale: es })}</span>
                                                ) : (
                                                  <span>Just now</span>
                                                )}
                                            </div>
                                            <p className="text-sm">{note.text}</p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setNoteToDelete(note)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    ))
                                  ) : (
                                    <p className="text-center text-muted-foreground py-4">No notes for this client yet.</p>
                                  )}
                              </div>
                          </TabsContent>
                      </CardContent>
                  </Tabs>
              </Card>
          </div>
        </div>
      </div>
    </>
  );
}
