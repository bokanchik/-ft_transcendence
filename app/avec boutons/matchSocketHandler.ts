// import { fastify } from "../server.ts";
// import { Socket } from "socket.io";
// import { waitingRoomHandler } from "../utils/waitingRoom.ts";
// import { getRowByMatchId, setGameResult } from "../database/dbModels.ts";
// import { createBallState } from "./pongGame.ts";
// import { gameLoop, handleKeydownLocal, handleKeyupLocal, handleKeydownRemote, handleKeyupRemote} from "./pongGame.ts";
// import { RemoteGameSession, gameSessions, findRemoteGameSessionBySocketId } from "./gameClass.ts";
// import { cleanOnDisconnection, makeid } from "../utils/waitingRoomUtils.ts";
// // @ts-ignore
// import { GameState, FRAME_RATE } from "../shared/gameTypes.js";
// import { updateUserStatus } from "../utils/apiClient.ts";
// import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";

// export const timeouts: Map<string, NodeJS.Timeout> = new Map();

// // --- Socket.io handler for local and remote games ---
// export async function matchSocketHandler(socket: Socket): Promise<void> {
//     // Handle waiting room events
//     waitingRoomHandler(socket);
//     // Handle gameplay events
//     serverSocketEvents(socket);
//     // Handle disconnection events
//     disconnectionHandler(socket);
// }

// export const localGames: Map<string, { state: GameState, intervalId: NodeJS.Timeout | null}> = new Map();

// function serverSocketEvents(socket: Socket) {
    
    
//     socket.on('startLocal',  (matchId: string) => {    
        
//         fastify.log.info('Game started locally'); 
        
//         const game = localGames.get(matchId);

//         if (!game) {
//             fastify.log.error('Local game not found');
//             return ;
//         }
        
//         startLocalGameInterval(game.state, socket, matchId);      
//     });
    
//     handleClientInput(socket);
    
// }


// function startLocalGameInterval(state: GameState, socket: Socket, matchId: string) {
//     const velocity = createBallState();

//     const intervalId = setInterval(() => {
//         const { winner, goalScored } = gameLoop(state, velocity, 'local');
        
//         if (goalScored || !winner) {
//             socket.emit('gameState', state);
//         }
//         if (winner) {
//             socket.emit('gameOver', state);
//             localGames.delete(matchId);
//             clearInterval(intervalId);
//             return;
//         }
//         if (!localGames.get(matchId)){
//             socket.emit('gameOver');
//             clearInterval(intervalId);
//             return;
//         }
//     }, 1000 / FRAME_RATE);
    
//     localGames.set(matchId, { state, intervalId });

//     socket.on('quitGame', () => {
//         localGames.delete(matchId);
//         clearInterval(intervalId);
//         return ;
//     })
// }



// export function startRemoteGame(client1: Socket, client2: Socket, matchId: string) {    
//     let roomName = makeid(5);
    
//     const gameSession = new RemoteGameSession(roomName, matchId);
//     gameSessions.set(roomName, gameSession);
    
//     gameSession.addPlayer(client1.id, 'left');
//     gameSession.addPlayer(client2.id, 'right');
    
//     client1.join(roomName);
//     client2.join(roomName);
    
    
//     gameSession.start();
    
// }

// function handleClientInput(socket: Socket) {
    
//     socket.on('keydown', (keyCode: string) => {
//         const gameSession = findRemoteGameSessionBySocketId(socket.id);
//         if (gameSession) {
//             const playerSide = gameSession.getPlayerSide(socket.id);
//             // if (playerSide) handleKeydownRemote(parseInt(keyCode), playerSide);
//             if (playerSide) handleKeydownRemote(keyCode, playerSide);
//         } else {
//             //  handleKeydownLocal(parseInt(keyCode))
//             handleKeydownLocal(keyCode);
//         }
//     });
    
//     socket.on('keyup', (keyCode: string) => {
//            const gameSession = findRemoteGameSessionBySocketId(socket.id);
//         if (gameSession) {
//             const playerSide = gameSession.getPlayerSide(socket.id);
//             // if (playerSide) handleKeyupRemote(parseInt(keyCode), playerSide);
//             if (playerSide) handleKeyupRemote(keyCode, playerSide);
//         } else {
//             //  handleKeyupLocal(parseInt(keyCode))
//             handleKeyupLocal(keyCode);
//         }
//     });
    
// }

// async function disconnectionHandler(socket: Socket)  {
    
//     socket.on('disconnect', async () => {
       
//         // waiting rooom cleanup
//         await cleanOnDisconnection(socket.id)

//         const gameSession = findRemoteGameSessionBySocketId(socket.id);
//         if (gameSession) {
//             if (gameSession.isFinished) return; // ajout arthur pour éviter de faire des actions sur une gameSession déjà finie
//             gameSession.isFinished = true;

//             const opponentSocketId = [...gameSession.players.keys()].find(id => id !== socket.id);

//             // if (opponentSocketId) {
//             //     fastify.io.to(opponentSocketId).emit('opponentLeft');
//             // }

//             // set game Result to DB
//             const match = await getRowByMatchId(gameSession.matchId);
//             const looserId = gameSession.getPlayerSide(socket.id) === 'left' ? match.player1_id : match.player2_id;
//             const winnerId = gameSession.getPlayerSide(socket.id) === 'left' ? match.player2_id : match.player1_id;

//             await setGameResult(gameSession.matchId, gameSession.state.score1, gameSession.state.score2, winnerId, 'forfeit');
            
//             await Promise.all([
//                 updateUserStatus(winnerId, UserOnlineStatus.ONLINE),
//                 updateUserStatus(looserId, UserOnlineStatus.ONLINE)
//             ]);

//             // clean up game session
//             gameSession.clearGameInterval();
//             gameSessions.delete(gameSession.roomName);
            
//              if (opponentSocketId) {
//                 fastify.io.to(opponentSocketId).emit('opponentLeft');
//             }
//         }
//     });
    
//     // "cancel" button clicked on frontend while the player is in waitingRoom
//     socket.on('cancelMatch', () => {
//         cleanOnDisconnection(socket.id);
//     });
    
// }

import { fastify } from "../server.ts";
import { Socket } from "socket.io";
import { getRowByMatchId, setGameResult, insertMatchToDB } from "../database/dbModels.ts";
import { createBallState } from "./pongGame.ts";
import { gameLoop, handleKeydownLocal, handleKeyupLocal, handleKeydownRemote, handleKeyupRemote} from "./pongGame.ts";
import { RemoteGameSession, gameSessions, findRemoteGameSessionBySocketId } from "./gameClass.ts";
import { cleanOnDisconnection, makeid } from "../utils/waitingRoomUtils.ts";
// @ts-ignore
import { GameState, FRAME_RATE, TIMEOUT_MS } from "../shared/gameTypes.js";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";
import { handleTournamentLogic, handleMatchEnd } from "../handlers/tournamentHandler.ts";
import { addPlayerToWaitingList, firstInFirstOut, getWaitingListSize, removePlayerFromWaitingList, PlayerInfo, waitingList } from "../utils/waitingListUtils.ts";


export const timeouts: Map<string, NodeJS.Timeout> = new Map();
export const localGames: Map<string, { state: GameState, intervalId: NodeJS.Timeout | null}> = new Map();
const playersReadyInRoom = new Map<string, Set<string>>();

// --- Socket.io handler for all game-related events ---
export async function matchSocketHandler(socket: Socket): Promise<void> {

    // 1. Authenticate and store player info on socket object for later use
    socket.on('authenticate', async ({ display_name, userId }) => {
        (socket as any).playerInfo = { display_name, userId, socket };
        await updateUserStatus(userId, UserOnlineStatus.ONLINE);
        fastify.log.info(`Player ${display_name} (ID: ${userId}, Socket: ${socket.id}) authenticated.`);
    });
    
    // 2. Handle different queues
    handleQuickMatchQueue(socket);
    handleTournamentLogic(socket); // Handles 'joinTournamentQueue'

    // 3. Handle Local Game events
    serverSocketEvents(socket);

    // 4. Handle Disconnection
    disconnectionHandler(socket);
}


// --- QUICK MATCH LOGIC ---
function handleQuickMatchQueue(socket: Socket) {
    socket.on('joinQuickMatchQueue', async () => {
        const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
        if (!playerInfo) {
            return socket.emit('error', { message: 'Player not authenticated.'});
        }

        await updateUserStatus(playerInfo.userId, UserOnlineStatus.IN_GAME);
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
            // Remettre les joueurs dans la file s'il y en a un
            if (player1) waitingList.set(player1.socket.id, player1);
            fastify.log.error('Matchmaking failed: not enough players found after dequeue.');
            return;
        }
        
        clearMatchmakingTimeout(player1.socket.id);
        clearMatchmakingTimeout(player2.socket.id);

        const matchId = crypto.randomUUID();
        
        insertMatchToDB({ matchId, player1_id: player1.userId, player2_id: player2.userId, player1_socket: player1.socket.id, player2_socket: player2.socket.id });
        
        player1.socket.emit('matchFound', { matchId, displayName: player1.display_name, side: 'left', opponent: player2.display_name });
        player2.socket.emit('matchFound', { matchId, displayName: player2.display_name, side: 'right', opponent: player1.display_name });
        
        // removePlayerFromWaitingList(player1.socket.id);
        // removePlayerFromWaitingList(player2.socket.id);
        
        setTimeout(() => startRemoteGame(player1.socket, player2.socket, matchId), 3000);

    } catch (error: unknown) {
        // --- AMÉLIORATION DU LOGGING ---
        if (error instanceof Error) {
            fastify.log.error({ msg: 'Error during matchmaking:', err: { message: error.message, stack: error.stack } });
        } else {
            fastify.log.error({ msg: 'Unknown error during matchmaking:', error });
        }
        // ---------------------------------
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


// --- LOCAL GAME LOGIC ---
function serverSocketEvents(socket: Socket) {
    socket.on('startLocal',  (matchId: string) => {    
        fastify.log.info('Game started locally'); 
        const game = localGames.get(matchId);
        if (!game) {
            fastify.log.error('Local game not found');
            return ;
        }
        startLocalGameInterval(game.state, socket, matchId);      
    });
    
    socket.on('playerInGameRoom', ({ matchId }) => {
        if (!playersReadyInRoom.has(matchId)) {
            playersReadyInRoom.set(matchId, new Set());
        }
        const readySet = playersReadyInRoom.get(matchId)!;
        readySet.add(socket.id);

        const session = gameSessions.get(matchId);
        // Si la session existe et que les deux joueurs ont confirmé leur présence
        if (session && readySet.size === 2) {
            fastify.log.info(`Both players are in game room for match ${matchId}. Starting game loop.`);
            session.start(); // On lance la boucle de jeu MAINTENANT
            playersReadyInRoom.delete(matchId); // On nettoie
        }
    });
    
    handleClientInput(socket);
}

function startLocalGameInterval(state: GameState, socket: Socket, matchId: string) {
    const velocity = createBallState();
    const intervalId = setInterval(() => {
        const { winner, goalScored } = gameLoop(state, velocity, 'local');
        
        if (goalScored || !winner) {
            socket.emit('gameState', state);
        }
        if (winner) {
            socket.emit('gameOver', state);
            localGames.delete(matchId);
            clearInterval(intervalId);
            return;
        }
        if (!localGames.get(matchId)){
            socket.emit('gameOver');
            clearInterval(intervalId);
            return;
        }
    }, 1000 / FRAME_RATE);
    
    localGames.set(matchId, { state, intervalId });

    socket.on('quitGame', () => {
        localGames.delete(matchId);
        clearInterval(intervalId);
        return ;
    });
}


// --- REMOTE GAME LOGIC (SHARED) ---
export function startRemoteGame(client1: Socket, client2: Socket, matchId: string, tournamentId?: string): RemoteGameSession {    
    let roomName = makeid(5);
    
    const gameSession = new RemoteGameSession(roomName, matchId, tournamentId);
    // gameSessions.set(roomName, gameSession);
    gameSessions.set(matchId, gameSession);
    
    gameSession.addPlayer(client1.id, 'left');
    gameSession.addPlayer(client2.id, 'right');
    
    client1.join(roomName);
    client2.join(roomName);
    
    // gameSession.start();
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

// --- DISCONNECTION LOGIC ---
async function disconnectionHandler(socket: Socket) {
    socket.on('disconnect', async () => {
        await cleanOnDisconnection(socket.id);

        const gameSession = findRemoteGameSessionBySocketId(socket.id);
        if (gameSession) {
            if (gameSession.isFinished) return;
            gameSession.isFinished = true;

            const opponentSocketId = [...gameSession.players.keys()].find(id => id !== socket.id);
            const tournamentInfo = (socket as any).tournamentInfo;
            
            // Si c'est un match de tournoi, le forfait est géré par la logique de tournoi
            if (tournamentInfo) {
                const winnerSocketId = opponentSocketId;
                const winnerSocket = winnerSocketId ? fastify.io.sockets.sockets.get(winnerSocketId) : undefined;
                if (winnerSocket) {
                    const winnerId = (winnerSocket as any).playerInfo.userId;
                    await handleMatchEnd(tournamentInfo.tournamentId, tournamentInfo.matchId, winnerId);
                }
            } else { // Sinon, c'est un match rapide classique
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