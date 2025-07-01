// src/services/authService.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getUserDataFromStorage } from './authService';
import { User, UserOnlineStatus } from '../shared/schemas/usersSchemas';

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
    // Nettoie le localStorage avant chaque test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getUserDataFromStorage', () => {
    it('should return null if no data is in localStorage', () => {
      expect(getUserDataFromStorage()).toBeNull();
    });

    it('should return user data if it exists and is not expired', () => {
      const expirationTime = new Date().getTime() + 1000 * 60; // Expire dans 1 minute
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));
      localStorage.setItem(USER_DATA_EXPIRATION_KEY, expirationTime.toString());

      const user = getUserDataFromStorage();
      expect(user).not.toBeNull();
      expect(user?.id).toBe(mockUser.id);
    });

    it('should return null if data is expired', () => {
      const expirationTime = new Date().getTime() - 1000; // A expiré il y a 1 seconde
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));
      localStorage.setItem(USER_DATA_EXPIRATION_KEY, expirationTime.toString());

      expect(getUserDataFromStorage()).toBeNull();
      // Le test vérifie aussi que les clés expirées ont été nettoyées
      expect(localStorage.getItem(USER_DATA_KEY)).toBeNull();
    });

    it('should return null if data is malformed', () => {
      const malformedData = { ...mockUser, id: '1' };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(malformedData));
      
      const expirationTime = new Date().getTime() + 1000 * 60;
      localStorage.setItem(USER_DATA_EXPIRATION_KEY, expirationTime.toString());

      expect(getUserDataFromStorage()).toBeNull();
    });
  });
});