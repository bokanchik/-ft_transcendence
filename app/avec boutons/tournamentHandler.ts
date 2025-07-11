// app/services/game/handlers/tournamentHandler.ts

import { Socket } from "socket.io";
import { fastify } from "../server.ts";
import { PlayerInfo, tournamentQueues } from "../utils/waitingListUtils.ts";
import { createTournament, addMatchToTournament, getTournamentById, updateMatchWinner, checkAndCreateNextRound } from "../database/dbModels.ts";
import { startRemoteGame } from "../pong/matchSocketHandler.ts";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";

// Structure pour garder en mémoire l'état des tournois actifs
const activeTournaments = new Map<string, { state: any; readyPlayers: Map<string, Set<number>> }>();

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
        const tournamentData = activeTournaments.get(tournamentId);
        if (tournamentData) {
            socket.emit('tournamentState', tournamentData.state);
        } else {
            const newState = await getTournamentState(tournamentId);
            activeTournaments.set(tournamentId, { state: newState, readyPlayers: new Map() });
            socket.emit('tournamentState', newState);
        }
    });

    // *** NOUVEL ÉVÉNEMENT ***
    socket.on('playerReady', async ({ tournamentId, matchId }: { tournamentId: string; matchId: string }) => {
        const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
        if (!playerInfo) return;

        const tournament = activeTournaments.get(tournamentId);
        if (!tournament) return;

        let readySet = tournament.readyPlayers.get(matchId);
        if (!readySet) {
            readySet = new Set<number>();
            tournament.readyPlayers.set(matchId, readySet);
        }
        readySet.add(playerInfo.userId);
        
        // Trouver les IDs des joueurs du match
        let p1Id, p2Id;
        for (const round of Object.values(tournament.state.rounds) as any[][]) {
            const match = round.find(m => m.id === matchId);
            if (match) {
                p1Id = match.player1_id;
                p2Id = match.player2_id;
                break;
            }
        }

        // On vérifie si les deux joueurs sont prêts
        if (p1Id && p2Id && readySet.has(p1Id) && readySet.has(p2Id)) {
            // On récupère les sockets une première fois pour le décompte
            const initialP1Socket = findSocketByUserId(p1Id);
            const initialP2Socket = findSocketByUserId(p2Id);

            if (initialP1Socket && initialP2Socket) {
                fastify.log.info(`Both players ready for match ${matchId}. Starting countdown.`);
                initialP1Socket.emit('matchStartingIn', { countdown: 3 });
                initialP2Socket.emit('matchStartingIn', { countdown: 3 });

                // Démarrer le jeu après le compte à rebours
                setTimeout(async () => {
                    // *** CORRECTION CLÉ : On récupère les sockets à nouveau ici ***
                    // Cela garantit qu'on a la connexion la plus récente.
                    const finalP1Socket = findSocketByUserId(p1Id);
                    const finalP2Socket = findSocketByUserId(p2Id);

                    if (finalP1Socket && finalP2Socket) {
                        (finalP1Socket as any).tournamentInfo = { tournamentId, matchId };
                        (finalP2Socket as any).tournamentInfo = { tournamentId, matchId };

                        finalP1Socket.emit('startTournamentMatch', { matchId });
                        finalP2Socket.emit('startTournamentMatch', { matchId });
                        
                        // const gameSession = startRemoteGame(finalP1Socket, finalP2Socket, matchId, tournamentId);
                        // gameSession.isTournamentMatch = true;
                        startRemoteGame(finalP1Socket, finalP2Socket, matchId, tournamentId);
                    } else {
                        fastify.log.error(`One player disconnected during countdown for match ${matchId}. Aborting.`);
                        // (Optionnel) Informer le joueur restant que l'adversaire est parti
                        if (finalP1Socket) finalP1Socket.emit('opponentLeftBeforeStart');
                        if (finalP2Socket) finalP2Socket.emit('opponentLeftBeforeStart');
                    }
                }, 3000);
            }
        }
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
    // activeTournaments.set(tournamentId, tournamentState);
    activeTournaments.set(tournamentId, { state: tournamentState, readyPlayers: new Map() });

    // 3. Informer tous les joueurs du début du tournoi
    // players.forEach(p => {
    //     p.socket.join(`tournament-${tournamentId}`); // Chaque joueur rejoint une salle dédiée
    //     p.socket.emit('tournamentStarting', { tournamentId, matches: tournamentState.rounds[1] });
    // });

    players.forEach(p => {
        p.socket.join(`tournament-${tournamentId}`);
        p.socket.emit('tournamentStarting', { tournamentId });
    });

    // 4. Lancer le premier match
    // triggerNextMatch(tournamentId);
}

export async function handleMatchEnd(tournamentId: string, matchId: string, winnerId: number) {
    fastify.log.info(`Match ${matchId} ended in tournament ${tournamentId}. Winner: ${winnerId}`);
    
    await updateMatchWinner(matchId, winnerId);
    await checkAndCreateNextRound(tournamentId);
    
    const tournamentState = await getTournamentState(tournamentId);
    const tournamentData = activeTournaments.get(tournamentId);
    if (tournamentData) {
        tournamentData.state = tournamentState;
        // On supprime l'entrée 'ready' pour le match terminé
        tournamentData.readyPlayers.delete(matchId);
    } else {
        activeTournaments.set(tournamentId, { state: tournamentState, readyPlayers: new Map() });
    }

    fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', tournamentState);

    // Si le tournoi n'est pas terminé, lancer le match suivant
    if (tournamentState.isFinished) {
        fastify.log.info(`Tournament ${tournamentId} has finished. Winner is ${tournamentState.winner_id}`);
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