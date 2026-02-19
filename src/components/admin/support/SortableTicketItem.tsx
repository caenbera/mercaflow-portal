
// src/components/admin/support/SortableTicketItem.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupportTicket } from '@/types';
import { GripVertical, Paperclip } from 'lucide-react';
import { STATUS_CONFIG } from './ticket-board';
import { useTranslations } from 'next-intl';

interface SortableTicketItemProps {
  ticket: SupportTicket;
  onClick: () => void;
}

export function SortableTicketItem({ ticket, onClick }: SortableTicketItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { status: ticket.status },
  });

  const t = useTranslations('AdminSupportPage');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const getTranslatedIssueType = (issueType: string) => {
      const key = `issue_option_${issueType}` as any;
      const translated = t(key);
      return translated === key ? issueType : translated;
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
        <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
        <CardHeader className="pb-2 p-3">
            <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-bold line-clamp-1 pt-1">
                {getTranslatedIssueType(ticket.issueType)}
            </CardTitle>
            <div className="flex items-center gap-1 shrink-0">
                {ticket.photoUrl && <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />}
                <Badge className={`border px-1.5 h-5 text-[10px] uppercase font-bold ${STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG].color}`}>
                    {STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG].icon}
                </Badge>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()} 
                    onMouseDown={(e) => e.stopPropagation()} 
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
            </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
            <p className="text-xs text-muted-foreground line-clamp-2">
            {ticket.details || '—'}
            </p>
            <div className="flex items-center justify-between mt-2 border-t pt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {ticket.userName}
                </p>
                {ticket.orderId && (
                    <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 font-mono">
                        #{ticket.orderId.substring(0,6).toUpperCase()}
                    </Badge>
                )}
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
