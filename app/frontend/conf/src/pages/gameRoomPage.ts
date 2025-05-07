export function GameRoomPage(): HTMLElement {
	const container = document.createElement('div');
	container.className = 'w-full h-screen flex flex-col items-center justify-center bg-gray-900';

	// Game box
	const gameBox = document.createElement('div');
	gameBox.className = 'relative bg-white w-[800px] h-[500px] border-4 border-black overflow-hidden';
	gameBox.id = 'game-box';

	// Left paddle
	const leftPaddle = document.createElement('div');
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
	leftUsername.className = 'absolute left-[20px] top-[20px] text-black font-semibold text-xl';
	leftUsername.id = 'left-username';
	leftUsername.textContent = 'Player 1';

	// Right username
	const rightUsername = document.createElement('div');
	rightUsername.className = 'absolute right-[20px] top-[20px] text-black font-semibold text-xl text-right';
	rightUsername.id = 'right-username';
	rightUsername.textContent = 'Player 2'; // fetch from server

	// Score display
	const scoreDisplay = document.createElement('div');
	scoreDisplay.className = 'absolute top-[20px] left-1/2 transform -translate-x-1/2 text-2xl font-bold text-black';
	scoreDisplay.id = 'score-display';
	scoreDisplay.textContent = '0 - 0';

	// Append all to game box
	gameBox.appendChild(leftPaddle);
	gameBox.appendChild(rightPaddle);
	gameBox.appendChild(ball);
	gameBox.appendChild(countdown);
	gameBox.appendChild(leftUsername);
	gameBox.appendChild(rightUsername);
	gameBox.appendChild(scoreDisplay);

	container.appendChild(gameBox);

	// Quit button
	const quitButton = document.createElement('button');
	quitButton.className = 'mt-6 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700';
	quitButton.textContent = 'Quit';
	quitButton.addEventListener('click', () => {
		console.log('Quit game clicked');
		// Hook to disconnect or go back
	});

	container.appendChild(quitButton);

	// Countdown logic
	let countdownValue = 3;
	const interval = setInterval(() => {
		if (countdownValue > 1) {
			countdownValue--;
			countdown.textContent = `Start in ${countdownValue}...`;
		} else {
			countdown.remove(); // remove overlay
			clearInterval(interval);
		}
	}, 1000);

	return container;
}
