import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Save, User as UserIcon } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    async function fetchProfile() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user?.id)
                .single();

            if (error) throw error;
            if (data?.full_name) {
                setFullName(data.full_name);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user?.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            // Reload window to update context (or we could expose a refresh function)
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">Profile Settings</h3>
                </div>

                <div className="p-6">
                    {message && (
                        <div className={`mb-4 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                disabled
                                value={user?.email || ''}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Nicole Manager"
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
