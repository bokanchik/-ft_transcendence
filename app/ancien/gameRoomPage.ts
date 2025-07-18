import { GameMode } from "../components/gamePage.js";
import { cleanupSocket } from "../services/initOnlineGame.js";
import { navigateTo } from "../services/router.js";
import socket from '../services/socket.js';
import { showGameResult } from "../components/gameResults.js";
import { showCustomConfirm } from "../components/toast.js";
//@ts-ignore
import { GameState } from '../shared/gameTypes.js';
import { t } from '../services/i18nService.js';

const PADDLE_HEIGHT = 120;
const PADDLE_WIDTH = 20;
const PADDLE_X_LEFT = 20;
const PADDLE_X_RIGHT = 770;
const BALL_RADIUS = 15;

const BG_COLOUR = "rgba(17, 24, 39, 0.8)"; // Fond sombre semi-transparent
const BALL_COLOUR = "rgb(234, 179, 8)"; // Jaune/Or pour la balle
const PADDLE_COLOUR = "rgb(209, 213, 219)"; // Gris clair pour les raquettes

const gameState: GameState = {
	leftPaddle: {
		y: 200,
	},
	rightPaddle: {
		y: 200,
	},
	ball: {
		x: 400,
		y: 250,
	},
	score1: 0, // left
	score2: 0 // right
}

// boolean qui sert pour arreter dessiner le jeu
let isGameOver = false;


// TODO: JE PEUX UTILISER MODE ICI ET NE PAS FAIRE UN APPEL A SESSION STORAGE !
export function GameRoomPage(mode: GameMode): HTMLElement {

	//ajout arthur
	const pageWrapper = document.createElement('div');
	pageWrapper.className = 'w-full h-screen flex flex-col items-center justify-center bg-cover bg-center bg-fixed';
	pageWrapper.style.backgroundImage = "url('/assets/background.webp')";

	// Conteneur principal
	const container = document.createElement('div');
	// container.className = 'w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-900 via-green-700 to-green-600 jungle-font text-white';
	// remplacement arthur
	container.className = 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-4';

	// Wrapper horizontal pour les usernames et canvas
	const gameRow = document.createElement('div');
	gameRow.className = 'flex items-center';

	// Nom du joueur gauche (à gauche du canvas)
	const leftUsername = document.createElement('div');
	// leftUsername.className = 'mr-4 px-3 py-1 bg-lime-200 text-green-900 border border-green-800 rounded font-bold text-xl shadow jungle-font text-center inline-block';
	leftUsername.className = 'w-32 text-center text-lg font-bold text-white bg-teal-600/30 border-2 border-teal-500/50 p-2 rounded-lg shadow-md';
	leftUsername.id = 'left-username';

	// Canvas de jeu
	const canvas = document.createElement('canvas');
	canvas.id = 'pong-canvas';
	canvas.width = 800;
	canvas.height = 500;
	// canvas.className = 'border-8 border-green-700 rounded-lg bg-neutral-900';
	canvas.className = 'border-4 border-white/10 rounded-lg shadow-inner';

	// Nom du joueur droit (à droite du canvas)
	const rightUsername = document.createElement('div');
	// rightUsername.className = 'ml-4 px-3 py-1 bg-lime-200 text-green-900 border border-green-800 rounded font-bold text-xl shadow jungle-font text-center inline-block';
	rightUsername.className = 'w-32 text-center text-lg font-bold text-white bg-rose-600/30 border-2 border-rose-500/50 p-2 rounded-lg shadow-md';
	rightUsername.id = 'right-username';

	// Score display
	const scoreDisplay = document.createElement('div');
	// scoreDisplay.className = 'absolute top-8 left-1/2 transform -translate-x-1/2 text-3xl font-extrabold text-yellow-300 jungle-font drop-shadow';
	scoreDisplay.className = 'text-5xl font-extrabold text-yellow-300 drop-shadow-lg [text-shadow:_0_2px_4px_rgb(0_0_0_/_40%)]';
	scoreDisplay.id = 'score-display';
	scoreDisplay.textContent = '0 - 0';

	// Composition de la ligne
	// gameRow.append(leftUsername, canvas, rightUsername, scoreDisplay);
	// ajout arthur
	gameRow.append(leftUsername, canvas, rightUsername);
	container.appendChild(scoreDisplay);

	container.appendChild(gameRow);

	// Quit button
	const quitButton = document.createElement('button');
	quitButton.className = 'mt-6 px-5 py-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 shadow-lg transition duration-300 jungle-font';
	quitButton.className = 'px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition duration-200 border border-red-500/50';
	quitButton.textContent = t('game.quitButton');

	// Ajouter le bouton dans le container principal
	container.appendChild(quitButton);
	// ajout arthur
	pageWrapper.appendChild(container);

	const gameMode = sessionStorage.getItem('gameMode');
	if (!gameMode) {
		console.error('Match ID not found in sessionStorage');
		return container;
	}

	if (gameMode === 'local' || gameMode === 'tournament') {
		rightUsername.textContent = sessionStorage.getItem('player1');
		leftUsername.textContent = sessionStorage.getItem('player2');
	} else {
		setBoard(leftUsername, rightUsername);
	}

	// Initialiser le canvas
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas context not supported');
	ctx.fillStyle = BG_COLOUR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// --- Event: quit button ---
	quitButton.addEventListener('click', quitButtonHandler);

	updateScore(scoreDisplay, gameState);

	drawGame(gameState, ctx, scoreDisplay);

	clientSocketHandler(gameMode, ctx, scoreDisplay);

	// ajout arthur
	// return container;
	return pageWrapper;
}

// Function to set usernames if they're playing in remote
function setBoard(leftUsername: HTMLDivElement, rightUsername: HTMLDivElement) {
	const side = sessionStorage.getItem('side');
	const displayName = sessionStorage.getItem('displayName');
	const opponent = sessionStorage.getItem('opponent');

	if (!side || !displayName || !opponent) {
		console.error("Session storaged doesn't contain what you need to set the board.");
		return;
	}

	if (side === 'left') {
		leftUsername.textContent = displayName;
		rightUsername.textContent = opponent;
	} else if (side === 'right') {
		leftUsername.textContent = opponent;
		rightUsername.textContent = displayName;
	}
}


function drawGame(state: GameState, ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {


	// Efface tout le canvas
	ctx.fillStyle = BG_COLOUR;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	// DRAW BALL
	const ball = state.ball;

	ctx.fillStyle = BALL_COLOUR;
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();

	ctx.fillStyle = PADDLE_COLOUR;

	// DRAW LEFT PADDLE
	const leftPaddle = state.leftPaddle;

	ctx.fillRect(PADDLE_X_LEFT, leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);

	// DRAW RIGHT PADDLE
	const rightPaddle = state.rightPaddle;

	ctx.fillRect(PADDLE_X_RIGHT, rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);


}

function updateScore(scoreDisplay: HTMLDivElement, state: GameState) {
	if (scoreDisplay) {
		scoreDisplay.textContent = `${state.score1} - ${state.score2}`;
	}
}

function clientSocketHandler(gameMode: string | null, ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {

	if (!socket.connected) {
		socket.connect();
	}


	if (gameMode === 'remote') {
		handleRemoteEvents(ctx, scoreDisplay);
	}

	if (gameMode === 'local' || gameMode === 'tournament') {
		handleLocalEvents(ctx, scoreDisplay);
	}

	document.addEventListener('keydown', keydown);
	document.addEventListener('keyup', keyup);

}

function handleRemoteEvents(ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {


	socket.on('gameState', (state: GameState) => {
		handleGameState(state, ctx, scoreDisplay);
	});


	socket.on('gameOver', () => {
		onGameOver();
	});

	socket.on('opponentLeft', () => {
		onGameOver();
	})

}

async function onGameOver() {
	const matchId = sessionStorage.getItem('matchId');
	if (!matchId) {
		console.error("Match ID not found in sessionStorage.");
		return;
	}

	// fetch results with game DB
	try {
		const matchRes = await fetch(`/api/game/match/remote/${matchId}`);
		if (!matchRes.ok) throw new Error('Failed to fetch match info');
		const data = await matchRes.json();


		const player1: number = parseInt(data.player1_id);
		const player2: number = parseInt(data.player2_id);
		const score1: number = parseInt(data.player1_score);
		const score2: number = parseInt(data.player2_score);

		const url1: string = await getUserAvatar(player1);
		const url2: string = await getUserAvatar(player2);
		const name1: string = await getDisplayName(player1);
		const name2: string = await getDisplayName(player2);

		// Here I need to find a way to send the score result to the tournament page
		sessionStorage.setItem('score1', score1.toString());
		sessionStorage.setItem('score2', score2.toString());
		setTimeout(() => {
			showGameResult(name1, name2, score1, score2, url1, url2);
			// stop drawing && clean
			isGameOver = true;
			cleanupSocket(socket);
			cleanupListeners();
			sessionStorage.clear();
			navigateTo('/game');
			isGameOver = false;
		}, 500);

	} catch (err: unknown) {
		console.log(`Failed to fetch data from db: ${err}`);
		throw err;
	}

}

function handleLocalEvents(ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {
	const matchId = sessionStorage.getItem('matchId');
	if (!matchId) {
		console.error("Match ID not found in sessionStorage.");
		return;
	}
	socket.emit('startLocal', matchId);

	socket.on('gameState', (state: GameState) => {
		handleGameState(state, ctx, scoreDisplay);
	});

	socket.on('gameOver', () => {
		isGameOver = true;
		cleanupSocket(socket);
		cleanupListeners();
		if (sessionStorage.getItem('gameMode') === 'tournament') {
			navigateTo('/tournament');
		}
		navigateTo('/local-game');
		sessionStorage.clear();
		isGameOver = false;
	});

}

function handleGameState(state: GameState, ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {
	if (isGameOver) return;
	requestAnimationFrame(() => drawGame(state, ctx, scoreDisplay));
	updateScore(scoreDisplay, state);
}

async function quitButtonHandler() {
	const confirmed = await showCustomConfirm("Are you sure you want to quit this game?");

	if (confirmed) {
		isGameOver = true;
		cleanupSocket(socket);
		cleanupListeners();

		const gameMode = sessionStorage.getItem('gameMode');
		if (!gameMode) {
			console.error('Game mode not found in session storage');
			return;
		}
		if (gameMode === 'local') {
			navigateTo('/local-game');
		} else if (gameMode === 'remote') {
			navigateTo('/game');
		} else if (gameMode === 'tournament') {
			navigateTo('/tournament');
		}

		sessionStorage.clear(); // clean storage --> users have to put there aliases again
		isGameOver = false;
	}
}

function keydown(e: KeyboardEvent) {
	socket.emit('keydown', e.keyCode);
}

function keyup(e: KeyboardEvent) {
	socket.emit('keyup', e.keyCode);
}

async function getDisplayName(userId: number): Promise<string> {
	// const userRes = await fetch(`api/users/${userId}`);
	const userRes = await fetch(`api/users/${userId}/public`);
	if (!userRes.ok) throw new Error('Failed to fetch user info');
	const userData = await userRes.json();
	const displayName = userData.display_name;

	return displayName;
}

async function getUserAvatar(userId: number): Promise<string> {
	// const userRes = await fetch(`/api/users/${userId}`);
	const userRes = await fetch(`api/users/${userId}/public`);
	if (!userRes.ok) throw new Error('Failed to fetch user info');
	const userData = await userRes.json();
	const url: string = userData.avatar_url;

	return url;
}

function cleanupListeners() {
	document.removeEventListener('keydown', keydown);
	document.removeEventListener('keyup', keyup);
}
