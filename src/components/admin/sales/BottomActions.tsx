'use client';

import { Button } from '@/components/ui/button';
import { Route, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BottomActionsProps {
  count: number;
  onClear: () => void;
  onGenerate: () => void;
}

export function BottomActions({ count, onClear, onGenerate }: BottomActionsProps) {
  const t = useTranslations('AdminSalesPage');

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-3 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3 z-40 md:left-auto md:w-auto md:bottom-5 md:right-5 md:rounded-xl">
      <div className="text-sm font-semibold">
        {t('create_route_button', { count: count })}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onClear}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button className="h-9" onClick={onGenerate}>
          <Route className="h-4 w-4 mr-2" /> {t('action_route')}
        </Button>
      </div>
    </div>
  );
}
