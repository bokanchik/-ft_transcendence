// src/components/gamePage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { GamePage } from './gamePage';
import { handleOnlineGame } from '../services/initOnlineGame';
import { checkAuthStatus, getUserDataFromStorage } from '../services/authService';
import { User, UserOnlineStatus } from '../shared/schemas/usersSchemas';
import { navigateTo } from '../services/router';

vi.mock('../services/initOnlineGame.js', () => ({
    handleOnlineGame: vi.fn(),
}));
vi.mock('../services/router.js');
vi.mock('../services/authService.js');
vi.mock('../components/toast.js', () => ({
    showToast: vi.fn(),
}));
vi.mock('../services/i18nService.js', () => ({
    t: (key: string) => key,
    getLanguage: vi.fn(() => 'en'),
}));

const mockUser: User = {
    id: 1, username: 'testuser', display_name: 'Test User', email: 'a@a.com',
    status: UserOnlineStatus.ONLINE, language: 'en', created_at: '', updated_at: '',
    is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null
};

describe('GamePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = ''; // Assure que le DOM est propre
        (getUserDataFromStorage as vi.Mock).mockReturnValue(mockUser);
        (checkAuthStatus as vi.Mock).mockResolvedValue(mockUser);
    });

    it('should render the game page with the start button', () => {
        const page = GamePage();
        document.body.appendChild(page);
        
        expect(screen.getByRole('button', { name: 'game.start' })).toBeInTheDocument();
    });

    it('should call handleOnlineGame when the start button is clicked', async () => {
        const page = GamePage();
        document.body.appendChild(page);
        
        const startButton = screen.getByRole('button', { name: 'game.start' });
        await fireEvent.click(startButton);

        await waitFor(() => {
            expect(checkAuthStatus).toHaveBeenCalled();
            expect(handleOnlineGame).toHaveBeenCalled();
        });
    });

    it('should redirect to login if user is not authenticated', () => {
        (getUserDataFromStorage as vi.Mock).mockReturnValue(null);
        
        GamePage();

        expect(navigateTo).toHaveBeenCalledWith('/login');
    });
});