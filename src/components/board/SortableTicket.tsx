import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TicketCard, { type Ticket } from './TicketCard';

interface SortableTicketProps {
    ticket: Ticket;
    onClick: (ticket: Ticket) => void;
}

export default function SortableTicket({ ticket, onClick }: SortableTicketProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ticket.id, data: { ...ticket } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TicketCard ticket={ticket} onClick={onClick} />
        </div>
    );
}
