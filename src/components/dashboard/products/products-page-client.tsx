"use client";

import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
// Nota: Ya no usamos Card/CardHeader aquí para dar más libertad al layout, 
// usamos divs directos para el estilo "Dashboard Limpio"
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/use-products';
import { ProductTable } from './product-table';
import { ProductDialog } from './product-dialog';
import { DeleteProductAlert } from './delete-product-alert';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductsPageClient() {
  const { products, loading } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const t = useTranslations('ProductsPage');

  const handleAdd = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setAlertOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-screen bg-slate-50/30">
      
      {/* MODALES */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
      />
      <DeleteProductAlert
        open={alertOpen}
        onOpenChange={setAlertOpen}
        product={selectedProduct}
      />

      {/* 1. ENCABEZADO DE PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={handleAdd} size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 font-bold px-6">
          <Plus className="mr-2 h-5 w-5" /> {t('add_button')}
        </Button>
      </div>
      
      {/* 2. BARRA DE HERRAMIENTAS (BUSCADOR Y FILTROS) */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        
        {/* Buscador */}
        <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
                placeholder={t('search_placeholder')} 
                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary/50 rounded-xl transition-all" 
            />
        </div>

        <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-1 md:pb-0">
            {/* Filtro Categoría */}
            <Select>
                <SelectTrigger className="w-full md:w-[200px] h-11 border-0 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-colors focus:ring-0">
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 opacity-70" />
                        <SelectValue placeholder={t('filter_all_categories')} />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('filter_all_categories')}</SelectItem>
                    <SelectItem value="Verduras">Verduras</SelectItem>
                    <SelectItem value="Frutas">Frutas</SelectItem>
                    <SelectItem value="Hierbas">Hierbas</SelectItem>
                    <SelectItem value="Abarrotes">Abarrotes</SelectItem>
                    <SelectItem value="Congelados">Congelados</SelectItem>
                </SelectContent>
            </Select>

            {/* Filtro Estado */}
            <Select>
                <SelectTrigger className="w-full md:w-[180px] h-11 border-0 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-colors focus:ring-0">
                    <SelectValue placeholder={t('filter_status_all')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('filter_status_all')}</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="low_stock">Stock Bajo</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* 3. TABLA DE CONTENIDO */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}