import { Socket } from "socket.io";
import { fastify } from "../server.ts";
import { PlayerInfo, tournamentQueues } from "../utils/waitingListUtils.ts";
import { createTournament, addMatchToTournament, getTournamentById, updateTournamentWinner, getMatchesByTournamentId, updateMatchWinner } from "../database/dbModels.ts";
import { startRemoteGame } from "../pong/matchSocketHandler.ts";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";

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
            const playersToStart = tournamentQueues.get(size)!.splice(0, size); 
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

        // On envoie le nouvel état à tout le monde pour montrer qui est prêt
        const tournamentState = await getTournamentState(tournamentId);
        fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', tournamentState);

        if (readyPlayers.size === 2) {
            const allMatches = await getMatchesByTournamentId(tournamentId);
            const matchData = allMatches.find(m => m.matchId === matchId);

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

                    setTimeout(() => {
                        if (p1Socket.connected && p2Socket.connected) {
                            const gameSession = startRemoteGame(p1Socket, p2Socket, matchId);
                            gameSession.isTournamentMatch = true;
                        }
                    }, 3000);
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
    
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        const player1 = shuffledPlayers[i];
        const player2 = shuffledPlayers[i + 1];
        const matchId = crypto.randomUUID();
        await addMatchToTournament(tournamentId, matchId, player1.userId, player2.userId, 1);
    }

    const tournamentState = await getTournamentState(tournamentId);

    players.forEach(p => {
        p.socket.join(`tournament-${tournamentId}`);
        p.socket.emit('tournamentStarting', { tournamentId, matches: tournamentState.rounds[1] });
    });
}

// --- LOGIQUE CORRIGÉE ET SIMPLIFIÉE ---
export async function handleMatchEnd(tournamentId: string, matchId: string, winnerId: number) {
    fastify.log.info(`Match ${matchId} ended. Winner: ${winnerId}. Processing tournament progression for ${tournamentId}`);

    // 1. Mettre à jour le vainqueur du match qui vient de se terminer
    await updateMatchWinner(matchId, winnerId);

    // 2. Vérifier si tous les matchs du round sont terminés
    const allMatches = await getMatchesByTournamentId(tournamentId);
    const currentMatch = allMatches.find(m => m.matchId === matchId);
    if (!currentMatch) return;

    const currentRoundNumber = currentMatch.round_number;
    const currentRoundMatches = allMatches.filter(m => m.round_number === currentRoundNumber);
    const allMatchesInRoundFinished = currentRoundMatches.every(m => m.winner_id !== null);

    // 3. Si le round est terminé, créer les matchs du round suivant
    if (allMatchesInRoundFinished) {
        fastify.log.info(`Round ${currentRoundNumber} of tournament ${tournamentId} is complete.`);
        const winners = currentRoundMatches.map(m => m.winner_id!);
        
        if (winners.length === 1) {
            // S'il ne reste qu'un seul vainqueur, c'est le gagnant du tournoi
            await finishTournament(tournamentId, winners[0]);
        } else {
            // Sinon, on crée les matchs du round suivant
            for (let i = 0; i < winners.length; i += 2) {
                const newMatchId = crypto.randomUUID();
                const player1_id = winners[i];
                const player2_id = winners[i + 1];
                await addMatchToTournament(tournamentId, newMatchId, player1_id, player2_id, currentRoundNumber + 1);
                fastify.log.info(`Created next round match: ${player1_id} vs ${player2_id} in tournament ${tournamentId}`);
            }
        }
    }
    // 4. Envoyer le nouvel état du tournoi à tous les clients
    const newTournamentState = await getTournamentState(tournamentId);
    fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', newTournamentState);
}

async function finishTournament(tournamentId: string, winnerId: number) {
    fastify.log.info(`Tournament ${tournamentId} has finished. Winner is ${winnerId}.`);
    await updateTournamentWinner(tournamentId, winnerId);

    // Émettre un événement final pour célébrer le vainqueur côté client
    const finalState = await getTournamentState(tournamentId);
    fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', finalState);
    
    // Nettoyer les ressources
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

    return { rounds, isFinished: !!tournament.winner_id, winner_id: tournament.winner_id };
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