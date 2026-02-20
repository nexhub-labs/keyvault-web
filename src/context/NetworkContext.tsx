import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkContextType {
    isServerReachable: boolean;
    isOnline: boolean;
    isChecking: boolean;
    setServerReachable: (status: boolean) => void;
    checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
    const [isServerReachable, setIsServerReachable] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isChecking, setIsChecking] = useState(false);

    const checkConnection = async (): Promise<boolean> => {
        if (!navigator.onLine) {
            setIsServerReachable(false);
            return false;
        }

        setIsChecking(true);
        try {
            // Use a short timeout to prevent long hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${import.meta.env.VITE_KEYVAULT_SERVER}/health`, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeoutId);

            const reachable = res.ok;
            setIsServerReachable(reachable);
            return reachable;
        } catch (error) {
            setIsServerReachable(false);
            return false;
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        let pollingTimer: ReturnType<typeof setTimeout>;
        let backoffDelay = 2000; // Start with 2s
        const maxDelay = 30000; // Max 30s

        const startPolling = async () => {
            const connected = await checkConnection();
            if (!connected) {
                backoffDelay = Math.min(backoffDelay * 1.5, maxDelay);
                pollingTimer = setTimeout(startPolling, backoffDelay);
            } else {
                backoffDelay = 2000; // Reset on success
            }
        };

        const handleOnline = () => {
            setIsOnline(true);
            startPolling();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setIsServerReachable(false);
            clearTimeout(pollingTimer);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const handleNetworkError = () => {
            setIsServerReachable(false);
            startPolling();
        };
        window.addEventListener('keyvault-network-error', handleNetworkError);

        // Initial check if we start offline/unreachable
        if (!navigator.onLine || !isServerReachable) {
            startPolling();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('keyvault-network-error', handleNetworkError);
            clearTimeout(pollingTimer);
        };
    }, []);

    return (
        <NetworkContext.Provider value={{ isServerReachable, isOnline, isChecking, setServerReachable: setIsServerReachable, checkConnection }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};
