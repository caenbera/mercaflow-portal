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
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const t = useTranslations('ProductsPage');
  
  const handleSuccess = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product ? t('dialog_edit_title') : t('dialog_add_title')}</DialogTitle>
        </DialogHeader>
        <ProductForm product={product} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
