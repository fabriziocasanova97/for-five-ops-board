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
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 px-4 selection:bg-black selection:text-white">
            <div className="w-full max-w-[420px] bg-white rounded-none p-10 border border-zinc-200 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-black font-for-five tracking-widest uppercase mb-2">
                        For Five
                    </h1>
                    <p className="text-zinc-500 text-xs tracking-[0.2em] uppercase font-medium">
                        Operations Portal
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-black text-white text-sm rounded-none border border-black flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="relative group pt-2">
                        <input
                            type="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            className="peer w-full px-0 py-2 bg-transparent border-b-2 border-zinc-200 text-black placeholder-transparent focus:outline-none focus:border-black transition-colors rounded-none"
                        />
                        <label
                            htmlFor="email"
                            className="absolute left-0 -top-4 text-xs font-semibold text-zinc-900 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-black cursor-text"
                        >
                            Email Address
                        </label>
                    </div>

                    <div className="relative group pt-2">
                        <input
                            type="password"
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="peer w-full px-0 py-2 bg-transparent border-b-2 border-zinc-200 text-black placeholder-transparent focus:outline-none focus:border-black transition-colors rounded-none"
                        />
                        <label
                            htmlFor="password"
                            className="absolute left-0 -top-4 text-xs font-semibold text-zinc-900 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-2 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-black cursor-text"
                        >
                            Password
                        </label>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full py-4 px-4 bg-black text-white font-semibold tracking-[0.15em] uppercase text-xs rounded-none hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Authenticating...' : 'Sign In'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
