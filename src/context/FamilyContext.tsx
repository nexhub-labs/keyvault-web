import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { toaster } from '../components/ui/toaster';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';

export interface FamilyMember {
    userId: string;
    role: 'OWNER' | 'MEMBER';
    status: 'active' | 'invited' | 'suspended';
}

export interface Family {
    _id: string;
    name: string;
    ownerId: string;
    members: FamilyMember[];
    createdAt: string;
}

interface FamilyContextType {
    families: Family[];
    currentFamily: Family | null;
    isLoading: boolean;
    fetchFamilies: () => Promise<void>;
    createFamily: (name: string) => Promise<void>;
    selectFamily: (familyId: string) => void;
    inviteMember: (familyId: string, email: string) => Promise<void>;
    acceptInvitation: (familyId: string, code: string) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
    const { session } = useAuth();
    const [families, setFamilies] = useState<Family[]>([]);
    const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchFamilies = async () => {
        if (!session?.user) return;
        setIsLoading(true);
        try {
            const { data } = await axiosInstance.get('/family/my');
            setFamilies(data);
        } catch (error) {
            logger.error('Failed to fetch families', error);
            toaster.create({ title: 'Failed to fetch families', type: 'error' });
        } finally {
            setIsLoading(false);
            setHasFetched(true);
        }
    };

    const createFamily = async (name: string) => {
        try {
            await axiosInstance.post('/family/create', { name });
            toaster.create({ title: 'Family group created', type: 'success' });
            await fetchFamilies();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            logger.error('Failed to create family', err);
            toaster.create({ title: err.response?.data?.message || 'Failed to create family', type: 'error' });
            throw err;
        }
    };

    const selectFamily = (familyId: string) => {
        const family = families.find(f => f._id === familyId);
        setCurrentFamily(family || null);
    };

    const inviteMember = async (familyId: string, email: string) => {
        try {
            await axiosInstance.post(`/family/${familyId}/invite`, { email });
            toaster.create({ title: 'Invitation sent', type: 'success' });
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            logger.error('Failed to invite member', err);
            toaster.create({ title: err.response?.data?.message || 'Failed to send invitation', type: 'error' });
            throw err;
        }
    };

    const acceptInvitation = async (familyId: string, code: string) => {
        try {
            await axiosInstance.post(`/family/${familyId}/accept`, { code });
            toaster.create({ title: 'Invitation accepted!', type: 'success' });
            await fetchFamilies();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            logger.error('Failed to accept invitation', err);
            toaster.create({ title: err.response?.data?.message || 'Failed to accept invitation', type: 'error' });
            throw err;
        }
    };

    useEffect(() => {
        if (session?.user?.id) {
            if (!hasFetched && !isLoading) {
                fetchFamilies();
            }
        } else {
            setFamilies([]);
            setCurrentFamily(null);
            setHasFetched(false);
        }
    }, [session?.user?.id, hasFetched, isLoading]);

    return (
        <FamilyContext.Provider value={{
            families,
            currentFamily,
            isLoading,
            fetchFamilies,
            createFamily,
            selectFamily,
            inviteMember,
            acceptInvitation
        }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const context = useContext(FamilyContext);
    if (!context) {
        throw new Error('useFamily must be used within a FamilyProvider');
    }
    return context;
};
