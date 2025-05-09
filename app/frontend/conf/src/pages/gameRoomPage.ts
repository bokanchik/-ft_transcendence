import { GameMode } from "../components/gamePage.js";
import { navigateTo } from "../services/router.js";

export function GameRoomPage(mode: GameMode): HTMLElement {
	const container = document.createElement('div');
	container.className = 'w-full h-screen flex flex-col items-center justify-center bg-gray-900';

	// Game box
	const gameBox = document.createElement('div');
	gameBox.className = 'relative bg-white w-[800px] h-[500px] border-4 border-black overflow-hidden';
	gameBox.id = 'game-box';

	// Left paddle
	const leftPaddle: HTMLDivElement = document.createElement('div');
	leftPaddle.className = 'absolute left-0 top-[200px] w-[10px] h-[100px] bg-black';
	leftPaddle.id = 'left-paddle';

	// Right paddle
	const rightPaddle = document.createElement('div');
	rightPaddle.className = 'absolute right-0 top-[200px] w-[10px] h-[100px] bg-black';
	rightPaddle.id = 'right-paddle';

	// Ball
	const ball = document.createElement('div');
	ball.className = 'absolute w-[15px] h-[15px] bg-red-600 rounded-full';
	ball.id = 'ball';

	ball.style.left = 'calc(50% - 7.5px)';
	ball.style.top = 'calc(50% - 7.5px)';

	// Countdown overlay
	const countdown = document.createElement('div');
	countdown.className = 'absolute inset-0 flex items-center justify-center text-6xl font-bold text-white bg-black bg-opacity-70 z-50';
	countdown.id = 'countdown';
	countdown.textContent = 'Start in 3...';

	// Left username
	const leftUsername = document.createElement('div');
	leftUsername.className = 'absolute left-[20px] top-[20px] px-3 py-1 bg-white border border-black rounded text-black font-semibold text-xl shadow';
	leftUsername.id = 'left-username';
	
	// Right username
	const rightUsername = document.createElement('div');
	rightUsername.className = 'absolute right-[20px] top-[20px] px-3 py-1 bg-white border border-black rounded text-black font-semibold text-xl shadow text-right';
	rightUsername.id = 'right-username';
	
	// Score display
	const scoreDisplay = document.createElement('div');
	scoreDisplay.className = 'absolute top-[20px] left-1/2 transform -translate-x-1/2 text-2xl font-bold text-black';
	scoreDisplay.id = 'score-display';
	scoreDisplay.textContent = '0 - 0';
	
	// Quit button
	const quitButton = document.createElement('button');
	quitButton.className = 'mt-6 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700';
	quitButton.textContent = 'Quit';

	// Append all to game box
	gameBox.appendChild(leftPaddle);
	gameBox.appendChild(rightPaddle);
	gameBox.appendChild(ball);
	gameBox.appendChild(countdown);
	gameBox.appendChild(leftUsername);
	gameBox.appendChild(rightUsername);
	gameBox.appendChild(scoreDisplay);
	
	container.append(gameBox, quitButton);

	// si local --> on recupere depuis sessionStorage
	if (sessionStorage.getItem('gameMode') === 'local'){
		rightUsername.textContent = sessionStorage.getItem('player1');
		leftUsername.textContent = sessionStorage.getItem('player2');
	}
	
	
	// --- Countdown function
	initCountdown(countdown);
	
	// --- Main game function for socket handling and game logic
	initGame(quitButton);

	return container;
}

function initGame(container: HTMLButtonElement) {
	const gameMode = sessionStorage.getItem('gameMode');
	const socket: SocketIOClient.Socket = io('wss://localhost:8443', {
		transports: ['websocket'],
	});

	socket.on('connect', () => {
		if (gameMode === 'local') {
			socket.emit('startLocalGame');
		} else if (gameMode === 'remote') {
			// look to initSocketClient
		}
	});

	// after connexion to the server
	socket.on('gameStarted', () => {
		startLocalGame(socket);
	});

	// --- Event: quit button ---
	container.addEventListener('click', () => {
		console.log('Quit game clicked');
		socket.emit('disconnect');
		sessionStorage.clear(); // clean storage --> users have to put there aliases again
		navigateTo('/game');
	});

}

async function initCountdown(container: HTMLDivElement) {
	const countdownIsDone = sessionStorage.getItem('countdown') === 'true';
	// Countdown logic
	if (!countdownIsDone) {
		let countdownValue = 3;
		const interval = setInterval(() => {
			if (countdownValue > 1) {
				countdownValue--;
				container.textContent = `Start in ${countdownValue}...`;
			} else {
				container.remove(); // remove overlay
				clearInterval(interval);
				sessionStorage.setItem('countdown', 'true');
				
			}
		}, 1000);
	} else {
		container.remove();
	}

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

		sendPlayerMouvement(socket, leftPaddleMovement, rightPaddleMovement);
	})

	document.addEventListener('keyup', (event) => {
		if (event.key === 'w' || event.key === 's' || event.key === 'W' || event.key == 'S') {
			leftPaddleMovement = 0;
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			rightPaddleMovement = 0;
		}

		sendPlayerMouvement(socket, leftPaddleMovement, rightPaddleMovement);
	})

	socket.on('message', (data: string) => {
		const { leftPaddleUpdated, rightPaddleUpdated } = JSON.parse(data);
		const leftPaddleElem = document.getElementById('left-paddle');
		const rightPaddleElem = document.getElementById('right-paddle');

		if (leftPaddleElem && rightPaddleElem) {
			leftPaddleElem.style.top = `${leftPaddleUpdated}px`;
			rightPaddleElem.style.top = `${rightPaddleUpdated}px`;
		}
	});
	
}

function sendPlayerMouvement(socket: SocketIOClient.Socket, leftPaddle: number, rightPaddle: number) {
	socket.emit('playerMove', ({
		leftPaddle,
		rightPaddle,
	}));
}

// function startRemoteGame(gameBox: HTMLDivElement) {

// }