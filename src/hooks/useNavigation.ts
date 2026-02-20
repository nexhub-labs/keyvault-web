import { useState, useEffect } from 'react';
import {
    LuLayoutDashboard,
    LuLock,
    LuTerminal,
    LuSettings,
    LuUsers,
    LuShieldCheck,
    LuKey,
} from 'react-icons/lu';
import { getPricingLimitsAPI, PricingLimitsResponse } from '../api/auth';
import { logger } from '../utils/logger';

export interface NavItem {
    id: string;
    label: string;
    description: string;
    icon: any; // Using any for icon components to avoid complex typing issues with react-icons
    path: string;
    color: string;
    category: 'core' | 'collaboration' | 'user' | 'system';
    tierRequired?: string[];
}

export const useNavigation = () => {
    const [pricingLimits, setPricingLimits] = useState<PricingLimitsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getPricingLimitsAPI()
            .then(setPricingLimits)
            .catch(logger.error)
            .finally(() => setIsLoading(false));
    }, []);

    const allItems: NavItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            description: 'Overview of your security status and quick actions.',
            icon: LuLayoutDashboard,
            path: '/dashboard',
            color: 'rgba(59, 130, 246, 1)', // blue.500
            category: 'core'
        },
        {
            id: 'vault',
            label: 'Private Vault',
            description: 'Manage your passwords and secure notes with zero-knowledge encryption.',
            icon: LuLock,
            path: '/vault',
            color: 'rgba(34, 197, 94, 1)', // brand.500
            category: 'core'
        },
        {
            id: 'environment',
            label: 'Environment Variables',
            description: 'Manage encrypted secrets for your development projects.',
            icon: LuTerminal,
            path: '/environment',
            color: 'rgba(59, 130, 246, 1)', // blue.500
            category: 'core'
        },
        {
            id: 'generator',
            label: 'Password Generator',
            description: 'Create strong, unique passwords for all your accounts.',
            icon: LuKey,
            path: '/generator',
            color: 'rgba(168, 85, 247, 1)', // purple.500
            category: 'user'
        },
        {
            id: 'teams',
            label: 'Teams',
            description: 'Collaborate and share secrets securely with your team.',
            icon: LuUsers,
            path: '/teams',
            color: 'rgba(236, 72, 153, 1)', // pink.500
            category: 'collaboration',
            tierRequired: ['team']
        },
        {
            id: 'family',
            label: 'Family',
            description: 'Share access with family members securely.',
            icon: LuUsers,
            path: '/family',
            color: 'rgba(236, 72, 153, 1)',
            category: 'collaboration',
            tierRequired: ['family', 'team']
        },
        {
            id: 'audit',
            label: 'Audit Logs',
            description: 'Track all security events and access logs for your account.',
            icon: LuShieldCheck,
            path: '/settings/audit',
            color: 'rgba(249, 115, 22, 1)', // orange.500
            category: 'system',
            tierRequired: ['team']
        },
        {
            id: 'settings',
            label: 'Settings',
            description: 'Manage your account, security preferences, and billing.',
            icon: LuSettings,
            path: '/settings',
            color: 'rgba(249, 115, 22, 1)', // orange.500
            category: 'user'
        }
    ];

    const filterByTier = (items: NavItem[]) => {
        if (!pricingLimits) return items.filter(item => !item.tierRequired);
        return items.filter(item => {
            if (!item.tierRequired) return true;
            return item.tierRequired.includes(pricingLimits.tier);
        });
    };

    const sidebarItems = filterByTier(allItems.filter(item => item.id !== 'generator'));
    const quickActions = filterByTier(allItems.filter(item => item.id !== 'dashboard'));

    return {
        allItems: filterByTier(allItems),
        sidebarItems,
        quickActions,
        pricingLimits,
        isLoading
    };
};
