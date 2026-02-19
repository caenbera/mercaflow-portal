
'use client';
import { CalendarDays, Filter, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SalesStatsView() {
  const t = useTranslations('AdminSalesPage');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="sales-dashboard">
            <div className="dashboard-header">
                <div className="dashboard-title">
                    <CalendarDays size={16} /> {t('stats_this_week')}
                </div>
                <div className="dashboard-date">02-08 Feb</div>
            </div>
            <div className="metrics-grid">
                <div className="metric-box">
                    <div className="metric-value">42</div>
                    <div className="metric-label">{t('action_visit')}</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">12</div>
                    <div className="metric-label">Nuevos</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">8</div>
                    <div className="metric-label">{t('metric_closed')}</div>
                </div>
                <div className="metric-box">
                    <div className="metric-value">19%</div>
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
                    <span className="font-bold">24</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '40%', height: '100%' }} className="bg-gray-400 rounded-full"></div>
                </div>
            </div>

            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>{t('status_visited')}</span>
                    <span className="font-bold">18</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '30%', height: '100%' }} className="bg-blue-500 rounded-full"></div>
                </div>
            </div>

            <div className="mb-5">
                <div className="flex justify-between mb-2 text-sm">
                    <span>{t('metric_negotiating')}</span>
                    <span className="font-bold">12</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '20%', height: '100%' }} className="bg-orange-500 rounded-full"></div>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-2 text-sm">
                    <span>Clientes ganados</span>
                    <span className="font-bold text-green-600">8</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div style={{ width: '13%', height: '100%' }} className="bg-green-500 rounded-full"></div>
                </div>
            </div>
        </div>

        <div className="district-card p-4 mt-4">
            <div className="font-bold text-base mb-4 flex items-center gap-2 text-slate-800">
                <MapPin size={16} className="text-secondary" /> {t('stats_top_zones_title')}
            </div>
            
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-secondary">
                    <div>
                        <div className="font-bold text-sm text-slate-800">CHI-LV (Little Village)</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">{t('stats_prospects_count', { count: 22 })}</div>
                    </div>
                    <div className="font-extrabold text-secondary text-base">$18k</div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-l-4 border-primary">
                    <div>
                        <div className="font-bold text-sm text-slate-800">CHI-PIL (Pilsen)</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">{t('stats_prospects_count', { count: 18 })}</div>
                    </div>
                    <div className="font-extrabold text-primary text-base">$12k</div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-info">
                    <div>
                        <div className="font-bold text-sm text-slate-800">CHI-AP (Albany Park)</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">{t('stats_prospects_count', { count: 15 })}</div>
                    </div>
                    <div className="font-extrabold text-info text-base">$9.5k</div>
                </div>
            </div>
        </div>
    </div>
  );
}
