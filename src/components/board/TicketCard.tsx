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
    created_at: string;
    created_by: string;
    stores?: { name: string }; // Joined data
    profiles?: { full_name: string }; // Joined data
};

interface TicketCardProps {
    ticket: Ticket;
    onClick: (ticket: Ticket) => void;
}

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
    const priorityColor = {
        low: 'bg-gray-100 text-gray-600 border-gray-200',
        medium: 'bg-gray-100 text-gray-900 border-gray-300',
        high: 'bg-black text-white border-black',
    }[ticket.priority];

    return (
        <div
            onClick={() => onClick(ticket)}
            className="bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wide border ${priorityColor}`}>
                    {ticket.priority}
                </span>
                {ticket.status !== 'pending' && (
                    <span className="text-xs text-gray-400 font-medium">
                        {ticket.status.replace('-', ' ')}
                    </span>
                )}
            </div>

            <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors line-clamp-2">
                {ticket.title}
            </h4>

            <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span className="truncate">{ticket.stores?.name || 'Unknown Store'}</span>
                </div>

                <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                </div>

                <div className="text-xs text-gray-400 mt-1">
                    By: {ticket.profiles?.full_name || 'Unknown'}
                </div>
            </div>
        </div>
    );
}
