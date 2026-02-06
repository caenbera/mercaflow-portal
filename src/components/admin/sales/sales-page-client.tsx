'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useProspects } from '@/hooks/use-prospects';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Users,
  CheckCircle,
  TrendingUp,
  Search,
  MapPin,
  Utensils,
  Store,
  Drumstick,
  Plus,
  Upload,
  Map
} from 'lucide-react';
import { ProspectCard } from './prospect-card';
import type { Prospect } from '@/types';
import { Button } from '@/components/ui/button';
import { ProspectDialog } from './prospect-dialog';
import { ProspectImportDialog } from './prospect-import-dialog';
import { updateProspect, addProspectVisit } from '@/lib/firestore/prospects';
import { useToast } from '@/hooks/use-toast';
import { DistrictCard } from './district-card';

export function SalesPageClient() {
  const t = useTranslations('AdminSalesPage');
  const { prospects, loading, error } = useProspects();
  const { role } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);

  const kpis = useMemo(() => {
    if (loading) return { total: 0, visited: 0, conversion: 0 };
    const visitedToday = prospects.filter(p => {
        return p.status === 'visited' || p.status === 'client';
    }).length;
    const clients = prospects.filter(p => p.status === 'client').length;
    const conversionRate = prospects.length > 0 ? (clients / prospects.length) * 100 : 0;
    return {
      total: prospects.length,
      visited: visitedToday,
      conversion: conversionRate.toFixed(0),
    };
  }, [prospects, loading]);

  const filteredProspects = useMemo(() => {
    return prospects.filter(prospect => {
      const matchesFilter = activeFilter === 'all' ||
                            (prospect.ethnic && prospect.ethnic.toLowerCase().includes(activeFilter)) ||
                            prospect.category.toLowerCase().includes(activeFilter);
      const matchesSearch = searchTerm === '' ||
                            prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            prospect.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (prospect.city && prospect.city.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [prospects, activeFilter, searchTerm]);

  const districtNames: Record<string, string> = {
    "CHI-PIL": t('district_name_pilsen'),
    "CHI-LV": t('district_name_little_village'),
    "CHI-AP": t('district_name_albany_park'),
    "Unzoned": t('uncategorized')
  };

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
  }, [filteredProspects]);

  const filters = [
    { id: 'all', label: t('filter_all'), icon: <MapPin/> },
    { id: 'restaurante', label: t('filter_restaurants'), icon: <Utensils/> },
    { id: 'supermercado', label: t('filter_supermarkets'), icon: <Store/> },
    { id: 'carnicería', label: t('filter_butchers'), icon: <Drumstick/> },
  ];

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
  
  const handleSelectAllInDistrict = (prospectIds: string[], select: boolean) => {
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
      <ProspectDialog 
        open={isFormDialogOpen} 
        onOpenChange={setIsFormDialogOpen} 
        prospect={selectedProspect} 
      />
      <ProspectImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
      />

      <div className="flex flex-col h-full bg-slate-50/50">
        <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-20">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-4">
            <h1 className="text-xl font-bold">{t('title')}</h1>
             <div className="flex gap-2 flex-wrap items-center">
                <Button variant="secondary" size="sm" onClick={handleToggleSelectionMode}>
                    {isSelectionMode ? t('cancel_selection') : t('select_for_route')}
                </Button>
              {(role === 'admin' || role === 'superadmin') && (
                <Button variant="secondary" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('import_button')}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handleNewProspect}>
                <Plus className="mr-2 h-4 w-4" />
                {t('new_prospect_button')}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
             <Card className="bg-white/10 text-white border-white/20 p-2">
              <div className="text-[10px] md:text-xs font-bold uppercase flex items-center gap-1 opacity-80"><Users className="h-3 w-3"/>{t('kpi_total')}</div>
              <div className="text-xl md:text-2xl font-bold">{loading ? <Skeleton className="h-6 md:h-7 w-12 bg-white/20"/> : kpis.total}</div>
            </Card>
            <Card className="bg-white/10 text-white border-white/20 p-2">
               <div className="text-[10px] md:text-xs font-bold uppercase flex items-center gap-1 opacity-80"><CheckCircle className="h-3 w-3"/>{t('kpi_visited')}</div>
               <div className="text-xl md:text-2xl font-bold">{loading ? <Skeleton className="h-6 md:h-7 w-12 bg-white/20"/> : kpis.visited}</div>
            </Card>
            <Card className="bg-white/10 text-white border-white/20 p-2">
                <div className="text-[10px] md:text-xs font-bold uppercase flex items-center gap-1 opacity-80"><TrendingUp className="h-3 w-3"/>{t('kpi_conversion')}</div>
                <div className="text-xl md:text-2xl font-bold">{loading ? <Skeleton className="h-6 md:h-7 w-12 bg-white/20"/> : `${kpis.conversion}%`}</div>
            </Card>
          </div>
        </div>

        <div className="p-4 bg-background border-b sticky top-[178px] md:top-[132px] z-10">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('search_placeholder')} 
              className="pl-10" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {filters.map(filter => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter.id)}
                className="rounded-full shrink-0"
              >
                {filter.icon} {filter.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-40 w-full rounded-xl"/>
              <Skeleton className="h-28 w-full rounded-xl"/>
              <Skeleton className="h-28 w-full rounded-xl"/>
            </>
          ) : error ? (
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
                    onSelectAll={handleSelectAllInDistrict}
                />
            ))
          ) : (
              <div className="text-center py-10 text-muted-foreground">{t('no_prospects_found')}</div>
          )}
        </div>

         {isSelectionMode && selectedProspects.length > 0 && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4">
                <Button
                size="lg"
                className="w-full shadow-lg"
                onClick={handleCreateRoute}
                >
                <Map className="mr-2 h-5 w-5" />
                {t('create_route_button', { count: selectedProspects.length })}
                </Button>
            </div>
        )}
      </div>
    </>
  );
}
