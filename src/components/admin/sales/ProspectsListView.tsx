'use client';
import { useState } from 'react';
import type { Prospect } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/navigation';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';


const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Nuevos' },
    { id: 'visited', label: 'Visitados' },
    { id: 'client', label: 'Clientes' },
];

interface ProspectsListViewProps {
  prospects: Prospect[];
}

const statusConfig = {
    pending: { label: 'Pendiente', className: 'text-amber-700 bg-amber-50'},
    contacted: { label: 'Contactado', className: 'text-blue-700 bg-blue-50'},
    visited: { label: 'Visitado', className: 'text-green-700 bg-green-50'},
    client: { label: 'Cliente', className: 'text-purple-700 bg-purple-50'},
    not_interested: { label: 'No Interesado', className: 'text-gray-700 bg-gray-50'},
};


export function ProspectsListView({ prospects }: ProspectsListViewProps) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredProspects = prospects.filter(p => {
    if (activeFilter === 'all') return true;
    return p.status === activeFilter;
  });

  return (
    <div>
      <div className="filter-bar">
        {filters.map(filter => (
          <div 
            key={filter.id}
            className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`} 
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </div>
        ))}
      </div>

      <div className="prospect-list">
        {filteredProspects.map(prospect => {
            const statusInfo = statusConfig[prospect.status] || statusConfig.pending;
            return (
              <Link key={prospect.id} href={`/admin/sales/prospects/${prospect.id}`} className="block no-underline text-current">
                  <div className="prospect-item">
                     <div className="prospect-avatar bg-gray-200 text-gray-600">
                         {prospect.name.substring(0,2).toUpperCase()}
                     </div>
                      <div className="prospect-info">
                          <div className="prospect-header">
                            <h4 className="prospect-name">{prospect.name}</h4>
                            <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 border-0", statusInfo.className)}>
                                {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="prospect-address">
                            <MapPin size={14} className="mr-1" />
                            {prospect.address}
                          </p>
                          <div className="prospect-meta">
                              <div className="prospect-zone">{prospect.zone}</div>
                              <div className="prospect-type capitalize">{prospect.category}</div>
                          </div>
                      </div>
                  </div>
              </Link>
            )
        })}
      </div>
    </div>
  );
}
