import { fastify } from "../server.ts";
import { gameLoop, createBallState, createGameState} from "./pongGame.ts";
import { setGameResult } from "../database/dbModels.ts";
// @ts-ignore
import { GameState, Velocity, FRAME_RATE } from "../shared/gameTypes.js";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";
import { handleMatchEnd } from "../handlers/tournamentHandler.ts";

export const gameSessions: Map<string, RemoteGameSession> = new Map();

export class RemoteGameSession {
    roomName: string;
    velocity: Velocity;
    matchId: string;
    state: GameState;
    players: Map<string, string>;
    intervalId: NodeJS.Timeout | null = null;
    isFinished: boolean = false;
    isTournamentMatch: boolean = false;

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
            const { winner } = gameLoop(this.state, this.velocity, 'remote');

            if (!winner) {
                fastify.io.to(this.roomName).emit('gameState', this.state)
            } else {
                if (this.isFinished) return;
                this.isFinished = true;
                this.clearGameInterval(); // stop loop now
                
                const playerSockets = Array.from(this.players.keys()).map(id => fastify.io.sockets.sockets.get(id));
                const p1Socket = playerSockets.find(s => this.getPlayerSide(s!.id) === 'left');
                const p2Socket = playerSockets.find(s => this.getPlayerSide(s!.id) === 'right');
                
                if (!p1Socket || !p2Socket) return;

                const winnerId = winner === 1 ? (p1Socket as any).playerInfo.userId : (p2Socket as any).playerInfo.userId;
                const loserId = winner === 1 ? (p2Socket as any).playerInfo.userId : (p1Socket as any).playerInfo.userId;

                await setGameResult(this.matchId, this.state.score1, this.state.score2, winnerId, 'score');

                if (this.isTournamentMatch) {
                    const tournamentInfo = (p1Socket as any).tournamentInfo;
                    if (tournamentInfo) {
                        await handleMatchEnd(tournamentInfo.tournamentId, this.matchId, winnerId);

                    }
                } else {
                    await Promise.all([
                        updateUserStatus(winnerId, UserOnlineStatus.ONLINE),
                        updateUserStatus(loserId, UserOnlineStatus.ONLINE)
                    ]);
                }
                fastify.io.to(this.roomName).emit('gameOver');
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