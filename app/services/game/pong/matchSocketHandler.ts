import { fastify } from "../server.ts";
import { Socket } from "socket.io";
import { getRowByMatchId, setGameResult, insertMatchToDB } from "../database/dbModels.ts";
import { createBallState } from "./pongGame.ts";
import { gameLoop, handleKeydownLocal, handleKeyupLocal, handleKeydownRemote, handleKeyupRemote} from "./pongGame.ts";
import { RemoteGameSession, gameSessions, findRemoteGameSessionBySocketId } from "./gameClass.ts";
import { cleanOnDisconnection, makeid } from "../utils/waitingRoomUtils.ts";
// @ts-ignore
import { GameState, FRAME_RATE, TIMEOUT_MS } from "../shared/gameTypes.js";
import { reportMatchResultToTournamentService, updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";
import { removePlayerFromWaitingList, addPlayerToWaitingList, firstInFirstOut, getWaitingListSize, PlayerInfo, waitingList } from "../utils/waitingListUtils.ts";


export const timeouts: Map<string, NodeJS.Timeout> = new Map();
export const localGames: Map<string, { state: GameState, intervalId: NodeJS.Timeout | null, socket: Socket | null }> = new Map();
const matchWaitingRoom = new Map<string, { socket: Socket, playerInfo: PlayerInfo }[]>();

export async function matchSocketHandler(socket: Socket): Promise<void> {

    socket.on('authenticate', async ({ display_name, userId }, callback) => {
        (socket as any).playerInfo = { display_name, userId, socket };
        await updateUserStatus(userId, UserOnlineStatus.ONLINE);
        fastify.log.info(`Player ${display_name} (ID: ${userId}, Socket: ${socket.id}) authenticated.`);
        if (typeof callback === 'function') {
        callback();
    }
    });
    socket.on('playerReadyForGame', async ({ matchId }) => {
        const playerInfo = (socket as any).playerInfo as PlayerInfo | undefined;

        if (!playerInfo) {
            fastify.log.warn(`Unauthenticated socket ${socket.id} tried to join game ${matchId}`);
            return socket.emit('error', { message: 'Authentication required.' });
        }

        fastify.log.info(`Player ${playerInfo.display_name} is ready for game ${matchId}`);

        if (!matchWaitingRoom.has(matchId)) {
            matchWaitingRoom.set(matchId, []);
        }
        const waitingPlayers = matchWaitingRoom.get(matchId)!;

        if (!waitingPlayers.some(p => p.playerInfo.userId === playerInfo.userId)) {
            waitingPlayers.push({ socket, playerInfo });
        }

        if (waitingPlayers.length === 2) {
            const [player1, player2] = waitingPlayers;
            
            const matchData = await getRowByMatchId(matchId);
            if (!matchData) {
                fastify.log.error(`Match data for ${matchId} not found in DB.`);
                player1.socket.emit('error', { message: 'Match data not found.' });
                player2.socket.emit('error', { message: 'Match data not found.' });
                matchWaitingRoom.delete(matchId);
                return;
            }

            const isTournament = !!matchData.tournament_id;

            const p1Socket = player1.playerInfo.userId === matchData.player1_id ? player1.socket : player2.socket;
            const p2Socket = player1.playerInfo.userId === matchData.player2_id ? player1.socket : player2.socket;

            await updateUserStatus(matchData.player1_id, UserOnlineStatus.IN_GAME);
            await updateUserStatus(matchData.player2_id, UserOnlineStatus.IN_GAME);
            
            const gameSession = startRemoteGame(p1Socket, p2Socket, matchId);
            gameSession.isTournamentMatch = isTournament;
            
            if (isTournament) {
                (p1Socket as any).tournamentInfo = { tournamentId: matchData.tournament_id, matchId };
                (p2Socket as any).tournamentInfo = { tournamentId: matchData.tournament_id, matchId };
            }
            
            matchWaitingRoom.delete(matchId);
        }
    });
    handleQuickMatchQueue(socket);
    serverSocketEvents(socket);
    disconnectionHandler(socket);
}


function handleQuickMatchQueue(socket: Socket) {
    socket.on('joinQuickMatchQueue', async () => {
        const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
        if (!playerInfo) {
            return socket.emit('error', { message: 'Player not authenticated.'});
        }

        const isNew = addPlayerToWaitingList(playerInfo.display_name, playerInfo.userId, socket);
        if (isNew) {
            socket.emit('inQueue');
            
            const timeout = setTimeout(() => {
                fastify.log.info(`Matchmaking timed out for player: ${playerInfo.display_name}`);
                socket.emit('matchTimeout');
                cleanOnDisconnection(socket.id);
            }, TIMEOUT_MS);
            timeouts.set(socket.id, timeout);
        }
        
        await tryMatchPlayers();
    });
}

let matchmakingLock = false;
async function tryMatchPlayers() {
    if (matchmakingLock || getWaitingListSize() < 2) return;
    
    matchmakingLock = true;
    try {
        const player1 = firstInFirstOut();
        const player2 = firstInFirstOut();
            
        if (!player1 || !player2) {
            if (player1) waitingList.set(player1.socket.id, player1);
            fastify.log.error('Matchmaking failed: not enough players found after dequeue.');
            matchmakingLock = false;
            return;
        }
        
        clearMatchmakingTimeout(player1.socket.id);
        clearMatchmakingTimeout(player2.socket.id);

        const matchId = crypto.randomUUID();
        
        insertMatchToDB({ matchId, player1_id: player1.userId, player2_id: player2.userId, player1_socket: player1.socket.id, player2_socket: player2.socket.id });
        
        player1.socket.emit('matchFound', { matchId, displayName: player1.display_name, side: 'left', opponent: player2.display_name });
        player2.socket.emit('matchFound', { matchId, displayName: player2.display_name, side: 'right', opponent: player1.display_name });
        
        removePlayerFromWaitingList(player1.socket.id);
        removePlayerFromWaitingList(player2.socket.id);
        
    } catch (error: unknown) {
        if (error instanceof Error) {
            fastify.log.error({ msg: 'Error during matchmaking:', err: { message: error.message, stack: error.stack } });
        } else {
            fastify.log.error({ msg: 'Unknown error during matchmaking:', error });
        }
    } finally {
        matchmakingLock = false;
    }
}

function clearMatchmakingTimeout(socketId: string) {
    const timeout = timeouts.get(socketId);
    if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(socketId);
    }
}

function serverSocketEvents(socket: Socket) {
    socket.on('startLocal', (matchId: string) => {
        fastify.log.info(`[Socket ${socket.id}] received 'startLocal' for match: ${matchId}`);
        const game = localGames.get(matchId);

        if (!game) {
            fastify.log.error(`Local game not found for matchId: ${matchId}`);
            socket.emit('error', { message: 'Local game session not found.' });
            return;
        }

        game.socket = socket;

        if (!game.intervalId) {
            fastify.log.info(`Starting new game loop for local match ${matchId}`);
            startLocalGameInterval(matchId);
        } else {
            fastify.log.info(`Game loop for ${matchId} is already running. Re-attaching socket ${socket.id}.`);
        }

        socket.on('quitGame', () => {
            const gameToQuit = localGames.get(matchId);
            if (gameToQuit && gameToQuit.intervalId) {
                clearInterval(gameToQuit.intervalId);
            }
            localGames.delete(matchId);
            fastify.log.info(`Local game ${matchId} quit by user.`);
        });
    });

    socket.on('leaveQueue', () => {
        const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
        if (playerInfo) {
            fastify.log.info(`Player ${playerInfo.display_name} (${socket.id}) explicitly left the quick match queue.`);
            removePlayerFromWaitingList(socket.id);
            clearMatchmakingTimeout(socket.id);
        }
    });

    handleClientInput(socket);
}

function startLocalGameInterval(matchId: string) {
    const game = localGames.get(matchId);
    if (!game) {
        fastify.log.error(`[startLocalGameInterval] Attempted to start loop for non-existent game ${matchId}`);
        return;
    }

    const velocity = createBallState();

    const intervalId = setInterval(() => {
        const currentGame = localGames.get(matchId);
        
        if (!currentGame || !currentGame.socket || !currentGame.socket.connected) {
            fastify.log.info(`Stopping game loop for local match ${matchId} due to cleanup or disconnection.`);
            clearInterval(intervalId);
            if (localGames.has(matchId)) {
                localGames.delete(matchId);
            }
            return;
        }

        const { winner, goalScored } = gameLoop(currentGame.state, velocity, 'local');
        
        if (goalScored || !winner) {
            currentGame.socket.emit('gameState', currentGame.state);
        }

        if (winner) {
            currentGame.socket.emit('gameOver', currentGame.state);
            clearInterval(intervalId);
            localGames.delete(matchId);
        }
    }, 1000 / FRAME_RATE);

    game.intervalId = intervalId;
    localGames.set(matchId, game);
}

export function startRemoteGame(client1: Socket, client2: Socket, matchId: string): RemoteGameSession {    
    let roomName = makeid(5);
    
    const gameSession = new RemoteGameSession(roomName, matchId);
    gameSessions.set(roomName, gameSession);
    
    gameSession.addPlayer(client1.id, 'left');
    gameSession.addPlayer(client2.id, 'right');
    
    client1.join(roomName);
    client2.join(roomName);
    
    gameSession.start();
    return gameSession;
}

function handleClientInput(socket: Socket) {
    socket.on('keydown', (keyCode: string) => {
        const gameSession = findRemoteGameSessionBySocketId(socket.id);
        if (gameSession) {
            const playerSide = gameSession.getPlayerSide(socket.id);
            if (playerSide) handleKeydownRemote(keyCode, playerSide);
        } else {
            handleKeydownLocal(keyCode);
        }
    });
    
    socket.on('keyup', (keyCode: string) => {
           const gameSession = findRemoteGameSessionBySocketId(socket.id);
        if (gameSession) {
            const playerSide = gameSession.getPlayerSide(socket.id);
            if (playerSide) handleKeyupRemote(keyCode, playerSide);
        } else {
            handleKeyupLocal(keyCode);
        }
    });
}

async function disconnectionHandler(socket: Socket) {
    socket.on('disconnect', async () => {
        await cleanOnDisconnection(socket.id);

        for (const [matchId, game] of localGames.entries()) {
            if (game.socket && game.socket.id === socket.id) {
                fastify.log.info(`Le joueur du match local ${matchId} s'est déconnecté. Terminaison de la partie.`);
                if (game.intervalId) {
                    clearInterval(game.intervalId);
                }
                localGames.delete(matchId);
                break;
            }
        }

        const gameSession = findRemoteGameSessionBySocketId(socket.id);
        if (gameSession) {
            if (gameSession.isFinished) return;
            gameSession.isFinished = true;

            const opponentSocketId = [...gameSession.players.keys()].find(id => id !== socket.id);
            const tournamentInfo = (socket as any).tournamentInfo;
            
            if (tournamentInfo) {
                const winnerSocketId = opponentSocketId;
                const winnerSocket = winnerSocketId ? fastify.io.sockets.sockets.get(winnerSocketId) : undefined;
                if (winnerSocket) {
                    const winnerId = (winnerSocket as any).playerInfo.userId;
                    await reportMatchResultToTournamentService(tournamentInfo.tournamentId, tournamentInfo.matchId, winnerId);
                }
            } else {
                const match = await getRowByMatchId(gameSession.matchId);
                if (match) {
                    const looserId = gameSession.getPlayerSide(socket.id) === 'left' ? match.player1_id : match.player2_id;
                    const winnerId = gameSession.getPlayerSide(socket.id) === 'left' ? match.player2_id : match.player1_id;

                    await setGameResult(gameSession.matchId, gameSession.state.score1, gameSession.state.score2, winnerId, 'forfeit');
                    await Promise.all([
                        updateUserStatus(winnerId, UserOnlineStatus.ONLINE),
                        updateUserStatus(looserId, UserOnlineStatus.ONLINE)
                    ]);
                }
            }
            
            gameSession.clearGameInterval();
            gameSessions.delete(gameSession.roomName);
            
            if (opponentSocketId) {
                fastify.io.to(opponentSocketId).emit('opponentLeft');
            }
        }
    });
    
    socket.on('cancelMatch', () => {
        cleanOnDisconnection(socket.id);
    });
}