/**
 * Geo Utility
 * Centralizes country and currency detection logic.
 */

export interface GeoData {
    countryCode: string; // ISO 2-letter code
    currency: string;    // e.g., '$' or '₦'
    isNigeria: boolean;
}

const CACHE_KEY = 'geo_data_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const fetchGeoData = async (): Promise<GeoData> => {
    // 1. Check Cache
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
                return data;
            }
        }
    } catch (e) {
        // Ignore cache read errors
    }

    const processData = (countryCode: string): GeoData => {
        const isNigeria = countryCode === 'NG';
        const geo = {
            countryCode,
            isNigeria,
            currency: isNigeria ? '₦' : '$'
        };
        // Store in cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data: geo, timestamp: Date.now() }));
        } catch (e) { }
        return geo;
    };

    // 2. Primary Provider (ipapi.co)
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const data = await res.json();
            if (data.country_code) return processData(data.country_code);
        }
    } catch (error) {
        // Silent fail to fallback
    }

    // 3. Fallback Provider (ipwho.is - typically more lenient with CORS/free tier)
    try {
        const res = await fetch('https://ipwho.is/');
        if (res.ok) {
            const data = await res.json();
            if (data.country_code) return processData(data.country_code);
        }
    } catch (error) {
        // Silent fail to default
    }

    // 4. Ultimate Default
    return {
        countryCode: 'US',
        isNigeria: false,
        currency: '$'
    };
};

/**
 * Legacy support or simple country check
 */
export const getCountryCode = async (): Promise<string> => {
    const geo = await fetchGeoData();
    return geo.countryCode;
};
