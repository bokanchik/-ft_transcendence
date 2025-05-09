import { navigateTo } from "./router.js";

// --- Main Fonction for online game: 
// post /api/game/match + socket initialisaztion + waiting room + 
// matchmaking + then navigaTo(/game-room)
export async function handleOnlineGame(display_name: string, token: string, container: HTMLElement, button: HTMLButtonElement): Promise<void> {
    button.disabled = true; // pour eviter les multiples click (data race)
    try {
        initOnlineGame(display_name, token, container);
    } catch (err: unknown) {
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
    
    socket.on('matchFound', async (opponentId: string) => {
        const matchId = await createOnlineMatch(token, opponentId, display_name, signal);
        // mettre dans try - catch peut-etre ? 
        navigateTo(`/game-room?matchId=${matchId}`);
    });
    
    //------FOR DEVELOPPING PURPOSES !!! -----------
    socket.on('disconnect', () => { 
        console.log('Disconnected from the server');
    });
    
    socket.on('error', (error: Error) => {
        console.error('Socket error:', error);
    });
    // ---------------------------------------------
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
                                    //  is goint to leave a waiting room
        socket.disconnect(); // disconnect client socket
        navigateTo('/game');
    });

    buttonsContainer.append(waitingMessage, cancelButton);
}

// --- Fonction pour créer une salle d'attente ---
export async function createOnlineMatch(token: string, opponentId: string, display_name: string, signal: AbortSignal) {
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
        
        if (!response.ok) {
            throw new Error('Failed to create online match');
        };
      
        const data = await response.json();  
        const matchId = data.matchId;

        return matchId;
    } catch (err: unknown) {
        alert('Error creating online match');
        console.log(err);
        return null;
    }
}
