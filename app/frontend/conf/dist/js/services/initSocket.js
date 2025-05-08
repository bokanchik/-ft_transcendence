import { navigateTo } from "./router.js";
// --- Fonction pour initialiser le client socket et le mettre dans le waiting room ---
export function initSocketClient(playerId, buttonsContainer, controller) {
    const socket = io('wss://localhost:8443', {
        transports: ['websocket'],
    });
    socket.on('connect', () => {
        console.log('Connected to the server');
        socket.emit('authenticate', playerId);
        showWaitingMessage(buttonsContainer, socket, controller);
    });
    // TODO check for TypeError for data && timeout ?
    socket.on('matchFound', (data) => {
        console.log(`Match found with opponent ${data.opponentId}, gameId is ${data.gameId}`);
        navigateTo('/game-room?mode=remote');
    });
    socket.on('disconnect', () => {
        console.log('Disconnected from the server');
    });
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
}
// --- Fonction pour afficher le message d'attente + Cancel button ---
function showWaitingMessage(buttonsContainer, socket, controller) {
    buttonsContainer.innerHTML = ''; // clear the buttons
    const waitingMessage = document.createElement('div');
    waitingMessage.textContent = 'Waiting for an opponent...';
    waitingMessage.className = 'text-gray-700 font-semibold text-lg animate-pulse';
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out';
    cancelButton.addEventListener('click', () => {
        controller.abort(); // abort the fetch request
        socket.emit('cancelMatch');
        socket.disconnect();
        navigateTo('/game');
    });
    buttonsContainer.append(waitingMessage, cancelButton);
}
