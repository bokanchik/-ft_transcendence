import { fastify } from "../server.ts";
import { Socket } from "socket.io";
import { waitingRoomHandler } from "../utils/waitingRoom.ts";
import { getRowByMatchId, setGameResult } from "../database/dbModels.ts";
import { createBallState } from "./pongGame.ts";
import { gameLoop, handleKeydownLocal, handleKeyupLocal, handleKeydownRemote, handleKeyupRemote} from "./pongGame.ts";
import { RemoteGameSession, gameSessions, findRemoteGameSessionBySocketId } from "./gameClass.ts";
import { cleanOnDisconnection, makeid } from "../utils/waitingRoomUtils.ts";
// @ts-ignore
import { GameState, FRAME_RATE } from "../shared/gameTypes.js";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";

export const timeouts: Map<string, NodeJS.Timeout> = new Map();

// --- Socket.io handler for local and remote games ---
export async function matchSocketHandler(socket: Socket): Promise<void> {
    // Handle waiting room events
    waitingRoomHandler(socket);
    // Handle gameplay events
    serverSocketEvents(socket);
    // Handle disconnection events
    disconnectionHandler(socket);
}

export const localGames: Map<string, { state: GameState, intervalId: NodeJS.Timeout | null}> = new Map();

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
            socket.emit('gameOver');
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
    })
}



export function startRemoteGame(client1: Socket, client2: Socket, matchId: string) {    
    let roomName = makeid(5);
    
    const gameSession = new RemoteGameSession(roomName, matchId);
    gameSessions.set(roomName, gameSession);
    
    gameSession.addPlayer(client1.id, 'left');
    gameSession.addPlayer(client2.id, 'right');
    
    client1.join(roomName);
    client2.join(roomName);
    
    
    gameSession.start();
    
}

function handleClientInput(socket: Socket) {
    
    socket.on('keydown', (keyCode: string) => {
        const gameSession = findRemoteGameSessionBySocketId(socket.id);
        if (gameSession) {
            const playerSide = gameSession.getPlayerSide(socket.id);
            if (playerSide) handleKeydownRemote(parseInt(keyCode), playerSide);
        } else {
             handleKeydownLocal(parseInt(keyCode))
        }
    });
    
    socket.on('keyup', (keyCode: string) => {
           const gameSession = findRemoteGameSessionBySocketId(socket.id);
        if (gameSession) {
            const playerSide = gameSession.getPlayerSide(socket.id);
            if (playerSide) handleKeyupRemote(parseInt(keyCode), playerSide);
        } else {
             handleKeyupLocal(parseInt(keyCode))
        }
    });
    
}

async function disconnectionHandler(socket: Socket)  {
    
    socket.on('disconnect', async () => {
       
        // waiting rooom cleanup
        await cleanOnDisconnection(socket.id)

        const gameSession = findRemoteGameSessionBySocketId(socket.id);
        if (gameSession) {
            if (gameSession.isFinished) return; // ajout arthur pour éviter de faire des actions sur une gameSession déjà finie
            gameSession.isFinished = true;

            const opponentSocketId = [...gameSession.players.keys()].find(id => id !== socket.id);

            if (opponentSocketId) {
                fastify.io.to(opponentSocketId).emit('opponentLeft');
            }
            // set game Result to DB
            const match = await getRowByMatchId(gameSession.matchId);
            const looserId = gameSession.getPlayerSide(socket.id) === 'left' ? match.player1_id : match.player2_id;
            const winnerId = gameSession.getPlayerSide(socket.id) === 'left' ? match.player2_id : match.player1_id;

            await setGameResult(gameSession.matchId, gameSession.state.score1, gameSession.state.score2, winnerId, 'forfeit');
            
            await Promise.all([
                updateUserStatus(winnerId, UserOnlineStatus.ONLINE),
                updateUserStatus(looserId, UserOnlineStatus.ONLINE)
            ]);

            // clean up game session
            gameSession.clearGameInterval();
            gameSessions.delete(gameSession.roomName);
        }
    });
    
    // "cancel" button clicked on frontend while the player is in waitingRoom
    socket.on('cancelMatch', () => {
        cleanOnDisconnection(socket.id);
    });
    
}
