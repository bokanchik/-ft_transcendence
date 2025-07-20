// app/frontend/src/pages/dashboardPage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/dom';
import { DashboardPage } from '@/pages/dashboardPage';
import { getUserDataFromStorage, checkAuthStatus, fetchUsers } from '@/services/authService';
import * as FriendService from '@/services/friendService';

vi.mock('../services/router', () => ({ navigateTo: vi.fn() }));
vi.mock('../services/authService');
vi.mock('../services/friendService.js');
vi.mock('../services/i18nService.js', () => ({
    t: (key: string) => key,
    getLanguage: () => 'fr',
    setLanguage: vi.fn(),
    initI18n: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../services/csrf', () => ({
    fetchCsrfToken: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../components/toast.js', () => ({
    showToast: vi.fn(),
    showCustomConfirm: vi.fn().mockResolvedValue(true),
}));

describe('DashboardPage', () => {
    const mockUser = {
        id: 1,
        username: 'testuser',
        display_name: 'Test User',
        email: 'test@user.com',
        wins: 10,
        losses: 5,
        created_at: '2024-01-01 12:00:00',
        is_two_fa_enabled: false,
        language: 'fr',
        status: 'online',
        avatar_url: null,
        updated_at: '2024-01-01 12:00:00',
    };
    const mockFriends = [{ 
        friend_id: 2, 
        friend_display_name: 'Ami Test',
        friendship_id: 1,
        friendship_status: 'accepted',
        friend_username: 'amites',
        friend_avatar_url: null,
        friend_wins: 5,
        friend_losses: 5,
        friend_online_status: 'online'
    }];

    beforeEach(() => {
        vi.resetAllMocks();
        document.body.innerHTML = '';
        (getUserDataFromStorage as vi.Mock).mockReturnValue(mockUser);
        (checkAuthStatus as vi.Mock).mockResolvedValue(mockUser);
        (FriendService.getFriendsList as vi.Mock).mockResolvedValue(mockFriends);
        (FriendService.getReceivedFriendRequests as vi.Mock).mockResolvedValue([]);
        (FriendService.getSentFriendRequests as vi.Mock).mockResolvedValue([]);
        (fetchUsers as vi.Mock).mockResolvedValue([]);
    });
    
    it('should render the dashboard and display user info', async () => {
        const pageElement = await DashboardPage();
        document.body.appendChild(pageElement);
        
        await waitFor(() => {
            const sidebar = screen.getByTestId('sidebar');
            expect(within(sidebar).getByText('testuser')).toBeInTheDocument();
            expect(within(sidebar).getByText('Test User')).toBeInTheDocument();
        });
    });

    it('should initially load the "users" tab content', async () => {
        const pageElement = await DashboardPage();
        document.body.appendChild(pageElement);
        await waitFor(() => {
            expect(fetchUsers).toHaveBeenCalled();
            expect(screen.getByText('user.noUser')).toBeInTheDocument();
        });
    });

    it('should switch to the "friends" tab and load its content on click', async () => {
        const pageElement = await DashboardPage();
        document.body.appendChild(pageElement);

        await waitFor(() => expect(fetchUsers).toHaveBeenCalled());

        const friendsTabButton = screen.getByRole('button', { name: 'dashboard.tabs.friends' });
        await fireEvent.click(friendsTabButton);

        await waitFor(() => {
            expect(FriendService.getFriendsList).toHaveBeenCalled();
            expect(screen.getByText('Ami Test')).toBeInTheDocument();
        });

        expect(screen.queryByText('user.noUser')).not.toBeInTheDocument();
    });
});