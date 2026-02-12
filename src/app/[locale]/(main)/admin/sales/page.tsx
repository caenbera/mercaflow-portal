'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useProspects } from '@/hooks/use-prospects';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';

import { DrilldownFilters } from '@/components/admin/sales/DrilldownFilters';
import { TabNavigation } from '@/components/admin/sales/TabNavigation';
import { MapView } from '@/components/admin/sales/map-view';
import { ProspectCard } from '@/components/admin/sales/prospect-card';
import { SalesStatsView } from '@/components/admin/sales/SalesStatsView';
import { Loader2, Plus, Upload, Route, Trash, Check, X, Wand, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProspectDialog } from '@/components/admin/sales/prospect-dialog';
import { ProspectDetailsDialog } from '@/components/admin/sales/prospect-details-dialog';
import { ProspectImportDialog } from '@/components/admin/sales/prospect-import-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DistrictCard } from '@/components/admin/sales/district-card';
import type { Prospect } from '@/types';
import { SalesDashboard } from '@/components/admin/sales/SalesDashboard';
import { SmartCluster } from '@/components/admin/sales/SmartCluster';
import { useToast } from '@/hooks/use-toast';
import { RouteOptionsDialog } from '@/components/admin/sales/RouteOptionsDialog';
import { BottomActions } from '@/components/admin/sales/BottomActions';
import { districts } from '@/lib/district-config';

type Selections = {
  state?: string;
  city?: string;
  category?: string;
  ethnic?: string;
};

export default function SalesPage() {
  const { prospects, loading } = useProspects();
  const { user } = useAuth();
  const t = useTranslations('AdminSalesPage');
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('districts');
  const [filters, setFilters] = useState<Selections>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  
  const [prospectToEdit, setProspectToEdit] = useState<Prospect | null>(null);
  const [prospectForVisit, setProspectForVisit] = useState<Prospect | null>(null);

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isRouteOptionsOpen, setIsRouteOptionsOpen] = useState(false);
  
  const handleEditProspect = (prospect: Prospect | null) => {
    setProspectToEdit(prospect);
  };
  
  const handleCheckIn = (prospect: Prospect) => {
    setProspectForVisit(prospect);
  };

  const handleSelectionChange = (prospectId: string, isSelected: boolean) => {
    setSelectedProspects(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(prospectId);
      } else {
        newSet.delete(prospectId);
      }
      return Array.from(newSet);
    });
  };

  const handleBulkSelect = (prospectIds: string[], select: boolean) => {
    setSelectedProspects(prev => {
      const newSet = new Set(prev);
      if (select) {
        prospectIds.forEach(id => newSet.add(id));
      } else {
        prospectIds.forEach(id => newSet.delete(id));
      }
      return Array.from(newSet);
    });
  };

  const filteredProspects = useMemo(() => {
    if (loading) return [];
    let initialProspects = prospects.filter(p => {
        if (filters.state && p.state !== filters.state) return false;
        if (filters.city && p.city !== filters.city) return false;
        if (filters.category && p.category !== filters.category) return false;
        if (filters.ethnic && p.ethnic !== filters.ethnic) return false;
        return true;
    });

    if (!searchTerm) {
        return initialProspects;
    }
    
    const lowercasedTerm = searchTerm.toLowerCase();
    return initialProspects.filter(p => 
        p.name.toLowerCase().includes(lowercasedTerm) ||
        p.address.toLowerCase().includes(lowercasedTerm) ||
        (p.zone && p.zone.toLowerCase().includes(lowercasedTerm))
    );

  }, [prospects, filters, loading, searchTerm]);

  const groupedByDistrict = useMemo(() => {
    return filteredProspects.reduce((acc, prospect) => {
      const districtCode = prospect.zone?.split('-').slice(0, 2).join('-') || 'Uncategorized';
      if (!acc[districtCode]) {
        acc[districtCode] = [];
      }
      acc[districtCode].push(prospect);
      return acc;
    }, {} as Record<string, Prospect[]>);
  }, [filteredProspects]);

  const selectedProspectsData = useMemo(() => {
    return prospects.filter(p => selectedProspects.includes(p.id));
  }, [prospects, selectedProspects]);
  
  const clearSelection = useCallback(() => {
    setSelectedProspects([]);
    setIsSelectionMode(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'districts':
        return (
          <div className="space-y-4">
             <SalesDashboard />
              <SmartCluster onAcceptCluster={(codes) => {
                const prospectIds = prospects.filter(p => codes.includes(p.zone || '')).map(p => p.id);
                handleBulkSelect(prospectIds, true);
                setIsSelectionMode(true);
              }} />
            {Object.keys(groupedByDistrict)
              .filter(code => code !== 'Uncategorized')
              .map(districtCode => {
                const city = groupedByDistrict[districtCode][0]?.city || '';
                const districtConfig = districts[districtCode];
                const districtName = districtConfig?.name || districtCode;
                const fullDistrictName = city ? `${city} - ${districtName}` : districtName;

                return (
                  <DistrictCard
                    key={districtCode}
                    districtCode={districtCode}
                    districtName={fullDistrictName}
                    prospects={groupedByDistrict[districtCode]}
                    selectedProspects={selectedProspects}
                    onBulkSelect={handleBulkSelect}
                  />
                )
            })}
          </div>
        );
      case 'map':
        return <p>Map view coming soon!</p>
      case 'list': {
        const prospectList = (isSelectionMode && selectedProspects.length > 0)
          ? prospects.filter(p => selectedProspects.includes(p.id))
          : filteredProspects;

        return (
          <div>
            {isSelectionMode && selectedProspects.length > 0 ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Mostrando {selectedProspects.length} prospectos de tu ruta actual.
                </p>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Limpiar selección
                </Button>
              </div>
            ) : (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre, dirección, zona..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-3 w-full overflow-x-hidden">
              {prospectList.length > 0 ? prospectList.map(prospect => (
                <div className="w-full overflow-hidden" key={prospect.id}>
                  <ProspectCard 
                    prospect={prospect}
                    onEdit={handleEditProspect}
                    onCheckIn={handleCheckIn}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedProspects.includes(prospect.id)}
                    onSelectionChange={handleSelectionChange}
                  />
                </div>
              )) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No se encontraron prospectos.</p>
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'stats':
        return <SalesStatsView />;
      default:
        return null;
    }
  };

  return (
    <>
      <ProspectDialog
        open={!!prospectToEdit}
        onOpenChange={(isOpen) => !isOpen && setProspectToEdit(null)}
        prospect={prospectToEdit}
      />
      <ProspectDetailsDialog 
        prospect={prospectForVisit}
        open={!!prospectForVisit}
        onOpenChange={(isOpen) => !isOpen && setProspectForVisit(null)}
      />
      <ProspectImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
      <RouteOptionsDialog
        open={isRouteOptionsOpen}
        onOpenChange={setIsRouteOptionsOpen}
        selectedProspects={selectedProspectsData}
        onClear={clearSelection}
      />
      
      <div className="min-h-screen w-full overflow-x-hidden">
        
        <header className="sticky top-0 z-30 w-full overflow-x-hidden bg-background/95 backdrop-blur-sm">
          <DrilldownFilters prospects={prospects} onFilterChange={setFilters} />
          <div className="bg-white border-b">
            <div className="md:hidden">
              <div className="p-1">
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
              <div className="flex items-stretch gap-1 p-1 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsImportDialogOpen(true)} 
                  className="w-1/2 min-w-0 h-auto py-2 flex flex-col items-center justify-center text-xs"
                >
                  <Upload className="h-4 w-4 mb-0.5" />
                  <span className="text-center">{t('import_button')}</span>
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleEditProspect(null)} 
                  className="w-1/2 min-w-0 h-auto py-2 flex flex-col items-center justify-center text-xs"
                >
                  <Plus className="h-4 w-4 mb-0.5" />
                  <span className="text-center">{t('new_prospect_button')}</span>
                </Button>
              </div>
            </div>

            <div className="hidden md:flex md:justify-between md:items-center md:px-3 md:py-1">
              <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} className="text-sm">
                  <Upload className="h-4 w-4 mr-2"/>
                  {t('import_button')}
                </Button>
                <Button size="sm" onClick={() => handleEditProspect(null)} className="text-sm">
                  <Plus className="h-4 w-4 mr-2"/>
                  {t('new_prospect_button')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 pb-48 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="selection-mode" 
                checked={isSelectionMode}
                onCheckedChange={setIsSelectionMode}
              />
              <Label htmlFor="selection-mode" className="text-sm font-medium">
                {t('select_for_route')}
              </Label>
            </div>
          </div>
          
          {renderContent()}
        </main>
        
        {isSelectionMode && selectedProspects.length > 0 && (
           <BottomActions 
            prospects={selectedProspectsData}
            onClear={clearSelection}
            onGenerate={() => setIsRouteOptionsOpen(true)}
            onRemove={(id) => handleSelectionChange(id, false)}
          />
        )}
      </div>
    </>
  );
}
