// app/frontend/conf/utils/validationUtils.ts

/**
 * Checks if a string is a valid HTTP/HTTPS URL.
 * @param urlString - The string to validate.
 * @returns True if valid, false otherwise.
 */
export function isValidHttpUrl(urlString: string | undefined | null): boolean {
    if (typeof urlString !== 'string' || !urlString) return false;
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

/**
 * Checks if a string is a valid email format (basic check).
 * @param emailString - The string to validate.
 * @returns True if valid, false otherwise.
 */
export function isValidEmailFormat(emailString: string | undefined | null): boolean {
    if (typeof emailString !== 'string' || !emailString) return false;
    // Basic check, consider a more robust regex if needed
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailString);
}