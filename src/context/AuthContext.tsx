import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: 'manager' | 'ops' | null;
    profile: { full_name: string | null } | null;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'manager' | 'ops' | null>(null);
    const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchUserRole(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
            } else {
                setRole(data?.role as 'manager' | 'ops' | null);
                setProfile({ full_name: data?.full_name });
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
        } finally {
            setLoading(false);
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        user,
        session,
        loading,
        role,
        profile,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
