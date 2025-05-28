import { navigateTo } from "./router.js";

export async function initLocalGame(form: HTMLFormElement) {
    const gameMode = form.querySelector<HTMLSelectElement>('#gameMode');
    if (!gameMode) { // optional check ?
        alert('Please select a game mode.');
        return;
    }
    switch (gameMode.value) {
        case '1v1':
            const isValidAlias = (alias: string) => /^[a-zA-Z0-9_-]+$/.test(alias);
            const alias1 = form.querySelector<HTMLInputElement>('#alias1')?.value.trim();
            const alias2 = form.querySelector<HTMLInputElement>('#alias2')?.value.trim();
            
            if (!alias1 || !alias2 ) {
                alert('Please enter aliases for both players.');
                return;
            }
            // sanitaze check (maybe not necessery on client side ?)
            if (!isValidAlias(alias1) || !isValidAlias(alias2)) {
                alert('Aliases can only contain letters, numbers, dashes, and underscores.');
                return;
            }
            if (alias1 === alias2) {
                alert('Aliases should be unique');
                return;
            }
            
            await createLocalMatch(alias1, alias2);
            break;
        case 'Tournament':
        default:
            alert('Unknown game mode selected');
    }
}

// --- Helper function to call an API
async function createLocalMatch(alias1: string, alias2: string) {
    try {
        const response = await fetch('/api/game/match/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player1: alias1,
                player2: alias2,
                isLocal: true,
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

        navigateTo(`/game-room?matchId=${matchId}`);

    } catch (err: unknown) {
        alert('Error creating local match');
        console.log(err);
    }
}
