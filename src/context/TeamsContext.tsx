import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { toaster } from '../components/ui/toaster';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

export interface Team {
    _id: string;
    name: string;
    ownerId: string;
    members: { userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER'; status: 'active' | 'invited' }[];
    createdAt: string;
}

interface TeamsContextType {
    teams: Team[];
    currentTeam: Team | null;
    isLoading: boolean;
    fetchTeams: () => Promise<void>;
    createTeam: (name: string) => Promise<void>;
    selectTeam: (teamId: string) => void;
    inviteMember: (teamId: string, email: string, role: 'admin' | 'member') => Promise<void>;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export const TeamsProvider = ({ children }: { children: ReactNode }) => {
    const { session } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchTeams = async () => {
        if (!session?.user) return;
        setIsLoading(true);
        try {
            const { data } = await axiosInstance.get('/teams/my-teams');
            setTeams(data);
        } catch (error) {
            logger.error('Failed to fetch teams', error);
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    };

    const createTeam = async (name: string) => {
        try {
            await axiosInstance.post('/teams/create', { name });
            toaster.create({ title: 'Team created successfully', type: 'success' });
            await fetchTeams();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            // logger.error('Failed to create team', err);
            toaster.create({ title: err.response?.data?.message || 'Failed to create team', type: 'error' });
            throw err;
        }
    };

    const selectTeam = (teamId: string) => {
        const team = teams.find(t => t._id === teamId);
        setCurrentTeam(team || null);
    };

    const inviteMember = async (teamId: string, email: string, role: 'admin' | 'member') => {
        try {
            await axiosInstance.post(`/teams/${teamId}/invite`, { email, role });
            toaster.create({ title: 'Invitation sent', type: 'success' });
            // Optionally refresh team details here if we had detailed view
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            // logger.error('Failed to invite member', err);
            toaster.create({ title: err.response?.data?.message || 'Failed to send invitation', type: 'error' });
            throw err;
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            if (!hasFetched && !isLoading) {
                fetchTeams();
            }
        } else {
            setTeams([]);
            setCurrentTeam(null);
            setHasFetched(false);
        }
    }, [session?.user?.id, hasFetched, isLoading]);

    return (
        <TeamsContext.Provider value={{ teams, currentTeam, isLoading, fetchTeams, createTeam, selectTeam, inviteMember }}>
            {children}
        </TeamsContext.Provider>
    );
};

export const useTeams = () => {
    const context = useContext(TeamsContext);
    if (!context) {
        throw new Error('useTeams must be used within a TeamsProvider');
    }
    return context;
};
