import { Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// To be moved to types.ts later or imported from shared types
export type Ticket = {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'resolved';
    priority: 'low' | 'medium' | 'high';
    store_id: string;
    assigned_to?: string; // New field
    category?: string;
    created_at: string;
    created_by: string;
    stores?: { name: string }; // Joined data
    profiles?: { full_name: string }; // Joined data (creator)
    assignee?: { full_name: string }; // Joined data (assignee)
};

interface TicketCardProps {
    ticket: Ticket;
    onClick: (ticket: Ticket) => void;
}

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
    const priorityColor = {
        low: 'bg-white text-gray-500 border-gray-200',
        medium: 'bg-gray-100 text-gray-900 border-gray-300',
        high: 'bg-black text-white border-black',
    }[ticket.priority];

    return (
        <div
            onClick={() => onClick(ticket)}
            className="bg-white p-4 border border-gray-200 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 cursor-pointer group rounded-none"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide border ${priorityColor}`}>
                        {ticket.priority}
                    </span>
                    {ticket.category && (
                        <span className="px-2 py-0.5 text-xs font-bold text-black bg-white border border-black uppercase tracking-wide">
                            {ticket.category}
                        </span>
                    )}
                </div>
                {ticket.status !== 'pending' && (
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                        {ticket.status.replace('-', ' ')}
                    </span>
                )}
            </div>

            <h4 className="font-bold text-gray-900 mb-2 group-hover:text-black transition-colors line-clamp-2">
                {ticket.title}
            </h4>

            <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span className="truncate">{ticket.stores?.name || 'Unknown Store'}</span>
                </div>

                <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                    <span>By: {ticket.profiles?.full_name || 'Unknown'}</span>
                    {ticket.assignee && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            To: {ticket.assignee.full_name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
