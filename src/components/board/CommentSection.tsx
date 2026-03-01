import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Send, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Comment = {
    id: string;
    ticket_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: { full_name: string };
};

interface CommentSectionProps {
    ticketId: string;
}

export default function CommentSection({ ticketId }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        fetchComments();

        // Subscribe to new comments
        const subscription = supabase
            .channel(`comments:${ticketId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `ticket_id=eq.${ticketId}`
            }, (payload) => {
                // Fetch full comment to get profile data
                fetchSingleComment(payload.new.id);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [ticketId]);

    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    async function fetchComments() {
        const { data, error } = await supabase
            .from('comments')
            .select(`
        *,
        profiles (full_name)
      `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error);
        } else {
            setComments(data as any);
        }
    }

    async function fetchSingleComment(commentId: string) {
        const { data } = await supabase
            .from('comments')
            .select(`*, profiles (full_name)`)
            .eq('id', commentId)
            .single();

        if (data) {
            setComments((prev) => {
                // Avoid duplicates
                if (prev.find(c => c.id === data.id)) return prev;
                return [...prev, data as any];
            });
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!user) {
            setSubmitError("You must be logged in to comment.");
            return;
        }

        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    ticket_id: ticketId,
                    user_id: user.id,
                    content: newComment.trim(),
                })
                .select('*, profiles(full_name)')
                .single();

            if (error) {
                console.error('Supabase error adding comment:', error);
                // Check for FK violation specifically
                if (error.code === '23503') { // foreign_key_violation
                    throw new Error("Your user profile is missing. Please contact support or run the profile backfill script.");
                }
                throw error;
            }

            if (data) {
                setComments((prev) => {
                    // Avoid duplicates if realtime picks it up fast
                    if (prev.find(c => c.id === data.id)) return prev;
                    return [...prev, data as any];
                });
            }

            setNewComment('');
        } catch (error: any) {
            console.error('Error adding comment catch block:', error);
            setSubmitError(error.message || "Failed to add comment");
            alert(`Error: ${error.message || "Failed to add comment"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[400px] bg-white border border-black">
            <div className="p-4 border-b border-black bg-white">
                <h4 className="text-sm font-bold text-black uppercase tracking-wide">Comments</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 text-sm">
                        No comments yet. Start the conversation!
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className={`flex gap-3 ${comment.user_id === user?.id ? 'flex-row-reverse' : ''}`}
                        >
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-100 border border-black flex items-center justify-center text-black rounded-none">
                                    <UserIcon size={14} />
                                </div>
                            </div>
                            <div
                                className={`max-w-[80%] p-3 text-sm rounded-none border border-black ${comment.user_id === user?.id
                                    ? 'bg-black text-white'
                                    : 'bg-white text-gray-900'
                                    }`}
                            >
                                <div className={`text-xs mb-1 font-bold tracking-wide uppercase ${comment.user_id === user?.id ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                    {comment.profiles?.full_name || 'Unknown'} • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </div>
                                <p>{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
                {submitError && (
                    <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 border border-red-100">
                        {submitError}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none rounded-none transition-colors"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !newComment.trim()}
                        className="px-4 py-2 bg-black text-white hover:bg-gray-800 border border-black disabled:opacity-50 transition-colors rounded-none"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
