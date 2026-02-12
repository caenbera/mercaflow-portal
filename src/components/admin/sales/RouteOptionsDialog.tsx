'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Navigation, PersonStanding, List } from 'lucide-react';
import type { Prospect } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RouteOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProspects: Prospect[];
  onClear: () => void;
}

export function RouteOptionsDialog({ open, onOpenChange, selectedProspects, onClear }: RouteOptionsDialogProps) {
  const t = useTranslations('AdminSalesPage');
  const { toast } = useToast();
  const [customAddress, setCustomAddress] = useState('');

  const buildMapsUrl = (origin: string, destinations: string[]): string => {
    if (destinations.length === 0) return '';
    
    if (destinations.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destinations[0]}`;
    }

    const finalDestination = destinations[destinations.length - 1];
    const waypoints = destinations.slice(0, -1).join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${finalDestination}&waypoints=${waypoints}`;
  };

  const getProspectAddresses = (): string[] => {
    return selectedProspects
      .filter(p => p.address && p.city && p.state)
      .map(p => {
        const fullAddress = `${p.address}, ${p.city}, ${p.state}${p.zip ? ` ${p.zip}` : ''}`;
        return encodeURIComponent(fullAddress);
      });
  };

  const handleStartFromCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: t('geolocation_not_supported') });
      return;
    }
    const destinations = getProspectAddresses();
    if (destinations.length === 0) {
        toast({ variant: "destructive", title: t('toast_no_address_title'), description: t('toast_no_address_desc') });
        return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = `${position.coords.latitude},${position.coords.longitude}`;
        const url = buildMapsUrl(origin, destinations);
        window.open(url, '_blank');
        onOpenChange(false);
        onClear();
      },
      () => {
        toast({ variant: 'destructive', title: t('location_denied_title'), description: t('location_denied_desc') });
      }
    );
  };

  const handleStartFromFirstProspect = () => {
    const destinations = getProspectAddresses();
    if (destinations.length === 0) {
        toast({ variant: "destructive", title: t('toast_no_address_title'), description: t('toast_no_address_desc') });
        return;
    }

    if (destinations.length === 1) {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destinations[0]}`;
        window.open(mapsUrl, '_blank');
        onOpenChange(false);
        onClear();
        return;
    }

    const origin = destinations.shift()!;
    const url = buildMapsUrl(origin, destinations);
    window.open(url, '_blank');
    onOpenChange(false);
    onClear();
  };

  const handleStartFromCustomAddress = () => {
    if (!customAddress.trim()) {
      toast({ variant: 'destructive', title: t('address_required_title'), description: t('address_required_desc') });
      return;
    }
    const origin = encodeURIComponent(customAddress);
    const destinations = getProspectAddresses();
     if (destinations.length === 0) {
        toast({ variant: "destructive", title: t('toast_no_address_title'), description: t('toast_no_address_desc') });
        return;
    }
    const url = buildMapsUrl(origin, destinations);
    window.open(url, '_blank');
    onOpenChange(false);
    onClear();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('route_options_title')}</DialogTitle>
          <DialogDescription>
            {t('route_options_desc', { count: selectedProspects.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg max-h-48">
            <div className="p-3 bg-muted/50 border-b font-semibold text-sm flex items-center gap-2">
                <List className="h-4 w-4"/>
                Prospectos Seleccionados
            </div>
            <ScrollArea className="h-32">
                <div className="p-3 text-sm">
                {selectedProspects.map((prospect, index) => (
                    <div key={prospect.id} className="py-1 border-b last:border-0">
                        <p className="font-medium">{index + 1}. {prospect.name}</p>
                        <p className="text-xs text-muted-foreground pl-4">{prospect.address}, {prospect.city}</p>
                    </div>
                ))}
                </div>
            </ScrollArea>
        </div>

        <div className="space-y-4 pt-2">
          <Button onClick={handleStartFromCurrentLocation} variant="outline" className="w-full h-auto py-3 justify-start gap-4">
            <MapPin className="h-5 w-5 text-primary" />
            <div className="text-left">
                <p className="font-semibold">{t('route_option_current_location_title')}</p>
                <p className="text-xs text-muted-foreground">{t('route_option_current_location_desc')}</p>
            </div>
          </Button>
          <Button onClick={handleStartFromFirstProspect} variant="outline" className="w-full h-auto py-3 justify-start gap-4">
            <PersonStanding className="h-5 w-5 text-primary" />
            <div className="text-left">
                <p className="font-semibold">{t('route_option_first_prospect_title')}</p>
                <p className="text-xs text-muted-foreground">{t('route_option_first_prospect_desc')}</p>
            </div>
          </Button>
          <div className="space-y-2">
            <p className="font-semibold text-sm">{t('route_option_custom_address_title')}</p>
            <div className="flex gap-2">
                <Input 
                    placeholder={t('route_option_custom_address_placeholder')}
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                />
                <Button onClick={handleStartFromCustomAddress} aria-label={t('route_options_start_button')}>
                    <Navigation className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
