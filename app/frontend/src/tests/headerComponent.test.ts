// src/components/headerComponent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeaderComponent } from '@/components/headerComponent';
import { User, UserOnlineStatus } from '@/shared/schemas/usersSchemas';
import { logout } from '@/services/authService';
import { navigateTo } from '@/services/router';
import { setLanguage } from '@/services/i18nService';

vi.mock('@/services/authService.js', () => ({
    logout: vi.fn(),
}));
vi.mock('@/services/router.js', () => ({
    navigateTo: vi.fn(),
}));
vi.mock('@/services/i18nService.js', () => ({
    t: (key: string) => key,
    getLanguage: () => 'en',
    setLanguage: vi.fn(),
}));
vi.mock('./toast.js', () => ({
    showToast: vi.fn(),
}));

describe('HeaderComponent', () => {
    const mockUser: User = {
        id: 1,
        username: 'testuser',
        display_name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'http://example.com/avatar.png',
        wins: 10,
        losses: 5,
        status: UserOnlineStatus.ONLINE,
        language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_two_fa_enabled: false,
    };

    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should render login and register buttons when user is not logged in', () => {
        const header = HeaderComponent({ currentUser: null });
        document.body.appendChild(header);
        expect(header.querySelector('a[href="/login"]')).not.toBeNull();
        expect(header.querySelector('a[href="/register"]')).not.toBeNull();
        expect(header.querySelector('.bg-teal-600\\/20')).toBeNull();
    });

    it('should render user menu when user is logged in', () => {
        const header = HeaderComponent({ currentUser: mockUser });
        document.body.appendChild(header);
        const userMenuTrigger = header.querySelector('.bg-teal-600\\/20');
        expect(userMenuTrigger).not.toBeNull();
        expect(userMenuTrigger?.textContent).toContain('Test User');
        expect(header.querySelector('a[href="/login"]')).toBeNull();
    });

    it('should show user dropdown on click', () => {
        const header = HeaderComponent({ currentUser: mockUser });
        document.body.appendChild(header);
        const userMenuTrigger = header.querySelector('.bg-teal-600\\/20') as HTMLElement;
        const userMenu = header.querySelector('.absolute.right-0') as HTMLElement;
        expect(userMenu.classList.contains('hidden')).toBe(true);
        userMenuTrigger.click();
        expect(userMenu.classList.contains('hidden')).toBe(false);
    });


    it('should call logout service and navigate on logout button click', async () => {
        (logout as vi.Mock).mockResolvedValue({});
        const header = HeaderComponent({ currentUser: mockUser });
        document.body.appendChild(header);

        const userMenuTrigger = header.querySelector('.bg-teal-600\\/20') as HTMLElement;
        userMenuTrigger.click();
        
        const logoutButton = header.querySelector('[data-testid="logout-button"]') as HTMLElement;
        expect(logoutButton).not.toBeNull();

        logoutButton.click();

        await vi.waitFor(() => {
            expect(logout).toHaveBeenCalled();
        });
        await vi.waitFor(() => {
            expect(navigateTo).toHaveBeenCalledWith('/');
        });
    });

    it('should change language on menu click', async () => {
        const header = HeaderComponent({ currentUser: null });
        document.body.appendChild(header);
        const langButton = header.querySelector('button.flex.items-center') as HTMLElement;
        langButton.click();
        const frenchButton = header.querySelector('button[data-lang="fr"]') as HTMLElement;
        frenchButton.click();
        await vi.waitFor(() => {
            expect(setLanguage).toHaveBeenCalledWith('fr');
        });
    });
});