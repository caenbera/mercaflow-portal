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
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { updateSupportTicket } from '@/lib/firestore/tickets';
import { SupportTicket } from '@/types';
import { CircleAlert, Clock, CheckCircle2, Loader2, GripVertical } from 'lucide-react';
import { SortableTicketItem } from './SortableTicketItem';

const VALID_STATUSES = ['new', 'in_progress', 'resolved'] as const;

export const STATUS_CONFIG: Record<(typeof VALID_STATUSES)[number], { label: string; color: string; icon: React.ReactNode }> = {
  new: {
    label: 'Nuevo',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Clock className="h-4 w-4" />,
  },
  in_progress: {
    label: 'En progreso',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <CircleAlert className="h-4 w-4" />,
  },
  resolved: {
    label: 'Resuelto',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

interface TicketBoardProps {
  tickets: SupportTicket[];
}

export function TicketBoard({ tickets }: TicketBoardProps) {
  const [columns, setColumns] = useState<Record<(typeof VALID_STATUSES)[number], SupportTicket[]>>({
    new: [],
    in_progress: [],
    resolved: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const newCols: Record<(typeof VALID_STATUSES)[number], SupportTicket[]> = {
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
      const status = ticket.status as (typeof VALID_STATUSES)[number];
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Soporte Técnico</h2>
          <div className="w-64">
            <Input
              placeholder="Buscar por tipo o detalles..."
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
                  <span className="ml-2">{STATUS_CONFIG[status].label}</span>
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
                    Arrastra tickets aquí
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
                    {activeTicket.issueType}
                  </CardTitle>
                  <Badge className={`border ${STATUS_CONFIG[activeTicket.status].color}`}>
                    {STATUS_CONFIG[activeTicket.status].icon}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activeTicket.details || 'Sin detalles'}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>

        <Dialog open={!!selectedTicket} onOpenChange={handleCloseDetails}>
          {selectedTicket && (
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>{selectedTicket.issueType}</DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-grow py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Detalles</h3>
                    <p>{selectedTicket.details || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs"><strong>Usuario:</strong> {selectedTicket.userName}</p>
                    {selectedTicket.orderId && (
                      <p className="text-xs"><strong>Orden:</strong> {selectedTicket.orderId}</p>
                    )}
                  </div>
                  <Separator />
                  {selectedTicket.photoUrl && (
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">Evidencia Fotográfica</h3>
                      <a href={selectedTicket.photoUrl} target="_blank" rel="noopener noreferrer">
                          <Image src={selectedTicket.photoUrl} alt="Support Ticket Evidence" width={500} height={300} className="rounded-lg border object-cover" />
                      </a>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center">
                    <Badge className={`border ${STATUS_CONFIG[selectedTicket.status].color}`}>
                      {STATUS_CONFIG[selectedTicket.status].icon}
                      {STATUS_CONFIG[selectedTicket.status].label}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      Creado:{" "}
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
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Marcar como En Progreso'}
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
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Marcar como Resuelto'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCloseDetails}>
                  Cerrar
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </DndContext>
  );
}
