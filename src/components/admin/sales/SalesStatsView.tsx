'use client';
import { useMemo } from 'react';
import { CalendarDays, Filter, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Prospect } from '@/types';
import { subDays, startOfDay, isAfter } from 'date-fns';

interface SalesStatsViewProps {
  prospects: Prospect[];
}

export function SalesStatsView({ prospects }: SalesStatsViewProps) {
  const t = useTranslations('AdminSalesPage');

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = startOfDay(subDays(now, 7));

    const total = prospects.length;
    if (total === 0) return null;

    const clients = prospects.filter(p => p.status === 'client');
    const visited = prospects.filter(p => p.status === 'visited');
    const contacted = prospects.filter(p => p.status === 'contacted');
    const pending = prospects.filter(p => p.status === 'pending');

    const conversionRate = (clients.length / total) * 100;

    // Recent activity (last 7 days)
    const visitsThisWeek = prospects.filter(p => 
      p.status === 'visited' && p.updatedAt && isAfter(p.updatedAt.toDate(), sevenDaysAgo)
    ).length;

    const newThisWeek = prospects.filter(p => 
      isAfter(p.createdAt.toDate(), sevenDaysAgo)
    ).length;

    const closedThisWeek = prospects.filter(p => 
      p.status === 'client' && p.updatedAt && isAfter(p.updatedAt.toDate(), sevenDaysAgo)
    ).length;

    // Group by zones for potential value
    const zonesValueMap: Record<string, { value: number, count: number }> = {};
    prospects.forEach(p => {
      const zoneCode = p.zone?.split('-').slice(0, 2).join('-') || 'N/A';
      if (!zonesValueMap[zoneCode]) {
        zonesValueMap[zoneCode] = { value: 0, count: 0 };
      }
      zonesValueMap[zoneCode].value += (p.potentialValue || 0);
      zonesValueMap[zoneCode].count += 1;
    });

    const topZones = Object.entries(zonesValueMap)
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 3)
      .map(([name, data]) => ({ name, ...data }));

    return {
      visitsThisWeek,
      newThisWeek,
      closedThisWeek,
      conversionRate,
      pipeline: {
        pending: pending.length,
        visited: visited.length,
        contacted: contacted.length,
        clients: clients.length
      },
      topZones
    };
  }, [prospects]);

  if (!stats) {
    return (
      <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-2xl bg-slate-50/50">
        No hay datos suficientes para generar estadísticas.
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="sales-dashboard">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <CalendarDays size={16} /> {t('stats_this_week')}
                </div>
                <div className="dashboard-date">Últimos 7 días</div>
            </div>
            <div className="metrics-grid">
                <div className="metric-box">
                    <div className="metric-value">{stats.visitsThisWeek}</div>
                    <div className="metric-label">{t('action_visit')}</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">{stats.newThisWeek}</div>
                    <div className="metric-label">Nuevos</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">{stats.closedThisWeek}</div>
                    <div className="metric-label">{t('metric_closed')}</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">{stats.conversionRate.toFixed(0)}%</div>
                    <div className="metric-label">{t('stats_conversion')}</div>
                </div>
            </div>
        </div>

        <div className="district-card p-4">
            <div className="font-bold text-base mb-4 flex items-center gap-2 text-slate-800">
                <Filter size={16} className="text-primary" /> {t('stats_pipeline_title')}
            </div>
            
            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>{t('stats_new_prospects')}</span>
                    <span className="font-bold">{stats.pipeline.pending}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${(stats.pipeline.pending / prospects.length) * 100}%` }} 
                      className="bg-gray-400 rounded-full h-full"
                    ></div>
                </div>
            </div>

            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>{t('status_visited')}</span>
                    <span className="font-bold">{stats.pipeline.visited}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${(stats.pipeline.visited / prospects.length) * 100}%` }} 
                      className="bg-blue-500 rounded-full h-full"
                    ></div>
                </div>
            </div>

            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>{t('metric_negotiating')}</span>
                    <span className="font-bold">{stats.pipeline.contacted}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${(stats.pipeline.contacted / prospects.length) * 100}%` }} 
                      className="bg-orange-500 rounded-full h-full"
                    ></div>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-2 text-sm">
                    <span>Clientes ganados</span>
                    <span className="font-bold text-green-600">{stats.pipeline.clients}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${(stats.pipeline.clients / prospects.length) * 100}%` }} 
                      className="bg-green-500 rounded-full h-full"
                    ></div>
                </div>
            </div>
        </div>

        <div className="district-card p-4 mt-4">
            <div className="font-bold text-base mb-4 flex items-center gap-2 text-slate-800">
                <MapPin size={16} className="text-secondary" /> {t('stats_top_zones_title')}
            </div>
            
            <div className="flex flex-col gap-3">
                {stats.topZones.map((zone, idx) => (
                  <div 
                    key={zone.name} 
                    className={cn(
                      "flex justify-between items-center p-3 rounded-lg border-l-4",
                      idx === 0 ? "bg-yellow-50 border-secondary" :
                      idx === 1 ? "bg-green-50 border-primary" : "bg-blue-50 border-blue-400"
                    )}
                  >
                      <div>
                          <div className="font-bold text-sm text-slate-800">{zone.name}</div>
                          <div className="text-[10px] uppercase font-bold text-muted-foreground">
                            {t('stats_prospects_count', { count: zone.count })}
                          </div>
                      </div>
                      <div className={cn(
                        "font-extrabold text-base",
                        idx === 0 ? "text-secondary" :
                        idx === 1 ? "text-primary" : "text-blue-600"
                      )}>
                        {formatCurrency(zone.value)}
                      </div>
                  </div>
                ))}
            </div>
        </div>
    </div>
  );
}