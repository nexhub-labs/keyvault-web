import axiosInstance from "../utils/axiosInstance";

export interface AuditLog {
    _id: string;
    userId: string;
    action: string;
    resourceType: string;
    severity: 'INFO' | 'WARN' | 'CRITICAL';
    timestamp: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    signature?: string;
}

export interface AuditLogResponse {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
}

export const getAuditLogsAPI = async (page = 1, limit = 50): Promise<AuditLogResponse> => {
    const response = await axiosInstance.get('/audit/logs', {
        params: { page, limit }
    });
    return response.data;
};
