import { GameMode } from "../pages/gameSetupPage.js";
import { cleanupSocket } from "../services/initOnlineGame.js";
import { navigateTo } from "../services/router.js";
import socket from '../services/socket.js';
import { showGameResult } from "../components/gameResults.js";
import { showCustomConfirm } from "../components/toast.js";
// @ts-ignore
import { GameState } from '../shared/gameTypes.js';
import { t } from '../services/i18nService.js';
import { User, UserPublic } from "../shared/schemas/usersSchemas.js";
import { config } from "../utils/config.js";

const PADDLE_HEIGHT = config.settings.game.paddleHeight;
const PADDLE_WIDTH = config.settings.game.paddleWidth;
const PADDLE_X_LEFT = config.settings.game.paddleXLeft;
const PADDLE_X_RIGHT = config.settings.game.paddleXRight;
const BALL_RADIUS = config.settings.game.ballRadius;
const BG_COLOUR = config.settings.game.backgroundColor;
const BALL_COLOUR = config.settings.game.ballColor;
const PADDLE_COLOUR = config.settings.game.paddleColor;

let isGameOver = false;

export function initializeGame(gameMode: GameMode, ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {
	const initialGameState: GameState = { leftPaddle: { y: 200 }, rightPaddle: { y: 200 }, ball: { x: 400, y: 250 }, score1: 0, score2: 0 };
	drawGame(initialGameState, ctx);
	updateScore(scoreDisplay, initialGameState);

	clientSocketHandler(gameMode, ctx, scoreDisplay);
}

function clientSocketHandler(gameMode: GameMode, ctx: CanvasRenderingContext2D, scoreDisplay: HTMLDivElement) {
	if (!socket.connected) {
		socket.connect();
	}

	const handleGameState = (state: GameState) => {
		if (isGameOver) return;
		requestAnimationFrame(() => drawGame(state, ctx));
		updateScore(scoreDisplay, state);
	};

	socket.on('gameState', handleGameState);
	socket.on('gameOver', (finalState?: GameState) => onGameOver(finalState));

	if (gameMode === 'remote' || gameMode === 'onlineTournament') {
		socket.on('opponentLeft', () => onGameOver());
	} else {
		const matchId = sessionStorage.getItem('matchId');
		if (matchId) socket.emit('startLocal', matchId);
	}

	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('keyup', handleKeyup);
}

function handleKeydown(e: KeyboardEvent) { socket.emit('keydown', e.code); }
function handleKeyup(e: KeyboardEvent) { socket.emit('keyup', e.code); }

async function onGameOver(finalState?: GameState) {
    if (isGameOver) return;
    isGameOver = true;

    const gameMode = sessionStorage.getItem('gameMode');
    const matchId = sessionStorage.getItem('matchId');
	const onlineTournamentId = sessionStorage.getItem('onlineTournamentId');

	// --- CAS TOURNOI EN LIGNE ---
	if (gameMode === 'onlineTournament') {
		cleanupGameRoom({ keepSocketAlive: true });
		try {
			if (!matchId) throw new Error("Match ID not found for online tournament game over.");

			const matchRes = await fetch(`/api/game/match/remote/${matchId}`);
			if (!matchRes.ok) throw new Error('Failed to fetch match info');
			const matchData = await matchRes.json();
			
			const [player1Data, player2Data] = await Promise.all([
				getUserPublic(matchData.player1_id),
				getUserPublic(matchData.player2_id)
			]);
			showGameResult( player1Data.display_name || 'Player 1',
				player2Data.display_name || 'Player 2',
				matchData.player1_score ?? 0,
				matchData.player2_score ?? 0,
				getAvatarForUser(player1Data),
				getAvatarForUser(player2Data),
				`/tournament/${onlineTournamentId}`,
				t('link.tournament')
			);
		} catch (err) {
			console.error("Error on game over:", err);
			navigateTo('/game');
		}
		return;
	}

    // --- CAS MATCH RAPIDE ---
    if (gameMode === 'remote') {
		cleanupGameRoom({ keepSocketAlive: false });
        try {
            if (!matchId) throw new Error("Match ID not found for remote game over.");
            const matchRes = await fetch(`/api/game/match/remote/${matchId}`);
            if (!matchRes.ok) throw new Error('Failed to fetch match info');
            const matchData = await matchRes.json();
    
            const [player1Data, player2Data] = await Promise.all([
                  getUserPublic(matchData.player1_id),
                  getUserPublic(matchData.player2_id)
            ]);
    
			showGameResult(
				player1Data.display_name || 'Player 1',
				player2Data.display_name || 'Player 2',
				matchData.player1_score ?? 0,
				matchData.player2_score ?? 0,
				getAvatarForUser(player1Data),
				getAvatarForUser(player2Data),
				'/game',
				t('link.newGame')
			);
    
        } catch (err) {
            console.error("Error on game over:", err);
            navigateTo('/game');
        }
        return;
    }

	// --- CAS TOURNOI LOCAL ---
    if (gameMode === 'tournament') {
        if (finalState) {
			cleanupGameRoom({ keepSocketAlive: true });
            const rawData = sessionStorage.getItem('tournamentData');
            if (rawData) {
                let data = JSON.parse(rawData);
				if (!data.results) {
                    const matchCount = data.pairs.length * 2 -1;
                    data.results = new Array(matchCount).fill(null);
                }
                let i = 0;
                while (data.results[i] != null) i++;
                data.results[i] = finalState.score1 > finalState.score2 ? 0 : 1;
                sessionStorage.setItem('tournamentData', JSON.stringify(data));
            }
        }
        navigateTo('/tournament');
        return;
    }

    // --- CAS MATCH LOCAL SIMPLE (DUEL) ---
    if (gameMode === 'local' && finalState) {
        const player1 = sessionStorage.getItem('player1') || 'Player 1';
        const player2 = sessionStorage.getItem('player2') || 'Player 2';
		const defaultAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
        cleanupGameRoom({ keepSocketAlive: false });
		showGameResult(player1, player2, finalState.score1, finalState.score2, defaultAvatar(player1), defaultAvatar(player2), '/local-game', t('link.newGame'));
    } else {
        navigateTo('/game');
    }
}

export async function quitGameHandler(gameMode: GameMode) {
    const confirmed = await showCustomConfirm(t('game.quitConfirm'));
    if (confirmed) {
        isGameOver = true;

        const onlineTournamentId = sessionStorage.getItem('onlineTournamentId');
        const keepSocketAlive = !!onlineTournamentId;
        cleanupGameRoom({ keepSocketAlive });
        
        if (onlineTournamentId) {
             socket.disconnect();
             navigateTo(`/tournament/${onlineTournamentId}`);
        } else {
            const destination = (gameMode === 'local' || gameMode === 'tournament') ? '/local-game' : '/game';
            navigateTo(destination);
        }
    }
}

function drawGame(state: GameState, ctx: CanvasRenderingContext2D) {
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

function updateScore(scoreDisplay: HTMLElement, state: GameState) {
	scoreDisplay.textContent = `${state.score1} - ${state.score2}`;
}

async function getUserPublic(userId: number): Promise<UserPublic> {
	const userRes = await fetch(`api/users/${userId}/public`);
	if (!userRes.ok) throw new Error('Failed to fetch user public details');
	const userData: UserPublic = await userRes.json();
	return userData;
}

function getAvatarForUser(user: UserPublic): string {
  if (user.avatar_url) { return user.avatar_url; }
  const name = user.display_name || `John Doe`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
}

function cleanupGameRoom( options: { keepSocketAlive?: boolean } = {}) {
	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('keyup', handleKeyup);

	socket.off('gameState');
	socket.off('gameOver');
	socket.off('opponentLeft');

	if (!options.keepSocketAlive) {
		cleanupSocket(socket);
		sessionStorage.clear();
	} else {
	    sessionStorage.removeItem('side');
	    sessionStorage.removeItem('matchId');
	}
}