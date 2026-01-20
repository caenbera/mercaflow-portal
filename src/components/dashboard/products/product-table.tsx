import Image from 'next/image';
import { MoreHorizontal, History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <div className="overflow-x-auto">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>{t('table_header_product')}</TableHead>
            <TableHead>{t('table_header_category')}</TableHead>
            <TableHead>{t('table_header_supplier')}</TableHead>
            <TableHead className="text-right">{t('table_header_prices')}</TableHead>
            <TableHead className="text-center">{t('table_header_margin')}</TableHead>
            <TableHead>{t('table_header_stock')}</TableHead>
            <TableHead className="text-right">{t('table_header_actions')}</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {products.length > 0 ? (
            products.map((product) => {
                const margin = product.salePrice > 0 ? ((product.salePrice - product.cost) / product.salePrice) * 100 : 0;
                let marginClass = 'bg-green-100 text-green-700';
                if(margin < 30) marginClass = 'bg-yellow-100 text-yellow-700';
                if(margin < 15) marginClass = 'bg-red-100 text-red-700';
                
                let stockClass = 'text-green-600';
                if (product.stock === 0) stockClass = 'text-red-600';
                else if (product.stock <= product.minStock) stockClass = 'text-yellow-600';

                return (
                <TableRow key={product.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="45"
                            src={product.photoUrl || 'https://picsum.photos/45'}
                            width="45"
                            />
                            <div>
                                <div className="font-bold">{product.name}</div>
                                <div className="text-xs text-muted-foreground">{product.sku}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getSupplierName(product.supplierId)}</TableCell>
                    <TableCell className="text-right">
                        <div className="font-semibold">{formatCurrency(product.salePrice)}</div>
                        <div className="text-xs text-muted-foreground">{t('price_cost')}: {formatCurrency(product.cost)}</div>
                    </TableCell>
                    <TableCell className="text-center">
                         <Badge variant="outline" className={cn("font-bold", marginClass)}>{margin.toFixed(0)}%</Badge>
                    </TableCell>
                    <TableCell>
                        <div className={cn("font-bold", stockClass)}>{product.stock} {product.unit}</div>
                         {product.stock > 0 && product.stock <= product.minStock && (
                            <small className="text-destructive font-bold text-xs">{t('stock_reorder')}</small>
                         )}
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => onEdit(product)}>{t('actions_edit')}</DropdownMenuItem>
                            <DropdownMenuItem><History className="mr-2 h-4 w-4"/>{t('actions_history')}</DropdownMenuItem>
                             <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => onDelete(product)} className="text-destructive">
                            {t('actions_delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                )
            })
            ) : (
            <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                No products found. Add one to get started!
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
    </div>
  );
}
