"use client";

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileText } from 'lucide-react';
import type { Product } from '@/types';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  products: Product[];
}

const CSV_TEMPLATE_HEADERS = [
  'sku',
  'costo_proveedor',
  'nombre_producto_proveedor',
  'precio_venta',
  'metodo_precios', // 'margin' or 'markup'
  'foto_url',
  'stock_actual',
  'stock_minimo',
  'nombre_interno_es',
  'nombre_interno_en',
  'categoria_es',
  'categoria_en',
  'subcategoria_es',
  'subcategoria_en',
  'unidad_es',
  'unidad_en'
];

export function ProductImportDialog({ open, onOpenChange, supplierId, supplierName, products }: ProductImportDialogProps) {
  const t = useTranslations('SuppliersPage');
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = CSV_TEMPLATE_HEADERS.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `plantilla_productos_${supplierId}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadCatalog = () => {
    if (!products || products.length === 0) {
      toast({
        variant: 'destructive',
        title: t('toast_no_products_title'),
        description: t('toast_no_products_desc'),
      });
      return;
    }

    const csvRows = [CSV_TEMPLATE_HEADERS.join(',')];

    for (const product of products) {
        const supplierInfo = product.suppliers.find(s => s.supplierId === supplierId);
        
        const formatForCsv = (value: string | number | undefined | null) => {
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Quote the string if it contains a comma, double quote, or newline
          if (/[",\n]/.test(stringValue)) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        };
        
        const row = [
          product.sku,
          supplierInfo?.cost ?? '',
          supplierInfo?.supplierProductName ?? '',
          product.salePrice,
          product.pricingMethod ?? 'margin',
          product.photoUrl ?? '',
          product.stock,
          product.minStock,
          product.name.es,
          product.name.en,
          product.category.es,
          product.category.en,
          product.subcategory?.es ?? '',
          product.subcategory?.en ?? '',
          product.unit.es,
          product.unit.en,
        ].map(formatForCsv);
        
        csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `catalogo_${supplierName.replace(/\s+/g, '_').toLowerCase()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a valid .csv file.',
      });
      setSelectedFile(null);
    }
    // Reset file input to allow uploading the same file again
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleImport = () => {
      // Phase 2: This is where the file processing logic will go.
      toast({
          title: "Función no implementada",
          description: "La lógica para procesar el archivo se añadirá en un paso futuro."
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('import_dialog_title', { supplierName })}</DialogTitle>
          <DialogDescription>{t('import_dialog_desc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
            <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
                <div>
                    <h4 className="font-semibold text-sm mb-2">{t('import_step1_title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('import_step1_desc_new')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border bg-background p-3 rounded-lg">
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full justify-start">
                            <Download className="mr-2 h-4 w-4"/>
                            {t('download_empty_template_button')}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">{t('download_empty_template_desc')}</p>
                    </div>
                    <div className="border bg-background p-3 rounded-lg">
                        <Button variant="outline" size="sm" onClick={handleDownloadCatalog} className="w-full justify-start">
                            <Download className="mr-2 h-4 w-4"/>
                            {t('download_current_catalog_button')}
                        </Button>
                         <p className="text-xs text-muted-foreground mt-2">{t('download_current_catalog_desc')}</p>
                    </div>
                </div>
            </div>
             <div className="p-4 rounded-lg border bg-muted/50">
                <h4 className="font-semibold text-sm mb-2">{t('import_step2_title')}</h4>
                <p className="text-xs text-muted-foreground mb-3">{t('import_step2_desc')}</p>
                 <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/>
                    {t('upload_file_button')}
                </Button>
                {selectedFile && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-md border">
                        <FileText className="h-4 w-4 text-primary"/>
                        <span className="font-medium">{selectedFile.name}</span>
                    </div>
                )}
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile}>
            {t('import_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
