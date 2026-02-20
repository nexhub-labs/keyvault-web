import { useState, useEffect } from "react";
import { useNetwork } from "../context/NetworkContext";

export interface ServiceStatus {
    status: "healthy" | "unhealthy" | "degraded";
    error?: string | null;
}

export interface HealthData {
    status: "ok" | "degraded" | "down";
    version: string;
    timestamp: string;
    services: {
        database: {
            status: "healthy" | "unhealthy";
            readyState?: number;
        };
        supabase: ServiceStatus;
    };
}

export const useSystemStatus = (refreshInterval = 60000) => {
    const { isServerReachable } = useNetwork();
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_KEYVAULT_SERVER}/health?public=true`);
            const data = await response.json();
            setHealth(data);
        } catch (error) {
            console.error("Failed to fetch status:", error);
            setHealth({
                status: "down",
                version: "unknown",
                timestamp: new Date().toISOString(),
                services: {
                    database: { status: "unhealthy" },
                    supabase: { status: "unhealthy" }
                }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isServerReachable) {
            fetchStatus();
            const interval = setInterval(fetchStatus, refreshInterval);
            return () => clearInterval(interval);
        } else {
            setHealth(prev => prev ? { ...prev, status: "down" } : null);
            setLoading(false);
        }
    }, [isServerReachable, refreshInterval]);

    return {
        health,
        loading,
        isServerReachable,
        refresh: fetchStatus,
        version: health?.version && health.version !== "unknown" ? `v${health.version}` : "v0.1.0",
        status: health?.status || (isServerReachable ? "ok" : "down")
    };
};
