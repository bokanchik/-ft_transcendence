// src/pages/dashboardPage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from './dashboardPage';
import { getUserDataFromStorage, checkAuthStatus, fetchUsers } from '../services/authService';
import * as FriendService from '../services/friendService';
import { initI18n } from '../services/i18nService';

vi.mock('../services/router', () => ({
  navigateTo: vi.fn(),
}));

vi.mock('../services/authService', () => ({
  getUserDataFromStorage: vi.fn(),
  fetchUsers: vi.fn(),
  checkAuthStatus: vi.fn(),
}));

vi.mock('../services/friendService.js', () => ({
  getFriendsList: vi.fn(),
  getReceivedFriendRequests: vi.fn(),
  getSentFriendRequests: vi.fn(),
}));

vi.mock('../services/i18nService.js', () => ({
  t: (key: string) => key,
  getLanguage: () => 'fr',
  setLanguage: vi.fn(),
  initI18n: vi.fn().mockResolvedValue(undefined),
}));


describe('DashboardPage', () => {
  const mockUser = {
      id: 1,
      username: 'testuser',
      display_name: 'Test User',
      email: 'test@user.com',
      wins: 10,
      losses: 5,
      created_at: new Date('2024-01-01T12:00:00.000Z').toISOString(),
      is_two_fa_enabled: false,
      language: 'fr',
      status: 'online',
      avatar_url: null,
      updated_at: new Date('2024-01-01T12:00:00.000Z').toISOString(),
  };

  beforeEach(() => {
    vi.resetAllMocks();

    (getUserDataFromStorage as any).mockReturnValue(mockUser);
    (checkAuthStatus as any).mockResolvedValue(mockUser);
    (FriendService.getFriendsList as any).mockResolvedValue([]);
    (FriendService.getReceivedFriendRequests as any).mockResolvedValue([]);
    (FriendService.getSentFriendRequests as any).mockResolvedValue([]);
    (fetchUsers as any).mockResolvedValue([]);

    document.body.innerHTML = '';
  });

  it('should render the dashboard wrapper and header', async () => {
    const pageElement = await DashboardPage();
    document.body.appendChild(pageElement);
    
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(pageElement.querySelector('.bg-gray-900\\/60')).not.toBeNull();
    expect(pageElement.querySelector('.font-beach')).not.toBeNull();
  });

  it('should display user information in the sidebar', async () => {
    const pageElement = await DashboardPage();
    document.body.appendChild(pageElement);
    
    await new Promise(resolve => setTimeout(resolve, 0));

    const sidebar = pageElement.querySelector('.w-1\\/4');
    expect(sidebar).not.toBeNull();
    expect(sidebar?.textContent).toContain('testuser');
    expect(sidebar?.textContent).toContain('Test User');
    expect(sidebar?.textContent).toContain('test@user.com');
    expect(sidebar?.textContent).toContain('10');
    expect(sidebar?.textContent).toContain('5');
    expect(sidebar?.textContent).toContain('2024');
  });
});