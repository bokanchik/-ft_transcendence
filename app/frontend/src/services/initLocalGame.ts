import { showToast } from "../components/toast.js";
import { navigateTo } from "./router.js";


/**
 * @brief Initializes a local game based on the selected game mode from the given form.
*
* @param form - The HTML form element containing game settings.
*
* @details
* - Retrieves the selected game mode from the form.
* - If the mode is "1v1":
*   - Extracts the two player aliases from the form.
*   - Validates that both aliases are non-empty, only contain letters, numbers, dashes, or underscores, and are unique.
*   - If validation passes, creates a local match using `createLocalMatch`.
* - If no mode is selected or an unsupported mode is chosen, the function does nothing (future-proofing for other modes).
*
* @returns A promise that resolves after the initialization process or exits early if validation fails.
*/
export async function initLocalGame(form: HTMLFormElement) {
    const gameMode = form.querySelector<HTMLSelectElement>('#gameMode');
    if (!gameMode) {
        showToast('Please, select a game mode.', 'error');
        return;
    }

    const isValidAlias = (alias: string) => /^[a-zA-Z0-9_-]+$/.test(alias);

    switch (gameMode.value) {
        case '1v1':
            const alias1 = form.querySelector<HTMLInputElement>('#alias1')?.value.trim();
            const alias2 = form.querySelector<HTMLInputElement>('#alias2')?.value.trim();
            
            if (!alias1 || !alias2 ) return;
            
            if (!isValidAlias(alias1) || !isValidAlias(alias2)) {
                showToast('Aliases can only contain letters, numbers, dashes, and underscores.', 'error');
                return;
            }

            if (alias1 === alias2) {
                showToast('Aliases should be unique', 'error');
                return;
            }
            await createLocalMatch(alias1, alias2, false);
            break;
        case 'Tournament':
            const formData = new FormData(form);
            const players: string[] = [];

            formData.forEach((value, key) => {
                if (key.startsWith('alias')) {
                    players.push(value.toString());
                }
            });

            // Check for valid characters
            if (!players.every(isValidAlias)) {
                showToast('Aliases can only contain letters, numbers, dashes, and underscores.', 'error');
                return;
            }

            // Check for uniqueness
            const uniquePlayers = new Set(players);
            if (uniquePlayers.size !== players.length) {
                showToast('All player aliases must be unique.', 'error');
                return;
            }

            const { pairs } = await fetchTournamentPlayers(players);
            
            console.log(pairs);
            
            sessionStorage.setItem('tournamentData', JSON.stringify({ pairs }));
            
            navigateTo('/tournament');
        default:
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
        sessionStorage.setItem('gameMode', 'local');
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
