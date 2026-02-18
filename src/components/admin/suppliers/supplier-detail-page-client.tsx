
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { Supplier, Product } from '@/types';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Star,
  FileText,
  Send,
  Phone,
  Mail,
  Truck,
  CreditCard,
  Info,
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  LineChart,
  Pencil,
  BotMessageSquare,
  Trash2,
  Upload,
  Globe,
  Zap,
  Loader2,
  Check,
  ShoppingBag
} from 'lucide-react';
import { ProductDialog } from '@/components/dashboard/products/product-dialog';
import { DeleteProductAlert } from '@/components/dashboard/products/delete-product-alert';
import { AddSupplierDialog } from './add-supplier-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductImportDialog } from './product-import-dialog';
import { ImportWizardDialog } from './import-wizard-dialog';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { addProduct } from '@/lib/firestore/products';
import { useOrganization } from '@/context/organization-context';

interface SupplierDetailPageClientProps {
    supplier: Supplier;
    products: Product[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const InteractiveRating = ({ initialRating, onRate }: { initialRating: number, onRate: (rating: number) => void }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(initialRating);

  const handleRate = (rating: number) => {
    setCurrentRating(rating);
    onRate(rating);
  };
  
  return (
    <div className="flex items-center gap-1">
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHoverRating(0)}
      >
        {[...Array(5)].map((_, i) => {
          const ratingValue = i + 1;
          return (
            <Star
              key={i}
              className={cn(
                "h-5 w-5 cursor-pointer transition-colors",
                ratingValue <= (hoverRating || currentRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              )}
              onMouseEnter={() => setHoverRating(ratingValue)}
              onClick={() => handleRate(ratingValue)}
            />
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">({currentRating.toFixed(1)})</span>
    </div>
  );
};

export function SupplierDetailPageClient({ supplier, products: supplierCatalog }: SupplierDetailPageClientProps) {
  const t = useTranslations('SuppliersPage');
  const locale = useLocale() as 'es' | 'en';
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();
  
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(supplier);
  
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Red MercaFlow State
  const [remoteProducts, setRemoteProducts] = useState<Product[]>([]);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [productsToImport, setProductsToImport] = useState<Product[]>([]);
  const [selectedRemoteSkus, setSelectedRemoteSkus] = useState<string[]>([]);

  const fetchRemoteProducts = async () => {
    if (!supplier.linkedOrgId) return;
    setIsRemoteLoading(true);
    try {
      const q = query(collection(db, 'products'), where('organizationId', '==', supplier.linkedOrgId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setRemoteProducts(list);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: "No se pudo cargar el catálogo remoto." });
    } finally {
      setIsRemoteLoading(false);
    }
  };

  const handleOpenWizard = (remotes: Product[]) => {
    // Filtrar los que ya existen
    const existingSkus = new Set(supplierCatalog.map(p => p.sku));
    const onlyNew = remotes.filter(r => !existingSkus.has(r.sku));

    if (onlyNew.length === 0) {
      toast({ title: "Productos ya existentes", description: "Todos los productos seleccionados ya están en tu catálogo." });
      return;
    }

    if (onlyNew.length < remotes.length) {
      toast({ title: "Algunos ya existen", description: `${remotes.length - onlyNew.length} productos fueron omitidos por estar ya en catálogo.` });
    }

    setProductsToImport(onlyNew);
    setIsWizardOpen(true);
  };

  const toggleSelectRemote = (sku: string) => {
    setSelectedRemoteSkus(prev => 
      prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
    );
  };

  const handleSelectAllRemote = () => {
    if (selectedRemoteSkus.length === remoteProducts.length) {
      setSelectedRemoteSkus([]);
    } else {
      setSelectedRemoteSkus(remoteProducts.map(p => p.sku));
    }
  };

  const handleRatingChange = (newRating: number) => {
      setCurrentSupplier(prev => ({...prev, rating: newRating}));
      toast({
          title: t('rating_updated_title'),
          description: t('rating_updated_desc', { supplierName: supplier.name, rating: newRating }),
      });
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setAlertOpen(true);
  };

  return (
    <>
      <ProductDialog 
        open={isProductDialogOpen} 
        onOpenChange={setIsProductDialogOpen} 
        product={selectedProduct} 
        defaultSupplierId={supplier.id}
      />
      <DeleteProductAlert
        open={isAlertOpen}
        onOpenChange={setAlertOpen}
        product={selectedProduct}
      />
      <AddSupplierDialog 
        open={isSupplierDialogOpen} 
        onOpenChange={setIsSupplierDialogOpen} 
        supplier={currentSupplier}
      />
      <ProductImportDialog 
        open={isImportDialogOpen} 
        onOpenChange={setIsImportDialogOpen} 
        supplierId={supplier.id} 
        supplierName={supplier.name} 
        products={supplierCatalog}
      />
      <ImportWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        remoteProducts={productsToImport}
        supplier={supplier}
        onSuccess={() => {
          fetchRemoteProducts();
          setSelectedRemoteSkus([]);
        }}
      />
      
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="mb-2">
          <Button variant="ghost" asChild className="text-muted-foreground font-semibold px-0 hover:bg-transparent">
            <Link href="/admin/suppliers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back_to_list')}
            </Link>
          </Button>
        </div>

        <Card className="p-6 shadow-md border-none rounded-2xl bg-white overflow-hidden relative">
          {supplier.linkedOrgId && (
            <div className="absolute top-0 right-0 p-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1">
                <Globe className="h-3 w-3" /> Vinculado en Red
              </Badge>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 rounded-2xl text-2xl font-bold shadow-sm border-2 border-white ring-1 ring-slate-100">
                  <AvatarFallback className="bg-slate-50 text-slate-400">{supplier.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-3xl font-black font-headline text-slate-900 tracking-tight">{supplier.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  {supplier.verified && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-bold px-2">{t('verified')}</Badge>}
                  <InteractiveRating initialRating={currentSupplier.rating} onRate={handleRatingChange} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-start sm:self-center">
              <Button variant="outline" className="h-11 rounded-xl font-bold"><FileText className="mr-2 h-4 w-4" />{t('account_statement')}</Button>
              <Button className="h-11 rounded-xl font-bold shadow-lg"><Send className="mr-2 h-4 w-4" />{t('send_order')}</Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-none rounded-2xl h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">{t('contact_payments')}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsSupplierDialogOpen(true)}><Pencil className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4 text-sm pt-2">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" /> 
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Email Corporativo</p>
                  <a href={`mailto:${supplier.email}`} className="text-primary font-bold underline truncate block">{supplier.email}</a>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <Truck className="h-5 w-5 text-primary mt-0.5 shrink-0" /> 
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Entregas</p>
                    <p className="font-bold text-slate-700">{supplier.deliveryDays}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5 shrink-0" /> 
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Términos</p>
                    <p className="font-bold text-slate-700">{supplier.paymentTerms}</p>
                  </div>
                </div>
              </div>
              <hr className="border-dashed" />
              <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider px-1">Personas de Contacto</h4>
              <div className="space-y-2">
                {supplier.contacts.map((contact, index) => (
                    <div key={contact.id || index} className="p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="font-bold text-sm text-slate-800">{contact.name}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2">{contact.department}</div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-lg" asChild>
                              <a href={`tel:${contact.phone}`}><Phone className="h-3 w-3 mr-1.5" /> Llamar</a>
                            </Button>
                            {contact.isWhatsapp && (
                              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-lg border-green-200 text-green-700 hover:bg-green-50" asChild>
                                <a href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} target="_blank"><BotMessageSquare className="h-3 w-3 mr-1.5" /> WhatsApp</a>
                              </Button>
                            )}
                        </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="local" className="w-full">
              <TabsList className="bg-white p-1 rounded-xl border shadow-sm h-auto">
                <TabsTrigger value="local" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
                  Mi Inventario del Proveedor ({supplierCatalog.length})
                </TabsTrigger>
                {supplier.linkedOrgId && (
                  <TabsTrigger 
                    value="remote" 
                    className="rounded-lg py-2.5 font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white gap-2"
                    onClick={fetchRemoteProducts}
                  >
                    <Globe className="h-4 w-4" /> Catálogo en Red MercaFlow
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="local" className="mt-6">
                <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <CardTitle className="text-base font-bold">Productos que ya le compras</CardTitle>
                            <p className="text-xs text-muted-foreground">Gestiona tus costos y precios de venta locales.</p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="rounded-xl h-10 font-bold">
                                  <Upload className="mr-2 h-4 w-4" />
                                  Importar CSV
                              </Button>
                              <Button onClick={handleAddProduct} className="rounded-xl h-10 font-bold">
                                  <Plus className="mr-2 h-4 w-4" />
                                  Nuevo Producto
                              </Button>
                          </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                          <TableHeader className="bg-slate-50/50">
                              <TableRow>
                                  <TableHead className="pl-6 text-[10px] uppercase font-bold text-slate-400 py-4">{t('product')}</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-400">{t('purchase_unit')}</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-400">{t('current_cost')}</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-400">{t('supplier_stock')}</TableHead>
                                  <TableHead className="pr-6 text-right text-[10px] uppercase font-bold text-slate-400">{t('actions')}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {supplierCatalog.length > 0 ? (
                                supplierCatalog.map(product => {
                                  const supplierInfo = product.suppliers.find(s => s.supplierId === supplier.id);
                                  const cost = supplierInfo?.cost ?? 0;
                                  const productName = product.name?.[locale] || product.name?.es || (product.name as any);
                                  const unitText = typeof product.unit === 'object' && product.unit?.[locale] ? product.unit[locale] : (product.unit as any);
                                  const imageUrl = product.photoUrl || '/placeholder.svg';
                                  return (
                                  <TableRow key={product.id} className="hover:bg-slate-50 transition-colors">
                                      <TableCell className="pl-6 font-medium py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="h-10 w-10 rounded-lg overflow-hidden border bg-slate-50 shrink-0">
                                                <Image src={imageUrl} alt={productName} width={40} height={40} className="rounded-md object-cover h-full w-full"/>
                                              </div>
                                              <div className="min-w-0">
                                                  <div className="font-bold text-slate-800 truncate text-sm">{productName}</div>
                                                  <div className="text-[10px] font-mono text-muted-foreground uppercase">SKU: {product.sku}</div>
                                              </div>
                                          </div>
                                      </TableCell>
                                      <TableCell className="text-slate-600 font-medium">{unitText}</TableCell>
                                      <TableCell className="font-black text-primary text-base">{formatCurrency(cost)}</TableCell>
                                      <TableCell>
                                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">DISPONIBLE</Badge>
                                      </TableCell>
                                      <TableCell className="pr-6">
                                          <div className="flex justify-end gap-1">
                                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleEditProduct(product)}><Pencil className="h-4 w-4" /></Button>
                                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive" onClick={() => handleDeleteProduct(product)}><Trash2 className="h-4 w-4" /></Button>
                                          </div>
                                      </TableCell>
                                  </TableRow>
                                  )
                              })
                              ) : (
                                <TableRow><TableCell colSpan={6} className="text-center h-48 text-slate-400"><ShoppingBag className="mx-auto h-10 w-10 opacity-20 mb-3" /> {t('no_products_yet')}</TableCell></TableRow>
                              )}
                          </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {supplier.linkedOrgId && (
                <TabsContent value="remote" className="mt-6">
                  <Card className="shadow-sm border-none rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white py-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" /> Catálogo en Red MercaFlow
                          </CardTitle>
                          <p className="text-xs text-slate-400 mt-1">Viendo el inventario real de <strong>{supplier.name}</strong> en MercaFlow.</p>
                        </div>
                        <div className="flex gap-2">
                          {selectedRemoteSkus.length > 0 && (
                            <Button 
                              variant="default" 
                              className="bg-primary hover:bg-primary/90 rounded-xl"
                              onClick={() => {
                                const products = remoteProducts.filter(p => selectedRemoteSkus.includes(p.sku));
                                handleOpenWizard(products);
                              }}
                            >
                              <Zap className="h-4 w-4 mr-2" />
                              Importar Seleccionados ({selectedRemoteSkus.length})
                            </Button>
                          )}
                          <Button variant="secondary" size="sm" onClick={fetchRemoteProducts} disabled={isRemoteLoading} className="rounded-xl">
                            {isRemoteLoading ? <Loader2 className="animate-spin" /> : "Actualizar Vista"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                      {isRemoteLoading ? (
                        <div className="p-12 text-center space-y-4">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                          <p className="text-sm font-medium text-slate-500">Sincronizando con la red...</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-slate-50/50">
                              <TableRow>
                                <TableHead className="w-[50px] pl-6">
                                  <Checkbox 
                                    checked={remoteProducts.length > 0 && selectedRemoteSkus.length === remoteProducts.length}
                                    onCheckedChange={handleSelectAllRemote}
                                  />
                                </TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-4">Producto Remoto</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-400">Su Unidad</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-slate-400">Tu Costo</TableHead>
                                <TableHead className="pr-6 text-right text-[10px] uppercase font-bold text-slate-400">Acción</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {remoteProducts.length > 0 ? remoteProducts.map(remote => {
                                const isAlreadyImported = supplierCatalog.some(p => p.sku === remote.sku);
                                return (
                                  <TableRow key={remote.id} className={cn("hover:bg-slate-50 transition-colors", isAlreadyImported && "opacity-60 bg-slate-50/30")}>
                                    <TableCell className="pl-6">
                                      {!isAlreadyImported && (
                                        <Checkbox 
                                          checked={selectedRemoteSkus.includes(remote.sku)}
                                          onCheckedChange={() => toggleSelectRemote(remote.sku)}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg overflow-hidden border bg-slate-100 shrink-0">
                                          <Image src={remote.photoUrl || '/placeholder.svg'} alt={remote.name.es} width={40} height={40} className="object-cover h-full w-full" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-sm text-slate-800">{remote.name.es}</p>
                                          <p className="text-[10px] font-mono text-muted-foreground uppercase">{remote.sku}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm">{remote.unit.es}</TableCell>
                                    <TableCell className="font-black text-primary text-base">{formatCurrency(remote.salePrice)}</TableCell>
                                    <TableCell className="pr-6 text-right">
                                      {isAlreadyImported ? (
                                        <Badge className="bg-slate-100 text-slate-500 border-none gap-1 py-1.5 rounded-lg">
                                          <Check className="h-3 w-3" /> En Catálogo
                                        </Badge>
                                      ) : (
                                        <Button 
                                          size="sm" 
                                          variant="ghost"
                                          className="text-primary hover:text-primary hover:bg-primary/10 h-9 px-4 rounded-xl font-bold"
                                          onClick={() => handleOpenWizard([remote])}
                                        >
                                          <Zap className="h-4 w-4 mr-1.5" />
                                          Importar
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              }) : (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-slate-400">Este proveedor aún no tiene productos públicos en la red.</TableCell></TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
