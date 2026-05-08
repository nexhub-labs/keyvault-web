import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useVaultContext } from '../context/VaultContext';
import { LoadSpinner } from './ui/LoadSpinner';

interface VaultProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * VaultProtectedRoute - Ensures user is BOTH:
 * 1. Authenticated via Supabase (Session level)
 * 2. Vault is Unlocked (Encryption key level)
 */
export const VaultProtectedRoute = ({ children }: VaultProtectedRouteProps) => {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { isUnlocked } = useVaultContext();
    const location = useLocation();

    // 1. Show premium loader while checking the Supabase session
    if (isAuthLoading) {
        return <LoadSpinner message="Verifying session..." />;
    }

    // 2. Not logged in? Go to login.
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Logged in but Vault is still locked (e.g. after refresh)? Go to unlock.
    if (!isUnlocked) {
        return <Navigate to="/unlock-vault" state={{ from: location }} replace />;
    }

    // 4. Fully secured and unlocked.
    return <>{children}</>;
};
