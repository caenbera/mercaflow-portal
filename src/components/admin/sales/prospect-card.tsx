'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Phone, Check, Navigation, Plus, Minus, Pencil, BotMessageSquare, Clock, CircleDot, UserX } from 'lucide-react';
import type { Prospect, ProspectStatus, ProspectVisit } from '@/types';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useProspectVisits } from '@/hooks/useProspectVisits';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onCheckIn: (prospect: Prospect) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelectionChange: (prospectId: string, isSelected: boolean) => void;
}

const OutcomeIcon = ({ outcome }: { outcome: ProspectVisit['outcome'] }) => {
  switch (outcome) {
    case 'successful':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'follow-up':
      return <CircleDot className="h-4 w-4 text-blue-500" />;
    case 'no_show':
      return <UserX className="h-4 w-4 text-red-500" />;
    default:
      return <BotMessageSquare className="h-4 w-4 text-gray-500" />;
  }
};

export function ProspectCard({ prospect, onEdit, onCheckIn, isSelectionMode, isSelected, onSelectionChange }: ProspectCardProps) {
  const t = useTranslations('AdminSalesPage');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { visits, loading: visitsLoading } = useProspectVisits(isOpen ? prospect.id : null); // Only fetch visits when expanded

  const statusConfig: Record<ProspectStatus, { label: string; className: string }> = {
    pending: { label: t('status_pending'), className: 'bg-yellow-100 text-yellow-800' },
    contacted: { label: t('status_contacted'), className: 'bg-blue-100 text-blue-800' },
    visited: { label: t('status_visited'), className: 'bg-green-100 text-green-800' },
    client: { label: t('status_client'), className: 'bg-purple-100 text-purple-800' },
    not_interested: { label: t('status_not_interested'), className: 'bg-gray-100 text-gray-800' },
  };

  const statusInfo = statusConfig[prospect.status] || statusConfig.pending;

  const handleCardClick = () => {
    if (isSelectionMode) {
      onSelectionChange(prospect.id, !isSelected);
    }
  };
  
  const cleanPhoneNumber = (phone: string | undefined) => {
    return phone?.replace(/\D/g, '') || '';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card 
        className={cn(
          "p-0 shadow-sm group transition-all duration-200 overflow-hidden", 
          prospect.priority && "border-l-4 border-accent",
          isSelected && "ring-2 ring-primary border-primary"
        )}
      >
        <div 
          className="flex items-start p-4 cursor-pointer" 
          onClick={handleCardClick}
        >
            {isSelectionMode && (
                <div className="p-2 mr-2 self-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectionChange(prospect.id, !!checked)}
                      onClick={(e) => e.stopPropagation()} 
                      className="h-5 w-5"
                    />
                </div>
            )}
            <div className="flex-grow">
                <h3 className="font-bold text-base pr-2">{prospect.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">{prospect.address}</span>
                </div>
                <div className='mt-2'>
                    <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
                </div>
            </div>
            <div className="flex flex-col items-center gap-2 ml-2">
                <CollapsibleTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={(e) => e.stopPropagation()}>
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        <span className="sr-only">Toggle details</span>
                    </Button>
                </CollapsibleTrigger>
                <Button size="sm" className="h-9 px-3" onClick={(e) => { e.stopPropagation(); onCheckIn(prospect); }}>
                    <Check className="mr-2" />
                    {t('action_visit')}
                </Button>
            </div>
        </div>

        <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
                 <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{prospect.phone || t('no_phone')}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="capitalize">{prospect.ethnic}</Badge>
                        <Badge variant="secondary" className="capitalize">{prospect.category}</Badge>
                        {prospect.zone && <Badge variant="secondary" className="capitalize">{prospect.zone}</Badge>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button asChild variant="outline" size="sm" className="flex-1" disabled={!prospect.phone}>
                        <a href={`tel:${cleanPhoneNumber(prospect.phone)}`}>
                            <Phone className="mr-2" />
                            {t('action_call')}
                        </a>
                    </Button>
                     <Button asChild variant="outline" size="sm" className="flex-1" disabled={!prospect.phone}>
                        <a href={`https://wa.me/${cleanPhoneNumber(prospect.phone)}`} target="_blank" rel="noopener noreferrer">
                            <BotMessageSquare className="mr-2" />
                            {t('action_whatsapp')}
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled={!prospect.address} onClick={(e) => {
                         e.stopPropagation();
                         window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(prospect.address)}`, '_blank');
                    }}>
                        <Navigation className="mr-2" />
                        {t('action_route')}
                    </Button>
                     <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(prospect); }}>
                        <Pencil className="mr-2" />
                        {t('action_edit')}
                    </Button>
                </div>
                 <div>
                  <h4 className="text-xs font-semibold mb-2 uppercase text-muted-foreground">{t('visit_history_title')}</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {visitsLoading ? (
                      <Skeleton className="h-12 w-full"/>
                    ) : visits.length > 0 ? (
                      visits.map(visit => (
                        <div key={visit.id} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center mt-1">
                            <OutcomeIcon outcome={visit.outcome} />
                            <div className="w-px h-full bg-border mt-1"></div>
                          </div>
                          <div>
                            <p className="text-sm text-foreground">{visit.notes}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                              <Clock className="h-3 w-3"/>
                              {formatDistanceToNow(visit.date.toDate(), { addSuffix: true, locale: locale === 'es' ? es : undefined })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-4">{t('no_visits_yet')}</p>
                    )}
                  </div>
                </div>
            </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
