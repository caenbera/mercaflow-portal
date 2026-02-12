'use client';

import { useState, useMemo } from 'react';
import type { Prospect } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

type FilterLevel = 'state' | 'city' | 'category' | 'ethnic';
type Selections = {
  state?: string;
  city?: string;
  category?: string;
  ethnic?: string;
};

interface DrilldownFiltersProps {
  prospects: Prospect[];
  onFilterChange: (filters: Selections) => void;
}

const getStatesFromProspects = (prospects: Prospect[]) => {
  const states = new Set(prospects.map(p => p.state).filter(Boolean));
  return Array.from(states);
};

const getCitiesFromProspects = (prospects: Prospect[], state: string) => {
    const cities = new Set(prospects.filter(p => p.state === state).map(p => p.city).filter(Boolean));
    return Array.from(cities);
};

const getCategoriesFromProspects = (prospects: Prospect[], state: string, city: string) => {
    const categories = new Set(prospects.filter(p => p.state === state && p.city === city).map(p => p.category).filter(Boolean));
    return Array.from(categories);
}

const getEthnicsFromProspects = (prospects: Prospect[], state: string, city: string, category: string) => {
    const ethnics = new Set(prospects.filter(p => p.state === state && p.city === city && p.category === category).map(p => p.ethnic).filter(Boolean));
    return Array.from(ethnics);
}


export function DrilldownFilters({ prospects, onFilterChange }: DrilldownFiltersProps) {
  const [selections, setSelections] = useState<Selections>({});
  const t = useTranslations('AdminSalesPage');

  const handleSelection = (level: FilterLevel, value: string | null) => {
    const newSelections: Selections = { ...selections };

    // Clear subsequent filters when a higher level is changed
    if (level === 'state') {
        delete newSelections.city;
        delete newSelections.category;
        delete newSelections.ethnic;
    } else if (level === 'city') {
        delete newSelections.category;
        delete newSelections.ethnic;
    } else if (level === 'category') {
        delete newSelections.ethnic;
    }

    if (value) {
      newSelections[level] = value;
    } else {
      delete newSelections[level];
    }
    
    setSelections(newSelections);
    onFilterChange(newSelections);
  };

  const getFilteredProspectsForCount = (level: FilterLevel) => {
    let filtered = prospects;
    if (selections.state && level !== 'state') {
        filtered = filtered.filter(p => p.state === selections.state);
    }
    if (selections.city && level !== 'state' && level !== 'city') {
        filtered = filtered.filter(p => p.city === selections.city);
    }
    if (selections.category && level !== 'state' && level !== 'city' && level !== 'category') {
        filtered = filtered.filter(p => p.category === selections.category);
    }
    return filtered;
  }

  const renderFilterBar = (level: FilterLevel, options: string[], currentSelection: string | undefined, totalCount: number) => {
    const getCount = (option: string) => {
        const filteredForCount = getFilteredProspectsForCount(level);
        return filteredForCount.filter(p => p[level] === option).length;
    };

    return (
        <div className="relative h-9 overflow-x-auto hide-scrollbar">
            <div className="absolute left-0 top-0 flex items-center gap-1.5 px-3 min-w-full">
                <Button
                    variant={!currentSelection ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full h-7 px-2.5 text-xs flex-shrink-0 whitespace-nowrap"
                    onClick={() => handleSelection(level, null)}
                >
                    {t('filter_all')} ({totalCount})
                </Button>
                {options.map(option => (
                    <Button
                        key={option}
                        variant={currentSelection === option ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full h-7 px-2.5 text-xs flex-shrink-0 whitespace-nowrap capitalize"
                        onClick={() => handleSelection(level, option)}
                    >
                        {option} ({getCount(option)})
                    </Button>
                ))}
            </div>
        </div>
    );
  };
  
  const stateOptions = useMemo(() => getStatesFromProspects(prospects), [prospects]);
  const cityOptions = useMemo(() => selections.state ? getCitiesFromProspects(prospects, selections.state) : [], [prospects, selections.state]);
  const categoryOptions = useMemo(() => selections.state && selections.city ? getCategoriesFromProspects(prospects, selections.state, selections.city) : [], [prospects, selections.state, selections.city]);
  const ethnicOptions = useMemo(() => selections.state && selections.city && selections.category ? getEthnicsFromProspects(prospects, selections.state, selections.city, selections.category) : [], [prospects, selections.state, selections.city, selections.category]);

  return (
    <div className="space-y-2 py-2 border-b bg-card">
        {renderFilterBar('state', stateOptions, selections.state, prospects.length)}
        {selections.state && cityOptions.length > 0 && renderFilterBar('city', cityOptions, selections.city, getFilteredProspectsForCount('city').length)}
        {selections.city && categoryOptions.length > 0 && renderFilterBar('category', categoryOptions, selections.category, getFilteredProspectsForCount('category').length)}
        {selections.category && ethnicOptions.length > 0 && renderFilterBar('ethnic', ethnicOptions, selections.ethnic, getFilteredProspectsForCount('ethnic').length)}
    </div>
  );
}
