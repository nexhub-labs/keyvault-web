/**
 * Pricing Configuration (Frontend)
 * This file handles fetching the pricing configuration from the backend.
 */

export interface PricingPlan {
    name: string;
    tier: string;
    period?: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    badge?: string;
    color?: string;
    buttonText: string;
}

export interface PricingDetails {
    base: number;
    discount: number;
}

export interface TierPricing {
    monthly: PricingDetails;
    annual: PricingDetails;
}

export interface PricingValues {
    [tier: string]: TierPricing;
}

export const fetchPricingConfig = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_KEYVAULT_SERVER}/pricing/config`);
        if (!res.ok) throw new Error('Failed to fetch pricing config');
        return await res.json();
    } catch (error) {
        console.error('Pricing Config Error:', error);
        return null;
    }
};

/**
 * Shared utility for calculating final price after discount.
 */
export const calculatePrice = (base: number, discount: number) => {
    return base * (1 - (discount / 100));
};
