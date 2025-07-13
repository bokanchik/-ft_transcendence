import { GameMode } from "../pages/gameSetupPage.js";
import { navigateTo } from "../services/router.js";
// @ts-ignore
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';
import { initializeGame, quitGameHandler } from "../services/gameService.js";

export function GameRoomPage(mode: GameMode): HTMLElement {

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