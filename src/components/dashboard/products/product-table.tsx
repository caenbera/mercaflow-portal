import Image from 'next/image';
import { Pencil, History, Trash2, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Product } from '@/types';
import { suppliers } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const t = useTranslations('ProductsPage');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'N/A';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <Table>
        <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-transparent border-gray-100">
                <TableHead className="py-4 pl-6 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[300px]">
                    {t('table_header_product')}
                </TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('table_header_category')}
                </TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('table_header_supplier')}
                </TableHead>
                <TableHead className="py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('table_header_prices')}
                </TableHead>
                <TableHead className="py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('table_header_margin')}
                </TableHead>
                <TableHead className="py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('table_header_stock')}
                </TableHead>
                <TableHead className="py-4 pr-6 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('table_header_actions')}
                </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {products.length > 0 ? (
            products.map((product) => {
                // Cálculos de lógica de negocio
                const margin = product.salePrice > 0 ? ((product.salePrice - product.cost) / product.salePrice) * 100 : 0;
                
                // Colores de Margen (Estilo Pastel del HTML)
                let marginClass = 'bg-green-50 text-green-700 border-green-100'; // > 30%
                if(margin < 30) marginClass = 'bg-orange-50 text-orange-700 border-orange-100'; // 15-30%
                if(margin < 15) marginClass = 'bg-red-50 text-red-700 border-red-100'; // < 15%
                
                // Semáforo de Stock
                let stockStatus: 'high' | 'low' | 'out' = 'high';
                if (product.stock === 0) stockStatus = 'out';
                else if (product.stock <= product.minStock) stockStatus = 'low';

                return (
                <TableRow key={product.id} className="group hover:bg-slate-50/60 border-gray-50 transition-colors">
                    
                    {/* PRODUCTO + SKU */}
                    <TableCell className="pl-6 py-3">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg border border-gray-100 bg-white p-0.5 shrink-0 overflow-hidden">
                                <Image
                                    alt={product.name}
                                    className="h-full w-full object-cover rounded-md"
                                    height="48"
                                    src={product.photoUrl || 'https://picsum.photos/48'}
                                    width="48"
                                />
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm leading-tight mb-1">{product.name}</div>
                                <span className="text-[10px] font-mono font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                    {product.sku}
                                </span>
                            </div>
                        </div>
                    </TableCell>

                    {/* CATEGORÍA */}
                    <TableCell>
                        <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-600 uppercase tracking-wide shadow-sm">
                            {product.category}
                        </span>
                    </TableCell>

                    {/* PROVEEDOR */}
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Truck className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate max-w-[120px]" title={getSupplierName(product.supplierId)}>
                                {getSupplierName(product.supplierId)}
                            </span>
                        </div>
                    </TableCell>

                    {/* PRECIOS APILADOS */}
                    <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="font-bold text-slate-800 text-sm">{formatCurrency(product.salePrice)}</span>
                            <span className="text-[11px] text-gray-400 font-medium">
                                {t('price_cost')}: {formatCurrency(product.cost)}
                            </span>
                        </div>
                    </TableCell>

                    {/* MARGEN */}
                    <TableCell className="text-center">
                         <span className={cn("inline-block min-w-[3rem] text-center text-xs font-bold px-2 py-1 rounded-lg border", marginClass)}>
                            {margin.toFixed(0)}%
                         </span>
                    </TableCell>

                    {/* STOCK CON PUNTOS (DOTS) */}
                    <TableCell>
                        <div className="flex flex-col justify-center">
                            <div className={cn("flex items-center gap-2 font-semibold text-sm", 
                                { 'text-green-600': stockStatus === 'high' },
                                { 'text-amber-600': stockStatus === 'low' },
                                { 'text-red-600': stockStatus === 'out' },
                            )}>
                                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", 
                                    { 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]': stockStatus === 'high' },
                                    { 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]': stockStatus === 'low' },
                                    { 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]': stockStatus === 'out' },
                                )} />
                                <span>{product.stock} <span className="text-xs text-gray-400 font-normal uppercase ml-0.5">{product.unit}</span></span>
                            </div>
                            {stockStatus !== 'high' && (
                                <span className={cn("text-[10px] font-bold uppercase ml-4.5 mt-0.5",
                                    stockStatus === 'low' ? 'text-amber-600' : 'text-red-600'
                                )}>
                                    {stockStatus === 'low' ? t('stock_low') : t('stock_out')}
                                </span>
                            )}
                        </div>
                    </TableCell>

                    {/* ACCIONES DIRECTAS */}
                    <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            onClick={() => onEdit(product)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('actions_edit')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        >
                                            <History className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('actions_history')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            onClick={() => onDelete(product)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-red-500">{t('actions_delete')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </TableCell>
                </TableRow>
                )
            })
            ) : (
            <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                            <Truck className="h-6 w-6 text-gray-300" />
                        </div>
                        <p>{t('no_products_found')}</p>
                    </div>
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
    </div>
  );
}