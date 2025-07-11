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

    // On parcourt les rounds pour trouver le premier match non joué
    for (const round of Object.values(tournamentState.rounds) as any[][]) {
        for (const match of round) {
            // Un match est "jouable" s'il n'a pas de gagnant et que les deux joueurs sont définis
            if (!match.winner_id && match.player1_id && match.player2_id) {
                const p1Socket = findSocketByUserId(match.player1_id);
                const p2Socket = findSocketByUserId(match.player2_id);

                if (p1Socket && p2Socket) {
                    fastify.log.info(`Triggering next match: ${match.player1_id} vs ${match.player2_id} (Match ID: ${match.id})`);
                    
                    // On attache les informations du tournoi au socket pour les retrouver plus tard
                    (p1Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
                    (p2Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
                    
                    // On informe les clients de démarrer
                    p1Socket.emit('startTournamentMatch', { matchId: match.id });
                    p2Socket.emit('startTournamentMatch', { matchId: match.id });

                    // On démarre la session de jeu sur le serveur
                    const gameSession = startRemoteGame(p1Socket, p2Socket, match.id);
                    gameSession.isTournamentMatch = true; // On marque ce match comme faisant partie d'un tournoi

                    // On a trouvé et lancé un match, on arrête de chercher.
                    return; 
                }
            }
        }
    }
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
            winner_id: match.winner_id
        });
    });

    const isFinished = !!tournament.winner_id;
    
    return { rounds, isFinished, winner_id: tournament.winner_id };
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