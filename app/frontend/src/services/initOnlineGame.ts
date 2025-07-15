import { UUID } from "crypto";
import { navigateTo } from "./router.js";
import socket from "./socket.js";
import { tournamentSocket } from "../services/socket.js";
import { removeWaitingToast, showToast, showWaitingToast } from "../components/toast.js";
import { initCountdown } from "../components/countdown.js";
import { config } from "../utils/config.js";
import { t } from "./i18nService.js";

export async function handleOnlineGame(display_name: string, userId: number): Promise<void> {
    try {
        await initOnlineGame(display_name, userId);
    } catch (err: unknown) {
        console.log(err);
        showToast(t('msg.error.any'), 'error');
        navigateTo('/game');
    }
}

type TournamentMatch = {
    player1: string;
    player2: string;
};

// --- Fonction pour la recherche de tournoi ---
export async function handleTournamentSearch(size: number, displayName: string, userId: number): Promise<void> {
    const controller: AbortController = new AbortController();

    // if (tournamentSocket.connected) {
    //     tournamentSocket.disconnect();
    // }
    // tournamentSocket.removeAllListeners();

    if (socket.connected) {
        socket.disconnect();
    }
    socket.removeAllListeners();

    sessionStorage.removeItem('tournamentData');
    sessionStorage.removeItem('onlineTournamentId');

    // Show initial waiting toast
    showWaitingToast(socket, controller, config.settings.online.waitTimeout, t('tournament.waitingForPlayers', { current: '1', required: size.toString() }));
    // showWaitingToast(tournamentSocket, controller, config.settings.online.waitTimeout, t('tournament.waitingForPlayers', { current: '1', required: size.toString() }));

    // Listen for queue updates
    // tournamentSocket.on('tournamentQueueUpdate', ({ current, required }: { current: number; required: number }) => {
    socket.on('tournamentQueueUpdate', ({ current, required }: { current: number; required: number }) => {
        showWaitingToast(socket, controller, config.settings.online.waitTimeout, t('tournament.waitingForPlayers', { current: current.toString(), required: required.toString() }));
        // showWaitingToast(tournamentSocket, controller, config.settings.online.waitTimeout, t('tournament.waitingForPlayers', { current: current.toString(), required: required.toString() }));
    });

    // Listen for tournament start
    // tournamentSocket.on('tournamentStarting', ({ tournamentId, matches }: { tournamentId: string; matches: TournamentMatch[] }) => {
    socket.on('tournamentStarting', ({ tournamentId, matches }: { tournamentId: string; matches: TournamentMatch[] }) => {
        removeWaitingToast();
        sessionStorage.setItem('onlineTournamentId', tournamentId);
        navigateTo(`/tournament/${tournamentId}`);
    });

    // Handle timeout
    // tournamentSocket.on('matchTimeout', () => {
    socket.on('matchTimeout', () => {
        showToast(t('tournament.timeout'), 'error');
        cleanupSocket(socket);
        // cleanupSocket(tournamentSocket);
        removeWaitingToast();
        navigateTo('/game');
    });

    // Standard error handling
    // tournamentSocket.on('connect_error', (err: Error) => {
    socket.on('connect_error', (err: Error) => {
        console.error(`Connection error: ${err.message}`);
        showToast(t('msg.error.any'), 'error');
        cleanupSocket(socket);
        // cleanupSocket(tournamentSocket);
        removeWaitingToast();
    });

    // tournamentSocket.on('connect', () => {
    socket.on('connect', () => {
        console.log('Connected to the server for tournament search');
        // tournamentSocket.emit('authenticate', { display_name: displayName, userId });
        // tournamentSocket.emit('joinTournamentQueue', { size });
        socket.emit('authenticate', { display_name: displayName, userId });
        socket.emit('joinTournamentQueue', { size });
    });
    socket.connect();
    // tournamentSocket.connect();
}

// export async function handleTournamentSearch(size: number, displayName: string, userId: number): Promise<void> {
//     const controller: AbortController = new AbortController();

//     if (tournamentSocket.connected) {
//         tournamentSocket.disconnect();
//     }
//     tournamentSocket.removeAllListeners();

//     sessionStorage.removeItem('tournamentData');
//     sessionStorage.removeItem('onlineTournamentId');

//     // Show initial waiting toast
//     showWaitingToast(tournamentSocket, controller, config.settings.online.waitTimeout, t('tournament.waitingForPlayers', { current: '1', required: size.toString() }));

//     // Listen for queue updates
//     tournamentSocket.on('tournamentQueueUpdate', ({ current, required }: { current: number; required: number }) => {
//         showWaitingToast(tournamentSocket, controller, config.settings.online.waitTimeout, t('tournament.waitingForPlayers', { current: current.toString(), required: required.toString() }));
//     });

//     // Listen for tournament start
//     tournamentSocket.on('tournamentStarting', ({ tournamentId, matches }: { tournamentId: string; matches: TournamentMatch[] }) => {
//         removeWaitingToast();
//         sessionStorage.setItem('onlineTournamentId', tournamentId);
//         navigateTo(`/tournament/${tournamentId}`);
//     });

//     // Handle timeout
//     tournamentSocket.on('matchTimeout', () => {
//         showToast(t('tournament.timeout'), 'error');
//         cleanupSocket(tournamentSocket);
//         removeWaitingToast();
//         navigateTo('/game');
//     });

//     // Standard error handling
//     tournamentSocket.on('connect_error', (err: Error) => {
//         console.error(`Connection error: ${err.message}`);
//         showToast(t('msg.error.any'), 'error');
//         cleanupSocket(tournamentSocket);
//         removeWaitingToast();
//     });

//     tournamentSocket.on('connect', () => {
//         console.log('Connected to the server for tournament search');
//         tournamentSocket.emit('authenticate', { display_name: displayName, userId });
//         tournamentSocket.emit('joinTournamentQueue', { size });
//     });
//     tournamentSocket.connect();
// }

export async function initOnlineGame(display_name: string, userId: number) {
    const controller: AbortController = new AbortController();

    if (socket.connected) {
        socket.disconnect();
    }
    socket.removeAllListeners();
    
    socket.on('connect', () => {
        console.log('Connect to the server');
        socket.emit('authenticate', { display_name, userId });
        socket.emit('joinQuickMatchQueue');
    });
    
    socket.on('inQueue', () => {
        console.log('In the queue...');
        showWaitingToast(socket, controller, config.settings.online.waitTimeout, t('game.waitOpponent'));
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
        text-white text-7xl font-beach [text-shadow:_0_3px_6px_rgb(0_0_0_/_50%)]
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
    
    socket.on('error', (err: Error) => { console.error('Socket error:', err); });
    socket.on('connect_error', (err: Error) => {
        console.error(`Connection to the server is failed: ${err.message}`);
        showToast(t('msg.error.any'), 'error');
        cleanupSocket(socket);
      });

    // --- Match timeout (60s) event ---
    socket.on('matchTimeout', () => {
        showToast(t('msg.error.any'), 'error');
        cleanupSocket(socket);
        removeWaitingToast();
        navigateTo('/game');
    });
    socket.connect();
}

// --- Helper to cleanup Socket connexion ---
export function cleanupSocket(socket: SocketIOClient.Socket) {
    socket.removeAllListeners();
    socket.disconnect();
}