import { User, UserOnlineStatus } from '../../shared/schemas/usersSchemas.js';
import { vi } from 'vitest';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  username: 'testuser',
  display_name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  wins: 10,
  losses: 5,
  status: UserOnlineStatus.ONLINE,
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_two_fa_enabled: false,
  ...overrides,
});

export const waitForElement = (selector: string, container: HTMLElement = document.body) => {
  return new Promise<HTMLElement>((resolve, reject) => {
    const element = container.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
    } else {
      setTimeout(() => reject(new Error(`Element ${selector} not found`)), 1000);
    }
  });
};

export const clearAllMocks = () => {
  vi.clearAllMocks();
};