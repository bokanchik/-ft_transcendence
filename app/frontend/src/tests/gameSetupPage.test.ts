// src/components/gamePage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { GamePage } from '@/pages/gameSetupPage';
import { handleOnlineGame } from '@/services/initOnlineGame';
import { checkAuthStatus, getUserDataFromStorage } from '@/services/authService';
import { User, UserOnlineStatus } from '@/shared/schemas/usersSchemas';
import { navigateTo } from '@/services/router';

vi.mock('@/services/initOnlineGame.js', () => ({
    handleOnlineGame: vi.fn(),
}));
vi.mock('@/services/router.js');
vi.mock('@/services/authService.js');
vi.mock('@/components/toast.js', () => ({
    showToast: vi.fn(),
}));
vi.mock('@/services/i18nService.js', () => ({
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
        document.body.innerHTML = '';
        (getUserDataFromStorage as vi.Mock).mockReturnValue(mockUser);
        (checkAuthStatus as vi.Mock).mockResolvedValue(mockUser);
    });

    it('should render the game page with initial options', () => {
        const page = GamePage();
        document.body.appendChild(page);
        
        expect(screen.getByRole('button', { name: 'game.quickMatch' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'game.startTournament' })).toBeInTheDocument();
    });

    it('should call handleOnlineGame when the quick match button is clicked', async () => {
        const page = GamePage();
        document.body.appendChild(page);
        
        const quickMatchButton = screen.getByRole('button', { name: 'game.quickMatch' });
        await fireEvent.click(quickMatchButton);

        await waitFor(() => {
            expect(checkAuthStatus).toHaveBeenCalled();
            expect(handleOnlineGame).toHaveBeenCalled();
        });
    });
    
    it('should show tournament options when tournament button is clicked', async () => {
        const page = GamePage();
        document.body.appendChild(page);

        const tournamentButton = screen.getByRole('button', { name: 'game.startTournament' });
        await fireEvent.click(tournamentButton);

        const sizeButtons = screen.getAllByRole('button', { name: 'game.players' });
        expect(sizeButtons).toHaveLength(3);
        
        expect(screen.getByRole('button', { name: 'general.back' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'game.quickMatch' })).not.toBeInTheDocument();
    });

    it('should redirect to login if user is not authenticated', () => {
        (getUserDataFromStorage as vi.Mock).mockReturnValue(null);
        
        GamePage();

        expect(navigateTo).toHaveBeenCalledWith('/login');
    });
});