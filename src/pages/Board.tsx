import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Filter, X } from 'lucide-react';
import TicketCard, { type Ticket } from '../components/board/TicketCard';
import TicketModal from '../components/board/TicketModal';

export default function Board() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterStore, setFilterStore] = useState('');
    const [filterPriority, setFilterPriority] = useState('');

    // Columns configuration
    const columns = [
        { id: 'pending', title: 'Pending', color: 'bg-red-50 border-red-200', titleColor: 'text-red-900' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-50 border-yellow-200', titleColor: 'text-yellow-900' },
        { id: 'resolved', title: 'Resolved', color: 'bg-blue-50 border-blue-200', titleColor: 'text-blue-900' },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [ticketsRes, storesRes] = await Promise.all([
                supabase
                    .from('tickets')
                    .select(`
                *,
                stores (name),
                profiles (full_name)
            `)
                    .order('created_at', { ascending: false }),
                supabase.from('stores').select('id, name').order('name')
            ]);

            if (ticketsRes.error) throw ticketsRes.error;
            if (storesRes.error) throw storesRes.error;

            setTickets(ticketsRes.data as any || []);
            setStores(storesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateNew = () => {
        setSelectedTicket(null);
        setIsModalOpen(true);
    };

    const handleTicketClick = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedTicket(null);
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filterStore && ticket.store_id !== filterStore) return false;
        if (filterPriority && ticket.priority !== filterPriority) return false;
        return true;
    });

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">The Operations Board</h2>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${showFilters || filterStore || filterPriority
                                ? 'bg-black border-black text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Ticket
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                {(showFilters || filterStore || filterPriority) && (
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="text-sm font-medium text-gray-700 mr-1">Filters:</div>

                        <select
                            value={filterStore}
                            onChange={(e) => setFilterStore(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                        >
                            <option value="">All Stores</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>

                        {(filterStore || filterPriority) && (
                            <button
                                onClick={() => {
                                    setFilterStore('');
                                    setFilterPriority('');
                                }}
                                className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                            >
                                <X className="w-3 h-3 mr-1" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                    </div>
                ) : (
                    <div className="flex gap-6 h-full min-w-[1000px]">
                        {columns.map((col) => (
                            <div key={col.id} className={`flex-1 flex flex-col rounded-xl border ${col.color} p-4`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold uppercase tracking-wider text-sm ${col.titleColor}`}>
                                        {col.title}
                                    </h3>
                                    <span className="bg-white/50 px-2 py-1 rounded text-xs font-medium text-gray-800">
                                        {filteredTickets.filter(t => t.status === col.id).length}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredTickets
                                        .filter((t) => t.status === col.id)
                                        .map((ticket) => (
                                            <TicketCard
                                                key={ticket.id}
                                                ticket={ticket}
                                                onClick={handleTicketClick}
                                            />
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TicketModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                ticket={selectedTicket}
                onTicketUpdated={fetchData}
            />
        </div>
    );
}
