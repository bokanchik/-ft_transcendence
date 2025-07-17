// // src/components/gamePage.test.ts
// import { describe, it, expect, vi, beforeEach } from 'vitest';
// import { screen, fireEvent, waitFor } from '@testing-library/dom';
// import { GamePage } from '@/pages/gameSetupPage';
// import { handleOnlineGame } from '@/services/initOnlineGame';
// import { checkAuthStatus, getUserDataFromStorage } from '@/services/authService';
// import { User, UserOnlineStatus } from '@/shared/schemas/usersSchemas';
// import { navigateTo } from '@/services/router';

// vi.mock('@/services/initOnlineGame.js', () => ({
//     handleOnlineGame: vi.fn(),
// }));
// vi.mock('@/services/router.js');
// vi.mock('@/services/authService.js');
// vi.mock('@/components/toast.js', () => ({
//     showToast: vi.fn(),
// }));
// vi.mock('@/services/i18nService.js', () => ({
//     t: (key: string) => key,
//     getLanguage: vi.fn(() => 'en'),
// }));

// const mockUser: User = {
//     id: 1, username: 'testuser', display_name: 'Test User', email: 'a@a.com',
//     status: UserOnlineStatus.ONLINE, language: 'en', created_at: '', updated_at: '',
//     is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null
// };

// describe('GamePage', () => {
//     beforeEach(() => {
//         vi.clearAllMocks();
//         document.body.innerHTML = '';
//         (getUserDataFromStorage as vi.Mock).mockReturnValue(mockUser);
//         (checkAuthStatus as vi.Mock).mockResolvedValue(mockUser);
//     });

//     it('should render the game page with initial options', () => {
//         const page = GamePage();
//         document.body.appendChild(page);
        
//         expect(screen.getByRole('button', { name: 'game.quickMatch' })).toBeInTheDocument();
//         expect(screen.getByRole('button', { name: 'game.startTournament' })).toBeInTheDocument();
//     });

//     it('should call handleOnlineGame when the quick match button is clicked', async () => {
//         const page = GamePage();
//         document.body.appendChild(page);
        
//         const quickMatchButton = screen.getByRole('button', { name: 'game.quickMatch' });
//         await fireEvent.click(quickMatchButton);

//         await waitFor(() => {
//             expect(checkAuthStatus).toHaveBeenCalled();
//             expect(handleOnlineGame).toHaveBeenCalled();
//         });
//     });
    
//     it('should show tournament options when tournament button is clicked', async () => {
//         const page = GamePage();
//         document.body.appendChild(page);

//         const tournamentButton = screen.getByRole('button', { name: 'game.startTournament' });
//         await fireEvent.click(tournamentButton);

//         const sizeButtons = screen.getAllByRole('button', { name: 'game.players' });
//         expect(sizeButtons).toHaveLength(3);
        
//         expect(screen.getByRole('button', { name: 'general.back' })).toBeInTheDocument();
//         expect(screen.queryByRole('button', { name: 'game.quickMatch' })).not.toBeInTheDocument();
//     });

//     it('should redirect to login if user is not authenticated', () => {
//         (getUserDataFromStorage as vi.Mock).mockReturnValue(null);
        
//         GamePage();

//         expect(navigateTo).toHaveBeenCalledWith('/login');
//     });
// });

// src/tests/gameSetupPage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Import 'waitFor' pour gérer les attentes et userEvent pour de meilleures simulations de clic
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
    handleTournamentSearch: vi.fn(), // Assurez-vous que cette fonction est aussi mockée si vous la testez
    cancelAllSearches: vi.fn(),
    cleanupSocket: vi.fn(),
}));
vi.mock('@/services/router.js');
vi.mock('@/services/authService.js');
vi.mock('@/components/toast.js', () => ({
    showToast: vi.fn(),
    removeWaitingToast: vi.fn(),
}));
vi.mock('@/services/i18nService.js', () => ({
    // Le mock de `t` retourne simplement la clé, ce qui est standard pour les tests unitaires.
    t: (key: string, replacements?: Record<string, string>) => {
        if (replacements && replacements.count) {
             // Rendons le mock un peu plus intelligent pour le test du tournoi
            return `${key} {count: ${replacements.count}}`;
        }
        return key;
    },
    getLanguage: vi.fn(() => 'en'),
}));

// Données utilisateur pour les tests
const mockUser: User = {
    id: 1, username: 'testuser', display_name: 'Test User', email: 'a@a.com',
    status: UserOnlineStatus.ONLINE, language: 'en', created_at: '', updated_at: '',
    is_two_fa_enabled: false, wins: 0, losses: 0, avatar_url: null
};

describe('GamePage', () => {
    // Initialisez userEvent pour chaque test
    const user = userEvent.setup();

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
        
        // Utiliser userEvent.click qui est asynchrone et plus proche d'une vraie interaction
        await user.click(quickMatchButton);

        // waitFor est toujours une bonne pratique pour s'assurer que toutes les promesses sont résolues.
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

        const tournamentButton = screen.getByRole('button', { name: 'game.startTournament' });
        // Utiliser userEvent.click
        await user.click(tournamentButton);

        // Utiliser findAllByRole qui est asynchrone.
        // On utilise une expression régulière /players/i pour correspondre au texte du bouton
        // de manière plus flexible, peu importe la langue ou les remplacements.
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