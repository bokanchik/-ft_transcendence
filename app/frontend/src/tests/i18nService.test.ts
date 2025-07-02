// src/services/i18nService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initI18n, setLanguage, getLanguage, t } from '@/services/i18nService';
import { getUserDataFromStorage } from '@/services/authService';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';

vi.mock('@/services/authService.js', () => ({
    getUserDataFromStorage: vi.fn()
}));

vi.mock('../main.js', () => ({
    router: vi.fn()
}));

const mockTranslations = {
    en: {
        app: { title: 'King-Pong' },
        header: { home: 'Home' },
        msg: { welcomeUser: 'Welcome, {username}!' }
    },
    fr: {
        app: { title: 'Roi-Pong' },
        header: { home: 'Accueil' },
        msg: { welcomeUser: 'Bienvenue, {username} !' }
    }
};

describe('i18nService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        
        server.use(
            http.get('/locales/en.json', () => HttpResponse.json(mockTranslations.en)),
            http.get('/locales/fr.json', () => HttpResponse.json(mockTranslations.fr))
        );
    });

    describe('initI18n', () => {
        it('should initialize with browser language if nothing else is set', async () => {
            (getUserDataFromStorage as vi.Mock).mockReturnValue(null);
            Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
            
            await initI18n();
            
            expect(getLanguage()).toBe('fr');
            expect(t('header.home')).toBe('Accueil');
        });

        it('should prioritize user language from storage', async () => {
            (getUserDataFromStorage as vi.Mock).mockReturnValue({ language: 'fr' });
            
            await initI18n();

            expect(getLanguage()).toBe('fr');
            expect(t('header.home')).toBe('Accueil');
        });
    });

    describe('setLanguage', () => {
        it('should load new translations and update localStorage', async () => {
            await setLanguage('fr');
            expect(getLanguage()).toBe('fr');
            expect(localStorage.getItem('language')).toBe('fr');
            expect(t('app.title')).toBe('Roi-Pong');
        });

        it('should not reload route if specified', async () => {
            const { router } = await import('../main.js');
            await setLanguage('fr', { reloadRoute: false });
            expect(router).not.toHaveBeenCalled();
        });
    });

    describe('t (translation function)', () => {
        it('should return the correct translation for a given key', async () => {
            await setLanguage('en'); 
            expect(t('header.home')).toBe('Home');
        });

        it('should return the key if translation is not found', () => {
            expect(t('non.existent.key')).toBe('non.existent.key');
        });

        it('should handle replacements in the translated string', async () => {
            await setLanguage('fr');
            const translated = t('msg.welcomeUser', { username: 'Jean' });
            expect(translated).toBe('Bienvenue, Jean !');
        });
    });
});