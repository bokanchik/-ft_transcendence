import { FastifyReply, FastifyRequest } from 'fastify';
import { Socket } from "socket.io";
import { fastify, io } from "../server.ts";
import { PlayerInfo, tournamentQueues, removePlayerFromTournamentQueues } from "../utils/waitingListUtils.ts";
import { createTournament, getTournamentById, updateTournamentWinner, getMatchesForTournament, addMatchToTournament, updateMatchWinnerInTournamentDB } from "../database/dbModels.ts";
import { createMatchInGameService, updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";
import { LocalTournamentBodySchema } from '../middleware/tournaments.schemas.ts';
import { singleEliminationMatches } from '../utils/matchmaking.ts';

// Map pour suivre les joueurs prêts pour un match de tournoi
const matchReadyState = new Map<string, Set<number>>();

// POST /api/tournament/local/start
export async function createLocalTournament(req: FastifyRequest, reply: FastifyReply) {
    const parseResult = LocalTournamentBodySchema.safeParse(req.body);

    if (!parseResult.success) {
        return reply.code(400).send({ error: parseResult.error.errors });
    }

    const { players } = parseResult.data;

    const pairs = singleEliminationMatches(players);

    console.log("Sending response: ", JSON.stringify(pairs));

    return reply.code(200).send({ pairs });
};

/**
 * Gère la logique principale des sockets pour le service de tournoi.
 */
export async function handleTournamentLogic(socket: Socket) {
    socket.on('authenticate', ({ display_name, userId }) => {
        (socket as any).playerInfo = { display_name, userId, socket };
        fastify.log.info(`Player ${display_name} (ID: ${userId}) authenticated on TOURNAMENT service.`);
    });
    
    socket.on('joinTournamentQueue', (data) => joinTournamentQueue(socket, data));
    socket.on('joinTournamentRoom', (data) => joinTournamentRoom(socket, data));
    socket.on('playerReadyForTournamentMatch', (data) => playerReadyForTournamentMatch(socket, data));
}

/**
 * Un joueur rejoint une file d'attente pour un tournoi.
 */
async function joinTournamentQueue(socket: Socket, { size }: { size: number }) {
    const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
    if (!playerInfo) return socket.emit('error', { message: 'Player not authenticated.' });

    if (![2, 4, 8].includes(size)) return socket.emit('error', { message: 'Invalid tournament size.' });
    
    await updateUserStatus(playerInfo.userId, UserOnlineStatus.IN_GAME);

    let queue = tournamentQueues.get(size) || [];
    if (!queue.some(p => p.userId === playerInfo.userId)) {
        queue.push(playerInfo);
    }
    tournamentQueues.set(size, queue);
    
    fastify.log.info(`Player ${playerInfo.display_name} in queue for size ${size}. Queue: ${queue.length}/${size}`);
    
    // Notifier tout le monde dans la file de la mise à jour
    queue.forEach(p => p.socket.emit('tournamentQueueUpdate', { current: queue.length, required: size }));

    if (queue.length === size) {
        const playersToStart = tournamentQueues.get(size)!.splice(0, size); 
        await startTournament(playersToStart);
    }
}

/**
 * Démarre un nouveau tournoi avec les joueurs fournis.
 */
async function startTournament(players: PlayerInfo[]) {
    const tournamentId = crypto.randomUUID();
    fastify.log.info(`Starting tournament ${tournamentId} with ${players.length} players.`);
    
    await createTournament(tournamentId, players.map(p => p.userId));
    
    const shuffledPlayers = players.sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const p1 = shuffledPlayers[i];
        const p2 = shuffledPlayers[i + 1];

        // Demander au service GAME de créer le match
        try {
            await createMatchInGameService({
                player1_id: p1.userId,
                player2_id: p2.userId,
                tournament_id: tournamentId,
                round_number: 1
            });
        } catch (error) {
            fastify.log.error(error, `Failed to create match for tournament ${tournamentId}`);
            // Gérer l'erreur (annuler le tournoi, notifier les joueurs, etc.)
        }
    }

    // Notifier les joueurs que le tournoi commence et qu'ils doivent rejoindre la salle
    const tournamentState = await getTournamentState(tournamentId);
    players.forEach(p => {
        p.socket.join(`tournament-${tournamentId}`);
        p.socket.emit('tournamentStarting', { tournamentId, matches: tournamentState.rounds[1] });
    });
}

/**
 * Un joueur rejoint la "salle" d'un tournoi pour voir l'arbre.
 */
async function joinTournamentRoom(socket: Socket, { tournamentId }: { tournamentId: string }) {
    socket.join(`tournament-${tournamentId}`);
    const tournamentState = await getTournamentState(tournamentId);
    socket.emit('tournamentState', tournamentState);
}


/**
 * Un joueur se déclare prêt pour son match de tournoi.
 */
async function playerReadyForTournamentMatch(socket: Socket, { tournamentId, matchId }: { tournamentId: string, matchId: string }) {
    const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
    if (!playerInfo) return;

    if (!matchReadyState.has(matchId)) matchReadyState.set(matchId, new Set());
    
    const readyPlayers = matchReadyState.get(matchId)!;
    readyPlayers.add(playerInfo.userId);
    
    fastify.log.info(`Player ${playerInfo.userId} is ready for match ${matchId}. Total ready: ${readyPlayers.size}`);
    
    const tournamentState = await getTournamentState(tournamentId);
    io.to(`tournament-${tournamentId}`).emit('tournamentState', tournamentState);
    
    if (readyPlayers.size === 2) {
        const allMatches = await getMatchesForTournament(tournamentId);
        const matchData = allMatches.find(m => m.matchId === matchId);

        if (matchData) {
            const p1Socket = findSocketByUserId(matchData.player1_id);
            const p2Socket = findSocketByUserId(matchData.player2_id);

            if (p1Socket && p2Socket) {
                p1Socket.emit('startTournamentMatch', { matchId, side: 'left', opponent: (p2Socket as any).playerInfo.display_name });
                p2Socket.emit('startTournamentMatch', { matchId, side: 'right', opponent: (p1Socket as any).playerInfo.display_name });
                matchReadyState.delete(matchId);
            }
        }
    }
}

/**
 * Gère la fin d'un match de tournoi, appelé par la route interne.
 */
export async function handleMatchEnd(tournamentId: string, matchId: string, winnerId: number) {
    fastify.log.info(`Processing match end for tournament ${tournamentId}, match ${matchId}, winner ${winnerId}`);
    
    await updateMatchWinnerInTournamentDB(matchId, winnerId);

    const allMatches = await getMatchesForTournament(tournamentId);
    const currentMatch = allMatches.find(m => m.matchId === matchId);
    if (!currentMatch) return;

    const currentRoundNumber = currentMatch.round_number;
    const currentRoundMatches = allMatches.filter(m => m.round_number === currentRoundNumber);
    const allMatchesInRoundFinished = currentRoundMatches.every(m => m.winner_id !== null);

    if (allMatchesInRoundFinished) {
        const winners = currentRoundMatches.map(m => m.winner_id!);
        if (winners.length === 1) {
            await finishTournament(tournamentId, winners[0]);
        } else {
            for (let i = 0; i < winners.length; i += 2) {
                await createMatchInGameService({
                    player1_id: winners[i],
                    player2_id: winners[i + 1],
                    tournament_id: tournamentId,
                    round_number: currentRoundNumber + 1
                });
            }
        }
    }

    const newTournamentState = await getTournamentState(tournamentId);
    io.to(`tournament-${tournamentId}`).emit('tournamentState', newTournamentState);
}

async function finishTournament(tournamentId: string, winnerId: number) {
    fastify.log.info(`Tournament ${tournamentId} has finished. Winner is ${winnerId}.`);
    await updateTournamentWinner(tournamentId, winnerId);

    const finalState = await getTournamentState(tournamentId);
    fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', finalState);
    
    matchReadyState.clear();
    
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

async function getTournamentState(tournamentId: string): Promise<any> {
    const { tournament, matches: rawMatches } = await getTournamentById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const playerCount = tournament.player_count;
    const totalRounds = playerCount > 1 ? Math.log2(playerCount) : 1;

    const rounds: { [key: number]: any[] } = {};
    
    rawMatches.forEach(match => {
        const round = match.round_number;
        if (!rounds[round]) {
            rounds[round] = [];
        }
        rounds[round].push({
            id: match.matchId,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            winner_id: match.winner_id,
            ready_players: Array.from(matchReadyState.get(match.matchId) || [])
        });
    });

    return { rounds, isFinished: !!tournament.winner_id, winner_id: tournament.winner_id, totalRounds };
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