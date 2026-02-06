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
  Upload
} from 'lucide-react';
import { ProspectCard } from './prospect-card';
import type { Prospect } from '@/types';
import { Button } from '@/components/ui/button';
import { ProspectDialog } from './prospect-dialog';
import { ProspectImportDialog } from './prospect-import-dialog';

export function SalesPageClient() {
  const t = useTranslations('AdminSalesPage');
  const { prospects, loading, error } = useProspects();
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  const kpis = useMemo(() => {
    if (loading) return { total: 0, visited: 0, conversion: 0 };
    const visitedToday = prospects.filter(p => {
        // This is a simplification. A real app would check today's date.
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

  const filters = [
    { id: 'all', label: t('filter_all'), icon: <MapPin/> },
    { id: 'restaurante', label: t('filter_restaurants'), icon: <Utensils/> },
    { id: 'supermercado', label: t('filter_supermarkets'), icon: <Store/> },
    { id: 'carnicería', label: t('filter_butchers'), icon: <Drumstick/> },
  ];

  const handleOpenDialog = (prospect: Prospect | null) => {
    setSelectedProspect(prospect);
    setIsDialogOpen(true);
  };

  return (
    <>
    <ProspectDialog 
      open={isDialogOpen} 
      onOpenChange={setIsDialogOpen} 
      prospect={selectedProspect} 
    />
    <ProspectImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
    />
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">{t('title')}</h1>
           <div className="flex gap-2">
            {(role === 'admin' || role === 'superadmin') && (
              <Button variant="secondary" size="sm" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {t('import_button')}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => handleOpenDialog(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('new_prospect_button')}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-white/10 text-white border-white/20 p-2">
            <div className="text-xs font-bold uppercase flex items-center gap-1 opacity-80"><Users className="h-3 w-3"/>{t('kpi_total')}</div>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12 bg-white/20"/> : kpis.total}</div>
          </Card>
          <Card className="bg-white/10 text-white border-white/20 p-2">
            <div className="text-xs font-bold uppercase flex items-center gap-1 opacity-80"><CheckCircle className="h-3 w-3"/>{t('kpi_visited')}</div>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12 bg-white/20"/> : kpis.visited}</div>
          </Card>
          <Card className="bg-white/10 text-white border-white/20 p-2">
            <div className="text-xs font-bold uppercase flex items-center gap-1 opacity-80"><TrendingUp className="h-3 w-3"/>{t('kpi_conversion')}</div>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-12 bg-white/20"/> : `${kpis.conversion}%`}</div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-background border-b sticky top-[132px] z-10">
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
      
      {/* Prospect List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-40 w-full rounded-xl"/>
            <Skeleton className="h-40 w-full rounded-xl"/>
            <Skeleton className="h-40 w-full rounded-xl"/>
          </>
        ) : error ? (
            <div className="text-center py-10 text-destructive">{t('error_loading')}</div>
        ) : filteredProspects.length > 0 ? (
            filteredProspects.map(prospect => (
              <ProspectCard key={prospect.id} prospect={prospect} onEdit={handleOpenDialog} />
            ))
        ) : (
            <div className="text-center py-10 text-muted-foreground">{t('no_prospects_found')}</div>
        )}
      </div>
    </div>
    </>
  );
}
