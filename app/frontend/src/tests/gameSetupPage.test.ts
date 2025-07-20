import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { GamePage } from '@/pages/gameSetupPage';
import { handleOnlineGame, handleTournamentSearch } from '@/services/initOnlineGame';
import { checkAuthStatus, getUserDataFromStorage } from '@/services/authService';
import { User, UserOnlineStatus } from '@/shared/schemas/usersSchemas';
import { navigateTo } from '@/services/router';

// Mocks des dépendances
vi.mock('@/services/initOnlineGame.js', () => ({
    handleOnlineGame: vi.fn(),
    handleTournamentSearch: vi.fn(),
    cancelAllSearches: vi.fn(),
    cleanupSocket: vi.fn(),
}));
vi.mock('@/services/router.js');
vi.mock('@/services/authService.js');
vi.mock('@/components/toast.js', () => ({
    showToast: vi.fn(),
    removeWaitingToast: vi.fn(),
    cancelAllSearches: vi.fn(),
}));
vi.mock('@/services/i18nService.js', () => ({
    t: (key: string, replacements?: Record<string, string>) => {
        if (replacements && replacements.count) {
            return `${key} {count: ${replacements.count}}`;
        }
        return key;
    },
    getLanguage: vi.fn(() => 'en'),
}));

const mockUser: User = {
    id: 1, username: 'testuser', display_name: 'Test User', email: 'a@a.com',
    status: UserOnlineStatus.ONLINE, language: 'en', created_at: '', updated_at: '',
    is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null
};

describe('GamePage', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
        (getUserDataFromStorage as vi.Mock).mockReturnValue(mockUser);
        (checkAuthStatus as vi.Mock).mockResolvedValue(mockUser);
        vi.mock('@/services/tournamentService.js', () => ({
            checkPlayerTournamentStatus: vi.fn().mockResolvedValue(null),
        }));
    });

    it('should render the game page with initial options', async () => {
        const page = GamePage();
        document.body.appendChild(page);
        
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'game.quickMatch' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'game.startTournament' })).toBeInTheDocument();
        });
    });

    it('should call handleOnlineGame when the quick match button is clicked', async () => {
        const page = GamePage();
        document.body.appendChild(page);
        
        const quickMatchButton = await screen.findByRole('button', { name: 'game.quickMatch' });
        await user.click(quickMatchButton);

        await waitFor(() => {
            expect(checkAuthStatus).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(handleOnlineGame).toHaveBeenCalled();
        });
    });
    
    it('should show tournament options when tournament button is clicked', async () => {
        const page = GamePage();
        document.body.appendChild(page);

        const tournamentButton = await screen.findByRole('button', { name: 'game.startTournament' });
        await user.click(tournamentButton);

        const sizeButtons = await screen.findAllByRole('button', { name: /players/i });
        expect(sizeButtons).toHaveLength(3);
        
        expect(await screen.findByRole('button', { name: 'general.back' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'game.quickMatch' })).not.toBeInTheDocument();
    });

    it('should redirect to login if user is not authenticated', () => {
        (getUserDataFromStorage as vi.Mock).mockReturnValue(null);
        
        GamePage();

        expect(navigateTo).toHaveBeenCalledWith('/login');
    });
});