import { router } from '../main.js';

let currentLanguage: string = 'en';
let translations: Record<string, any> = {};
// const supportedLanguages = ['fr', 'en'];
const supportedLanguages = ['fr', 'en', 'es'];


async function loadTranslations(lang: string): Promise<void> {
    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${lang}`);
        }
        translations = await response.json();
        console.log(`Translations for '${lang}' loaded.`);
    } catch (error) {
        console.error(error);
        if (lang !== 'fr') {
            await loadTranslations('fr');
        }
    }
}

/**
 * Initialise le service i18n. Doit être appelé au démarrage de l'application.
 */
export async function initI18n(): Promise<void> {
    let lang = localStorage.getItem('language');

    if (!lang) {
        const browserLang = navigator.language.split('-')[0];
        if (supportedLanguages.includes(browserLang)) {
            lang = browserLang;
        }
    }

    currentLanguage = lang || 'en';
    localStorage.setItem('language', currentLanguage);

    await loadTranslations(currentLanguage);
}

/**
 * Change la langue de l'application, recharge les traductions et rafraîchit l'interface.
 * @param lang La nouvelle langue ('fr', 'en', etc.)
 */
export async function setLanguage(lang: string): Promise<void> {
    if (!supportedLanguages.includes(lang)) {
        console.warn(`Language '${lang}' is not supported.`);
        return;
    }
    currentLanguage = lang;
    localStorage.setItem('language', currentLanguage);
    await loadTranslations(currentLanguage);
    router();
}

/**
 * Récupère la langue actuellement configurée.
 */
export function getLanguage(): string {
    return currentLanguage;
}

/**
 * La fonction de traduction principale.
 * @param key La clé de traduction (ex: "header.home").
 * @param replacements Un objet pour les remplacements dynamiques (ex: { username: "John" }).
 * @returns La chaîne traduite.
 */
export function t(key: string, replacements?: Record<string, string>): string {
    const keys = key.split('.');
    
    let result = keys.reduce((acc, currentKey) => {
        if (acc && typeof acc === 'object' && acc.hasOwnProperty(currentKey)) {
            return acc[currentKey];
        }
        return undefined;
    }, translations as any);

    if (typeof result === 'string') {
        let translation = result;
        if (replacements) {
            for (const placeholder in replacements) {
                translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
            }
        }
        return translation;
    }
    
    return key;
}