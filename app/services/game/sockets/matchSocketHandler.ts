import { fastify } from "../server.ts";
import { Socket } from "socket.io";
import { waitingRoomHandler, cleanOnDisconnection } from "../utils/waitingRoom.ts";
import { getOpponentSocketId, getRowByMatchId, setGameResult, updateStatus } from "../database/dbModels.ts";
import { createGameState } from "./pongGame.ts";
// @ts-ignore
import { GameState, FRAME_RATE } from "../shared/gameTypes.js";
import { gameLoop, handleKeydownLocal, handleKeyupLocal, handleKeydownRemote, handleKeyupRemote} from "./pongGame.ts";

export const timeouts: Map<string, NodeJS.Timeout> = new Map();

const gameSessions: Map<string, GameSession> = new Map();

class GameSession {
    roomName: string;
    matchId: string;
    state: GameState;
    players: Map<string, string>;
    intervalId: NodeJS.Timeout | null = null;
    
    constructor(roomName: string, matchId: string) {
        this.roomName = roomName;
        this.state = createGameState();
        this.players = new Map();
        this.matchId = matchId;
    }
    
    addPlayer(socketId: string, side: string) {
        this.players.set(socketId, side);
    }
    
    removePlayer(socketId: string) {
        this.players.delete(socketId);
    }

    getPlayerSide(socketId: string): string | undefined {
        return this.players.get(socketId);
    }

    start() {
        if (this.intervalId) return;
        
        this.intervalId = setInterval(async () => {
            const { winner, goalScored } = gameLoop(this.state, 'remote');

            if (goalScored || !winner) {
                fastify.io.to(this.roomName).emit('gameState', this.state)
            } else {
                fastify.io.to(this.roomName).emit('gameOver');

                const match = await getRowByMatchId(this.matchId);
                if (winner === 1) {
                    setGameResult(this.matchId, this.state.score1, this.state.score2, match.player1_id, 'score');
                } else if (winner === 2) {
                    setGameResult(this.matchId, this.state.score1, this.state.score2, match.player2_id, 'score');
                }
                
                updateStatus('finished', this.matchId);

                this.clearGameInterval();

            }
        }, 1000 / FRAME_RATE);

    }

    clearGameInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}


// --- Socket.io handler for local and remote games ---
export async function matchSocketHandler(socket: Socket): Promise<void> {
    // Handle waiting room events
    waitingRoomHandler(socket);
    // Handle gameplay events
    serverSocketEvents(socket);
    // Handle disconnection events
    disconnectionHandler(socket);
}


function serverSocketEvents(socket: Socket) {
    
    
    socket.on('startLocal',  (matchId: string) => {    
        
        fastify.log.info('Game started locally'); 
        
        const state = createGameState();
        
        startLocalGameInterval(state, socket, matchId);      
    });
    
    handleClientInput(socket);
    
}

function handleClientInput(socket: Socket) {
    
    socket.on('keydown', (keyCode: string) => {
        const gameSession = findGameSessionBySocketId(socket.id);
        if (gameSession) {
            const playerSide = gameSession.getPlayerSide(socket.id);
            if (playerSide) handleKeydownRemote(parseInt(keyCode), playerSide);
        } else {
             handleKeydownLocal(parseInt(keyCode))
        }
    });
    
    socket.on('keyup', (keyCode: string) => {
           const gameSession = findGameSessionBySocketId(socket.id);
        if (gameSession) {
            const playerSide = gameSession.getPlayerSide(socket.id);
            if (playerSide) handleKeyupRemote(parseInt(keyCode), playerSide);
        } else {
             handleKeyupLocal(parseInt(keyCode))
        }
    })
    
}

function findGameSessionBySocketId(socketId: string): GameSession | undefined {
    for (let session of gameSessions.values()) {
        if (session.players.has(socketId)) {
            return session;
        }
    }
    return undefined;
}

export function startRemoteGame(client1: Socket, client2: Socket, matchId: string) {    
    let roomName = makeid(5);
    
    const gameSession = new GameSession(roomName, matchId);
    gameSessions.set(roomName, gameSession);

    gameSession.addPlayer(client1.id, 'left');
    gameSession.addPlayer(client2.id, 'right');

    client1.join(roomName);
    client2.join(roomName);
    
    
    gameSession.start();
    
}

export const localGames: Map<string, { state: GameState, intervalId: NodeJS.Timeout }> = new Map();


function startLocalGameInterval(state: GameState, socket: Socket, mathcId: string) {

    const intervalId = setInterval(() => {
        const { winner, goalScored } = gameLoop(state, 'local');
        
        if (goalScored || ! winner) {
            socket.emit('gameState', state);
        }
        if (winner) {
            socket.emit('gameOver');
            clearInterval(intervalId);
            return;
        }
    }, 1000 / FRAME_RATE);
    
    localGames.set(mathcId, { state, intervalId });

    socket.on('quitGame', () => {
        clearInterval(intervalId);
        return ;
    })
}


async function disconnectionHandler(socket: Socket)  {
    
    socket.on('disconnect', async () => {
       
        // waiting rooom cleanup
        cleanOnDisconnection(socket.id)
        clearMatchTimeout(socket.id);

        const gameSession = findGameSessionBySocketId(socket.id);
        if (gameSession) {
            const opponentSocketId = [...gameSession.players.keys()].find(id => id !== socket.id);

            if (opponentSocketId) {
                fastify.io.to(opponentSocketId).emit('opponentLeft');
            }
            // set game Result to DB
            const match = await getRowByMatchId(gameSession.matchId);
            const looser = gameSession.getPlayerSide(socket.id);

            if (looser === 'left') {
                setGameResult(gameSession.matchId, gameSession.state.score1, gameSession.state.score2, match.player2_id, 'forfeit');
            } else if (looser === 'right') {
                setGameResult(gameSession.matchId, gameSession.state.score1, gameSession.state.score2, match.player1_id, 'forfeit');
            }

            updateStatus('finished', gameSession.matchId);

            // clean up game session
            gameSession.clearGameInterval();
            gameSessions.delete(gameSession.roomName);
        }
    });
    
    // "cancel" button clicked on frontend while the player is in waitingRoom
    socket.on('cancelMatch', () => {
        cleanOnDisconnection(socket.id);
        clearMatchTimeout(socket.id);
    });
    
}


// --- HELPER FUNCTIONS ---- //
export function clearMatchTimeout(socketId: string) {
    const timeout = timeouts.get(socketId);
    if (timeout) {
        clearTimeout(timeout);
        timeouts.delete(socketId);
    }
}

function makeid(length: number) {
    let res = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charLen = characters.length;
    for (let i = 0; i < length; i++) {
        res += characters.charAt(Math.floor(Math.random() * charLen));
    }
    
    return res;
}