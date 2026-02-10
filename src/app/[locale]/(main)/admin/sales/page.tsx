'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useProspects } from '@/hooks/use-prospects';
import { useAuth } from '@/context/auth-context';
import { districts } from '@/lib/district-config';
import { useTranslations } from 'next-intl';

import { SalesHeader } from '@/components/admin/sales/SalesHeader';
import { ZoneSelector } from '@/components/admin/sales/ZoneSelector';
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


export default function SalesPage() {
  const { prospects, loading } = useProspects();
  const { user } = useAuth();
  const t = useTranslations('AdminSalesPage');
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('list');
  const [selectedZone, setSelectedZone] = useState('all');
  
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
    if (selectedZone === 'all') return prospects;
    return prospects.filter(p => p.zone?.split('-')[0] === selectedZone);
  }, [prospects, selectedZone, loading]);

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

  const zoneConfigs = [
      { code: 'CHI', label: 'Chicago', icon: 'fas fa-city' },
      { code: 'WI', label: 'Wisconsin', icon: 'fas fa-cheese' },
      { code: 'IN', label: 'Indiana', icon: 'fas fa-flag-usa' },
  ];

  const zoneCounts = zoneConfigs.map(zone => ({
      ...zone,
      count: prospects.filter(p => p.zone?.split('-')[0] === zone.code).length
  }));

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
                  districtName={districts[districtCode]?.name || districtCode}
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
            onToggleSelection={handleSelectionChange}
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
        <SalesHeader user={user} />
        
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
          <ZoneSelector 
            zones={zoneCounts} 
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
          />
          <div className="flex justify-between items-center bg-white border-b px-2 md:px-4">
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex items-center gap-2 pr-2">
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

        <main className="p-4">
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
            count={selectedProspects.length}
            onClear={() => setSelectedProspects([])}
            onGenerate={() => setIsRouteOptionsOpen(true)}
          />
        )}
      </div>
    </>
  );
}
    
