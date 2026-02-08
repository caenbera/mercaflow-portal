
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
import type { ProspectInput } from '@/types';

interface ProspectImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CSV_TEMPLATE_HEADERS = [
  'name', 'address', 'city', 'state', 'zip', 'lat', 'lng', 'phone', 'web', 'category', 'ethnic', 'zone', 'status', 'priority', 'notes'
];

const CATEGORY_OPTIONS = ['Restaurante', 'Supermercado', 'Carnicería', 'Otro'];
const ETHNIC_OPTIONS = ['mexicano', 'peruano', 'colombiano', 'ecuatoriano', 'venezolano', 'salvadoreno', 'guatemalteco', 'otro'];
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
    if (!selectedFile || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'File or user not found.'});
      return;
    };
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
              console.warn('Skipping row due to missing required fields:', rowData);
              errorCount++;
              continue;
            }

            let lat: number | null = null;
            let lng: number | null = null;

            if (rowData.lat && rowData.lng && !isNaN(parseFloat(rowData.lat)) && !isNaN(parseFloat(rowData.lng))) {
              lat = parseFloat(rowData.lat);
              lng = parseFloat(rowData.lng);
            } else {
              const fullAddress = `${rowData.address}, ${rowData.city}, ${rowData.state || 'IL'}`;
              const encodedAddress = encodeURIComponent(fullAddress);
              const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

              if (apiKey) {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`);
                const geoData = await response.json();
                if (geoData.status === 'OK' && geoData.results.length > 0) {
                  const location = geoData.results[0].geometry.location;
                  lat = location.lat;
                  lng = location.lng;
                } else {
                  console.warn(`Geocoding failed for: ${fullAddress}. Status: ${geoData.status}`);
                }
                await new Promise(resolve => setTimeout(resolve, 50)); 
              }
            }
            
            let zone = rowData.zone || '';
            if (lat && lng) {
                const calculatedZone = getZoneFromCoordinates(lat, lng);
                if (calculatedZone) {
                    zone = calculatedZone;
                }
            }
            
            // Fallback to assign a general zone based on state if zoning fails
            if (!zone && rowData.state) {
              const state = String(rowData.state).toUpperCase().trim();
              if (state === 'IL' || state === 'ILLINOIS') zone = 'CHI';
              else if (state === 'WI' || state === 'WISCONSIN') zone = 'WI';
              else if (state === 'IN' || state === 'INDIANA') zone = 'IN';
            }

            const prospectData: Partial<ProspectInput> = {
              name: rowData.name,
              address: rowData.address,
              city: rowData.city,
              state: rowData.state || 'Illinois',
              zip: rowData.zip || '',
              lat: lat,
              lng: lng,
              phone: rowData.phone || '',
              web: rowData.web || '',
              category: CATEGORY_OPTIONS.includes(rowData.category) ? rowData.category : 'Otro',
              ethnic: ETHNIC_OPTIONS.includes(rowData.ethnic?.toLowerCase()) ? rowData.ethnic.toLowerCase() : 'otro',
              zone: zone,
              status: STATUS_OPTIONS.includes(rowData.status?.toLowerCase()) ? rowData.status.toLowerCase() : 'pending',
              priority: rowData.priority?.toUpperCase() === 'TRUE' || rowData.priority?.toUpperCase() === 'VERDADERO',
              notes: rowData.notes || '',
              salespersonId: user.uid,
            };

            const existingProspect = await findProspectByNameAndCity(rowData.name, rowData.city);

            if (existingProspect) {
              await updateProspect(existingProspect.id, prospectData);
              updatedCount++;
            } else {
              await addProspect(prospectData as ProspectInput);
              createdCount++;
            }

          } catch (e: any) {
            errorCount++;
            console.error(`Failed to process row: ${JSON.stringify(rowData)}`, e);
          }
        }

        toast({
          title: "Import Complete",
          description: `${createdCount} created, ${updatedCount} updated. ${errorCount > 0 ? `${errorCount} rows failed.` : ''}`,
        });

        setIsProcessing(false);
        setSelectedFile(null);
        onOpenChange(false);
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        toast({ variant: 'destructive', title: 'CSV Parsing Error', description: error.message });
        setIsProcessing(false);
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
                <div>
                    <h4 className="font-semibold text-sm mb-2">{t('import_step1_title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('import_step1_desc')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4"/>
                    {t('download_template_button')}
                </Button>
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
