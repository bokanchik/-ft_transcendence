import { GameMode } from "../components/gamePage.js";
import { cleanupSocket } from "../services/initOnlineGame.js";
import { navigateTo } from "../services/router.js";
import socket from '../services/socket.js';
import { showGameResult } from "../components/gameResults.js";
import { initCountdown } from "../components/countdown.js";
import { get } from "http";
// import { showToast } from '../components/toast.js';

export function GameRoomPage(mode: GameMode): HTMLElement {
	const container = document.createElement('div');
	container.className = 'w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-900 via-green-700 to-green-600 jungle-font text-white';
	
	// Game box
	const gameBox = document.createElement('div');
	gameBox.className = `
			relative w-[800px] h-[500px] border-[10px] border-green-950 rounded-xl overflow-hidden
			bg-gradient-to-br from-emerald-800 via-lime-700 to-green-600 shadow-xl
		`;	
	gameBox.id = 'game-box';

	// Left paddle
	const leftPaddle: HTMLDivElement = document.createElement('div');
	leftPaddle.className = `
		absolute left-0 top-[200px] w-[14px] h-[100px] bg-yellow-900 rounded-sm shadow-inner
	`;
	leftPaddle.id = 'left-paddle';

	// Right paddle
	const rightPaddle = document.createElement('div');
	rightPaddle.className = `
		absolute right-0 top-[200px] w-[14px] h-[100px] bg-yellow-900 rounded-sm shadow-inner
	`;
	rightPaddle.id = 'right-paddle';

	// Ball
	const ball = document.createElement('div');
	ball.className = `
		absolute w-[20px] h-[20px] rounded-full border-[2px] border-[#3e2f1c] 
		bg-[#5b3c1d] shadow-inner jungle-coconut
	`;
	ball.id = 'ball';
	ball.style.left = 'calc(50% - 10px)';
	ball.style.top = 'calc(50% - 10px)';

	// Left username
	const leftUsername = document.createElement('div');
	leftUsername.className = `
		absolute left-[20px] top-[20px] px-3 py-1 bg-lime-200 text-green-900 border border-green-800
		rounded font-bold text-xl shadow jungle-font
	`;
	leftUsername.id = 'left-username';

	// Right username
	const rightUsername = document.createElement('div');
	rightUsername.className = `
		absolute right-[20px] top-[20px] px-3 py-1 bg-lime-200 text-green-900 border border-green-800
		rounded font-bold text-xl shadow text-right jungle-font
	`;
	rightUsername.id = 'right-username';

	// Score display
	const scoreDisplay = document.createElement('div');
	scoreDisplay.className = `
		absolute top-[20px] left-1/2 transform -translate-x-1/2 
		text-3xl font-extrabold text-yellow-300 jungle-font drop-shadow
	`;
	scoreDisplay.id = 'score-display';
	scoreDisplay.textContent = '0 - 0'; // TODO: should be apdated

	// Quit button
	const quitButton = document.createElement('button');
	quitButton.className = `
		mt-6 px-5 py-2 bg-red-700 text-white font-bold rounded-lg 
		hover:bg-red-800 shadow-lg transition duration-300 jungle-font
	`;
	quitButton.textContent = 'Quit';

	// Append all to game box
	gameBox.appendChild(leftPaddle);
	gameBox.appendChild(rightPaddle);
	gameBox.appendChild(ball);
	gameBox.appendChild(leftUsername);
	gameBox.appendChild(rightUsername);
	gameBox.appendChild(scoreDisplay);

	container.append(gameBox, quitButton);
	
	const gameMode = sessionStorage.getItem('gameMode');
	if (gameMode === 'local') {
		rightUsername.textContent = sessionStorage.getItem('player1');
		leftUsername.textContent = sessionStorage.getItem('player2');
	} else {
		setBoard(leftUsername, rightUsername);
	}

	// --- Countdown function
	// initCountdown(countdown);

	// --- Main game function for socket handling and game logic
	gameRoutine(quitButton, gameMode);

	return container;
}

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

function gameRoutine(container: HTMLButtonElement, gameMode: string | null) {

	// --- Socket events handler ---
	clientSocketHandler(gameMode);
	
	// --- Event: quit button ---
	container.addEventListener('click', () => {
		const matchId = sessionStorage.getItem('matchId');
		const opponentId = sessionStorage.getItem('opponent');

		socket.emit('quit', matchId, opponentId);
		cleanupSocket(socket);
		sessionStorage.clear(); // clean storage --> users have to put there aliases again
		navigateTo('/game');
	});
}

function clientSocketHandler(gameMode: string | null) {
	
	if (!socket.connected) {
		socket.connect();
	}
	
	if (gameMode === 'remote') {
		startOnlineGame(socket);
	}
	
	// --- Local Socket events ---
	socket.on('connect', () => {
		console.log('emit startLocal');
		if (gameMode === 'local') {
			const matchId = sessionStorage.getItem('localMatchId');
			socket.emit('startLocalGame', matchId); // maybe need to send sides
		}
	});
	
	socket.on('gameStarted', () => {
		if (gameMode === 'local') {
			startLocalGame(socket);
		}
	});

	socket.on('gameFinished', async (matchId: string) => {
		try {
			const matchRes = await fetch(`/api/game/match/${matchId}`);
			if (!matchRes.ok) throw new Error('Failed to fetch match info');
			const matchData = await matchRes.json();
			const data = matchData.data;
			const player1: number = data.player1_id; // userid
			const player2: number = data.player2_id;
			const score1: number = data.player1_score;
			const score2: number = data.player2_score;

			const url1: string = await getUserAvatar(player1);
			const url2: string = await getUserAvatar(player2);
			const name1: string = await getDisplayName(player1);
			const name2: string = await getDisplayName(player2);

			setTimeout(() => {
				showGameResult(name1, name2, score1, score2, url1, url2);
			}, 2000);
			
		} catch (err: unknown) {
			console.log(`Failed to fetch data from db: ${err}`);
		}
	});
	
}

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

function startOnlineGame(socket: SocketIOClient.Socket) {

	const side = sessionStorage.getItem('side');
	let paddleMovement = 0;

	document.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowUp') {
			paddleMovement = -1;
		} else if (event.key === 'ArrowDown') {
			paddleMovement = 1;
		}
		socket.emit('playerMove', {
			side,
			paddleMovement,
		});
	})

	document.addEventListener('keyup', (event) => {
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			paddleMovement = 0;
			socket.emit('playerMove', {
				side,
				paddleMovement,
			});
		}
	});

	// socket.on('stateUpdate', (data: string) => {
	// 	const { leftPaddleUpdated, rightPaddleUpdated, ballUpdated } = JSON.parse(data);
	// 	document.getElementById('left-paddle')!.style.top = `${leftPaddleUpdated}px`;
	// 	document.getElementById('right-paddle')!.style.top = `${rightPaddleUpdated}px`;
	// 	document.getElementById('ball')!.style.left = `${ballUpdated.x}px`;
	// 	document.getElementById('ball')!.style.top = `${ballUpdated.y}px`;
	// });

}

function startLocalGame(socket: SocketIOClient.Socket) {
	let leftPaddleMovement = 0;
	let rightPaddleMovement = 0;

	document.addEventListener('keydown', (event) => {
		if (event.key === 'w' || event.key === 'W') {
			leftPaddleMovement = -1; // deplacer vers le haut
		} else if (event.key === 's' || event.key === 'S') {
			leftPaddleMovement = 1; // deplacer vers le bas
		}

		if (event.key === 'ArrowUp') {
			rightPaddleMovement = -1;
		} else if (event.key === 'ArrowDown') {
			rightPaddleMovement = 1;
		}
		sendPlayerMovement(socket, leftPaddleMovement, rightPaddleMovement);

	})

	document.addEventListener('keyup', (event) => {
		if (event.key === 'w' || event.key === 's' || event.key === 'W' || event.key == 'S') {
			leftPaddleMovement = 0;
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			rightPaddleMovement = 0;
		}

		sendPlayerMovement(socket, leftPaddleMovement, rightPaddleMovement);
	})

	// TODO: serveur recois 
	// socket.on('stateUpdate', (data: string) => {
	// 	const { leftPaddleUpdated, rightPaddleUpdated } = JSON.parse(data);
	// 	const leftPaddleElem = document.getElementById('left-paddle');
	// 	const rightPaddleElem = document.getElementById('right-paddle');

	// 	if (leftPaddleElem && rightPaddleElem) {
	// 		leftPaddleElem.style.top = `${leftPaddleUpdated}px`;
	// 		rightPaddleElem.style.top = `${rightPaddleUpdated}px`;
	// 	}
	// });

}

function sendPlayerMovement(socket: SocketIOClient.Socket, leftPaddle: number, rightPaddle: number) {
	socket.emit('playerMove', ({
		leftPaddle,
		rightPaddle,
	}));
}

