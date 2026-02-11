// src/components/admin/sales/prospect-card.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, Phone, Check, Navigation, Plus, Minus, 
  Pencil, BotMessageSquare, Clock, CircleDot, UserX, 
  Globe, ChevronDown, Route, Store, Utensils, Beef
} from 'lucide-react';
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

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category.toLowerCase()) {
    case 'restaurante':
      return <Utensils className="h-4 w-4" />;
    case 'supermercado':
      return <Store className="h-4 w-4" />;
    case 'carnicería':
      return <Beef className="h-4 w-4" />;
    default:
      return <Store className="h-4 w-4" />;
  }
};

export function ProspectCard({ 
  prospect, 
  onEdit, 
  onCheckIn, 
  isSelectionMode, 
  isSelected, 
  onSelectionChange 
}: ProspectCardProps) {
  const t = useTranslations('AdminSalesPage');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { visits, loading: visitsLoading } = useProspectVisits(isOpen ? prospect.id : null);

  const statusConfig: Record<ProspectStatus, { 
    label: string; 
    className: string;
    bgColor: string;
    borderColor: string;
  }> = {
    pending: { 
      label: t('status_pending'), 
      className: 'text-amber-700 bg-amber-50',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-400'
    },
    contacted: { 
      label: t('status_contacted'), 
      className: 'text-blue-700 bg-blue-50',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400'
    },
    visited: { 
      label: t('status_visited'), 
      className: 'text-green-700 bg-green-50',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400'
    },
    client: { 
      label: t('status_client'), 
      className: 'text-purple-700 bg-purple-50',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-400'
    },
    not_interested: { 
      label: t('status_not_interested'), 
      className: 'text-gray-700 bg-gray-50',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-400'
    },
  };

  const statusInfo = statusConfig[prospect.status] || statusConfig.pending;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, [role="checkbox"]')) {
      return;
    }
    if (isSelectionMode) {
      onSelectionChange(prospect.id, !isSelected);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const cleanPhoneNumber = (phone: string | undefined) => {
    return phone?.replace(/\D/g, '') || '';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card 
        className={cn(
          "overflow-hidden transition-all duration-200 border-l-4",
          prospect.priority ? "border-l-orange-500" : statusInfo.borderColor,
          isSelected ? "ring-2 ring-green-600 border-green-600 bg-green-50/30" : "hover:shadow-md",
          isSelectionMode && "cursor-pointer"
        )}
        onClick={handleCardClick}
      >
        {/* Header Section - Diseño del prototipo */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Selection + Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {isSelectionMode && (
                <div className="pt-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectionChange(prospect.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 border-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                {/* Name + Status Badge */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {prospect.name}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs font-semibold px-2 py-0.5 border-0", statusInfo.className)}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>

                {/* Address with icon */}
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                  <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="truncate">{prospect.address}</span>
                </div>

                {/* Zone Code - Destacado como en el prototipo */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <div className="font-mono text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                    {prospect.zone || 'SIN-ZONA'}
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize bg-gray-100 text-gray-700">
                    {prospect.ethnic}
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize bg-gray-100 text-gray-700 flex items-center gap-1">
                    <CategoryIcon category={prospect.category} />
                    {prospect.category}
                  </Badge>
                </div>

                {/* Action Buttons - Estilo prototipo */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white h-9"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onCheckIn(prospect); 
                    }}
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">{t('action_visit')}</span>
                    <span className="sm:hidden">Visitar</span>
                  </Button>
                  
                  {!isSelectionMode && (
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isOpen ? (
                          <>
                            <Minus className="h-4 w-4 mr-1.5" />
                            Menos
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1.5" />
                            Más
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Distance/Route - Solo si no está en modo selección */}
            {!isSelectionMode && (
              <div className="flex flex-col items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(prospect.address)}`, '_blank');
                  }}
                >
                  <Navigation className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Content - Detalles expandidos */}
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
            
            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 mt-2">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">Teléfono</div>
                  <div className="font-medium text-sm truncate">
                    {prospect.phone || t('no_phone')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">Web</div>
                  <a 
                    href={prospect.web} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-sm text-blue-600 hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {prospect.web ? 'Ver sitio' : 'N/A'}
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
              <Button 
                asChild 
                variant="outline" 
                className="h-11 justify-start border-green-200 hover:bg-green-50 hover:border-green-300"
                disabled={!prospect.phone}
              >
                <a href={`tel:${cleanPhoneNumber(prospect.phone)}`}>
                  <Phone className="mr-2 h-4 w-4 text-green-600" />
                  <span className="text-green-700">Llamar</span>
                </a>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                className="h-11 justify-start border-green-200 hover:bg-green-50 hover:border-green-300"
                disabled={!prospect.phone}
              >
                <a 
                  href={`https://wa.me/1${cleanPhoneNumber(prospect.phone)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <BotMessageSquare className="mr-2 h-4 w-4 text-green-600" />
                  <span className="text-green-700">WhatsApp</span>
                </a>
              </Button>
            </div>

            {/* Visit History */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                {t('visit_history_title')}
              </h4>
              
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {visitsLoading ? (
                  <Skeleton className="h-16 w-full rounded-lg"/>
                ) : visits.length > 0 ? (
                  visits.map((visit, index) => (
                    <div 
                      key={visit.id} 
                      className="flex gap-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col items-center">
                        <OutcomeIcon outcome={visit.outcome} />
                        {index !== visits.length - 1 && (
                          <div className="w-px h-full bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-relaxed">{visit.notes}</p>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                          <Clock className="h-3 w-3"/>
                          {formatDistanceToNow(visit.date.toDate(), { 
                            addSuffix: true, 
                            locale: locale === 'es' ? es : undefined 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">{t('no_visits_yet')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <div className="mt-4 pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                className="w-full h-11 border-gray-300 hover:bg-gray-100"
                onClick={() => onEdit(prospect)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t('action_edit')}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
