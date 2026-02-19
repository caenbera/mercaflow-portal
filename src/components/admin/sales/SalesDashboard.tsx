
'use client';
import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { useProspects } from '@/hooks/use-prospects';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfToday, isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
};

export function SalesDashboard() {
  const locale = useLocale();
  const t = useTranslations('AdminSalesPage');
  const { prospects, loading } = useProspects();

  const today = new Date();

  const stats = useMemo(() => {
    if (loading || !prospects) {
      return { visits: 0, negotiating: 0, closed: 0, pipeline: 0 };
    }

    const startOfTodayDate = startOfToday();

    const visitsToday = prospects.filter(p =>
      p.status === 'visited' && p.updatedAt && isSameDay(p.updatedAt.toDate(), startOfTodayDate)
    ).length;

    const negotiating = prospects.filter(p =>
      p.status === 'contacted' || p.status === 'visited'
    ).length;

    const closedToday = prospects.filter(p =>
      p.status === 'client' && p.updatedAt && isSameDay(p.updatedAt.toDate(), startOfTodayDate)
    ).length;

    const pipeline = prospects
      .filter(p => p.status !== 'client' && p.status !== 'not_interested')
      .reduce((sum, p) => sum + (p.potentialValue || 0), 0);

    return { visits: visitsToday, negotiating, closed: closedToday, pipeline };
  }, [prospects, loading]);

  const renderMetric = (value: string | number, label: string) => (
    <div className="metric-box">
      {loading ? (
        <>
          <Skeleton className="h-6 w-12 mx-auto mb-1" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </>
      ) : (
        <>
          <div className="metric-value">{value}</div>
          <div className="metric-label">{label}</div>
        </>
      )}
    </div>
  );

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <Trophy size={16} className="inline mr-1" /> {t('dashboard_performance_title')}
        </div>
        {loading ? <Skeleton className="h-5 w-24" /> : 
        <div className="dashboard-date">{format(today, 'dd MMM yyyy', { locale: locale === 'es' ? es : undefined })}</div>
        }
      </div>
      <div className="metrics-grid">
        {renderMetric(stats.visits, t('action_visit'))}
        {renderMetric(stats.negotiating, t('metric_negotiating'))}
        {renderMetric(stats.closed, t('metric_closed'))}
        {renderMetric(formatCurrency(stats.pipeline), t('metric_pipeline'))}
      </div>
    </div>
  );
}
