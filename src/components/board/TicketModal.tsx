import React, { useState, useEffect } from 'react';
import { X, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Ticket } from './TicketCard';
import CommentSection from './CommentSection';

// Types for Resources
export interface Resource {
    id: string;
    name: string;
}

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
    const [category, setCategory] = useState('');
    const [storeId, setStoreId] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [status, setStatus] = useState<'pending' | 'in-progress' | 'resolved'>('pending');

    const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);

    // Resource State
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
    const [newResourceName, setNewResourceName] = useState('');

    // Comments State (TODO: Implement comments fetching and posting)
    const [initialComment, setInitialComment] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchStores();
            if (ticket) {
                setTitle(ticket.title);
                setDescription(ticket.description || '');
                setPriority(ticket.priority);
                setCategory(ticket.category || '');
                setStoreId(ticket.store_id);
                setAssignedTo(ticket.assigned_to || '');
                setStatus(ticket.status);
            } else {
                // Reset form for new ticket
                setTitle('');
                setDescription('');
                setPriority('medium');
                setCategory('');
                setStatus('pending');
                setAssignedTo('');
                // Optionally set default store if user has a preference, or empty
                setStoreId('');
                setSelectedResourceIds([]);
                setInitialComment('');
            }
        }
    }, [isOpen, ticket]);

    async function fetchStores() {
        const [storesRes, usersRes, resourcesRes] = await Promise.all([
            supabase.from('stores').select('id, name').order('name'),
            role === 'ops' ? supabase.from('profiles').select('id, full_name').order('full_name') : Promise.resolve({ data: [] }),
            supabase.from('resources').select('*').order('name')
        ]);

        if (storesRes.data) setStores(storesRes.data);
        if (usersRes.data) setUsers(usersRes.data as any);
        if (resourcesRes.data) setAllResources(resourcesRes.data);

        // Fetch ticket resources if a ticket exists
        if (ticket) {
            const { data } = await supabase
                .from('ticket_resources')
                .select('resource_id')
                .eq('ticket_id', ticket.id);
            if (data) {
                setSelectedResourceIds(data.map(tr => tr.resource_id));
            }
        }
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
                updates.category = category || null;

                if (role === 'ops') {
                    updates.priority = priority;
                    updates.status = status;
                    updates.assigned_to = assignedTo || null;
                }

                console.log('Updating ticket:', ticket.id, updates);
                const { data, error } = await supabase
                    .from('tickets')
                    .update(updates)
                    .eq('id', ticket.id)
                    .select();

                console.log('Ticket update result:', data, error);

                if (error) throw error;
                if (!data || data.length === 0) {
                    throw new Error('No rows updated. You might not have permission to update this ticket.');
                }
            } else {
                // Create new ticket
                console.log('Creating ticket:', title, description);
                const { data, error } = await supabase
                    .from('tickets')
                    .insert({
                        title,
                        description,
                        priority,
                        category: category || null,
                        store_id: storeId,
                        created_by: user?.id,
                        status: 'pending', // Default
                        assigned_to: role === 'ops' ? (assignedTo || null) : null,
                    })
                    .select();

                console.log('Ticket creation result:', data, error);

                if (error) throw error;
                if (!data || data.length === 0) {
                    throw new Error('No rows created. You might not have permission to create tickets.');
                }

                if (data && data[0] && initialComment.trim()) {
                    const ticketId = data[0].id;
                    const { error: commentError } = await supabase
                        .from('comments')
                        .insert({
                            ticket_id: ticketId,
                            user_id: user?.id,
                            content: initialComment.trim()
                        });
                    if (commentError) console.error("Error creating initial comment:", commentError);
                }

                // If ops created a new ticket, we need to add the resources
                if (role === 'ops' && data[0] && selectedResourceIds.length > 0) {
                    const ticketId = data[0].id;
                    const resourceInserts = selectedResourceIds.map(rid => ({
                        ticket_id: ticketId,
                        resource_id: rid
                    }));
                    const { error: trError } = await supabase.from('ticket_resources').insert(resourceInserts);
                    if (trError) console.error("Error setting resources for new ticket:", trError);
                }
            }

            // If updating an existing ticket as ops, manage resources
            if (ticket && role === 'ops') {
                // To keep it simple, delete all existing resources for this ticket, then re-insert
                const { error: delError } = await supabase
                    .from('ticket_resources')
                    .delete()
                    .eq('ticket_id', ticket.id);

                if (delError) console.error("Error clearing old resources:", delError);

                if (selectedResourceIds.length > 0) {
                    const resourceInserts = selectedResourceIds.map(rid => ({
                        ticket_id: ticket.id,
                        resource_id: rid
                    }));
                    const { error: insError } = await supabase.from('ticket_resources').insert(resourceInserts);
                    if (insError) console.error("Error attaching resources:", insError);
                }
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

    const handleCreateResource = async () => {
        if (!newResourceName.trim()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('resources')
                .insert({ name: newResourceName.trim() })
                .select();

            if (error) {
                // Handle duplicate unique constraint gracefully if possible
                if (error.code === '23505') {
                    alert('A resource with this name already exists.');
                } else {
                    throw error;
                }
            } else if (data && data[0]) {
                const newResource = data[0] as Resource;
                setAllResources(prev => [...prev, newResource].sort((a, b) => a.name.localeCompare(b.name)));
                setSelectedResourceIds(prev => [...prev, newResource.id]);
                setNewResourceName('');
            }
        } catch (error) {
            console.error('Error creating resource:', error);
            alert('Failed to create resource');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-none">
                {/* Header */}
                <div className="px-6 py-5 border-b border-black flex justify-between items-center bg-white">
                    <div>
                        <h3 className="text-3xl font-bold text-black font-[family-name:--font-for-five] tracking-tight uppercase">
                            {ticket ? 'Ticket Details' : 'New Ticket'}
                        </h3>
                        {ticket && (
                            <p className="text-xs font-bold text-gray-500 mt-1.5 uppercase tracking-wide">
                                Created by <span className="text-black">{ticket.profiles?.full_name || 'Unknown'}</span> on {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="ticket-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-base font-medium text-black placeholder:text-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none transition-colors"
                                    placeholder="e.g., POS System Offline"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">Store</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={storeId}
                                        onChange={(e) => setStoreId(e.target.value)}
                                        className="w-full px-3 py-2 text-base font-medium text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white appearance-none pr-10 rounded-none transition-colors"
                                    >
                                        <option value="">Select a store</option>
                                        {stores.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">Priority</label>
                                <div className="relative">
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full px-3 py-2 text-base font-medium text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white appearance-none pr-10 rounded-none transition-colors"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">Category</label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 text-base font-medium text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white appearance-none pr-10 rounded-none transition-colors"
                                    >
                                        <option value="">Select a category</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Inventory">Inventory</option>
                                        <option value="Modbar">Modbar</option>
                                        <option value="Steamers">Steamers</option>
                                        <option value="Bathroom">Bathroom</option>
                                        <option value="Kitchen">Kitchen</option>
                                        <option value="HVAC">HVAC</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            {role === 'ops' && ticket && (
                                <div>
                                    <label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">Status</label>
                                    <div className="relative">
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value as any)}
                                            className="w-full px-3 py-2 text-base font-medium text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white appearance-none pr-10 rounded-none transition-colors"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {role === 'ops' && (
                                <div>
                                    <label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">Assign To</label>
                                    <div className="relative">
                                        <select
                                            value={assignedTo}
                                            onChange={(e) => setAssignedTo(e.target.value)}
                                            className="w-full px-3 py-2 text-base font-medium text-black border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white appearance-none pr-10 rounded-none transition-colors"
                                        >
                                            <option value="">Unassigned</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>{u.full_name || 'Unnamed'}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-xs font-bold text-black uppercase tracking-wide mb-1.5">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 text-base font-medium text-black placeholder:text-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none resize-none rounded-none transition-colors"
                                    placeholder="Detailed description of the issue..."
                                />
                            </div>
                        </div>

                        {/* Resources Section */}
                        {(role === 'ops' || selectedResourceIds.length > 0) && (
                            <div className="pt-6 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-black uppercase tracking-wide mb-3">Resources</h4>
                                {role === 'ops' ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newResourceName}
                                                onChange={(e) => setNewResourceName(e.target.value)}
                                                className="flex-1 px-3 py-2 text-base font-medium text-black placeholder:text-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none transition-colors"
                                                placeholder="Add new resource..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleCreateResource();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleCreateResource}
                                                disabled={!newResourceName.trim() || loading}
                                                className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-gray-800 disabled:opacity-50 transition-colors rounded-none"
                                            >
                                                Create
                                            </button>
                                        </div>

                                        {allResources.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {allResources.map(resource => {
                                                    const isSelected = selectedResourceIds.includes(resource.id);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={resource.id}
                                                            onClick={() => {
                                                                setSelectedResourceIds(prev =>
                                                                    isSelected
                                                                        ? prev.filter(id => id !== resource.id)
                                                                        : [...prev, resource.id]
                                                                );
                                                            }}
                                                            className={`px-3 py-1 text-xs font-bold uppercase tracking-wide border transition-colors rounded-none ${isSelected
                                                                ? 'bg-black text-white border-black'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                                                }`}
                                                        >
                                                            {resource.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {allResources.filter(r => selectedResourceIds.includes(r.id)).length > 0 ? (
                                            allResources.filter(r => selectedResourceIds.includes(r.id)).map(resource => (
                                                <span key={resource.id} className="px-3 py-1 bg-white text-black border border-black text-xs font-bold uppercase tracking-wide rounded-none">
                                                    {resource.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs font-medium text-gray-500">No resources assigned.</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Comments Section */}
                        {ticket ? (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <CommentSection ticketId={ticket.id} />
                            </div>
                        ) : (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-black uppercase tracking-wide mb-3">Initial Comment (mandatory)</h4>
                                <div className="p-4 bg-gray-50 border border-gray-200">
                                    <textarea
                                        required
                                        rows={3}
                                        value={initialComment}
                                        onChange={(e) => setInitialComment(e.target.value)}
                                        className="w-full px-3 py-2 text-base font-medium text-black placeholder:text-gray-400 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none resize-none rounded-none transition-colors"
                                        placeholder="What steps have you taken so far to try and solve this issue?"
                                    />
                                </div>
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
                            className="flex items-center text-red-600 hover:text-red-700 text-xs font-bold uppercase tracking-wide transition-colors"
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
                            className="px-4 py-2 text-gray-700 hover:text-black text-xs font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors rounded-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="ticket-form"
                            disabled={loading || (!ticket && !initialComment.trim())}
                            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-gray-800 shadow-sm hover:shadow-md disabled:opacity-50 transition-all rounded-none"
                        >
                            {loading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
