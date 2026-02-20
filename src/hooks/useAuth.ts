import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';

interface UseAuthOptions {
    /** If true, redirect to the specified path when a session is detected */
    redirectIfAuthenticated?: boolean;
    /** Path to redirect to when authenticated (default: '/unlock-vault') */
    redirectTo?: string;
}

interface UseAuthReturn {
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

/**
 * Hook for managing Supabase authentication state.
 * Can optionally redirect authenticated users away from public pages (login/signup).
 */
export const useAuth = (options: UseAuthOptions = {}): UseAuthReturn => {
    const { redirectIfAuthenticated = false, redirectTo = '/unlock-vault' } = options;

    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);

            if (session && redirectIfAuthenticated) {
                navigate(redirectTo, { replace: true });
            } else {
                setIsLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);

            if (session && redirectIfAuthenticated) {
                navigate(redirectTo, { replace: true });
            } else {
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate, redirectIfAuthenticated, redirectTo]);

    return {
        session,
        isLoading,
        isAuthenticated: !!session,
    };
};
