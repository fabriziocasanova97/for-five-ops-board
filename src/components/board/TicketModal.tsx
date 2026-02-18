import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Ticket } from './TicketCard';
import CommentSection from './CommentSection';

interface TicketModalProps {
    ticket?: Ticket | null; // If null, we are creating a new ticket
    isOpen: boolean;
    onClose: () => void;
    onTicketUpdated: () => void; // Refresh board
}

export default function TicketModal({ ticket, isOpen, onClose, onTicketUpdated }: TicketModalProps) {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [storeId, setStoreId] = useState('');
    const [status, setStatus] = useState<'pending' | 'in-progress' | 'resolved'>('pending');

    // Comments State (TODO: Implement comments fetching and posting)

    useEffect(() => {
        if (isOpen) {
            fetchStores();
            if (ticket) {
                setTitle(ticket.title);
                setDescription(ticket.description || '');
                setPriority(ticket.priority);
                setStoreId(ticket.store_id);
                setStatus(ticket.status);
            } else {
                // Reset form for new ticket
                setTitle('');
                setDescription('');
                setPriority('medium');
                setStatus('pending');
                // Optionally set default store if user has a preference, or empty
                setStoreId('');
            }
        }
    }, [isOpen, ticket]);

    async function fetchStores() {
        const { data } = await supabase.from('stores').select('id, name').order('name');
        if (data) setStores(data);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (ticket) {
                // Update existing ticket
                const updates: any = {};
                // Managers can only update description? Or maybe they shouldn't edit after creation?
                // Let's assume for now they can edit content. Ops can edit everything.
                // We'll send all fields but RLS might block some if we aren't careful.
                // Actually, the requirements said: 
                // Ops: Update status, delete.
                // Manager: Create.
                // Let's allow updating title/desc for both (if they own it), and status/priority for Ops.

                updates.title = title;
                updates.description = description;
                updates.store_id = storeId;

                if (role === 'ops') {
                    updates.priority = priority;
                    updates.status = status;
                }

                const { error } = await supabase
                    .from('tickets')
                    .update(updates)
                    .eq('id', ticket.id);

                if (error) throw error;
            } else {
                // Create new ticket
                const { error } = await supabase
                    .from('tickets')
                    .insert({
                        title,
                        description,
                        priority,
                        store_id: storeId,
                        created_by: user?.id,
                        status: 'pending', // Default
                    });

                if (error) throw error;
            }

            onTicketUpdated();
            onClose();
        } catch (error) {
            console.error('Error saving ticket:', error);
            alert('Failed to save ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!ticket || !confirm('Are you sure you want to delete this ticket?')) return;
        try {
            const { error } = await supabase.from('tickets').delete().eq('id', ticket.id);
            if (error) throw error;
            onTicketUpdated();
            onClose();
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('Failed to delete ticket');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            {ticket ? 'Ticket Details' : 'New Ticket'}
                        </h3>
                        {ticket && (
                            <p className="text-sm text-gray-500 mt-1">
                                Created by <span className="font-medium text-gray-700">{ticket.profiles?.full_name || 'Unknown'}</span> on {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="ticket-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                                    placeholder="e.g., POS System Offline"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                                <select
                                    required
                                    value={storeId}
                                    onChange={(e) => setStoreId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                                >
                                    <option value="">Select a store</option>
                                    {stores.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {role === 'ops' && ticket && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                            )}

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none"
                                    placeholder="Detailed description of the issue..."
                                />
                            </div>
                        </div>

                        {/* Comments Section */}
                        {ticket && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <CommentSection ticketId={ticket.id} />
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    {role === 'ops' && ticket ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Ticket
                        </button>
                    ) : (
                        <div></div> // Spacer
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="ticket-form"
                            disabled={loading}
                            className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
