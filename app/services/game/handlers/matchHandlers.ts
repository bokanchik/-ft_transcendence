import { FastifyReply, FastifyRequest } from 'fastify';
import { Socket } from "socket.io";
import { startRemoteGame } from '../pong/matchSocketHandler.ts';
import { fastify } from '../server.ts';
import { getRowByMatchId, getMatchesByUserId, insertTourMatchToDB, setGameResult } from '../database/dbModels.ts';
import {  MatchIdParams, MatchUserIdParams, MatchBaseSchema } from '../shared/schemas/matchesSchemas.ts';
import { localGames } from '../pong/matchSocketHandler.ts';
//@ts-ignore
import { JWTPayload } from '../shared/schemas/usersSchemas.js';
import { createGameState } from '../pong/pongGame.ts';

// POST /api/match/local 
export async function createLocalMatchHandler(req: FastifyRequest, reply: FastifyReply) {    
    const { player1, player2 } = req.validatedBody;

    const match = {
        matchId: crypto.randomUUID(),
        player1,
        player2,
        startTime: new Date().toISOString(),
    };

    const state = createGameState();
    const intervalId: NodeJS.Timeout | null = null;

    localGames.set(match.matchId, { state, intervalId });
    
    return reply.code(201).send(match);
}

// POST /api/match/local/cancel : HTTP API endpoint allowing partial usage of game via CLI (you can cancel a match via a terminal)
export async function cancelLocalMatchHandler(req: FastifyRequest, reply: FastifyReply) {
    const { matchId } = req.validatedBody;

    const game = localGames.get(matchId);

    if (!game) {
        return reply.code(404).send({ error: 'Match not found or already cancelled' });
    }

    localGames.delete(matchId);

    return reply.code(201).send({ message: `Match ${matchId} cancelled`});
}

// GET /api/match/local/state/:matchId : HTTP API endpoint that can be used via CLI to follow game state in real time (left/right paddles positions, ball position, score)
export async function getLocalMatchState(req: FastifyRequest<{ Params: MatchIdParams }>, reply: FastifyReply) {
    const { matchId } = req.params;

    const game = localGames.get(matchId);

    if (!game) {
        return reply.code(404).send({ error: 'Match not found or already cancelled' });
    }

    return reply.code(200).send(game.state); 
}

// GET /api/match/remote/:matchId
export async function getMatchIdHandler(req: FastifyRequest<{ Params: MatchIdParams }>, reply: FastifyReply) {
    const { matchId } = req.params;

    if (!matchId) {
        return reply.code(400).send({ error: 'Match ID is required' });
    }
    req.log.info(`Fetching match details for matchId: ${matchId}`);
    
    try {
        const match = await getRowByMatchId(matchId);
        if (match) {

            const res = {
                    id: match.id,
                    matchId: match.matchId,
                    player1_id: match.player1_id,
                    player2_id: match.player2_id,
                    player1_socket: match.player1_socket,
                    player2_socket: match.player2_socket,
                    player1_score: match.player1_score ?? 0,
                    player2_score: match.player2_score ?? 0,
                    winner_id: match.winner_id,
                    win_type: match.win_type,
                    created_at: match.created_at,
                    tournament_id: match.tournament_id,
                    status: match.status
            };

            const validatedRes = MatchBaseSchema.parse(res);

            return reply.code(200).send(validatedRes);
        }  else {
            return reply.code(404).send({ error: 'Match not found' });
        }

    } catch (err: unknown) { 
        if (err instanceof Error) {
            req.log.error(err);
            return reply.code(500).send({ error: err.message });
        }
    }
}

type AuthenticatedRequest = FastifyRequest & { user: JWTPayload };

// GET /history/:userId : all matches fetched for this userId
export async function getMatchByUserHandler(req: AuthenticatedRequest, reply: FastifyReply) {
    const userId = parseInt((req.params as MatchUserIdParams).userId, 10);

    if (!userId) {
        return reply.code(400).send({ error: 'UserId is required'});
    }
    
    try {
        const matchesFromDb = await getMatchesByUserId(userId);

        if (!matchesFromDb) {
            return reply.code(404).send({ error: 'Matches not found' });
        }
        const sanitizedMatches = matchesFromDb.map(match => ({
            ...match,
            player1_score: match.player1_score ?? 0, // Remplace null par 0
            player2_score: match.player2_score ?? 0, // Remplace null par 0
        }));
        
        console.log("BACKEND - Sending sanitized matches data:", JSON.stringify(sanitizedMatches, null, 2));
        return reply.code(200).send(sanitizedMatches);

    } catch (err: unknown) {
        if (err instanceof Error) {
            req.log.error(err);
            return reply.code(500).send({ error: err.message });
        }
    }
}


export async function createInternalMatchHandler(req: FastifyRequest, reply: FastifyReply) {
    const { player1_id, player2_id, tournament_id, round_number } = req.body as any;
    
    if (!player1_id || !player2_id || !tournament_id) {
        return reply.code(400).send({ error: 'Missing required fields for internal match creation' });
    }
    
    const matchId = crypto.randomUUID();

    try {
        await insertTourMatchToDB({
            matchId,
            player1_id,
            player2_id,
            player1_socket: null, // Les sockets seront assignés lors de la connexion
            player2_socket: null,
            tournament_id,
            round_number,
            status: 'pending' // Le match est en attente, pas encore en cours
        });

        req.log.info(`Internal request: Created match ${matchId} for tournament ${tournament_id}`);
        return reply.code(201).send({ matchId });
    } catch (error) {
        req.log.error(error, "Failed to create internal match");
        return reply.code(500).send({ error: 'Failed to create match in database' });
    }
}

export async function startOnlineMatchHandler(req: FastifyRequest, reply: FastifyReply) {
    const { matchId, player1_id, player2_id } = req.body as any;

    if (!matchId || !player1_id || !player2_id) {
        return reply.code(400).send({ error: 'Missing matchId, player1_id, or player2_id' });
    }

    req.log.info(`Received internal request to start match: ${matchId}`);

    // Retrouver les sockets des joueurs connectés au service de jeu
    const p1Socket = findSocketByUserId(player1_id);
    const p2Socket = findSocketByUserId(player2_id);
    
    if (!p1Socket || !p2Socket) {
        req.log.error(`Could not start match ${matchId}: One or both players are not connected to the game service.`);
        // Il faudrait une logique de retry ou de timeout ici, mais pour l'instant on retourne une erreur.
        return reply.code(404).send({ error: "One or both players not connected" });
    }

    const p1Info = (p1Socket as any).playerInfo;
    const p2Info = (p2Socket as any).playerInfo;

    // Associer les infos du tournoi pour la gestion de fin de partie
    (p1Socket as any).tournamentInfo = { tournamentId: req.body.tournament_id, matchId };
    (p2Socket as any).tournamentInfo = { tournamentId: req.body.tournament_id, matchId };

    // Notifier les clients qu'ils peuvent commencer (c'est une sécurité, déjà fait par le service tournament)
    p1Socket.emit('startTournamentMatch', { matchId, side: 'left', opponent: p2Info.display_name });
    p2Socket.emit('startTournamentMatch', { matchId, side: 'right', opponent: p1Info.display_name });

    // Démarrer la boucle de jeu
    const gameSession = startRemoteGame(p1Socket, p2Socket, matchId);
    gameSession.isTournamentMatch = true;

    return reply.code(200).send({ message: 'Match started' });
}

// Fonction utilitaire à ajouter dans ce fichier ou un fichier d'utils
function findSocketByUserId(userId: number): Socket | undefined {
    for (const socket of fastify.io.sockets.sockets.values()) {
        const playerInfo = (socket as any).playerInfo;
        if (playerInfo && playerInfo.userId === userId) {
            return socket;
        }
    }
    return undefined;
}

export async function declareMatchForfeitHandler(req: FastifyRequest, reply: FastifyReply) {
    const { matchId, winnerId } = req.body as { matchId: string, winnerId: number };

    if (!matchId || !winnerId) {
        return reply.code(400).send({ error: 'Missing matchId or winnerId' });
    }

    req.log.info(`Received internal request to declare forfeit for match ${matchId}, winner is ${winnerId}`);

    try {
        const match = await getRowByMatchId(matchId);
        if (!match) {
            return reply.code(404).send({ error: 'Match not found' });
        }
        if (match.status === 'finished') {
            return reply.code(200).send({ message: 'Match already finished' });
        }

        // On utilise la fonction existante pour mettre à jour la DB et les stats
        await setGameResult(matchId, 0, 0, winnerId, 'forfeit');

        return reply.code(200).send({ message: `Match ${matchId} declared forfeit.` });
    } catch (error) {
        req.log.error(error, `Failed to declare forfeit for match ${matchId}`);
        return reply.code(500).send({ error: 'Internal server error' });
    }
}