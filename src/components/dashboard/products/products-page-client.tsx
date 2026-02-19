
"use client";

import { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/use-products';
import { ProductTable } from './product-table';
import { ProductDialog } from './product-dialog';
import { DeleteProductAlert } from './delete-product-alert';
import { OfferDialog } from './offer-dialog';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductsPageClient() {
  const t = useTranslations('ProductsPage');
  const locale = useLocale() as 'es' | 'en';
  const { products, loading } = useProducts();
  
  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Estados para modales
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Unificar productos (por SKU si es necesario) y aplicar filtros
  const filteredProducts = useMemo(() => {
    if (loading) return [];
    
    // 1. Unificación básica (eliminar duplicados por SKU si existen en la suscripción)
    const productMap = products.reduce((acc, product) => {
        const existing = acc.get(product.sku);
        if (existing) {
            existing.stock += product.stock;
        } else {
            acc.set(product.sku, { ...product });
        }
        return acc;
    }, new Map<string, Product>());

    let list = Array.from(productMap.values());

    // 2. Aplicar Búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.name[locale].toLowerCase().includes(term) ||
        p.name.es.toLowerCase().includes(term) ||
        p.name.en.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    }

    // 3. Aplicar Filtro de Categoría
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category.es === categoryFilter || p.category.en === categoryFilter);
    }

    // 4. Aplicar Filtro de Estado
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        list = list.filter(p => p.active === true);
      } else if (statusFilter === 'low_stock') {
        list = list.filter(p => p.stock <= p.minStock && p.stock > 0);
      } else if (statusFilter === 'out_of_stock') {
        list = list.filter(p => p.stock === 0);
      }
    }

    return list;
  }, [products, loading, searchTerm, categoryFilter, statusFilter, locale]);

  // Obtener categorías únicas presentes en los productos para el filtro
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category?.es) cats.add(p.category.es);
    });
    return Array.from(cats).sort();
  }, [products]);


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
  
  const handleOffer = (product: Product) => {
    setSelectedProduct(product);
    setOfferDialogOpen(true);
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
      <OfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-1 md:pb-0">
            {/* Filtro Categoría */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-11 border-0 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-colors focus:ring-0">
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 opacity-70" />
                        <SelectValue placeholder={t('filter_all_categories')} />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('filter_all_categories')}</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Filtro Estado */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-11 border-0 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl transition-colors focus:ring-0">
                    <SelectValue placeholder={t('filter_status_all')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('filter_status_all')}</SelectItem>
                    <SelectItem value="active">{t('form_label_active_true')}</SelectItem>
                    <SelectItem value="low_stock">{t('stock_low')}</SelectItem>
                    <SelectItem value="out_of_stock">{t('stock_out')}</SelectItem>
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
            <ProductTable 
              products={filteredProducts} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
              onOffer={handleOffer} 
            />
        </div>
      )}
    </div>
  );
}
