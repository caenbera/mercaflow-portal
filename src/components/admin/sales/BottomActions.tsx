'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Route, Trash2, X, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Prospect } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface BottomActionsProps {
  prospects: Prospect[];
  onClear: () => void;
  onGenerate: () => void;
  onRemove: (id: string) => void;
}

export function BottomActions({ prospects, onClear, onGenerate, onRemove }: BottomActionsProps) {
  const t = useTranslations('AdminSalesPage');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl md:rounded-xl md:border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="px-4 pt-3">
          <CollapsibleTrigger className="flex justify-between items-center w-full text-left -mx-1 px-1 py-1 rounded-md hover:bg-muted">
            <h3 className="font-bold text-sm text-foreground">Prospectos Seleccionados ({prospects.length})</h3>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="px-4 pt-2 pb-1">
            <ScrollArea className="h-32">
              <div className="space-y-2 pr-2">
                {prospects.map(prospect => (
                  <div key={prospect.id} className="p-2 bg-muted/50 border rounded-lg flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-semibold text-sm">{prospect.name}</p>
                      <p className="text-xs text-muted-foreground">{prospect.address}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => onRemove(prospect.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <div className="p-3 mt-2 border-t bg-card/50 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">
          {t('create_route_button', { count: prospects.length })}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9" onClick={onClear}>
            <Trash2 className="h-4 w-4 mr-2" /> Limpiar
          </Button>
          <Button className="h-9" onClick={onGenerate}>
            <Route className="h-4 w-4 mr-2" /> {t('action_route')}
          </Button>
        </div>
      </div>
    </div>
  );
}
