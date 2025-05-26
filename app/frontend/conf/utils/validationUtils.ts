// app/frontend/conf/utils/validationUtils.ts

export function isValidHttpUrl(urlString: string | undefined | null): boolean {
    if (typeof urlString !== 'string' || !urlString) return false;
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

export function isValidEmailFormat(emailString: string | undefined | null): boolean {
    if (typeof emailString !== 'string' || !emailString) return false;
    // Basic check, consider a more robust regex if needed
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailString);
}