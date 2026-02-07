
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useProspects } from '@/hooks/use-prospects';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  CheckCircle,
  TrendingUp,
  Plus,
  Upload,
  Map,
  List,
  Route
} from 'lucide-react';
import type { Prospect } from '@/types';
import { Button } from '@/components/ui/button';
import { ProspectDialog } from '@/components/admin/sales/prospect-dialog';
import { ProspectDetailsDialog } from '@/components/admin/sales/prospect-details-dialog';
import { ProspectImportDialog } from '@/components/admin/sales/prospect-import-dialog';
import { useToast } from '@/hooks/use-toast';
import { DistrictCard } from '@/components/admin/sales/district-card';
import { ProspectCard } from '@/components/admin/sales/prospect-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoneFilterBar } from '@/components/admin/sales/zone-filter-bar';
import dynamic from 'next/dynamic';

const KpiCard = ({ title, value, icon: Icon, loading }: { title: string, value: string | number, icon: React.ElementType, loading: boolean }) => (
    <div className="bg-primary/90 text-white border-white/20 p-3 rounded-lg shadow-lg">
        <div className="text-sm font-bold uppercase flex items-center gap-2 opacity-80"><Icon className="h-4 w-4"/>{title}</div>
        <div className="text-2xl font-bold mt-1">{loading ? <Skeleton className="h-7 w-16 bg-white/20"/> : value}</div>
    </div>
);

const DynamicMapView = dynamic(
  () => import('@/components/admin/sales/map-view').then(mod => mod.MapView),
  {
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
    ssr: false
  }
);


export default function SalesPage() {
  const t = useTranslations('AdminSalesPage');
  const { prospects, loading, error } = useProspects();
  const { role } = useAuth();
  const { toast } = useToast();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [detailsProspect, setDetailsProspect] = useState<Prospect | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  
  const [selectedZone, setSelectedZone] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [proximityRadius, setProximityRadius] = useState(2);
  const [activeTab, setActiveTab] = useState('districts');

  const kpis = useMemo(() => {
    if (loading) return { total: 0, visited: 0, conversion: 0 };
    const visitedToday = prospects.filter(p => p.status === 'visited' || p.status === 'client').length;
    const clients = prospects.filter(p => p.status === 'client').length;
    const conversionRate = prospects.length > 0 ? ((clients / prospects.length) * 100) : 0;
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

  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      const zoneConfigs: Record<string, (prospect: Prospect) => boolean> = {
        'all': () => true,
        'CHI-C': (p) => { const zone = p.zone?.toUpperCase() || ''; return zone.startsWith('CHI-') && ['LP', 'WN', 'RP', 'NP'].some(d => zone.includes(d)); },
        'CHI-S': (p) => { const zone = p.zone?.toUpperCase() || ''; return zone.startsWith('CHI-') && ['PIL', 'LV', 'BP', 'CK'].some(d => zone.includes(d)); },
        'CHI-W': (p) => { const zone = p.zone?.toUpperCase() || ''; return zone.startsWith('CHI-') && ['AP', 'IP', 'HP', 'AC'].some(d => zone.includes(d)); },
        'WI': (p) => (p.zone?.toUpperCase() || '').startsWith('WI-') || p.state?.toUpperCase() === 'WI',
        'IN': (p) => (p.zone?.toUpperCase() || '').startsWith('IN-') || p.state?.toUpperCase() === 'IN',
      };
      const matchesZone = (zoneConfigs[selectedZone] || zoneConfigs['all'])(p);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchLower) || p.address.toLowerCase().includes(searchLower) || (p.zone || '').toLowerCase().includes(searchLower);
      return matchesZone && matchesSearch;
    });
  }, [prospects, selectedZone, searchTerm]);

  const prospectsByDistrict = useMemo(() => {
    return filteredProspects.reduce((acc, prospect) => {
      const districtCode = prospect.zone?.split('-').slice(0, 2).join('-') || 'Unzoned';
      if (!acc[districtCode]) {
        acc[districtCode] = { name: districtNames[districtCode] || districtCode, prospects: [] };
      }
      acc[districtCode].prospects.push(prospect);
      return acc;
    }, {} as Record<string, { name: string; prospects: Prospect[] }>);
  }, [filteredProspects, districtNames]);

  const handleEditProspect = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setIsFormDialogOpen(true);
  };
  
  const handleCheckIn = (prospect: Prospect) => {
    setDetailsProspect(prospect);
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
    setSelectedProspects(prev => isSelected ? [...prev, prospectId] : prev.filter(id => id !== prospectId));
  };
  
  const handleBulkSelect = (prospectIds: string[], select: boolean) => {
    setSelectedProspects(prev => {
      const newSelected = new Set(prev);
      prospectIds.forEach(id => select ? newSelected.add(id) : newSelected.delete(id));
      return Array.from(newSelected);
    });
  };

  const handleCreateRoute = () => {
    const selected = prospects.filter(p => selectedProspects.includes(p.id) && p.address);
    if (selected.length === 0) {
      toast({ variant: 'destructive', title: t('toast_no_address_title'), description: t('toast_no_address_desc') });
      return;
    }
    const baseUrl = 'https://www.google.com/maps/dir/';
    const addresses = selected.map(p => encodeURIComponent(p.address)).join('/');
    window.open(`${baseUrl}${addresses}`, '_blank');
  };

  return (
    <>
      <ProspectDialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen} prospect={selectedProspect} />
      <ProspectDetailsDialog open={!!detailsProspect} onOpenChange={(open) => !open && setDetailsProspect(null)} prospect={detailsProspect} />
      <ProspectImportDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} />

      <div className="flex flex-col h-full bg-slate-50/50">
        <div className="p-4 bg-background border-b">
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
             <KpiCard title={t('kpi_total')} value={kpis.total} icon={Users} loading={loading}/>
             <KpiCard title={t('kpi_visited')} value={kpis.visited} icon={CheckCircle} loading={loading}/>
             <KpiCard title={t('kpi_conversion')} value={`${kpis.conversion}%`} icon={TrendingUp} loading={loading}/>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <div className="p-4 bg-background border-b space-y-4">
            <ZoneFilterBar
              prospects={prospects}
              selectedZone={selectedZone}
              onZoneChange={setSelectedZone}
              proximityRadius={proximityRadius}
              onRadiusChange={setProximityRadius}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="districts">
                <Users className="md:mr-2"/> 
                <span className="hidden md:inline">{t('tab_districts')}</span>
              </TabsTrigger>
              <TabsTrigger value="map">
                <Map className="md:mr-2"/> 
                <span className="hidden md:inline">{t('tab_map')}</span>
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="md:mr-2"/> 
                <span className="hidden md:inline">{t('tab_list')}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-4 flex-grow">
            <TabsContent value="districts" className="mt-0">
              <div className="space-y-4">
                {loading ? (
                  <Skeleton className="h-40 w-full rounded-xl"/>
                ) : error ? (
                  <div className="text-center py-10 text-destructive">{t('error_loading')}</div>
                ) : Object.keys(prospectsByDistrict).length > 0 ? (
                  Object.entries(prospectsByDistrict).map(([districtCode, { name, prospects: districtProspects }]) => (
                    <DistrictCard
                      key={districtCode}
                      districtCode={districtCode}
                      districtName={name}
                      prospects={districtProspects}
                      selectedProspects={selectedProspects}
                      onBulkSelect={handleBulkSelect}
                      proximityRadius={proximityRadius}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No se encontraron prospectos para los filtros seleccionados
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="map" forceMount={true} className="mt-0 h-full data-[state=inactive]:hidden">
               <DynamicMapView 
                    prospects={filteredProspects}
                    selectedProspects={selectedProspects}
                    onToggleSelection={handleProspectSelectionChange}
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
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm px-4">
                <Button
                    size="lg"
                    className="w-full shadow-lg"
                    onClick={handleCreateRoute}
                >
                    <Route className="mr-2 h-5 w-5" />
                    {t('create_route_button', { count: selectedProspects.length })}
                </Button>
            </div>
        )}
      </div>
    </>
  );
}
