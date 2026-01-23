'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSupportTickets } from '@/hooks/use-support-tickets';
import { updateSupportTicket } from '@/lib/firestore/tickets';
import { useToast } from '@/hooks/use-toast';
import { TicketColumn } from './ticket-column';
import { TicketCard } from './ticket-card';
import { TicketDetailsDialog } from './ticket-details-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { SupportTicket } from '@/types';
import { useTranslations } from 'next-intl';

type TicketStatus = 'new' | 'in_progress' | 'resolved';

export function TicketBoard() {
  const { tickets, loading } = useSupportTickets();
  const { toast } = useToast();
  const t = useTranslations('AdminSupportPage');

  const [columns, setColumns] = useState<Record<TicketStatus, SupportTicket[]>>({
    new: [],
    in_progress: [],
    resolved: [],
  });

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    if (!loading) {
      const newCols: Record<TicketStatus, SupportTicket[]> = { new: [], in_progress: [], resolved: [] };
      tickets.forEach(ticket => {
        let status = ticket.status as TicketStatus;
        // This is a safeguard. If a ticket has a missing or invalid status,
        // it will default to the 'new' column instead of crashing the app.
        if (!status || !newCols[status]) {
          status = 'new';
        }
        newCols[status].push(ticket);
      });
      setColumns(newCols);
    }
  }, [tickets, loading]);
  
  const columnIds: TicketStatus[] = ['new', 'in_progress', 'resolved'];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
        const activeContainer = active.data.current?.sortable.containerId as TicketStatus;
        const overContainer = over.data.current?.sortable.containerId as TicketStatus;
        const ticketId = active.id as string;
        
        if (activeContainer !== overContainer) {
            updateSupportTicket(ticketId, { status: overContainer })
                .then(() => toast({ title: t('toast_status_updated') }))
                .catch(() => toast({ variant: 'destructive', title: t('toast_update_error') }));
        }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <>
        <TicketDetailsDialog
            ticket={selectedTicket}
            open={!!selectedTicket}
            onOpenChange={(isOpen) => !isOpen && setSelectedTicket(null)}
        />
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    {columnIds.map(columnId => (
                        <TicketColumn key={columnId} id={columnId} tickets={columns[columnId]}>
                            {columns[columnId].map(ticket => (
                                <TicketCard key={ticket.id} ticket={ticket} onSelect={setSelectedTicket} />
                            ))}
                        </TicketColumn>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    </>
  );
}
