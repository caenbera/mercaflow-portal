// src/app/[locale]/(main)/admin/sales/page.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useProspects } from '@/hooks/use-prospects';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from "@/components/ui/slider"
import {
    Users, Map, List, Plus, Upload, Crosshair, Search
} from 'lucide-react';
import { ProspectDialog } from '@/components/admin/sales/prospect-dialog';
import { ProspectImportDialog } from '@/components/admin/sales/prospect-import-dialog';
import { DistrictCard } from '@/components/admin/sales/district-card';
import { ProspectCard } from '@/components/admin/sales/prospect-card';
import type { Prospect } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updateProspect, addProspectVisit } from '@/lib/firestore/prospects';
import { MapView } from '@/components/admin/sales/map-view';


export default function SalesPage() {
  const t = useTranslations('AdminSalesPage');
  const { prospects, loading, error } = useProspects();
  const { role } = useAuth();
  const { toast } = useToast();
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  
  const [proximityRadius, setProximityRadius] = useState(5);
  // More state for proximity controls will be needed.

  const kpis = useMemo(() => {
    if (loading) return { total: 0, visited: 0, conversion: 0 };
    const visitedToday = prospects.filter(p => p.status === 'visited' || p.status === 'client').length;
    const clients = prospects.filter(p => p.status === 'client').length;
    const conversionRate = prospects.length > 0 ? (clients / prospects.length) * 100 : 0;
    return {
      total: prospects.length,
      visited: visitedToday,
      conversion: conversionRate.toFixed(0),
    };
  }, [prospects, loading]);

  const districtNames: Record<string, string> = {
    "CHI-PIL": t('district_name_pilsen'),
    "CHI-LV": t('district_name_little_village'),
    "CHI-AP": t('district_name_albany_park'),
    "Unzoned": t('uncategorized')
  };

  // This will be filtered by proximity later
  const filteredProspects = prospects; 

  const prospectsByDistrict = useMemo(() => {
    return filteredProspects.reduce((acc, prospect) => {
        const districtCode = prospect.zone?.split('-').slice(0, 2).join('-') || 'Unzoned';
        if (!acc[districtCode]) {
            acc[districtCode] = {
                name: districtNames[districtCode] || districtCode,
                prospects: []
            };
        }
        acc[districtCode].prospects.push(prospect);
        return acc;
    }, {} as Record<string, { name: string; prospects: Prospect[] }>);
  }, [filteredProspects, t]);

  const handleEditProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsFormDialogOpen(true);
  };
  
  const handleCheckIn = async (prospect: Prospect) => {
    try {
      await updateProspect(prospect.id, { status: 'visited' });
      await addProspectVisit(prospect.id, { notes: 'Check-in rápido realizado.', outcome: 'follow-up' });
      toast({ title: "Check-in realizado", description: `Visita registrada para ${prospect.name}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar la visita.'})
    }
  };

  const handleNewProspect = () => {
    setSelectedProspect(null);
    setIsFormDialogOpen(true);
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedProspects([]);
  };

  const handleProspectSelectionChange = (prospectId: string, isSelected: boolean) => {
    setSelectedProspects(prev => {
      if (isSelected) {
        return [...prev, prospectId];
      } else {
        return prev.filter(id => id !== prospectId);
      }
    });
  };
  
  const handleBulkSelect = (prospectIds: string[], select: boolean) => {
    setSelectedProspects(prev => {
      const newSelected = new Set(prev);
      if (select) {
        prospectIds.forEach(id => newSelected.add(id));
      } else {
        prospectIds.forEach(id => newSelected.delete(id));
      }
      return Array.from(newSelected);
    });
  };

  const handleCreateRoute = () => {
    const selected = prospects.filter(p => selectedProspects.includes(p.id) && p.address);
    if (selected.length === 0) {
      toast({
        variant: 'destructive',
        title: t('toast_no_address_title'),
        description: t('toast_no_address_desc'),
      });
      return;
    }

    const baseUrl = 'https://www.google.com/maps/dir/';
    const addresses = selected.map(p => encodeURIComponent(p.address)).join('/');
    const url = `${baseUrl}${addresses}`;
    
    window.open(url, '_blank');
  };

  return (
    <>
      <ProspectDialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen} prospect={selectedProspect} />
      <ProspectImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />

      <div className="flex flex-col h-full bg-slate-50/50">
        
        {/* Header */}
        <div className="p-4 sticky top-0 z-20 bg-background border-b">
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <div className="flex gap-2 flex-wrap items-center">
                  <Button variant="outline" size="sm" onClick={handleToggleSelectionMode}>
                      {isSelectionMode ? t('cancel_selection') : t('select_for_route')}
                  </Button>
                {(role === 'admin' || role === 'superadmin') && (
                  <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('import_button')}
                  </Button>
                )}
                <Button size="sm" onClick={handleNewProspect}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('new_prospect_button')}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-muted p-2 rounded-lg">
                    <div className="font-bold text-lg">{loading ? <Skeleton className="h-6 w-10 mx-auto bg-gray-300"/> : kpis.total}</div>
                    <div className="text-muted-foreground">{t('kpi_total')}</div>
                </div>
                <div className="bg-muted p-2 rounded-lg">
                    <div className="font-bold text-lg">{loading ? <Skeleton className="h-6 w-10 mx-auto bg-gray-300"/> : kpis.visited}</div>
                    <div className="text-muted-foreground">{t('kpi_visited')}</div>
                </div>
                <div className="bg-muted p-2 rounded-lg">
                    <div className="font-bold text-lg">{loading ? <Skeleton className="h-6 w-10 mx-auto bg-gray-300"/> : `${kpis.conversion}%`}</div>
                    <div className="text-muted-foreground">{t('kpi_conversion')}</div>
                </div>
            </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="districts" className="flex-grow flex flex-col">
            {/* Proximity and Tabs Header */}
            <div className="p-4 bg-background border-b sticky top-[214px] md:top-[160px] z-10">
              <div className="mb-4 space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">{t('proximity_from')}</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input placeholder={t('search_address')} className="pl-10" />
                  </div>
                  <Button variant="outline" size="icon"><Crosshair/></Button>
                </div>
                 <div className="flex items-center gap-2 pt-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t('radius')}:</label>
                    <Slider defaultValue={[proximityRadius]} max={10} step={0.5} onValueChange={(v) => setProximityRadius(v[0])}/>
                    <span className="text-sm font-semibold w-20 text-right">{proximityRadius} km</span>
                </div>
              </div>
              
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="districts"><Users className="md:mr-2"/> <span className="hidden md:inline">{t('tab_districts')}</span></TabsTrigger>
                <TabsTrigger value="map"><Map className="md:mr-2"/> <span className="hidden md:inline">{t('tab_map')}</span></TabsTrigger>
                <TabsTrigger value="list"><List className="md:mr-2"/> <span className="hidden md:inline">{t('tab_list')}</span></TabsTrigger>
              </TabsList>
            </div>
            
            {/* Tabs Content */}
            <div className="p-4 flex-grow">
                <TabsContent value="districts">
                  <div className="space-y-4">
                    {loading ? <Skeleton className="h-40 w-full rounded-xl"/> : error ? (
                        <div className="text-center py-10 text-destructive">{t('error_loading')}</div>
                    ) : Object.keys(prospectsByDistrict).length > 0 ? (
                      Object.entries(prospectsByDistrict).map(([districtCode, { name, prospects: districtProspects }]) => (
                        <DistrictCard
                            key={districtCode}
                            districtCode={districtCode}
                            districtName={name}
                            prospects={districtProspects}
                            onEdit={handleEditProspect}
                            onCheckIn={handleCheckIn}
                            isSelectionMode={isSelectionMode}
                            selectedProspects={selectedProspects}
                            onSelectionChange={handleProspectSelectionChange}
                            onSelectAll={handleBulkSelect}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">{t('no_prospects_found')}</div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="map" className="h-full m-0">
                    <MapView 
                      prospects={filteredProspects}
                      selectedProspects={selectedProspects}
                      onToggleSelection={(id) => {
                        setSelectedProspects(prev => 
                          prev.includes(id) 
                            ? prev.filter(p => p !== id)
                            : [...prev, id]
                        );
                      }}
                      onCreateRoute={handleCreateRoute}
                    />
                </TabsContent>
                <TabsContent value="list" className="space-y-3">
                  {loading ? <Skeleton className="h-40 w-full rounded-xl"/> : filteredProspects.map(prospect => (
                      <ProspectCard key={prospect.id} prospect={prospect} onEdit={handleEditProspect} onCheckIn={handleCheckIn} isSelectionMode={isSelectionMode} isSelected={selectedProspects.includes(prospect.id)} onSelectionChange={handleProspectSelectionChange} />
                  ))}
                </TabsContent>
            </div>
        </Tabs>
        
        {isSelectionMode && selectedProspects.length > 0 && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4">
                <Button size="lg" className="w-full shadow-lg" onClick={handleCreateRoute}>
                <Map className="mr-2 h-5 w-5" />
                {t('create_route_button', { count: selectedProspects.length })}
                </Button>
            </div>
        )}
      </div>
    </>
  );
}
