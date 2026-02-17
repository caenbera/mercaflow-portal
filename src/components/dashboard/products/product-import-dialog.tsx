"use client";

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileText, Loader2 } from 'lucide-react';
import type { Product, ProductInput } from '@/types';
import { getProductBySku, addProduct, updateProduct } from '@/lib/firestore/products';
import Papa from 'papaparse';
import { useOrganization } from '@/context/organization-context';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  products: Product[];
}

// The official header order as defined by the user
const CSV_TEMPLATE_HEADERS = [
  'sku',
  'nombre_interno_es',
  'nombre_interno_en',
  'foto_url',
  'categoria_es',
  'categoria_en',
  'subcategoria_es',
  'subcategoria_en',
  'unidad_es',
  'unidad_en',
  'nombre_producto_proveedor',
  'costo_proveedor',
  'calcular_desde_precio_venta', // VERDADERO o FALSO
  'margen',
  'markup',
  'precio_venta',
  'stock_actual',
  'stock_minimo',
  'es_caja', // VERDADERO o FALSO
];

export function ProductImportDialog({ open, onOpenChange, supplierId, supplierName, products }: ProductImportDialogProps) {
  const t = useTranslations('SuppliersPage');
  const { toast } = useToast();
  const { activeOrgId } = useOrganization();
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

    // Filtrar productos por organización activa si existe
    const filteredProducts = activeOrgId 
      ? products.filter(p => p.organizationId === activeOrgId)
      : products;

    const csvRows = [CSV_TEMPLATE_HEADERS.join(',')];

    for (const product of filteredProducts) {
        const supplierInfo = product.suppliers.find(s => s.supplierId === supplierId);
        const cost = supplierInfo?.cost ?? 0;
        const price = product.salePrice;
        
        let margin = '';
        if (price > 0 && cost > 0) {
          margin = (((price - cost) / price) * 100).toFixed(1);
        }

        let markup = '';
        if (cost > 0) {
          markup = (((price - cost) / cost) * 100).toFixed(1);
        }
        
        const rowData: Record<string, any> = {
          sku: product.sku,
          nombre_interno_es: product.name.es,
          nombre_interno_en: product.name.en,
          foto_url: product.photoUrl ?? '',
          categoria_es: product.category.es,
          categoria_en: product.category.en,
          subcategoria_es: product.subcategory?.es ?? '',
          subcategoria_en: product.subcategory?.en ?? '',
          unidad_es: product.unit.es,
          unidad_en: product.unit.en,
          nombre_producto_proveedor: supplierInfo?.supplierProductName ?? '',
          costo_proveedor: cost,
          calcular_desde_precio_venta: product.calculationDirection === 'priceToCost' ? 'VERDADERO' : 'FALSO',
          margen: product.pricingMethod === 'margin' ? margin : '',
          markup: product.pricingMethod === 'markup' ? markup : '',
          precio_venta: price,
          stock_actual: product.stock,
          stock_minimo: product.minStock,
          es_caja: product.isBox ? 'VERDADERO' : 'FALSO',
        };

        const row = CSV_TEMPLATE_HEADERS.map(header => {
            const value = rowData[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (/[",\n]/.test(stringValue)) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        });
        
        csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
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
        title: 'Tipo de archivo inválido',
        description: 'Por favor sube un archivo .csv válido.',
      });
      setSelectedFile(null);
    }
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleImport = async () => {
    if (!selectedFile || !activeOrgId) {
      toast({ variant: 'destructive', title: "Error", description: "Debes seleccionar un edificio primero." });
      return;
    }
    setIsProcessing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        let updatedCount = 0;
        let createdCount = 0;

        for (const rowData of data) {
          try {
            const sku = rowData.sku;
            if (!sku) continue;

            // --- Determine Calculation Logic ---
            const calculateFromPrice = rowData.calcular_desde_precio_venta?.toUpperCase() === 'VERDADERO';
            const pricingMethod = rowData.markup ? 'markup' : 'margin';
            const calculationDirection = calculateFromPrice ? 'priceToCost' : 'costToPrice';
            
            // --- Read & Parse Values ---
            let costo_proveedor = rowData.costo_proveedor && !isNaN(parseFloat(rowData.costo_proveedor)) ? parseFloat(rowData.costo_proveedor) : null;
            let precio_venta = rowData.precio_venta && !isNaN(parseFloat(rowData.precio_venta)) ? parseFloat(rowData.precio_venta) : null;
            const margen = rowData.margen && !isNaN(parseFloat(rowData.margen)) ? parseFloat(rowData.margen) : null;
            const markup = rowData.markup && !isNaN(parseFloat(rowData.markup)) ? parseFloat(rowData.markup) : null;

            // --- Perform Calculation based on Direction ---
            if (calculateFromPrice && precio_venta !== null) {
              if (pricingMethod === 'margin' && margen !== null && margen < 100) {
                costo_proveedor = precio_venta * (1 - (margen / 100));
              } else if (pricingMethod === 'markup' && markup !== null) {
                costo_proveedor = precio_venta / (1 + (markup / 100));
              }
            } else if (!calculateFromPrice && costo_proveedor !== null) {
              if (pricingMethod === 'margin' && margen !== null && margen < 100) {
                precio_venta = costo_proveedor / (1 - (margen / 100));
              } else if (pricingMethod === 'markup' && markup !== null) {
                precio_venta = costo_proveedor * (1 + (markup / 100));
              }
            }
            
            const existingProduct = await getProductBySku(sku);

            if (existingProduct) {
              // UPDATE logic: Build a payload with all available data from the CSV
              const updatePayload: Partial<ProductInput> = {
                organizationId: activeOrgId
              };
              
              if(rowData.nombre_interno_es) updatePayload.name = { ...existingProduct.name, es: rowData.nombre_interno_es };
              if(rowData.nombre_interno_en) updatePayload.name = { ...(updatePayload.name || existingProduct.name), en: rowData.nombre_interno_en };
              if(rowData.categoria_es) updatePayload.category = { ...existingProduct.category, es: rowData.categoria_es };
              if(rowData.categoria_en) updatePayload.category = { ...(updatePayload.category || existingProduct.category), en: rowData.categoria_en };
              if(rowData.subcategoria_es !== undefined || rowData.subcategoria_en !== undefined) {
                updatePayload.subcategory = {
                  es: rowData.subcategoria_es !== undefined ? rowData.subcategoria_es : (existingProduct.subcategory?.es || ''),
                  en: rowData.subcategoria_en !== undefined ? rowData.subcategoria_en : (existingProduct.subcategory?.en || '')
                };
              }
              if(rowData.unidad_es) updatePayload.unit = { ...existingProduct.unit, es: rowData.unidad_es };
              if(rowData.unidad_en) updatePayload.unit = { ...(updatePayload.unit || existingProduct.unit), en: rowData.unidad_en };
              if(precio_venta !== null) updatePayload.salePrice = precio_venta;
              if(rowData.stock_actual !== undefined) updatePayload.stock = parseInt(rowData.stock_actual) || 0;
              if(rowData.stock_minimo !== undefined) updatePayload.minStock = parseInt(rowData.stock_minimo) || 0;
              if(rowData.es_caja !== undefined) updatePayload.isBox = rowData.es_caja.toUpperCase() === 'VERDADERO';
              updatePayload.photoUrl = rowData.foto_url || ''; // Always update, even if empty
              updatePayload.pricingMethod = pricingMethod;
              updatePayload.calculationDirection = calculationDirection;

              const suppliers = [...existingProduct.suppliers];
              let supplierEntry = suppliers.find(s => s.supplierId === supplierId);

              if (supplierEntry) {
                if (costo_proveedor !== null) supplierEntry.cost = costo_proveedor;
                if (rowData.nombre_producto_proveedor) supplierEntry.supplierProductName = rowData.nombre_producto_proveedor;
              } else {
                suppliers.push({ supplierId, cost: costo_proveedor ?? 0, isPrimary: suppliers.length === 0, supplierProductName: rowData.nombre_producto_proveedor ?? '' });
              }
              updatePayload.suppliers = suppliers;
              
              await updateProduct(existingProduct.id, updatePayload);
              updatedCount++;

            } else {
              // CREATE logic
              const createPayload: ProductInput = {
                sku,
                organizationId: activeOrgId,
                name: { es: rowData.nombre_interno_es || '', en: rowData.nombre_interno_en || '' },
                category: { es: rowData.categoria_es || '', en: rowData.categoria_en || '' },
                subcategory: { es: rowData.subcategoria_es || '', en: rowData.subcategoria_en || '' },
                unit: { es: rowData.unidad_es || '', en: rowData.unidad_en || '' },
                salePrice: precio_venta ?? 0,
                stock: parseInt(rowData.stock_actual) || 0,
                minStock: parseInt(rowData.stock_minimo) || 10,
                active: true,
                isBox: rowData.es_caja?.toUpperCase() === 'VERDADERO',
                suppliers: [{ supplierId, cost: costo_proveedor ?? 0, isPrimary: true, supplierProductName: rowData.nombre_producto_proveedor || '' }],
                photoUrl: rowData.foto_url || '',
                pricingMethod: pricingMethod,
                calculationDirection: calculationDirection,
              };

              if (!createPayload.name.es || !createPayload.category.es || !createPayload.unit.es || createPayload.salePrice <= 0) {
                console.warn(`Omitiendo creación para SKU ${sku} por falta de datos esenciales.`);
                continue;
              }

              await addProduct(createPayload);
              createdCount++;
            }
          } catch(e: any) {
             console.error(`Fallo al procesar fila: ${JSON.stringify(rowData)}`, e);
          }
        }

        toast({
          title: "Importación Completada",
          description: `${createdCount} productos creados y ${updatedCount} actualizados.`,
        });

        setIsProcessing(false);
        onOpenChange(false);
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        toast({ variant: 'destructive', title: 'Error de Lectura de CSV', description: error.message });
        setIsProcessing(false);
      }
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
          <Button onClick={handleImport} disabled={!selectedFile || isProcessing || !activeOrgId}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('import_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
