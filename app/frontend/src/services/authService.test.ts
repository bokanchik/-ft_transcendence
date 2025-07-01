// src/services/authService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../tests/mocks/server';
import { 
    getUserDataFromStorage, 
    attemptLogin,
    attemptRegister,
    checkAuthStatus,
    setUserDataInStorage, // Assurez-vous d'exporter cette fonction pour les tests
    clearUserDataFromStorage // et celle-ci aussi
} from './authService';
import { User, UserOnlineStatus } from '../shared/schemas/usersSchemas';
import { config } from '../utils/config';

const USER_DATA_KEY = 'userDataKey';
const USER_DATA_EXPIRATION_KEY = 'userDataExpiration';

describe('authService', () => {
    const mockUser: User = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        display_name: 'Test User',
        avatar_url: null,
        wins: 0,
        losses: 0,
        status: UserOnlineStatus.ONLINE,
        language: 'fr',
        is_two_fa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        server.resetHandlers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('storage management', () => {
        it('setUserDataInStorage should store user and expiration', () => {
            const now = new Date();
            vi.setSystemTime(now);

            setUserDataInStorage(mockUser);
            
            const ttl = 60 * 60 * 1000;
            const expectedExpiration = (now.getTime() + ttl).toString();

            expect(JSON.parse(localStorage.getItem(USER_DATA_KEY)!)).toEqual(mockUser);
            expect(localStorage.getItem(USER_DATA_EXPIRATION_KEY)).toBe(expectedExpiration);
        });

        it('getUserDataFromStorage should return null if expired', () => {
            setUserDataInStorage(mockUser);
            
            // Avancer le temps pour que le token expire
            vi.advanceTimersByTime(2 * 60 * 60 * 1000); // 2 heures

            expect(getUserDataFromStorage()).toBeNull();
            expect(localStorage.getItem(USER_DATA_KEY)).toBeNull();
        });

        it('clearUserDataFromStorage should remove user data', () => {
            setUserDataInStorage(mockUser);
            expect(localStorage.getItem(USER_DATA_KEY)).not.toBeNull();
            
            clearUserDataFromStorage();
            
            expect(localStorage.getItem(USER_DATA_KEY)).toBeNull();
            expect(localStorage.getItem(USER_DATA_EXPIRATION_KEY)).toBeNull();
        });
    });

    describe('API calls', () => {
        it('attemptLogin should return user data on success', async () => {
            server.use(
                http.post(config.api.auth.login, () => {
                    return HttpResponse.json({ message: 'Login successful', user: mockUser }, { status: 200 });
                })
            );

            const result = await attemptLogin({ identifier: 'test', password: 'password' });
            
            expect(result.success).toBe(true);
            if(result.success) {
                expect(result.data.user).toEqual(mockUser);
            }
        });

        it('attemptLogin should handle 2FA requirement', async () => {
            server.use(
                http.post(config.api.auth.login, () => {
                    return HttpResponse.json({ message: '2FA required', two_fa_required: true }, { status: 200 });
                })
            );

            const result = await attemptLogin({ identifier: 'test', password: 'password' });
            
            expect(result.success).toBe(true);
            if(result.success) {
                expect(result.data.two_fa_required).toBe(true);
                expect(result.data.user).toBeUndefined();
            }
        });

        it('attemptLogin should return an error on failure', async () => {
            server.use(
                http.post(config.api.auth.login, () => {
                    return HttpResponse.json({ error: 'Invalid credentials', statusCode: 401 }, { status: 401 });
                })
            );

            const result = await attemptLogin({ identifier: 'test', password: 'wrong' });

            expect(result.success).toBe(false);
            if(!result.success) {
                expect(result.error).toBe('Invalid credentials');
                expect(result.statusCode).toBe(401);
            }
        });

        it('checkAuthStatus should return user if authenticated', async () => {
             server.use(
                http.get(config.api.users.me, () => {
                    return HttpResponse.json(mockUser);
                })
            );
            const user = await checkAuthStatus();
            expect(user).toEqual(mockUser);
            expect(localStorage.getItem(USER_DATA_KEY)).toBeDefined();
        });

        it('checkAuthStatus should return null if not authenticated', async () => {
            server.use(
               http.get(config.api.users.me, () => {
                   return new HttpResponse(null, { status: 401 });
               })
           );
           const user = await checkAuthStatus();
           expect(user).toBeNull();
           expect(localStorage.getItem(USER_DATA_KEY)).toBeNull();
       });
    });
});