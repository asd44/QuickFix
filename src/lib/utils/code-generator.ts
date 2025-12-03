/**
 * Utility class for generating and validating job completion codes
 */
export class CodeGenerator {
    /**
     * Generate a random 6-digit completion code
     * @returns string - 6-digit code (e.g., "123456")
     */
    static generateCompletionCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Validate completion code
     * @param input - Code entered by provider
     * @param stored - Code stored in database
     * @returns boolean - True if codes match
     */
    static validateCode(input: string, stored: string): boolean {
        return input.trim() === stored.trim();
    }

    /**
     * Check if code has expired
     * @param expiresAt - Expiration timestamp
     * @returns boolean - True if code is expired
     */
    static isExpired(expiresAt: Date): boolean {
        return expiresAt < new Date();
    }

    /**
     * Calculate code expiration time (24 hours from now)
     * @returns Date - Expiration timestamp
     */
    static getExpirationTime(): Date {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }
}
