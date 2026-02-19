
'use client';
import { useState } from 'react';
import { Wand, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { suggestRoute, type SuggestRouteOutput } from '@/ai/flows/suggest-route-flow';
import type { Prospect } from '@/types';
import { useTranslations } from 'next-intl';

interface SmartClusterProps {
  prospects: Prospect[];
  onAcceptCluster: (prospectIds: string[]) => void;
}

export function SmartCluster({ prospects, onAcceptCluster }: SmartClusterProps) {
  const t = useTranslations('AdminSalesPage');
  const [suggestion, setSuggestion] = useState<SuggestRouteOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateSuggestion = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    const prospectsForAI = prospects.map(p => ({
      id: p.id,
      address: p.address,
      status: p.status,
      potentialValue: p.potentialValue || 0,
    }));

    try {
      const result = await suggestRoute({ prospects: prospectsForAI });
      setSuggestion(result);
    } catch (e: any) {
      console.error("Failed to generate route suggestion:", e);
      setError("Failed to generate suggestion. Please try again later.");
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not get a response from the optimization model.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onAcceptCluster(suggestion.prospectIds);
      setSuggestion(null);
    }
  };

  const handleClear = () => {
    setSuggestion(null);
    setError(null);
  };
  
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };


  return (
    <div className="smart-cluster">
      <div className="cluster-header">
        <div className="cluster-title">
          <Wand size={16} className="text-accent" />
          {t('smart_cluster_title')}
        </div>
        {suggestion && !isLoading && (
            <div className="cluster-badge">{t('smart_cluster_top_suggestion')}</div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm font-medium text-center text-muted-foreground">{t('smart_cluster_analyzing')}</p>
        </div>
      ) : suggestion ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
            <div className="cluster-stats">
                <div className="cluster-stat">
                <div className="cluster-stat-value">{suggestion.prospectCount}</div>
                <div className="cluster-stat-label">Prospectos</div>
                </div>
                <div className="cluster-stat">
                <div className="cluster-stat-value">{suggestion.estimatedKm.toFixed(1)}</div>
                <div className="cluster-stat-label">{t('smart_cluster_km')}</div>
                </div>
                <div className="cluster-stat">
                <div className="cluster-stat-value">{formatCurrency(suggestion.totalPotentialValue)}</div>
                <div className="cluster-stat-label">{t('smart_cluster_potential')}</div>
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" className="w-1/3 h-10" onClick={handleClear}>
                    <X size={16} className="mr-2"/> {t('smart_cluster_clear')}
                </Button>
                <Button size="sm" className="w-2/3 h-10 bg-accent hover:bg-accent/90 font-bold" onClick={handleAccept}>
                    <Check size={16} className="mr-2"/> {t('smart_cluster_accept')}
                </Button>
            </div>
        </div>
      ) : (
        <div className="text-center p-4">
            <p className="text-sm text-muted-foreground mb-4">
                {t('smart_cluster_description')}
            </p>
            <Button className="w-full h-11 bg-accent hover:bg-accent/90 font-bold shadow-md" onClick={handleGenerateSuggestion}>
                <Wand size={18} className="mr-2" />
                Generar Sugerencia
            </Button>
            {error && <p className="text-xs text-destructive mt-3 bg-destructive/10 p-2 rounded">{error}</p>}
        </div>
      )}
    </div>
  );
}
