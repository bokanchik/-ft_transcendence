import { UUID } from "crypto";
import { navigateTo } from "./router.js";
import { Socket } from "socket.io-client";
import socket from "./socket.js";
import { removeWaitingToast, showToast, showWaitingToast } from "../components/toast.js";
import { initCountdown } from "../components/countdown.js";

// --- Main Fonction for online game: 
export async function handleOnlineGame(display_name: string, userId: string, container: HTMLElement, button: HTMLButtonElement, title: HTMLHeadElement): Promise<void> {
    button.disabled = true; // pour eviter les multiples click (data race)
    try {
        await initOnlineGame(display_name, userId, container, title);
    } catch (err: unknown) {
        console.log(err);
        showToast('Error while creating a waiting room. Please, try again later', 'error');
        navigateTo('/game');
    } finally {
        button.disabled = false;
    }
}

// --- Fonction pour initialiser le client socket et le mettre dans le waiting room ---
export async function initOnlineGame(display_name: string, userId: string, _buttonsContainer: HTMLElement, _title: HTMLHeadElement) {
    const controller: AbortController = new AbortController();

    if (!socket.connected) {
        socket.connect();
    }
    
    socket.on('connect', () => {
        console.log('Connected to the server');
        socket.emit('authenticate', { display_name, userId });
    });
    
    socket.on('inQueue', () => {
        showWaitingToast(socket, controller);
    });

    // --- Socket listener on matchFound event --> if opponenet is found
    socket.on('matchFound', async ({ matchId, displayName, side, opponent }: { matchId: UUID; displayName: string, side: 'left' | 'right'; opponent: string}) => {

        sessionStorage.setItem('matchId', matchId);
        sessionStorage.setItem('displayName', displayName);
        sessionStorage.setItem('side', side);
        sessionStorage.setItem('opponent', opponent);

        removeWaitingToast();

        const countdownContainer = document.createElement('div');
        countdownContainer.className = `
            fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50
            text-lime-200 text-6xl font-extrabold tracking-widest jungle-font
        `;        
        document.body.appendChild(countdownContainer);

        await initCountdown(countdownContainer);

        navigateTo(`/game-room?matchId=${matchId}`);

    });
    
    // --- Socket listeners on errors from the server side
    socket.on('disconnect', (reason: string, details?: any) => { 
        console.log(`Disconnected from the server: reason ${reason}`);
        if (details){
            console.log(`details: ${details.message}, ${details.description}, ${details.context}`);
        }
    });
    
    socket.on('error', (err: Error) => {
        console.error('Socket error:', err);
    });

    socket.on('connect_error', (err: Error) => {
        console.error(`Connection to the server is failed: ${err.message}`);
        showToast('Failed to connect to server. Please try later.', 'error');
        cleanupSocket(socket);
      });

    // --- TODO: emit on server side ---
    socket.on('matchTimeout', () => {
        showToast('No opponent found. Please try later.', 'error');
        cleanupSocket(socket);
        removeWaitingToast();
        navigateTo('/game');
    });
}

// // --- Fonction pour créer une salle d'attente ---
// export async function createOnlineMatch(token: string, opponentId: string, display_name: string, signal: AbortSignal): Promise<string | null> {
//     try {
//         const requestBody = {
//             player1: display_name,
//             player2: opponentId,
//             isLocal: false,
//         }

//         console.log("Request Body:", requestBody);
//         const response = await fetch('/api/game/match', {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 player1: display_name,
//                 player2: opponentId,
//                 isLocal: false,
//             }),
//             signal: signal,
//           //  cache: 'default',
//         });
        
//         if (!response.ok) { // la reponse echouee (true if (res > 200 && res < 299))
//             throw new Error(`Failed to create online match: ${await response.text}`);
//         };
      
//         const data = await response.json();  
//         const matchId = data.matchId;

//         return matchId;
//     } catch (err: unknown) {
//         if (err instanceof DOMException && err.name === 'AbortError'){
//             console.log('Fetch aborted by user');
//         } else {
//             alert('Error creating online match');
//             console.log(err);
//         }
//         return null;
//     }
// }


// --- Helper to cleanup Socket connexion ---
export function cleanupSocket(socket: Socket) {
    socket.removeAllListeners();
    socket.disconnect();
}