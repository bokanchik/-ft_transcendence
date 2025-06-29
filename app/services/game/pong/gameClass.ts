import { fastify } from "../server.ts";
import { gameLoop, createBallState, createGameState} from "./pongGame.ts";
import { getRowByMatchId, setGameResult } from "../database/dbModels.ts";
//@ts-ignore
import { GameState, Velocity, FRAME_RATE } from "../shared/gameTypes.js";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";

export const gameSessions: Map<string, RemoteGameSession> = new Map();

export class RemoteGameSession {
    roomName: string;
    velocity: Velocity;
    matchId: string;
    state: GameState;
    players: Map<string, string>;
    intervalId: NodeJS.Timeout | null = null;
    isFinished: boolean = false;
    
    constructor(roomName: string, matchId: string) {
        this.roomName = roomName;
        this.velocity = createBallState();
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
            if (this.isFinished) {
                this.clearGameInterval();
                return;
            }
            const { winner, goalScored } = gameLoop(this.state, this.velocity, 'remote');

            // if (goalScored || !winner) {
            if (!winner) {
                fastify.io.to(this.roomName).emit('gameState', this.state)
            } else {
                if (this.isFinished) return; // Prevent multiple emissions if already finished
                this.isFinished = true;
                
                fastify.io.to(this.roomName).emit('gameOver');

                const match = await getRowByMatchId(this.matchId);
                const winnerId = winner === 1 ? match.player1_id : match.player2_id;
                const loserId = winner === 1 ? match.player2_id : match.player1_id;
                await setGameResult(this.matchId, this.state.score1, this.state.score2, winnerId, 'score');
                // if (winner === 1) {
                //     setGameResult(this.matchId, this.state.score1, this.state.score2, match.player1_id, 'score');
                // } else if (winner === 2) {
                //     setGameResult(this.matchId, this.state.score1, this.state.score2, match.player2_id, 'score');
                // }
                
                await Promise.all([
                    updateUserStatus(winnerId, UserOnlineStatus.ONLINE),
                    updateUserStatus(loserId, UserOnlineStatus.ONLINE)
                ]);
                
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

export function findRemoteGameSessionBySocketId(socketId: string): RemoteGameSession | undefined {
    for (let session of gameSessions.values()) {
        if (session.players.has(socketId)) {
            return session;
        }
    }
    return undefined;
}