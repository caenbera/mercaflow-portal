'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Phone, Check, Navigation, Star, Pencil, BotMessageSquare } from 'lucide-react';
import type { Prospect, ProspectStatus } from '@/types';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ProspectCardProps {
  prospect: Prospect;
  onEdit: (prospect: Prospect) => void;
  onSelect: (prospect: Prospect) => void;
  onCheckIn: (prospect: Prospect) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelectionChange: (prospectId: string, isSelected: boolean) => void;
}

export function ProspectCard({ prospect, onEdit, onSelect, onCheckIn, isSelectionMode, isSelected, onSelectionChange }: ProspectCardProps) {
  const t = useTranslations('AdminSalesPage');

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
    } else {
      onSelect(prospect);
    }
  };

  const cleanPhoneNumber = (phone: string | undefined) => {
    return phone?.replace(/\D/g, '') || '';
  };

  return (
    <Card 
      className={cn(
        "p-4 shadow-sm group cursor-pointer", 
        prospect.priority && "border-l-4 border-accent",
        isSelected && "ring-2 ring-primary border-primary"
      )}
      onClick={handleCardClick}
    >
        <div className="flex items-start">
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
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base pr-2">{prospect.name}</h3>
                    <div className="flex items-center gap-1">
                    <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
                    {!isSelectionMode && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); onEdit(prospect); }}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    </div>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{prospect.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{prospect.phone || t('no_phone')}</span>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-4">
                    <Badge variant="secondary" className="capitalize">{prospect.ethnic}</Badge>
                    <Badge variant="secondary" className="capitalize">{prospect.category}</Badge>
                    {prospect.zone && <Badge variant="secondary" className="capitalize">{prospect.zone}</Badge>}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
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
                    <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onCheckIn(prospect); }}>
                        <Check className="mr-2" />
                        {t('action_visit')}
                    </Button>
                </div>
            </div>
      </div>
    </Card>
  );
}
