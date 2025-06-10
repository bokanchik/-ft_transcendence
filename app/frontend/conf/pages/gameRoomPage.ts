import { GameMode } from "../components/gamePage.js";
import { cleanupSocket } from "../services/initOnlineGame.js";
import { navigateTo } from "../services/router.js";
import socket from '../services/socket.js';
import { showGameResult } from "../components/gameResults.js";
import { showCustomConfirm } from "../components/toast.js";
//@ts-ignore
import { GameState } from '../shared/gameTypes.js';
// import { showToast } from '../components/toast.js';
const PADDLE_HEIGHT = 120;
const PADDLE_WIDTH = 20;
const BG_COLOUR = "rgb(0, 0, 0) ";
const BALL_COLOUR = "rgb(255, 255, 255) ";
const PADDLE_COLOUR = "rgb(255, 255, 255) ";

const gameState: GameState = {
	leftPaddle: {
		x: 20,
		y: 200,
		vy: 0, // need to remove

	},
	rightPaddle: {
		x: 770,
		y: 200,
		vy: 0,
	},
	ball: {
		x: 400,
		y: 250,
		vx: 0,
		vy: 0, // need to remove
		radius: 15
	},
} 

// boolean qui sert pour arreter dessiner le jeu
let isGameOver = false;

export function GameRoomPage(mode: GameMode): HTMLElement {
	
	// Conteneur principal
	const container = document.createElement('div');
	container.className = `
		w-full h-screen flex flex-col items-center justify-center 
		bg-gradient-to-b from-green-900 via-green-700 to-green-600 
		jungle-font text-white
	`;

	// Wrapper horizontal pour les usernames et canvas
	const gameRow = document.createElement('div');
	gameRow.className = 'flex items-center';

	// Nom du joueur gauche (à gauche du canvas)
	const leftUsername = document.createElement('div');
	leftUsername.className = `
		mr-4 px-3 py-1 bg-lime-200 text-green-900 
		border border-green-800 rounded font-bold text-xl 
		shadow jungle-font text-center inline-block
	`;
	leftUsername.id = 'left-username';

	// Canvas de jeu
	const canvas = document.createElement('canvas');
	canvas.id = 'pong-canvas';
	canvas.width = 800;
	canvas.height = 500;
	canvas.className = 'border-8 border-green-700 rounded-lg bg-neutral-900';

	// Nom du joueur droit (à droite du canvas)
	const rightUsername = document.createElement('div');
	rightUsername.className = `
		ml-4 px-3 py-1 bg-lime-200 text-green-900 
		border border-green-800 rounded font-bold text-xl 
		shadow jungle-font text-center inline-block
	`;
	rightUsername.id = 'right-username';

	// Score display
	const scoreDisplay = document.createElement('div');
	scoreDisplay.className = `
		absolute top-8 left-1/2 transform -translate-x-1/2
		text-3xl font-extrabold text-yellow-300 jungle-font drop-shadow
	`;
	scoreDisplay.id = 'score-display';
	scoreDisplay.textContent = '0 - 0';

	// Composition de la ligne
	gameRow.append(leftUsername, canvas, rightUsername, scoreDisplay);
	container.appendChild(gameRow);

	// Quit button
	const quitButton = document.createElement('button');
	quitButton.className = `
		mt-6 px-5 py-2 bg-red-700 text-white font-bold rounded-lg 
		hover:bg-red-800 shadow-lg transition duration-300 jungle-font
	`;
	quitButton.textContent = 'Quit';

	// Ajouter le bouton dans le container principal
	container.appendChild(quitButton);
	
	const gameMode = sessionStorage.getItem('gameMode');
	if (gameMode === 'local') {
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
	
	drawGame(gameState, ctx);

	clientSocketHandler(scoreDisplay, gameMode, ctx);

	return container;
}


function drawGame(state: GameState, ctx: CanvasRenderingContext2D) {
	
	// Efface tout le canvas
	ctx.fillStyle = BG_COLOUR;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	 
	// DRAW BALL
	const ball = state.ball;
	 
	ctx.fillStyle = BALL_COLOUR;
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
	
	ctx.fillStyle = PADDLE_COLOUR;
	
	// DRAW LEFT PADDLE
	const leftPaddle = state.leftPaddle;
	
	ctx.fillRect(leftPaddle.x, leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	
	// DRAW RIGHT PADDLE
	const rightPaddle = state.rightPaddle;
	
	ctx.fillRect(rightPaddle.x, rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT);
	
	
}

// Function to set usernames if they're playing in remote
function setBoard(leftUsername: HTMLDivElement, rightUsername: HTMLDivElement) {
	const side = sessionStorage.getItem('side');
	const displayName = sessionStorage.getItem('displayName');
	const opponent = sessionStorage.getItem('opponent');
	
	if (side === 'left') {
		leftUsername.textContent = displayName;
		rightUsername.textContent = opponent;
	} else if (side === 'right') {
		leftUsername.textContent = opponent;
		rightUsername.textContent = displayName;
	}
}

function clientSocketHandler(scoreDisplay: HTMLDivElement, gameMode: string | null, ctx: CanvasRenderingContext2D) {
	
	if (!socket.connected) {
		socket.connect();
	}
	
	if (gameMode === 'local') {
		handleLocalEvents(ctx, scoreDisplay);
	} else if (gameMode === 'remote') {
		handleRemoteEvents(ctx, scoreDisplay);
	}
	
}

function handleRemoteEvents(ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {
	socket.emit('startRemote');

	document.addEventListener('keydown', keydown);
	document.addEventListener('keyup', keyup);
	
	socket.on('gameState', (state: GameState) => {
		handleGameState(state, ctx);
	});
	
	socket.on('scoreUpdated', ({ score1, score2 }: {score1: number, score2: number})  => {
		if (scoreDisplay) {
			scoreDisplay.textContent = `${score1} - ${score2}`;
		}
	});

	socket.on('gameOver', () => {
		isGameOver = true;
		cleanupSocket(socket);
		sessionStorage.clear();
		navigateTo('/local-game');
		isGameOver = false;
	});
}

function handleLocalEvents(ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {
	socket.emit('startLocal');
	
	document.addEventListener('keydown', keydown);
	document.addEventListener('keyup', keyup);
	
	socket.on('gameState', (state: GameState) => {
		handleGameState(state, ctx);
	});
	
	socket.on('scoreUpdated', ({ score1, score2 }: {score1: number, score2: number})  => {
		if (scoreDisplay) {
			scoreDisplay.textContent = `${score1} - ${score2}`;
		}
	});
	
	socket.on('gameOver', () => {
		isGameOver = true;
		cleanupSocket(socket);
		sessionStorage.clear();
		navigateTo('/local-game');
		isGameOver = false;
	});
	
}

function keydown(e: KeyboardEvent) {
	//	console.log(e);
	socket.emit('keydown', e.keyCode);
}

function keyup(e: KeyboardEvent) {
	socket.emit('keyup', e.keyCode);
}


function handleGameState(state: GameState, ctx: CanvasRenderingContext2D) {
	if (isGameOver) return;
	requestAnimationFrame(() => drawGame(state, ctx));
}




async function quitButtonHandler() {
	const confirmed = await showCustomConfirm("Are you sure you want to quit this game?");
	
	if (confirmed) {
		// const matchId = sessionStorage.getItem('matchId');
		// const opponentId = sessionStorage.getItem('opponent');
		isGameOver = true;
		socket.emit('quitGame');
		cleanupSocket(socket);
		sessionStorage.clear(); // clean storage --> users have to put there aliases again
		navigateTo('/local-game');
		isGameOver = false;
	}
}


// socket.on('gameFinished', async (matchId: string) => {
	// 	try {
		// 		const matchRes = await fetch(`/api/game/match/${matchId}`);
		// 		if (!matchRes.ok) throw new Error('Failed to fetch match info');
		// 		const matchData = await matchRes.json();
		// 		const data = matchData.data;
		// 		const player1: number = data.player1_id; // userid
		// 		const player2: number = data.player2_id;
		// 		const score1: number = data.player1_score;
		// 		const score2: number = data.player2_score;
		
		// 		const url1: string = await getUserAvatar(player1);
		// 		const url2: string = await getUserAvatar(player2);
		// 		const name1: string = await getDisplayName(player1);
		// 		const name2: string = await getDisplayName(player2);
		
		// 		setTimeout(() => {
			// 			showGameResult(name1, name2, score1, score2, url1, url2);
			// 		}, 2000);
			
			// 	} catch (err: unknown) {
				// 		console.log(`Failed to fetch data from db: ${err}`);
				// 	}
				// });

async function getDisplayName(userId: number) : Promise<string> {
	const userRes = await fetch(`api/users/${userId}`);
	if (!userRes.ok) throw new Error('Failed to fetch user info');
	const userData = await userRes.json();
	const displayName = userData.display_name;
					
	return displayName;
}
				
async function getUserAvatar(userId: number) : Promise<string> {
	const userRes = await fetch(`/api/users/${userId}`);
	if (!userRes.ok) throw new Error('Failed to fetch user info');
	const userData = await userRes.json();
	const url: string = userData.avatar_url;
					
	return url;
}
