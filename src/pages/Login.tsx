import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-none shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 font-for-five tracking-wide">FOR FIVE OPERATIONS</h1>
                    <p className="text-gray-500 mt-2">Sign in to manage store operations</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-none flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-black hover:bg-gray-800 text-white font-semibold rounded-none shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
