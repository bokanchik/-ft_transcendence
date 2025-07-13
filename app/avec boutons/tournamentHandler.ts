// app/services/game/handlers/tournamentHandler.ts

import { Socket } from "socket.io";
import { fastify } from "../server.ts";
import { PlayerInfo, tournamentQueues } from "../utils/waitingListUtils.ts";
import { createTournament, addMatchToTournament, getTournamentById, updateTournamentWinner } from "../database/dbModels.ts";
import { startRemoteGame } from "../pong/matchSocketHandler.ts";
import { updateUserStatus } from "../utils/apiClient.ts";
import { UserOnlineStatus } from "../shared/schemas/usersSchemas.js";


// Structure pour garder en mémoire l'état des tournois actifs
// const activeTournaments = new Map<string, any>();
const activeTournaments = new Map<string, {
    state: any;
    readyStates: Map<string, { p1Ready: boolean, p2Ready: boolean }>;
}>();

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

    // socket.on('joinTournamentRoom', async ({ tournamentId }: { tournamentId: string }) => {
    //     socket.join(`tournament-${tournamentId}`);
    //     const tournamentState = await getTournamentState(tournamentId);
    //     socket.emit('tournamentState', tournamentState);
    // });

    socket.on('joinTournamentRoom', async ({ tournamentId }: { tournamentId: string }) => {
        socket.join(`tournament-${tournamentId}`);
        const tournament = activeTournaments.get(tournamentId);
        if (tournament) {
            socket.emit('tournamentState', tournament.state);
        } else {
            const tournamentState = await getTournamentState(tournamentId);
            activeTournaments.set(tournamentId, { state: tournamentState, readyStates: new Map() });
            socket.emit('tournamentState', tournamentState);
        }
    });

    socket.on('playerReadyForMatch', async ({ tournamentId, matchId }) => {
        const playerInfo: PlayerInfo | undefined = (socket as any).playerInfo;
        if (!playerInfo) return;

        const tournament = activeTournaments.get(tournamentId);
        if (!tournament) return;

        const match = findMatchInTournament(tournament.state, matchId);
        if (!match) return;

        let readyState = tournament.readyStates.get(matchId);
        if (!readyState) {
            readyState = { p1Ready: false, p2Ready: false };
            tournament.readyStates.set(matchId, readyState);
        }

        if (playerInfo.userId === match.player1_id) {
            readyState.p1Ready = true;
        } else if (playerInfo.userId === match.player2_id) {
            readyState.p2Ready = true;
        }

        fastify.log.info(`Player ${playerInfo.display_name} is ready for match ${matchId}. State: ${JSON.stringify(readyState)}`);

        // Informer les joueurs de l'état d'avancement
        fastify.io.to(`tournament-${tournamentId}`).emit('readinessUpdate', { matchId, readyState });

        // Si les deux sont prêts, lancer la partie
        if (readyState.p1Ready && readyState.p2Ready) {
            fastify.log.info(`Both players ready for match ${matchId}. Starting game...`);
            await startGameForMatch(tournamentId, matchId);
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
    activeTournaments.set(tournamentId, { state: tournamentState, readyStates: new Map() });

    // 3. Informer tous les joueurs du début du tournoi
    players.forEach(p => {
        p.socket.join(`tournament-${tournamentId}`); // Chaque joueur rejoint une salle dédiée
        p.socket.emit('tournamentStarting', { tournamentId, matches: tournamentState.rounds[1] });
    });

    // 4. Lancer le premier match
    triggerNextMatch(tournamentId);
}

// export async function handleMatchEnd(tournamentId: string, matchId: string, winnerId: number) {
//     fastify.log.info(`Match ${matchId} ended in tournament ${tournamentId}. Winner: ${winnerId}`);
    
//     const tournamentState = await getTournamentState(tournamentId);
//     activeTournaments.set(tournamentId, tournamentState);

//     // Mettre à jour tous les participants
//     fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', tournamentState);

//     const nextMatchAvailable = await triggerNextMatch(tournamentId);
//     if (!nextMatchAvailable && !tournamentState.isFinished) {
//         fastify.log.info(`Tournament ${tournamentId} has finished. Winner is ${winnerId}.`);
//         await updateTournamentWinner(tournamentId, winnerId);
//         console.log(`\x1b[35m[DEBUG] Emitting 'tournamentFinished' for tournament ${tournamentId}\x1b[0m`);
//         fastify.io.to(`tournament-${tournamentId}`).emit('tournamentFinished', { winnerId, tournamentId });
//         activeTournaments.delete(tournamentId);
//         const sockets = await fastify.io.in(`tournament-${tournamentId}`).fetchSockets();
//         sockets.forEach(s => {
//             const playerInfo = (s as any).playerInfo as PlayerInfo;
//             if (playerInfo) {
//                 updateUserStatus(playerInfo.userId, UserOnlineStatus.ONLINE);
//             }
//             s.leave(`tournament-${tournamentId}`);
//             delete (s as any).tournamentInfo; // Nettoyer les infos de tournoi
//         });
//     }
// }

export async function handleMatchEnd(tournamentId: string, matchId: string, winnerId: number) {
    fastify.log.info(`Match ${matchId} ended in tournament ${tournamentId}. Winner: ${winnerId}`);
    
    // 1. On récupère toujours l'état le plus récent de la DB.
    const currentTournamentState = await getTournamentState(tournamentId);
    
    // 2. On met à jour notre map en mémoire avec cet état frais.
    //    On préserve les `readyStates` s'ils existent déjà.
    const existingTournament = activeTournaments.get(tournamentId);
    activeTournaments.set(tournamentId, { 
        state: currentTournamentState, 
        readyStates: existingTournament?.readyStates || new Map() 
    });

    // 3. On notifie tous les clients du nouvel état du tournoi.
    fastify.io.to(`tournament-${tournamentId}`).emit('tournamentState', currentTournamentState);

    // 4. On passe l'état actuel directement à triggerNextMatch.
    const nextMatchAvailable = await triggerNextMatch(tournamentId, currentTournamentState);
    
    // 5. Si aucun match n'est disponible et que le tournoi est marqué comme terminé dans la DB
    if (!nextMatchAvailable && currentTournamentState.isFinished) {
        fastify.log.info(`Tournament ${tournamentId} has officially finished. Winner is ${currentTournamentState.winner_id}.`);
        
        // On émet l'événement final.
        fastify.io.to(`tournament-${tournamentId}`).emit('tournamentFinished', { winnerId: currentTournamentState.winner_id, tournamentId });
        
        // Nettoyage final
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

// async function triggerNextMatch(tournamentId: string): Promise<boolean> {
//     const tournamentState = activeTournaments.get(tournamentId);
//     if (!tournamentState || tournamentState.isFinished) return false;

//     // On parcourt les rounds pour trouver le premier match non joué
//     for (const round of Object.values(tournamentState.rounds) as any[][]) {
//         for (const match of round) {
//             // Un match est "jouable" s'il n'a pas de gagnant et que les deux joueurs sont définis
//             if (!match.winner_id && match.player1_id && match.player2_id) {
//                 const p1Socket = findSocketByUserId(match.player1_id);
//                 const p2Socket = findSocketByUserId(match.player2_id);

//                 if (p1Socket && p2Socket) {
//                     const p1Info = (p1Socket as any).playerInfo;
//                     const p2Info = (p2Socket as any).playerInfo;
//                     fastify.log.info(`Triggering next match: ${match.player1_id} vs ${match.player2_id} (Match ID: ${match.id})`);
                    
//                     // On attache les informations du tournoi au socket pour les retrouver plus tard
//                     (p1Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
//                     (p2Socket as any).tournamentInfo = { tournamentId, matchId: match.id };
                    
//                     // On informe les clients de démarrer
//                     p1Socket.emit('startTournamentMatch', {
//                         matchId: match.id,
//                         side: 'left',
//                         opponent: p2Info.display_name
//                     });
//                     p2Socket.emit('startTournamentMatch', {
//                         matchId: match.id,
//                         side: 'right',
//                         opponent: p1Info.display_name
//                     });

//                     // On démarre la session de jeu sur le serveur
//                     const gameSession = startRemoteGame(p1Socket, p2Socket, match.id);
//                     gameSession.isTournamentMatch = true; // On marque ce match comme faisant partie d'un tournoi

//                     // On a trouvé et lancé un match, on arrête de chercher.
//                     return true; 
//                 }
//             }
//         }
//     }
//     return false; // Aucun match à jouer pour le moment
// }

// async function triggerNextMatch(tournamentId: string): Promise<boolean> {
//     const tournament = activeTournaments.get(tournamentId);
//     if (!tournament || tournament.state.isFinished) return false;

//     for (const round of Object.values(tournament.state.rounds) as any[][]) {
//         for (const match of round) {
//             if (!match.winner_id && match.player1_id && match.player2_id) {
//                 const p1Socket = findSocketByUserId(match.player1_id);
//                 const p2Socket = findSocketByUserId(match.player2_id);
                
//                 if (p1Socket && p2Socket) {
//                     fastify.log.info(`Notifying players for match ${match.id}: ${match.player1_id} vs ${match.player2_id}`);
//                     // On envoie un événement pour que le client affiche le bouton "Prêt"
//                     p1Socket.emit('matchReadyToPlay', { matchId: match.id, tournamentId });
//                     p2Socket.emit('matchReadyToPlay', { matchId: match.id, tournamentId });
//                     return true;
//                 }
//             }
//         }
//     }
//     return false;
// }

async function triggerNextMatch(tournamentId: string, tournamentState: any): Promise<boolean> {
    // La fonction reçoit maintenant l'état et n'a plus besoin de le chercher dans la map.
    if (!tournamentState || tournamentState.isFinished) {
        return false;
    }

    // Le reste de la fonction est identique...
    for (const round of Object.values(tournamentState.rounds) as any[][]) {
        for (const match of round) {
            if (!match.winner_id && match.player1_id && match.player2_id) {
                const p1Socket = findSocketByUserId(match.player1_id);
                const p2Socket = findSocketByUserId(match.player2_id);
                
                if (p1Socket && p2Socket) {
                    fastify.log.info(`Notifying players for match ${match.id}: ${match.player1_id} vs ${match.player2_id}`);
                    p1Socket.emit('matchReadyToPlay', { matchId: match.id, tournamentId });
                    p2Socket.emit('matchReadyToPlay', { matchId: match.id, tournamentId });
                    return true;
                }
            }
        }
    }
    return false;
}

async function startGameForMatch(tournamentId: string, matchId: string) {
    const tournament = activeTournaments.get(tournamentId);
    if (!tournament) return;

    const match = findMatchInTournament(tournament.state, matchId);
    if (!match) return;

    const p1Socket = findSocketByUserId(match.player1_id);
    const p2Socket = findSocketByUserId(match.player2_id);

    if (p1Socket && p2Socket) {
        const p1Info = (p1Socket as any).playerInfo;
        const p2Info = (p2Socket as any).playerInfo;

        (p1Socket as any).tournamentInfo = { tournamentId, matchId };
        (p2Socket as any).tournamentInfo = { tournamentId, matchId };

        p1Socket.emit('startTournamentMatch', { matchId, side: 'left', opponent: p2Info.display_name });
        p2Socket.emit('startTournamentMatch', { matchId, side: 'right', opponent: p1Info.display_name });
        
        const gameSession = startRemoteGame(p1Socket, p2Socket, matchId);
        gameSession.isTournamentMatch = true;
    }
}

function findMatchInTournament(tournamentState: any, matchId: string): any | null {
    for (const round of Object.values(tournamentState.rounds) as any[][]) {
        const found = round.find(m => m.id === matchId);
        if (found) return found;
    }
    return null;
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