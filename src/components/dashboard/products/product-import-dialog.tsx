
"use client";

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileText, Loader2 } from 'lucide-react';
import type { Product, ProductInput } from '@/types';
import { getProductBySku, addProduct, updateProduct } from '@/lib/firestore/products';

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
  'margen',
  'markup',
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
  'unidad_en',
  'es_caja' // VERDADERO o FALSO
];

export function ProductImportDialog({ open, onOpenChange, supplierId, supplierName, products }: ProductImportDialogProps) {
  const t = useTranslations('SuppliersPage');
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadTemplate = () => {
    const csvContent = CSV_TEMPLATE_HEADERS.join(',');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
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

    const formatForCsv = (value: string | number | boolean | undefined | null) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'VERDADERO' : 'FALSO';
        const stringValue = String(value);
        if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    for (const product of products) {
        const supplierInfo = product.suppliers.find(s => s.supplierId === supplierId);
        const cost = supplierInfo?.cost ?? 0;
        const price = product.salePrice;
        const margin = price > 0 && cost > 0 ? ((price - cost) / price) * 100 : '';
        const markup = cost > 0 ? ((price - cost) / cost) * 100 : '';
        
        const row = [
          product.sku,
          cost,
          supplierInfo?.supplierProductName ?? '',
          price,
          typeof margin === 'number' ? margin.toFixed(1) : '',
          typeof markup === 'number' ? markup.toFixed(1) : '',
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
          product.isBox,
        ].map(formatForCsv);
        
        csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
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
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleImport = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    const parseCsvRow = (row: string): string[] => {
        const values: string[] = [];
        let currentVal = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
                    currentVal += '"';
                    i++; 
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal);
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal);
        return values;
    };

    try {
        const text = await selectedFile.text();
        const rows = text.split(/\r?\n/).map(row => row.trim()).filter(row => row);
        const headerLine = rows.shift();
        if (!headerLine) throw new Error("CSV file is empty or has no header.");

        const headers = parseCsvRow(headerLine).map(h => h.trim());
        
        let updatedCount = 0;
        let createdCount = 0;

        for (const row of rows) {
            const values = parseCsvRow(row);
            
            if (values.length > headers.length) {
              console.warn(`Skipping malformed row. Has too many columns. Row: "${row}"`);
              continue;
            }
            
            const rowData: any = headers.reduce((obj, header, index) => {
                obj[header] = values[index]?.trim() || '';
                return obj;
            }, {} as any);

              const sku = rowData.sku;
              if (!sku) continue;

              let finalCost = rowData.costo_proveedor ? parseFloat(rowData.costo_proveedor) : null;
              let finalSalePrice = rowData.precio_venta ? parseFloat(rowData.precio_venta) : null;
              const margen = rowData.margen ? parseFloat(rowData.margen) : null;
              const markup = rowData.markup ? parseFloat(rowData.markup) : null;
              const metodo_precios = rowData.metodo_precios === 'markup' ? 'markup' : 'margin';

              if (finalCost !== null && finalSalePrice === null) {
                  if (metodo_precios === 'margin' && margen !== null && margen < 100) {
                      finalSalePrice = finalCost / (1 - (margen / 100));
                  } else if (metodo_precios === 'markup' && markup !== null) {
                      finalSalePrice = finalCost * (1 + (markup / 100));
                  }
              } else if (finalSalePrice !== null && finalCost === null) {
                  if (metodo_precios === 'margin' && margen !== null && margen < 100) {
                      finalCost = finalSalePrice * (1 - (margen / 100));
                  } else if (metodo_precios === 'markup' && markup !== null) {
                      finalCost = finalSalePrice / (1 + (markup / 100));
                  }
              }

              const existingProduct = await getProductBySku(sku);

              if (existingProduct) {
                  // UPDATE logic
                  const updatePayload: any = {};
                  const suppliers = [...existingProduct.suppliers];
                  let supplierEntry = suppliers.find(s => s.supplierId === supplierId);

                  if (supplierEntry) {
                      if (finalCost !== null) supplierEntry.cost = finalCost;
                      if (rowData.nombre_producto_proveedor) supplierEntry.supplierProductName = rowData.nombre_producto_proveedor;
                  } else {
                      suppliers.push({ supplierId, cost: finalCost ?? 0, isPrimary: suppliers.length === 0, supplierProductName: rowData.nombre_producto_proveedor ?? '' });
                  }
                  updatePayload.suppliers = suppliers;

                  if (finalSalePrice !== null) updatePayload.salePrice = finalSalePrice;
                  if (rowData.foto_url) updatePayload.photoUrl = rowData.foto_url;

                  if (rowData.metodo_precios) {
                      updatePayload.pricingMethod = rowData.metodo_precios;
                  } else if (rowData.margen) {
                      updatePayload.pricingMethod = 'margin';
                  } else if (rowData.markup) {
                      updatePayload.pricingMethod = 'markup';
                  }
                  
                  if (rowData.nombre_interno_es) updatePayload.name = { ...existingProduct.name, es: rowData.nombre_interno_es };
                  if (rowData.nombre_interno_en) updatePayload.name = { ...(updatePayload.name || existingProduct.name), en: rowData.nombre_interno_en };
                  if (rowData.stock_actual) updatePayload.stock = parseInt(rowData.stock_actual);
                  if (rowData.stock_minimo) updatePayload.minStock = parseInt(rowData.stock_minimo);
                  if (rowData.es_caja) updatePayload.isBox = rowData.es_caja.toUpperCase() === 'VERDADERO';


                  await updateProduct(existingProduct.id, updatePayload);
                  updatedCount++;
              } else {
                  // CREATE logic
                  const createPayload: ProductInput = {
                      sku,
                      name: { es: rowData.nombre_interno_es, en: rowData.nombre_interno_en },
                      category: { es: rowData.categoria_es, en: rowData.categoria_en },
                      subcategory: { es: rowData.subcategoria_es, en: rowData.subcategoria_en },
                      unit: { es: rowData.unidad_es, en: rowData.unidad_en },
                      salePrice: finalSalePrice ?? 0,
                      stock: parseInt(rowData.stock_actual) || 0,
                      minStock: parseInt(rowData.stock_minimo) || 10,
                      active: true,
                      isBox: rowData.es_caja?.toUpperCase() === 'VERDADERO',
                      suppliers: [{ supplierId, cost: finalCost ?? 0, isPrimary: true, supplierProductName: rowData.nombre_producto_proveedor || '' }],
                      photoUrl: rowData.foto_url || '',
                      pricingMethod: metodo_precios,
                  };

                  if (!createPayload.name.es || !createPayload.category.es || !createPayload.unit.es || createPayload.salePrice <= 0) {
                      console.warn(`Skipping creation for SKU ${sku} due to missing essential data.`);
                      continue;
                  }

                  await addProduct(createPayload);
                  createdCount++;
              }
          }
          toast({
              title: "Importación Completada",
              description: `${createdCount} productos creados y ${updatedCount} actualizados.`,
          });
      } catch (e: any) {
          console.error(e);
          toast({ variant: 'destructive', title: 'Error de Importación', description: e.message || 'Hubo un problema al procesar el archivo CSV.' });
      } finally {
          setIsProcessing(false);
          onOpenChange(false);
      }
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
          <Button onClick={handleImport} disabled={!selectedFile || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('import_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    

      


      