import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductForm } from './product-form';
import type { Product } from '@/types';
import { useTranslations } from 'next-intl';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  defaultSupplierId?: string;
}

export function ProductDialog({ open, onOpenChange, product, defaultSupplierId }: ProductDialogProps) {
  const t = useTranslations('ProductsPage');
  
  const handleSuccess = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* CAMBIO AQUÍ: max-w-4xl para que quepa bien el diseño de 2 columnas */}
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {product ? t('dialog_edit_title') : t('dialog_add_title')}
          </DialogTitle>
        </div>
        
        <div className="p-6 max-h-[85vh] overflow-y-auto">
            <ProductForm product={product} onSuccess={handleSuccess} defaultSupplierId={defaultSupplierId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
    