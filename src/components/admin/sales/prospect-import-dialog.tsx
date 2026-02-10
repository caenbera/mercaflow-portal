'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { addProspect, updateProspect, findProspectByNameAndCity } from '@/lib/firestore/prospects';
import { Download, Upload, FileText, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { getZoneFromCoordinates } from '@/lib/zoning';
import type { Prospect } from '@/types';
interface ProspectImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CSV_TEMPLATE_HEADERS = [
  'name', 'address', 'city', 'state', 'zip', 'lat', 'lng', 'phone', 'web', 'category', 'ethnic', 'zone', 'status', 'priority', 'notes'
];

const CATEGORY_OPTIONS = ['Restaurante', 'Supermercado', 'Carnicería', 'Distribuidor Mayorista', 'Otro'];
const ETHNIC_OPTIONS = ['mexicano', 'peruano', 'colombiano', 'ecuatoriano', 'venezolano', 'salvadoreno', 'guatemalteco', 'dominicano', 'africano', 'caribeño', 'internacional', 'otro'];
const STATUS_OPTIONS = ['pending', 'contacted', 'visited', 'client', 'not_interested'];

export function ProspectImportDialog({ open, onOpenChange }: ProspectImportDialogProps) {
  const t = useTranslations('AdminSalesPage');
  const { toast } = useToast();
  const { user } = useAuth();
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
      link.setAttribute('download', 'plantilla_prospectos.csv');
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!selectedFile || !user) return;
    setIsProcessing(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        for (const rowData of data) {
          try {
            if (!rowData.name || !rowData.address || !rowData.city) {
              errorCount++;
              continue;
            }

            let lat = parseFloat(rowData.lat);
            let lng = parseFloat(rowData.lng);
            
            // Asignación de Zona automática
            let finalZone = rowData.zone || '';
            if (!isNaN(lat) && !isNaN(lng)) {
                const calculatedZone = getZoneFromCoordinates(lat, lng);
                if (calculatedZone) {
                    finalZone = calculatedZone;
                }
            }
            
            // Fallback si la zona no tiene el formato ZONA-SUBZONA (ej: "CHI-PIL") le ponemos "-01"
            if (finalZone && !finalZone.includes('-', finalZone.indexOf('-') + 1)) {
              finalZone = `${finalZone}-01`;
            }

            const prospectData: Partial<Prospect> = {
              name: rowData.name,
              address: rowData.address,
              city: rowData.city,
              state: rowData.state || 'IL',
              zip: rowData.zip || '',
              lat: isNaN(lat) ? null : lat,
              lng: isNaN(lng) ? null : lng,
              phone: rowData.phone || '',
              web: rowData.web || '',
              category: CATEGORY_OPTIONS.includes(rowData.category) ? rowData.category : 'Otro',
              ethnic: ETHNIC_OPTIONS.includes(rowData.ethnic?.toLowerCase()) ? rowData.ethnic.toLowerCase() : 'otro',
              zone: finalZone,
              status: STATUS_OPTIONS.includes(rowData.status?.toLowerCase()) ? rowData.status.toLowerCase() : 'pending',
              priority: rowData.priority?.toUpperCase() === 'HIGH' || rowData.priority?.toUpperCase() === 'TRUE',
              notes: rowData.notes || '',
              salespersonId: user.uid,
            };

            const existingProspect = await findProspectByNameAndCity(rowData.name, rowData.city);

            if (existingProspect) {
              await updateProspect(existingProspect.id, prospectData);
              updatedCount++;
            } else {
              await addProspect(prospectData as Prospect);
              createdCount++;
            }

          } catch (e) {
            errorCount++;
            console.error(e);
          }
        }

        toast({
          title: "Import Complete",
          description: `${createdCount} created, ${updatedCount} updated. ${errorCount > 0 ? `${errorCount} errors.` : ''}`,
        });

        setIsProcessing(false);
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('import_dialog_title')}</DialogTitle>
          <DialogDescription>{t('import_dialog_desc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
            <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4"/>
                    {t('download_template_button')}
                </Button>
            </div>
             <div className="p-4 rounded-lg border bg-muted/50">
                 <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileChange} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/>
                    {t('upload_file_button')}
                </Button>
                {selectedFile && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-md border">
                        <FileText className="h-4 w-4 text-primary"/>
                        <span>{selectedFile.name}</span>
                    </div>
                )}
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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