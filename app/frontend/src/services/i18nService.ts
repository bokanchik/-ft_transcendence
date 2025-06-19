import { router } from '../main.js';

let currentLanguage: string = 'en'; // by default
// let translations: Record<string, string> = {};
let translations: Record<string, any> = {};
const supportedLanguages = ['fr', 'en'];

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
        // Fallback to default language if loading fails
        if (lang !== 'fr') {
            await loadTranslations('fr');
        }
    }
}

/**
 * Initialise le service i18n. Doit être appelé au démarrage de l'application.
 */
export async function initI18n(): Promise<void> {
    // 1. Tente de récupérer la langue depuis le localStorage
    let lang = localStorage.getItem('language');

    // 2. Sinon, utilise la langue du navigateur si elle est supportée
    if (!lang) {
        const browserLang = navigator.language.split('-')[0];
        if (supportedLanguages.includes(browserLang)) {
            lang = browserLang;
        }
    }

    // 3. Sinon, utilise la langue par défaut ('fr')
    currentLanguage = lang || 'fr';
    localStorage.setItem('language', currentLanguage);

    // Charge les traductions initiales
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
// export function t(key: string, replacements?: Record<string, string>): string {
//     let translation = translations[key] || key; // Retourne la clé si la traduction n'est pas trouvée

//     if (replacements) {
//         for (const placeholder in replacements) {
//             translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
//         }
//     }
//     return translation;
// }
export function t(key: string, replacements?: Record<string, string>): string {
    // On divise la clé par les points
    const keys = key.split('.');
    
    // On parcourt l'objet translations en utilisant les parties de la clé
    let result = keys.reduce((acc, currentKey) => {
        // acc est l'objet/valeur accumulé, on vérifie qu'il existe et qu'il a la clé suivante
        if (acc && typeof acc === 'object' && acc.hasOwnProperty(currentKey)) {
            return acc[currentKey];
        }
        return undefined; // Si une clé n'est pas trouvée, on retourne undefined
    }, translations as any); // On caste translations en 'any' pour le reduce initial

    // Si on a trouvé une traduction (et que ce n'est pas un objet mais bien une string)
    if (typeof result === 'string') {
        let translation = result;
        if (replacements) {
            for (const placeholder in replacements) {
                translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
            }
        }
        return translation;
    }
    
    // Sinon, on retourne la clé originale comme fallback
    return key;
}