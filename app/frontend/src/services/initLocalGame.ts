import { showToast } from "../components/toast.js";
import { navigateTo } from "./router.js";
import { t } from "./i18nService.js";

interface GameConfig {
    mode: 'duel' | 'tournament';
    players: string[];
}

/**
 * @brief Initializes a local game based on the provided configuration.
 *
 * @param config - The configuration object containing game mode and player aliases.
 *
 * @details
 * - If the mode is 'duel', it creates a local match between two players.
 * - If the mode is 'tournament', it fetches tournament players and navigates to the tournament page.
 */
export async function initLocalGame(config: GameConfig) {
    const { mode, players } = config;

    switch (mode) {
        case 'duel':
            await createLocalMatch(players[0], players[1], false);
            break;

        case 'tournament':
            try {
                const tournamentData = await fetchTournamentPlayers(players);
                sessionStorage.setItem('tournamentData', JSON.stringify(tournamentData));
                navigateTo('/tournament');
            } catch (error) {
                console.error("Failed to start tournament:", error);
                showToast(t('msg.error.any'), 'error');
            }
            break;
    }
}

/**
 * @brief Sends a POST request to create a new local match between two players.
 *
 * @param alias1 - The alias of player 1.
 * @param alias2 - The alias of player 2.
 *
 * @details
 * - Sends a POST request to `/api/game/match/` with player aliases and a `isLocal` flag.
 * - Expects a JSON response containing a `matchId` and player data.
 * - On success:
 *   - Stores player data and match ID in `sessionStorage`.
 *   - Navigates the user to the game room page with the match ID.
 * - On failure:
 *   - Logs the error to the console and displays an alert.
 *
 * @returns A promise that resolves when the match is successfully created and navigation occurs.
 */
export async function createLocalMatch(alias1: string, alias2: string, isTournament: boolean) {
    try {
        const response = await fetch('/api/game/match/local', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player1: alias1,
                player2: alias2,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create local match: ${await response.text}`);
        }
        
        const data = await response.json();
        const matchId = data.matchId;

        if (!matchId) {
            throw new Error('Missing match ID from server.')
        }
        // ! sessionStorage store all data locally 
        // + not erased after page refresh (but after closing the tab)
        sessionStorage.setItem('player1', data.player1);
        sessionStorage.setItem('player2', data.player2);

        sessionStorage.setItem('gameMode', isTournament ? 'tournament' : 'local');
        sessionStorage.setItem('matchId', matchId);
        // if (isTournament) {
        //     sessionStorage.setItem('gameRegime', 'tournament');
        // }
        navigateTo(`/game-room?matchId=${matchId}`);

    } catch (err: unknown) {
        showToast('Error creating local match. Please, try again later.', 'error');
        console.log(err);
        throw err;
    }
}

async function fetchTournamentPlayers(players: string[]) {
    try {
        const response = await fetch('/api/tournament/local/start', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ players })
        })

        if (!response.ok) {
            throw new Error(`Response status:  ${response.status}`);
        }

        const data = await response.json();
        
        return data;
    } catch (err: unknown) {
        console.error("Error while fetching players: ", err);
    }
}
