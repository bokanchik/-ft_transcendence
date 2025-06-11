import { router } from '../main.js';

// ---- État du service ----
let currentLanguage: string = 'fr'; // Langue par défaut
let translations: Record<string, string> = {}; // Stockage des traductions chargées
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

// ---- Fonctions Publiques ----

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
export function t(key: string, replacements?: Record<string, string>): string {
    let translation = translations[key] || key; // Retourne la clé si la traduction n'est pas trouvée

    if (replacements) {
        for (const placeholder in replacements) {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        }
    }
    return translation;
}
