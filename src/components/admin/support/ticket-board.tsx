// src/components/admin/support/ticket-board.tsx
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { updateSupportTicket } from '@/lib/firestore/tickets';
import { SupportTicket } from '@/types';
import { CircleAlert, Clock, CheckCircle2, Loader2, GripVertical, Paperclip } from 'lucide-react';
import { SortableTicketItem } from './SortableTicketItem';
import { useTranslations } from 'next-intl';

const VALID_STATUSES = ['new', 'in_progress', 'resolved'] as const;
type TicketStatus = (typeof VALID_STATUSES)[number];

export const STATUS_CONFIG: Record<TicketStatus, { color: string; icon: React.ReactNode }> = {
  new: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Clock className="h-4 w-4" />,
  },
  in_progress: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <CircleAlert className="h-4 w-4" />,
  },
  resolved: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

interface TicketBoardProps {
  tickets: SupportTicket[];
}

export function TicketBoard({ tickets }: TicketBoardProps) {
  const t = useTranslations('AdminSupportPage');
  const [columns, setColumns] = useState<Record<TicketStatus, SupportTicket[]>>({
    new: [],
    in_progress: [],
    resolved: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const newCols: Record<TicketStatus, SupportTicket[]> = {
      new: [],
      in_progress: [],
      resolved: [],
    };

    const filtered = tickets.filter(
      (ticket) =>
        ticket.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.details && ticket.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.forEach((ticket) => {
      const status = ticket.status as TicketStatus;
      if (VALID_STATUSES.includes(status)) {
        newCols[status].push(ticket);
      } else {
        newCols.new.push(ticket); // Default to 'new' if status is invalid
      }
    });

    setColumns(newCols);
  }, [tickets, searchTerm]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (VALID_STATUSES.includes(overId as any)) {
      const newStatus = overId as any;
      const currentStatus = tickets.find((t) => t.id === activeId)?.status;

      if (currentStatus !== newStatus) {
        try {
          setIsUpdating(true);
          await updateSupportTicket(activeId, { status: newStatus });
        } catch (err) {
          console.error('Error al mover ticket:', err);
        } finally {
          setIsUpdating(false);
        }
      }
      return;
    }
  };

  const handleOpenDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseDetails = () => {
    setSelectedTicket(null);
  };

  const activeTicket = tickets.find((t) => t.id === activeId) || null;
  
  const getTranslatedIssueType = (issueType: string) => {
      const key = `issue_option_${issueType}` as any;
      const translated = t(key);
      return translated === key ? issueType : translated;
  }

  const getStatusLabel = (status: TicketStatus) => {
      return t(`status_${status}` as any);
  }

  const getColumnLabel = (status: TicketStatus) => {
      return t(`${status}_column` as any);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('page_title')}</h2>
          <div className="w-64">
            <Input
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALID_STATUSES.map((status) => (
            <div key={status} className="flex flex-col">
              <div className="flex items-center mb-3">
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                  {STATUS_CONFIG[status].icon}
                  <span className="ml-2">{getColumnLabel(status)}</span>
                  <span className="ml-2 bg-white text-gray-700 rounded-full px-2 py-0.5">
                    {columns[status].length}
                  </span>
                </Badge>
              </div>
              <div className="min-h-[500px] border rounded-lg p-3 bg-gray-50">
                <SortableContext
                  items={columns[status].map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columns[status].map((ticket) => (
                    <SortableTicketItem
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => handleOpenDetails(ticket)}
                    />
                  ))}
                </SortableContext>
                {columns[status].length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    {t('column_empty_hint')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? (
            <Card className="w-80 shadow-lg border-2 border-dashed border-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium line-clamp-1">
                    {getTranslatedIssueType(activeTicket.issueType)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {activeTicket.photoUrl && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab"/>
                    <Badge className={`border ${STATUS_CONFIG[activeTicket.status as TicketStatus].color}`}>
                      {STATUS_CONFIG[activeTicket.status as TicketStatus].icon}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activeTicket.details || '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeTicket.userName}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>

        <Dialog open={!!selectedTicket} onOpenChange={handleCloseDetails}>
          {selectedTicket && (
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>{getTranslatedIssueType(selectedTicket.issueType)}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-grow py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">{t('dialog_details_label')}</h3>
                    <p>{selectedTicket.details || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs"><strong>{t('details_user_label')}:</strong> {selectedTicket.userName}</p>
                    {selectedTicket.orderId && (
                      <p className="text-xs"><strong>{t('details_order_label')}:</strong> {selectedTicket.orderId}</p>
                    )}
                  </div>
                  <Separator />
                  {selectedTicket.photoUrl && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">{t('dialog_photo_evidence')}</h3>
                      <a href={selectedTicket.photoUrl} target="_blank" rel="noopener noreferrer" className="relative block aspect-video w-full">
                          <Image src={selectedTicket.photoUrl} alt="Support Ticket Evidence" fill className="rounded-lg border object-contain bg-black" />
                      </a>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <Badge className={`border ${STATUS_CONFIG[selectedTicket.status as TicketStatus].color}`}>
                      {STATUS_CONFIG[selectedTicket.status as TicketStatus].icon}
                      <span className='ml-2'>{getStatusLabel(selectedTicket.status as TicketStatus)}</span>
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {t('details_created_label')}:{" "}
                      {selectedTicket.createdAt instanceof Date
                        ? selectedTicket.createdAt.toLocaleString()
                        : new Date(selectedTicket.createdAt.seconds * 1000).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                {selectedTicket.status === 'new' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      updateSupportTicket(selectedTicket.id, { status: 'in_progress' });
                      handleCloseDetails();
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('action_mark_in_progress')}
                  </Button>
                )}
                {selectedTicket.status === 'in_progress' && (
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    onClick={() => {
                      updateSupportTicket(selectedTicket.id, { status: 'resolved' });
                      handleCloseDetails();
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('action_mark_resolved')}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCloseDetails}>
                  {t('dialog_close')}
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </DndContext>
  );
}
