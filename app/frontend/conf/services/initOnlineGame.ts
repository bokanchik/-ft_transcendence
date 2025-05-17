import { UUID } from "crypto";
import { navigateTo } from "./router.js";
import socket from "./socket.js";

// --- Main Fonction for online game: 
// post /api/game/match + socket initialisaztion + waiting room + 
// matchmaking + then navigaTo(/game-room)
export async function handleOnlineGame(display_name: string, container: HTMLElement, button: HTMLButtonElement): Promise<void> {
    button.disabled = true; // pour eviter les multiples click (data race)
    try {
        await initOnlineGame(display_name, container);
    } catch (err: unknown) {
        console.log(err);
        alert('Error creating waiting room. Please try again.');
        navigateTo('/game'); // !! maybe redirect to error page instead of alert()
    } finally {
        button.disabled = false;
    }
}

// --- Fonction pour initialiser le client socket et le mettre dans le waiting room ---
export async function initOnlineGame(display_name: string, buttonsContainer: HTMLElement) {
    const controller: AbortController = new AbortController();

    if (!socket.connected) {
        socket.connect();
    }
    
    socket.on('connect', () => {
        console.log('Connected to the server');
        socket.emit('authenticate', display_name);
        showWaitingMessage(buttonsContainer, socket, controller);
    });
    
    // --- Socket listener on matchFound event --> if opponenet is found
    socket.on('matchFound', ({ matchId, displayName, side, opponent }: { matchId: UUID; displayName: string, side: 'left' | 'right'; opponent: string}) => {

        // FOR DEBUGGING
        console.log(matchId);
        console.log(side);
        console.log(opponent);
        // -------------------
        
        sessionStorage.setItem('matchId', matchId);
        sessionStorage.setItem('displayName', displayName);
        sessionStorage.setItem('side', side);
        sessionStorage.setItem('opponent', opponent);

        socket.emit('startOnlineGame');
        navigateTo(`/game-room?matchId=${matchId}`);

    });
    
    // --- Socket listeners on errors from the server side
    socket.on('disconnect', (reason: string, details?: any) => { 
        console.log(`Disconnected from the server: reason ${reason},
            details: ${details.message}, ${details.description}, ${details.context}`);
    });
    
    socket.on('error', (err: Error) => {
        console.error('Socket error:', err);
    });

    socket.on('connect_error', (err: Error) => {
        console.error(`Connection to the server is failed: ${err.message}`);
        alert('Failed to connect to server.');
        cleanupSocket(socket);
      });

    // --- TODO: emit on server side ---
    socket.on('matchTimeout', () => {
        alert('No opponent found. Please try again later.');
        cleanupSocket(socket);
        navigateTo('/game');
    });

}

// --- Fonction pour afficher le message d'attente + Cancel button ---
export function showWaitingMessage(buttonsContainer: HTMLElement, socket: SocketIOClient.Socket, controller: AbortController) {
    buttonsContainer.innerHTML = ''; // clear the buttons
    
    const waitingMessage = document.createElement('div');
    waitingMessage.textContent = 'Waiting for an opponent...';
    waitingMessage.className = 'text-gray-700 font-semibold text-lg animate-pulse';
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out';

    cancelButton.addEventListener('click', () => {
        controller.abort(); // abort the fetch request
        socket.emit('cancelMatch'); // inform the server that client
                                    //  is going to leave a waiting room
        cleanupSocket(socket);
        navigateTo('/game');
    });

    buttonsContainer.append(waitingMessage, cancelButton);
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
export function cleanupSocket(socket: SocketIOClient.Socket) {
    socket.removeAllListeners();
    socket.disconnect();
}