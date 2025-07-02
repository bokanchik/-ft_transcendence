import { router } from '../main.js';
import { getUserDataFromStorage } from './authService.js';
let currentLanguage = 'en';
let translations = {};
const supportedLanguages = ['fr', 'en', 'es', 'ru'];
async function loadTranslations(lang) {
    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${lang}`);
        }
        translations = await response.json();
        console.log(`Translations for '${lang}' loaded.`);
    }
    catch (error) {
        console.error(error);
        if (lang !== 'fr') {
            await loadTranslations('fr');
        }
    }
}
export async function initI18n() {
    const user = getUserDataFromStorage();
    let lang = null;
    // 1. Priorité à la langue de l'utilisateur connecté (depuis la DB via localStorage)
    if (user && user.language) {
        lang = user.language;
    }
    // 2. Sinon, on regarde dans le localStorage (pour les non-connectés)
    else {
        lang = localStorage.getItem('language');
    }
    // 3. Sinon, on prend la langue du navigateur
    if (!lang) {
        const browserLang = navigator.language.split('-')[0];
        if (supportedLanguages.includes(browserLang)) {
            lang = browserLang;
        }
    }
    // 4. Langue par défaut si rien n'est trouvé
    currentLanguage = lang || 'en';
    localStorage.setItem('language', currentLanguage);
    await loadTranslations(currentLanguage);
}
export async function setLanguage(lang, options = { reloadRoute: true }) {
    if (!supportedLanguages.includes(lang)) {
        console.warn(`Language '${lang}' is not supported.`);
        return;
    }
    currentLanguage = lang;
    localStorage.setItem('language', currentLanguage);
    await loadTranslations(currentLanguage);
    if (options.reloadRoute) {
        router();
    }
}
export function getLanguage() {
    return currentLanguage;
}
/**
 * La fonction de traduction principale.
 * @param key La clé de traduction (ex: "header.home").
 * @param replacements Un objet pour les remplacements dynamiques (ex: { username: "John" }).
 * @returns La chaîne traduite.
 */
export function t(key, replacements) {
    const keys = key.split('.');
    let result = keys.reduce((acc, currentKey) => {
        if (acc && typeof acc === 'object' && acc.hasOwnProperty(currentKey)) {
            return acc[currentKey];
        }
        return undefined;
    }, translations);
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
