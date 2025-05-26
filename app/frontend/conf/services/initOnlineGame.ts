import { UUID } from "crypto";
import { navigateTo } from "./router.js";
import socket from "./socket.js";
import { showToast } from "../components/toast.js";

// --- Main Fonction for online game: 
export async function handleOnlineGame(display_name: string, username: string, container: HTMLElement, button: HTMLButtonElement, title: HTMLHeadElement): Promise<void> {
    button.disabled = true; // pour eviter les multiples click (data race)
    try {
        await initOnlineGame(display_name, username, container, title);
    } catch (err: unknown) {
        console.log(err);
        showToast('Error while creating a waiting room. Please, try again later', 'error');
        navigateTo('/game'); // !! maybe redirect to error page instead of alert()
    } finally {
        button.disabled = false;
    }
}

// --- Fonction pour initialiser le client socket et le mettre dans le waiting room ---
export async function initOnlineGame(display_name: string, username: string, buttonsContainer: HTMLElement, title: HTMLHeadElement) {
    const controller: AbortController = new AbortController();

    if (!socket.connected) {
        socket.connect();
    }
    
    socket.on('connect', () => {
        console.log('Connected to the server');
        // TODO: peut-etre je dois aussi envoyer userId pour apres recuperer l'url de l'avatar avec /api/users/:userId
        socket.emit('authenticate', { display_name, username });
    });
    
    socket.on('inQueue', () => {
        title.textContent = 'Looking for an opponent...';
        showWaitingMessage(buttonsContainer, socket, controller);
    });

    // --- Socket listener on matchFound event --> if opponenet is found
    socket.on('matchFound', ({ matchId, displayName, side, opponent }: { matchId: UUID; displayName: string, side: 'left' | 'right'; opponent: string}) => {

        // FOR DEBUGGING
        // console.log(matchId);
        // console.log(side);
        // console.log(opponent);
        // -------------------
        
        sessionStorage.setItem('matchId', matchId);
        sessionStorage.setItem('displayName', displayName);
        sessionStorage.setItem('side', side);
        sessionStorage.setItem('opponent', opponent);

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
        showToast('Failed to connect to server. Please try later.', 'error');
        cleanupSocket(socket);
      });

    // --- TODO: emit on server side ---
    socket.on('matchTimeout', () => {
        showToast('No opponent found. Please try later.', 'error');
        cleanupSocket(socket);
        navigateTo('/game');
    });
}

// --- Fonction pour afficher le message d'attente + Cancel button ---
export function showWaitingMessage(buttonsContainer: HTMLElement, socket: SocketIOClient.Socket, controller: AbortController) {
    buttonsContainer.innerHTML = ''; // clear existing content

    // Container centré
    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col items-center justify-center space-y-6 h-full';

    // Cercle vert animé
    const circle = document.createElement('div');
    circle.className = 'relative w-40 h-40 rounded-full bg-green-500 animate-pulse flex items-center justify-center shadow-lg';

    // Timer au centre du cercle
    const timerText = document.createElement('span');
    timerText.className = 'text-white text-2xl font-bold';
    timerText.textContent = '60';

    circle.appendChild(timerText);

    // Bouton Cancel
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition duration-300 ease-in-out';

    cancelButton.addEventListener('click', () => {
        controller.abort();
        socket.emit('cancelMatch');
        clearInterval(timer);
        cleanupSocket(socket);
        navigateTo('/game');
    });

    wrapper.append(circle, cancelButton);
    buttonsContainer.appendChild(wrapper);

    // Timer logique
    let timeleft = 60;
    const timer = setInterval(() => {
        timeleft--;
        timerText.textContent = `${timeleft}`;
        if (timeleft <= 0) {
            clearInterval(timer);
        }
    }, 1000);
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