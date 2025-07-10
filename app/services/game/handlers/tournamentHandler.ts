// app/services/game/handlers/tournamentHandler.ts

import { Socket } from "socket.io";
import { fastify } from "../server.ts";
import { PlayerInfo, tournamentQueues } from "../utils/waitingListUtils.ts";
import { createTournament, addMatchToTournament, getTournamentById, updateMatchWinner } from "../database/dbModels.ts";
import { startRemoteGame } from "../pong/matchSocketHandler.ts";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";

// Structure pour garder en mémoire l'état des tournois actifs
const activeTournaments = new Map<string, any>();

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
        
        // Correction : Robustesse contre les reconnexions
        // On s'assure de retirer toute instance précédente du même utilisateur avant d'ajouter la nouvelle.
        const existingPlayerIndex = queue.findIndex(p => p.userId === playerInfo.userId);
        if (existingPlayerIndex > -1) {
            queue.splice(existingPlayerIndex, 1);
        }
        
        // On ajoute le joueur avec son socket ACTIF.
        queue.push(playerInfo);
        tournamentQueues.set(size, queue);
        

        fastify.log.info(`Player ${playerInfo.display_name} joined tournament queue for size ${size}. Queue size: ${queue.length}/${size}`);

        // Emettre une mise à jour à tous les joueurs dans la file
        // A ce stade, tous les sockets dans la queue sont garantis d'être valides.
        queue.forEach(p => {
            if (p.socket && p.socket.connected) { // Double vérification par sécurité
                p.socket.emit('tournamentQueueUpdate', { current: queue.length, required: size });
            }
        });

        // Si la file est pleine, on démarre le tournoi
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
}

// ... Le reste du fichier reste identique ...
// ...
async function startTournament(players: PlayerInfo[]) {
    fastify.log.info(`Starting a new tournament with ${players.length} players.`);
    
    // 1. Créer le tournoi dans la DB
    const tournamentId = crypto.randomUUID();
    await createTournament(tournamentId, players.map(p => p.userId));
    
    // 2. Mélanger les joueurs et créer les paires
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

    // 3. Informer tous les joueurs du début du tournoi
    players.forEach(p => {
        p.socket.join(`tournament-${tournamentId}`); // Chaque joueur rejoint une salle dédiée
        p.socket.emit('tournamentStarting', { tournamentId, matches: tournamentState.rounds[1] });
    });

    // 4. Lancer le premier match
    triggerNextMatch(tournamentId);
}

export async function handleMatchEnd(tournamentId: string, matchId: string, winnerId: number) {
    fastify.log.info(`Match ${matchId} ended in tournament ${tournamentId}. Winner: ${winnerId}`);
    
    await updateMatchWinner(matchId, winnerId);
    
    const tournamentState = await getTournamentState(tournamentId);
    activeTournaments.set(tournamentId, tournamentState);

    // Mettre à jour tous les participants
    fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', tournamentState);

    // Si le tournoi n'est pas terminé, lancer le match suivant
    if (!tournamentState.isFinished) {
        triggerNextMatch(tournamentId);
    } else {
        fastify.log.info(`Tournament ${tournamentId} has finished. Winner is ${tournamentState.winner}`);
        // Nettoyage
        activeTournaments.delete(tournamentId);
        const sockets = await fastify.io.in(`tournament-${tournamentId}`).fetchSockets();
        sockets.forEach(s => {
            const playerInfo = (s as any).playerInfo as PlayerInfo;
            if (playerInfo) {
                updateUserStatus(playerInfo.userId, UserOnlineStatus.ONLINE);
            }
            s.leave(`tournament-${tournamentId}`);
        });
    }
}

async function triggerNextMatch(tournamentId: string) {
    const tournamentState = activeTournaments.get(tournamentId);
    if (!tournamentState || tournamentState.isFinished) return;

    for (const round of Object.values(tournamentState.rounds) as any[][]) {
        for (const match of round) {
            if (!match.winner_id && match.player1 && match.player2) {
                const p1Socket = findSocketByUserId(match.player1.id);
                const p2Socket = findSocketByUserId(match.player2.id);

                if (p1Socket && p2Socket) {
                    fastify.log.info(`Triggering next match: ${match.player1.display_name} vs ${match.player2.display_name}`);
                    
                    (p1Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
                    (p2Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
                    
                    p1Socket.emit('startTournamentMatch', { matchId: match.id });
                    p2Socket.emit('startTournamentMatch', { matchId: match.id });

                    startRemoteGame(p1Socket, p2Socket, match.id);
                    return;
                }
            }
        }
    }
}


async function getTournamentState(tournamentId: string): Promise<any> {
    const { tournament, matches } = await getTournamentById(tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    const rounds: { [key: number]: any[] } = {};
    const playerDetails = new Map<number, { id: number, display_name: string }>();
    matches.forEach(m => {
        playerDetails.set(m.player1_id, { id: m.player1_id, display_name: m.player1_display_name });
        playerDetails.set(m.player2_id, { id: m.player2_id, display_name: m.player2_display_name });
    });

    matches.forEach(match => {
        if (!rounds[match.round_number]) {
            rounds[match.round_number] = [];
        }
        rounds[match.round_number].push({
            id: match.match_id,
            player1: playerDetails.get(match.player1_id),
            player2: playerDetails.get(match.player2_id),
            winner_id: match.winner_id
        });
    });

    let currentRound = 1;
    while (true) {
        const previousRoundMatches = rounds[currentRound];
        if (!previousRoundMatches || previousRoundMatches.some(m => !m.winner_id)) break;

        const winners = previousRoundMatches.map(m => playerDetails.get(m.winner_id!));
        if (winners.length < 2) break; // Fin du tournoi
        
        const nextRound = currentRound + 1;
        rounds[nextRound] = [];
        for (let i = 0; i < winners.length; i += 2) {
            rounds[nextRound].push({
                id: `R${nextRound}-${i/2}`,
                player1: winners[i],
                player2: winners[i+1] || null,
                winner_id: null
            });
        }
        currentRound++;
    }

    const isFinished = !!tournament.winner_id;
    const winner = isFinished ? playerDetails.get(tournament.winner_id!)?.display_name : undefined;

    return { rounds, isFinished, winner };
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