import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Filter, X, Menu, ChevronDown } from 'lucide-react';
import TicketCard, { type Ticket } from '../components/board/TicketCard';
import TicketModal from '../components/board/TicketModal';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    pointerWithin,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableTicket from '../components/board/SortableTicket';
import { useDroppable } from '@dnd-kit/core';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContextType } from '../components/layout/Layout';

function DroppableColumn({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={className}>
            {children}
        </div>
    );
}

export default function Board() {
    const { setIsMobileMenuOpen } = useOutletContext<LayoutContextType>();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [originalStatus, setOriginalStatus] = useState<string | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterStore, setFilterStore] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // ... (existing code)

    const filteredTickets = tickets.filter(ticket => {
        if (filterStore && ticket.store_id !== filterStore) return false;
        if (filterPriority && ticket.priority !== filterPriority) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                ticket.title.toLowerCase().includes(query) ||
                (ticket.description && ticket.description.toLowerCase().includes(query))
            );
        }
        return true;
    });

    // Columns configuration
    const columns = [
        { id: 'pending', title: 'Pending', color: 'bg-white border-t-[6px] border-t-red-700 border-x-gray-200 border-b-gray-200 shadow-sm', titleColor: 'text-gray-900' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-white border-t-[6px] border-t-yellow-500 border-x-gray-200 border-b-gray-200 shadow-sm', titleColor: 'text-gray-900' },
        { id: 'resolved', title: 'Resolved', color: 'bg-white border-t-[6px] border-t-blue-700 border-x-gray-200 border-b-gray-200 shadow-sm', titleColor: 'text-gray-900' },
    ];

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // Enable click on child elements
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        // setLoading(true); // Don't block UI with loading on background refresh if possible, but keep for now
        try {
            console.log('Fetching tickets...');
            const [ticketsRes, storesRes] = await Promise.all([
                supabase
                    .from('tickets')
                    .select(`
                *,
                stores (name),
                profiles:profiles!created_by (full_name),
                assignee:profiles!assigned_to (full_name)
            `)
                    .order('created_at', { ascending: false }),
                supabase.from('stores').select('id, name').order('name')
            ]);

            if (ticketsRes.error) throw ticketsRes.error;
            if (storesRes.error) throw storesRes.error;

            console.log('Fetched tickets:', ticketsRes.data?.length, ticketsRes.data);
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
        setActiveId(null);
    };

    // Drag and Drop Handlers
    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
        const ticket = tickets.find(t => t.id === event.active.id);
        if (ticket) {
            setOriginalStatus(ticket.status);
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the tickets
        const activeTicket = tickets.find(t => t.id === activeId);
        const overTicket = tickets.find(t => t.id === overId);

        if (!activeTicket) return;

        const activeStatus = activeTicket.status;
        // If over a ticket, use its status; if over a column, use the column id
        const overStatus = overTicket ? overTicket.status : overId;

        if (activeStatus !== overStatus) {
            setTickets((items) => {
                return items.map(t => {
                    if (t.id === activeId) {
                        return { ...t, status: overStatus as any };
                    }
                    return t;
                });
            });
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) {
            setOriginalStatus(null);
            return;
        }

        const overStatus = (tickets.find(t => t.id === over.id)?.status || over.id) as Ticket['status'];

        if (originalStatus && originalStatus !== overStatus) {
            // Optimistic update status in DB
            updateTicketStatus(active.id as string, overStatus);
        }

        setOriginalStatus(null);
    }

    async function updateTicketStatus(ticketId: string, newStatus: string) {
        console.log(`Updating ticket ${ticketId} to ${newStatus}`);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .update({ status: newStatus })
                .eq('id', ticketId)
                .select();

            if (error) throw error;
            console.log('Update result:', data);

            if (!data || data.length === 0) {
                // If RLS blocked it, throw error to trigger revert
                throw new Error('No rows updated (RLS blockage likely)');
            }
        } catch (error) {
            console.error('Error updating ticket status:', error);
            alert('Failed to update ticket status. You may not have permission.');
            fetchData(); // Revert on error
        }
    }

    // (Old filteredTickets removed)

    const [activeTab, setActiveTab] = useState('pending');

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col gap-4 mb-6 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* ... (Header) ... */}
                    <h2 className="text-2xl font-bold text-gray-800">The Operations Board</h2>

                    {/* ... (Bottom Nav) ... */}
                    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-30 flex items-center justify-around px-2 md:static md:h-auto md:p-0 md:bg-transparent md:border-0 md:z-auto md:justify-start md:gap-3">
                        {/* ... (Buttons) ... */}
                        {/* Left: Menu */}
                        <button
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="md:hidden flex flex-col items-center justify-center w-16 h-full text-gray-500 hover:text-black hover:bg-gray-50 active:scale-95 transition-all"
                            aria-label="Menu"
                        >
                            <Menu className="w-5 h-5 mb-1" />
                            <span className="text-[10px] font-medium">Menu</span>
                        </button>

                        {/* Center: New Ticket */}
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-full shadow-lg active:scale-95 transition-all mx-4 md:mx-0 md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-none md:shadow-sm"
                        >
                            <Plus className="w-6 h-6 md:w-4 md:h-4 md:mr-2" />
                            <span className="hidden md:inline text-sm font-bold">New Ticket</span>
                        </button>

                        {/* Right: Filter */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex flex-col items-center justify-center w-16 h-full text-gray-500 hover:text-black hover:bg-gray-50 active:scale-95 transition-all md:flex-row md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-none md:border md:border-gray-300 ${showFilters || filterStore || filterPriority || searchQuery
                                ? 'text-black font-semibold bg-gray-50'
                                : ''
                                }`}
                            aria-label="Filter"
                        >
                            <Filter className="w-5 h-5 mb-1 md:mb-0 md:mr-2 md:w-4 md:h-4" />
                            <span className="text-[10px] font-medium md:text-sm">Filter</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Tab Navigation */}
                <div className="md:hidden flex p-1 bg-gray-100 rounded-lg mx-4 mt-2">
                    {columns.map((col) => (
                        <button
                            key={col.id}
                            onClick={() => setActiveTab(col.id)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === col.id
                                ? 'bg-white text-black shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {col.title}
                            <span className="ml-1.5 text-[10px] opacity-70">
                                {filteredTickets.filter(t => t.status === col.id).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                {(showFilters || filterStore || filterPriority || searchQuery) && (
                    <div className="fixed bottom-16 left-0 right-0 z-20 md:static md:z-auto flex flex-wrap items-center gap-3 p-3 bg-white border-t md:border border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-sm animate-in fade-in slide-in-from-bottom-2 md:slide-in-from-top-2">
                        <div className="w-full md:w-auto mb-2 md:mb-0">
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-none focus:ring-2 focus:ring-black outline-none"
                            />
                        </div>

                        <div className="text-sm font-medium text-gray-700 mr-1 hidden md:block">Filters:</div>

                        <select
                            value={filterStore}
                            onChange={(e) => setFilterStore(e.target.value)}
                            className="flex-1 md:flex-none px-3 py-1.5 text-sm border border-gray-300 focus:ring-2 focus:ring-black outline-none"
                        >
                            <option value="">All Stores</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="flex-1 md:flex-none px-3 py-1.5 text-sm border border-gray-300 focus:ring-2 focus:ring-black outline-none"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>

                        {(filterStore || filterPriority || searchQuery) && (
                            <button
                                onClick={() => {
                                    setFilterStore('');
                                    setFilterPriority('');
                                    setSearchQuery('');
                                }}
                                className="w-full md:w-auto ml-auto text-xs text-red-600 hover:text-red-800 font-medium flex items-center justify-center md:justify-start mt-2 md:mt-0"
                            >
                                <X className="w-3 h-3 mr-1" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 min-h-0 overflow-x-auto pb-24 md:pb-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin h-12 w-12 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <div className="flex gap-6 h-full md:min-w-[1000px] px-4 md:px-0">
                            {columns.map((col) => (
                                <DroppableColumn
                                    key={col.id}
                                    id={col.id}
                                    className={`flex-1 flex flex-col border ${col.color} p-4 ${activeTab === col.id ? 'flex' : 'hidden md:flex'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-4 shrink-0">
                                        <h3 className={`font-semibold uppercase tracking-wider text-sm ${col.titleColor}`}>
                                            {col.title}
                                        </h3>
                                        <span className="bg-white/50 px-2 py-1 text-xs font-medium text-gray-800 rounded-sm shadow-sm border border-gray-100">
                                            {filteredTickets.filter(t => t.status === col.id).length}
                                        </span>
                                    </div>

                                    <div className="relative flex-1 min-h-0 flex flex-col">
                                        {/* The scrollable area */}
                                        <div className="flex-1 space-y-3 overflow-y-auto pr-6 md:pr-2 custom-scrollbar pb-10">
                                            <SortableContext
                                                items={filteredTickets.filter(t => t.status === col.id).map(t => t.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {filteredTickets
                                                    .filter((t) => t.status === col.id)
                                                    .map((ticket) => (
                                                        <SortableTicket
                                                            key={ticket.id}
                                                            ticket={ticket}
                                                            onClick={handleTicketClick}
                                                        />
                                                    ))}
                                            </SortableContext>
                                        </div>

                                        {/* Mobile scroll visual indicator (only if there are 3+ tickets) */}
                                        {filteredTickets.filter(t => t.status === col.id).length > 2 && (
                                            <div className="md:hidden absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none flex flex-col justify-end items-center pb-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 backdrop-blur-sm rounded-full shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] border border-black/10 text-[10px] font-bold text-gray-600 uppercase tracking-widest animate-bounce">
                                                    Scroll
                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DroppableColumn>
                            ))}
                        </div>
                    )}
                </div>
                {/* ... (DragOverlay & Modal) ... */}

                <DragOverlay>
                    {activeId ? (
                        <TicketCard
                            ticket={tickets.find((t) => t.id === activeId)!}
                            onClick={() => { }}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>



            <TicketModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                ticket={selectedTicket}
                onTicketUpdated={fetchData}
            />
        </div>
    );
}
