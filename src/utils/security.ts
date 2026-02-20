import { VaultItem } from "../api/vault";

export interface StrengthResult {
    label: string;
    color: string;
    score: number;
}

/**
 * Estimates the strength of a password based on entropy and complexity.
 */
export const getPasswordStrength = (password: string): StrengthResult => {
    if (!password) return { label: "None", color: "gray", score: 0 };

    let score = 0;

    // Length contribution (capped at 40 points)
    score += Math.min(password.length * 4, 40);

    // Variety contribution
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    // Penalty for repeats or too short
    if (/(.)\1{2,}/.test(password)) score -= 10;
    if (password.length < 8) score -= 20;

    score = Math.max(0, Math.min(100, score));

    if (score > 80) return { label: "Very Strong", color: "purple.400", score };
    if (score > 60) return { label: "Strong", color: "green.400", score };
    if (score > 40) return { label: "Good", color: "blue.400", score };
    if (score > 20) return { label: "Fair", color: "yellow.400", score };
    return { label: "Weak", color: "red.400", score };
};

/**
 * Heuristically estimates strength for an encrypted item.
 * Since we can't see the password, we use the ciphertext length and age.
 */
export const getHeuristicStrength = (item: VaultItem): StrengthResult => {
    // Use the encryptedData field from the Zero-Knowledge schema
    const encryptedData = item.encryptedData;

    if (!encryptedData) {
        return { label: "Unknown", color: "fg.muted", score: 0 };
    }

    const cipherLen = encryptedData.length;
    let score = 50; // Neutral start

    // Length heuristic
    if (cipherLen > 32) score += 30; // Likely >16 chars
    else if (cipherLen > 24) score += 15; // Likely 12-16 chars
    else if (cipherLen < 16) score -= 20; // Likely very short

    // Age heuristic (Temporal decay)
    const ageInDays = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 90) score -= 15; // Old passwords are "less healthy"
    if (ageInDays > 180) score -= 15;

    score = Math.max(0, Math.min(100, score));

    if (score > 80) return { label: "Secure", color: "green.400", score };
    if (score > 60) return { label: "Solid", color: "blue.400", score };
    if (score > 40) return { label: "Average", color: "yellow.400", score };
    return { label: "Needs Update", color: "orange.400", score };
};

export const calculateVaultHealth = (items: VaultItem[]): number => {
    if (items.length === 0) return 100;
    const totalScore = items.reduce((acc, item) => acc + getHeuristicStrength(item).score, 0);
    return Math.round(totalScore / items.length);
};

export const calculateSecurityLevel = (items: VaultItem[]): number => {
    if (items.length === 0) return 100;
    // Security level is slightly different, it focuses more on the distribution of strong items
    const strongItems = items.filter(item => getHeuristicStrength(item).score > 60).length;
    return Math.round((strongItems / items.length) * 100);
};
