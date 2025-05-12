import { navigateTo } from "./router.js";

// --- Main Fonction for online game: 
// post /api/game/match + socket initialisaztion + waiting room + 
// matchmaking + then navigaTo(/game-room)
export async function handleOnlineGame(display_name: string, token: string, container: HTMLElement, button: HTMLButtonElement): Promise<void> {
    button.disabled = true; // pour eviter les multiples click (data race)
    try {
        await initOnlineGame(display_name, token, container);
    } catch (err: unknown) {
        console.log(err);
        alert('Error creating waiting room. Please try again.');
        navigateTo('/game'); // !! maybe redirect to error page instead of alert()
    } finally {
        button.disabled = false;
    }
}

// --- Fonction pour initialiser le client socket et le mettre dans le waiting room ---
export async function initOnlineGame(display_name: string, token: string, buttonsContainer: HTMLElement) {
    const socket: SocketIOClient.Socket = io('wss://localhost:8443', { // faut pas que ca soit en clair 
        transports: ['websocket'],
    });
    const controller: AbortController = new AbortController();
    const signal: AbortSignal = controller.signal;

    socket.on('connect', () => {
        console.log('Connected to the server');
        socket.emit('authenticate', display_name);
        showWaitingMessage(buttonsContainer, socket, controller);
    });
    
    // --- Socket listener on matchFound event --> if opponenet is found
    socket.on('matchFound', async (opponentId: string) => {
        try {
            const matchId = await createOnlineMatch(token, opponentId, display_name, signal);
            if (matchId){
                // ! on garde le socket actif pour le jeu
                navigateTo(`/game-room?matchId=${matchId}`);
            } else {
                console.warn('Match creation aborted or failed');
                navigateTo('/game');
            }
        } catch (err: unknown) {
            console.error(`Error in matchFound handler: ${err}`);
            cleanupSocket(socket);
        }
    });
    
    // --- Socket listeners on errors from the server side
    socket.on('disconnect', () => { 
        console.log('Disconnected from the server');
    });
    
    socket.on('error', (err: Error) => {
        console.error('Socket error:', err);
    });

    socket.on('connect_error', (err: Error) => {
        console.error('Connection failed:', err);
        alert('Failed to connect to server.');
        cleanupSocket(socket);
        navigateTo('/game');
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

// --- Fonction pour créer une salle d'attente ---
export async function createOnlineMatch(token: string, opponentId: string, display_name: string, signal: AbortSignal): Promise<string | null> {
    try {
        const response = await fetch('/api/game/match', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player1: opponentId,
                player2: display_name,
                isLocal: false,
            }),
            signal: signal,
          //  cache: 'default',
        });
        
        if (!response.ok) { // la reponse echouee (true if (res > 200 && res < 299))
            throw new Error(`Failed to create online match: ${await response.text}`);
        };
      
        const data = await response.json();  
        const matchId = data.matchId;

        return matchId;
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError'){
            console.log('Fetch aborted by user');
        } else {
            alert('Error creating online match');
            console.log(err);
        }
        return null;
    }
}


// --- Helper to cleanup Socket connexion ---
export function cleanupSocket(socket: SocketIOClient.Socket) {
    socket.removeAllListeners();
    socket.disconnect();
}