'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useProspects } from '@/hooks/use-prospects';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';

import { DrilldownFilters } from '@/components/admin/sales/DrilldownFilters'; // NEW
import { TabNavigation } from '@/components/admin/sales/TabNavigation';
import { MapView } from '@/components/admin/sales/map-view';
import { ProspectCard } from '@/components/admin/sales/prospect-card';
import { SalesStatsView } from '@/components/admin/sales/SalesStatsView';
import { Loader2, Plus, Upload, Route, Trash, Check, X, Wand } from 'lucide-react';
import { ProspectDialog } from '@/components/admin/sales/prospect-dialog';
import { ProspectDetailsDialog } from '@/components/admin/sales/prospect-details-dialog';
import { ProspectImportDialog } from '@/components/admin/sales/prospect-import-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DistrictCard } from '@/components/admin/sales/district-card';
import type { Prospect } from '@/types';
import { SalesDashboard } from '@/components/admin/sales/SalesDashboard';
import { SmartCluster } from '@/components/admin/sales/SmartCluster';
import { useToast } from '@/hooks/use-toast';
import { RouteOptionsDialog } from '@/components/admin/sales/RouteOptionsDialog';
import { BottomActions } from '@/components/admin/sales/BottomActions';

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

  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState<Selections>({}); // NEW STATE FOR FILTERS

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
    return prospects.filter(p => {
        if (filters.state && p.state !== filters.state) return false;
        if (filters.city && p.city !== filters.city) return false;
        if (filters.category && p.category !== filters.category) return false;
        if (filters.ethnic && p.ethnic !== filters.ethnic) return false;
        return true;
    });
  }, [prospects, filters, loading]);

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
              .map(districtCode => (
                <DistrictCard
                  key={districtCode}
                  districtCode={districtCode}
                  districtName={groupedByDistrict[districtCode][0]?.city || districtCode} // Approximation
                  prospects={groupedByDistrict[districtCode]}
                  selectedProspects={selectedProspects}
                  onBulkSelect={handleBulkSelect}
                />
            ))}
          </div>
        );
      case 'map':
        return (
          <MapView 
            prospects={filteredProspects}
            selectedProspects={selectedProspects}
            onToggleSelection={(id) => {
              const isSelected = selectedProspects.includes(id);
              handleSelectionChange(id, !isSelected);
            }}
          />
        );
      case 'list':
        return (
          <div className="space-y-3">
            {filteredProspects.map(prospect => (
              <ProspectCard 
                key={prospect.id}
                prospect={prospect}
                onEdit={handleEditProspect}
                onCheckIn={handleCheckIn}
                isSelectionMode={isSelectionMode}
                isSelected={selectedProspects.includes(prospect.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>
        );
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
      />
      
      <div className="min-h-screen">
        
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
          <DrilldownFilters prospects={prospects} onFilterChange={setFilters} />
          <div className="bg-white border-b">
            <div className="md:hidden">
              <div className="p-1">
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
              <div className="flex items-center gap-1 p-1 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)} className="flex-1 whitespace-normal text-center h-auto py-2">
                  <Upload className="h-4 w-4 mr-2"/>
                  {t('import_button')}
                </Button>
                <Button size="sm" onClick={() => handleEditProspect(null)} className="flex-1 whitespace-normal text-center h-auto py-2">
                  <Plus className="h-4 w-4 mr-2"/>
                  {t('new_prospect_button')}
                </Button>
              </div>
            </div>

            <div className="hidden md:flex md:justify-between md:items-center md:px-4 md:py-1">
              <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2"/>
                    {t('import_button')}
                  </Button>
                  <Button size="sm" onClick={() => handleEditProspect(null)}>
                    <Plus className="h-4 w-4 mr-2"/>
                    {t('new_prospect_button')}
                  </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 pb-48">
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
            onClear={() => setSelectedProspects([])}
            onGenerate={() => setIsRouteOptionsOpen(true)}
            onRemove={(id) => handleSelectionChange(id, false)}
          />
        )}
      </div>
    </>
  );
}
