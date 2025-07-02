// import { GameMode } from "../components/gamePage.js";
// import { cleanupSocket } from "../services/initOnlineGame.js";
// import { navigateTo } from "../services/router.js";
// import socket from '../services/socket.js';
// import { showGameResult } from "../components/gameResults.js";
// import { showCustomConfirm } from "../components/toast.js";
// //@ts-ignore
// import { GameState } from '../shared/gameTypes.js';
// // import { showToast } from '../components/toast.js';
// import { t } from '../services/i18nService.js';
import { cleanupSocket } from "../services/initOnlineGame.js";
import { navigateTo } from "../services/router.js";
import socket from '../services/socket.js';
import { showGameResult } from "../components/gameResults.js";
import { showCustomConfirm } from "../components/toast.js";
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';
// --- Constantes du jeu ---
const PADDLE_HEIGHT = 120;
const PADDLE_WIDTH = 20;
const PADDLE_X_LEFT = 20;
const PADDLE_X_RIGHT = 770;
const BALL_RADIUS = 15;
const BG_COLOUR = "rgba(17, 24, 39, 0.8)";
const BALL_COLOUR = "rgb(234, 179, 8)";
const PADDLE_COLOUR = "rgb(209, 213, 219)";
let isGameOver = false;
// --- Point d'entrée de la page ---
export function GameRoomPage(mode) {
    isGameOver = false;
    const leftUsername = createElement('div', { id: 'left-username', className: 'w-32 text-center text-lg font-bold text-white bg-teal-600/30 border-2 border-teal-500/50 p-2 rounded-lg shadow-md' });
    const rightUsername = createElement('div', { id: 'right-username', className: 'w-32 text-center text-lg font-bold text-white bg-rose-600/30 border-2 border-rose-500/50 p-2 rounded-lg shadow-md' });
    const scoreDisplay = createElement('div', { id: 'score-display', textContent: '0 - 0', className: 'text-5xl font-extrabold text-yellow-300 drop-shadow-lg [text-shadow:_0_2px_4px_rgb(0_0_0_/_40%)]' });
    const canvas = createElement('canvas', { id: 'pong-canvas', className: 'border-4 border-white/10 rounded-lg shadow-inner' });
    canvas.width = 800;
    canvas.height = 500;
    const quitButton = createElement('button', { textContent: t('game.quitButton'), className: 'px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-200 border border-red-500/50' });
    const gameRow = createElement('div', { className: 'flex items-center' }, [leftUsername, canvas, rightUsername]);
    const container = createElement('div', { className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-4' }, [
        scoreDisplay, gameRow, quitButton
    ]);
    const pageWrapper = createElement('div', { className: 'w-full h-screen flex flex-col items-center justify-center bg-cover bg-center bg-fixed' }, [container]);
    pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
    const gameMode = sessionStorage.getItem('gameMode');
    if (!gameMode) {
        console.error('Game mode not found in sessionStorage. Navigating home.');
        navigateTo('/');
        return pageWrapper;
    }
    setupUsernames(leftUsername, rightUsername, gameMode);
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Canvas context not supported');
    initializeGame(gameMode, ctx, scoreDisplay);
    quitButton.addEventListener('click', () => quitGameHandler(gameMode));
    return pageWrapper;
}
function setupUsernames(leftUsername, rightUsername, gameMode) {
    if (gameMode === 'local' || gameMode === 'tournament') {
        leftUsername.textContent = sessionStorage.getItem('player1') || 'Player 1';
        rightUsername.textContent = sessionStorage.getItem('player2') || 'Player 2';
    }
    else {
        const side = sessionStorage.getItem('side');
        const displayName = sessionStorage.getItem('displayName');
        const opponent = sessionStorage.getItem('opponent');
        if (side === 'left') {
            leftUsername.textContent = displayName;
            rightUsername.textContent = opponent;
        }
        else {
            rightUsername.textContent = displayName;
            leftUsername.textContent = opponent;
        }
    }
}
function initializeGame(gameMode, ctx, scoreDisplay) {
    const initialGameState = { leftPaddle: { y: 200 }, rightPaddle: { y: 200 }, ball: { x: 400, y: 250 }, score1: 0, score2: 0 };
    drawGame(initialGameState, ctx);
    updateScore(scoreDisplay, initialGameState);
    clientSocketHandler(gameMode, ctx, scoreDisplay);
}
function clientSocketHandler(gameMode, ctx, scoreDisplay) {
    if (!socket.connected) {
        socket.connect();
    }
    const handleGameState = (state) => {
        if (isGameOver)
            return;
        requestAnimationFrame(() => drawGame(state, ctx));
        updateScore(scoreDisplay, state);
    };
    socket.on('gameState', handleGameState);
    socket.on('gameOver', (finalState) => onGameOver(finalState)); // Modifié pour accepter l'état final
    if (gameMode === 'remote') {
        socket.on('opponentLeft', () => onGameOver());
    }
    else {
        const matchId = sessionStorage.getItem('matchId');
        if (matchId)
            socket.emit('startLocal', matchId);
    }
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyup);
}
function handleKeydown(e) { socket.emit('keydown', e.keyCode); }
function handleKeyup(e) { socket.emit('keyup', e.keyCode); }
async function onGameOver(finalState) {
    if (isGameOver)
        return;
    isGameOver = true;
    const gameMode = sessionStorage.getItem('gameMode');
    const matchId = sessionStorage.getItem('matchId');
    cleanupAll();
    if (gameMode === 'local' || gameMode === 'tournament') {
        if (finalState) {
            const player1 = sessionStorage.getItem('player1') || 'Player 1';
            const player2 = sessionStorage.getItem('player2') || 'Player 2';
            const defaultAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
            const destination = gameMode === 'tournament' ? '/tournament' : '/local-game';
            const buttonText = gameMode === 'tournament' ? t('link.tournament') : t('link.newGame');
            showGameResult(player1, player2, finalState.score1, finalState.score2, defaultAvatar(player1), defaultAvatar(player2), destination, buttonText);
        }
        else {
            navigateTo('/local-game');
        }
        return;
    }
    try {
        if (!matchId)
            throw new Error("Match ID not found for remote game over.");
        const matchRes = await fetch(`/api/game/match/remote/${matchId}`);
        if (!matchRes.ok)
            throw new Error('Failed to fetch match info');
        const data = await matchRes.json();
        const [url1, url2, name1, name2] = await Promise.all([
            getUserAvatar(data.player1_id),
            getUserAvatar(data.player2_id),
            getDisplayName(data.player1_id),
            getDisplayName(data.player2_id)
        ]);
        showGameResult(name1, name2, data.player1_score ?? 0, data.player2_score ?? 0, url1, url2, '/game', t('link.lobby'));
    }
    catch (err) {
        console.error("Error on game over:", err);
        navigateTo('/game');
    }
}
async function quitGameHandler(gameMode) {
    const confirmed = await showCustomConfirm(t('game.quitConfirm'));
    if (confirmed) {
        isGameOver = true;
        cleanupAll();
        const destination = (gameMode === 'local' || gameMode === 'tournament') ? '/local-game' : '/game';
        navigateTo(destination);
    }
}
function drawGame(state, ctx) {
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = BALL_COLOUR;
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PADDLE_COLOUR;
    ctx.fillRect(PADDLE_X_LEFT, state.leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(PADDLE_X_RIGHT, state.rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
}
function updateScore(scoreDisplay, state) {
    scoreDisplay.textContent = `${state.score1} - ${state.score2}`;
}
async function getDisplayName(userId) {
    const userRes = await fetch(`api/users/${userId}`);
    if (!userRes.ok)
        return `Player ${userId}`;
    const userData = await userRes.json();
    return userData.display_name || `Player ${userId}`;
}
async function getUserAvatar(userId) {
    const userRes = await fetch(`/api/users/${userId}`);
    if (!userRes.ok)
        return `https://ui-avatars.com/api/?name=??`;
    const userData = await userRes.json();
    return userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.display_name)}&background=random&color=fff&size=128`;
}
function cleanupAll() {
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('keyup', handleKeyup);
    cleanupSocket(socket);
    // On ne nettoie pas tout sessionStorage pour garder les infos du tournoi si besoin
    sessionStorage.removeItem('gameMode');
    sessionStorage.removeItem('side');
}
