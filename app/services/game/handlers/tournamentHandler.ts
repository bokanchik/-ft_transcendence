import { Socket } from "socket.io";
import { fastify } from "../server.ts";
import { PlayerInfo, tournamentQueues } from "../utils/waitingListUtils.ts";
import { createTournament, addMatchToTournament, getTournamentById, updateTournamentWinner } from "../database/dbModels.ts";
import { startRemoteGame } from "../pong/matchSocketHandler.ts";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";

const activeTournaments = new Map<string, any>();
const matchReadyState = new Map<string, Set<number>>();

export async function handleTournamentLogic(socket: Socket) {
    socket.on('joinTournamentQueue', async ({ size }: { size: number }) => {
        const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
        if (!playerInfo) {
            socket.emit('error', { message: 'Player not authenticated for tournament queue.' });
            return;
        }

        if (![2, 4, 8].includes(size)) {
            socket.emit('error', { message: 'Invalid tournament size.' });
            return;
        }

        let queue = tournamentQueues.get(size) || [];
        
        const existingPlayerIndex = queue.findIndex(p => p.userId === playerInfo.userId);
        if (existingPlayerIndex > -1) {
            queue.splice(existingPlayerIndex, 1);
        }
        
        queue.push(playerInfo);
        tournamentQueues.set(size, queue);
        
        fastify.log.info(`Player ${playerInfo.display_name} joined tournament queue for size ${size}. Queue size: ${queue.length}/${size}`);

        queue.forEach(p => {
            if (p.socket && p.socket.connected) {
                p.socket.emit('tournamentQueueUpdate', { current: queue.length, required: size });
            }
        });

        if (queue.length === size) {
            const playersToStart = tournamentQueues.get(size)!.splice(0, size); // On retire les joueurs de la file
            await startTournament(playersToStart);
        }
    });

    socket.on('joinTournamentRoom', async ({ tournamentId }: { tournamentId: string }) => {
        socket.join(`tournament-${tournamentId}`);
        const tournamentState = await getTournamentState(tournamentId);
        socket.emit('tournamentState', tournamentState);
    });

    socket.on('playerReadyForTournamentMatch', async ({ tournamentId, matchId }) => {
        const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
        if (!playerInfo) return;

        if (!matchReadyState.has(matchId)) {
            matchReadyState.set(matchId, new Set());
        }
        const readyPlayers = matchReadyState.get(matchId)!;
        readyPlayers.add(playerInfo.userId);
        
        fastify.log.info(`Player ${playerInfo.userId} is ready for match ${matchId}. Total ready: ${readyPlayers.size}`);

        const tournamentState = await getTournamentState(tournamentId);
        fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', tournamentState);

        if (readyPlayers.size === 2) {
            const matchData = tournamentState.rounds[tournamentState.currentRound].find((m: any) => m.id === matchId);

            if (matchData) {
                const p1Socket = findSocketByUserId(matchData.player1_id);
                const p2Socket = findSocketByUserId(matchData.player2_id);

                if (p1Socket && p2Socket) {
                    const p1Info = (p1Socket as any).playerInfo;
                    const p2Info = (p2Socket as any).playerInfo;
                    
                    (p1Socket as any).tournamentInfo = { tournamentId, matchId };
                    (p2Socket as any).tournamentInfo = { tournamentId, matchId };

                    p1Socket.emit('startTournamentMatch', { matchId, side: 'left', opponent: p2Info.display_name });
                    p2Socket.emit('startTournamentMatch', { matchId, side: 'right', opponent: p1Info.display_name });

                    const gameSession = startRemoteGame(p1Socket, p2Socket, matchId);
                    gameSession.isTournamentMatch = true;

                    matchReadyState.delete(matchId);
                }
            }
        }
    });

}

async function startTournament(players: PlayerInfo[]) {
    fastify.log.info(`Starting a new tournament with ${players.length} players.`);
    
    const tournamentId = crypto.randomUUID();
    await createTournament(tournamentId, players.map(p => p.userId));
    
    const shuffledPlayers = players.sort(() => 0.5 - Math.random());
    const initialMatches = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1];
        const matchId = crypto.randomUUID();
        await addMatchToTournament(tournamentId, matchId, player1.userId, player2.userId, 1);
        initialMatches.push({ matchId, player1, player2 });
    }

    const tournamentState = await getTournamentState(tournamentId);
    activeTournaments.set(tournamentId, tournamentState);

    players.forEach(p => {
        p.socket.join(`tournament-${tournamentId}`);
        p.socket.emit('tournamentStarting', { tournamentId, matches: tournamentState.rounds[1] });
    });
}

export async function handleMatchEnd(tournamentId: string, matchId: string, winnerId: number) {
    fastify.log.info(`Match ${matchId} ended in tournament ${tournamentId}. Winner: ${winnerId}`);
    
    const tournamentState = await getTournamentState(tournamentId);
    activeTournaments.set(tournamentId, tournamentState);

    fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', tournamentState);

    const nextMatchAvailable = await triggerNextMatch(tournamentId);
    if (!nextMatchAvailable && !tournamentState.isFinished) {
        fastify.log.info(`Tournament ${tournamentId} has finished. Winner is ${winnerId}.`);
        await updateTournamentWinner(tournamentId, winnerId);
        console.log(`\x1b[35m[DEBUG] Emitting 'tournamentFinished' for tournament ${tournamentId}\x1b[0m`);
        fastify.io.to(`tournament-${tournamentId}`).emit('tournamentFinished', { winnerId, tournamentId });
        activeTournaments.delete(tournamentId);
        const sockets = await fastify.io.in(`tournament-${tournamentId}`).fetchSockets();
        sockets.forEach(s => {
            const playerInfo = (s as any).playerInfo as PlayerInfo;
            if (playerInfo) {
                updateUserStatus(playerInfo.userId, UserOnlineStatus.ONLINE);
            }
            s.leave(`tournament-${tournamentId}`);
            delete (s as any).tournamentInfo;
        });
    }
}

async function triggerNextMatch(tournamentId: string): Promise<boolean> {
    const tournamentState = activeTournaments.get(tournamentId);
    if (!tournamentState || tournamentState.isFinished) return false;

    for (const round of Object.values(tournamentState.rounds) as any[][]) {
        for (const match of round) {
            if (!match.winner_id && match.player1_id && match.player2_id) {
                const p1Socket = findSocketByUserId(match.player1_id);
                const p2Socket = findSocketByUserId(match.player2_id);

                if (p1Socket && p2Socket) {
                    const p1Info = (p1Socket as any).playerInfo;
                    const p2Info = (p2Socket as any).playerInfo;
                    fastify.log.info(`Triggering next match: ${match.player1_id} vs ${match.player2_id} (Match ID: ${match.id})`);
                    
                    (p1Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
                    (p2Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
                    
                    p1Socket.emit('startTournamentMatch', {
                        matchId: match.id,
                        side: 'left',
                        opponent: p2Info.display_name
                    });
                    p2Socket.emit('startTournamentMatch', {
                        matchId: match.id,
                        side: 'right',
                        opponent: p1Info.display_name
                    });

                    const gameSession = startRemoteGame(p1Socket, p2Socket, match.id);
                    gameSession.isTournamentMatch = true;

                    return true; 
                }
            }
        }
    }
    return false;
}

async function getTournamentState(tournamentId: string): Promise<any> {
    const { tournament, matches: rawMatches } = await getTournamentById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const rounds: { [key: number]: any[] } = {};
    
    rawMatches.forEach(match => {
        if (!rounds[match.round_number]) {
            rounds[match.round_number] = [];
        }
        rounds[match.round_number].push({
            id: match.matchId,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            winner_id: match.winner_id,
            ready_players: Array.from(matchReadyState.get(match.matchId) || [])
        });
    });

    const isFinished = !!tournament.winner_id;
    
    let currentRound = 1;
    if (!isFinished) {
        for (let i = 1; i <= Object.keys(rounds).length; i++) {
            if (rounds[i].some(m => !m.winner_id)) {
                currentRound = i;
                break;
            }
        }
    }
    
    return { rounds, isFinished, winner_id: tournament.winner_id, currentRound };
}

function findSocketByUserId(userId: number): Socket | undefined {
    for (const socket of fastify.io.sockets.sockets.values()) {
        const playerInfo = (socket as any).playerInfo as PlayerInfo;
        if (playerInfo && playerInfo.userId === userId) {
            return socket;
        }
    }
    return undefined;
}