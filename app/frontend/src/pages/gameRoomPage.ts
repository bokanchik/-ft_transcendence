import { GameMode } from "../shared/schemas/matchesSchemas.js";
import { navigateTo } from "../services/router.js";
// @ts-ignore
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';
import { initializeGame, quitGameHandler } from "../services/gameService.js";

export function GameRoomPage(mode: GameMode): HTMLElement {
	const leftUsername = createElement('div', { id: 'left-username', className: 'w-48 text-center text-3xl font-beach text-white bg-teal-800/50 border-4 border-teal-500/50 p-3 rounded-lg shadow-xl' });
	const scoreDisplay = createElement('div', { id: 'score-display', textContent: '0 - 0', className: 'text-7xl font-beach text-gray-300 drop-shadow-lg [text-shadow:_0_3px_6px_rgb(0_0_0_/_50%)]' });
	const rightUsername = createElement('div', { id: 'right-username', className: 'w-48 text-center text-3xl font-beach text-white bg-rose-800/50 border-4 border-rose-500/50 p-3 rounded-lg shadow-xl' });
	
	const canvas = createElement('canvas', { id: 'pong-canvas', className: 'border-4 border-white/20 rounded-lg shadow-inner bg-gray-900/30' });
	canvas.width = 800;
	canvas.height = 500;

	const quitButton = createElement('button', { textContent: t('game.quitButton'), className: 'px-8 py-3 bg-red-800 hover:bg-red-700 text-white font-beach text-xl rounded-lg shadow-lg transition duration-200 border-2 border-red-600/50 transform hover:scale-105' });
	
	const gameRow = createElement('div', { className: 'flex items-center justify-center gap-8' }, 
		[leftUsername, canvas, rightUsername]);
	const container = createElement('div', { className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-6' }, [scoreDisplay, gameRow, quitButton]);
	const pageWrapper = createElement('div', { className: 'w-full h-screen flex flex-col items-center justify-center bg-cover bg-center bg-fixed' }, [container]);
	pageWrapper.style.backgroundImage = "url('/assets/background.webp')";

	const gameMode = sessionStorage.getItem('gameMode') as GameMode | null;
	if (!gameMode) {
		console.error('Game mode not found in sessionStorage. Navigating home.');
		navigateTo('/');
		return pageWrapper;
	}

	setupUsernames(leftUsername, rightUsername, gameMode);

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas context not supported');

	initializeGame(gameMode, ctx, scoreDisplay);

	quitButton.addEventListener('click', quitGameHandler);

	return pageWrapper;
}

function setupUsernames(leftUsername: HTMLElement, rightUsername: HTMLElement, gameMode: GameMode) {
	if (gameMode === 'local' || gameMode === 'tournament') {
		leftUsername.textContent = sessionStorage.getItem('player1') || 'Player 1';
		rightUsername.textContent = sessionStorage.getItem('player2') || 'Player 2';
	} else {
		const side = sessionStorage.getItem('side');
		const displayName = sessionStorage.getItem('displayName');
		const opponent = sessionStorage.getItem('opponent');
		if (side === 'left') {
			leftUsername.textContent = displayName;
			rightUsername.textContent = opponent;
		} else {
			rightUsername.textContent = displayName;
			leftUsername.textContent = opponent;
		}
	}
}
