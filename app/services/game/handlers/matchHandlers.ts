import { type FastifyReply, type FastifyRequest } from 'fastify';
import { getRowByMatchId, getMatchesByUserId } from '../database/dbModels.ts';
import { MatchIdParams, MatchUserIdParams } from '../middleware/matchesSchemas.ts';

// http post /api/game/match
export async function createMatchHandler(req: FastifyRequest, reply: FastifyReply) {
    req.log.info(`Client envoie: ${JSON.stringify(req.validatedBody)}`);
    
    const { player1, player2 } = req.validatedBody;

    const match = {
        matchId: crypto.randomUUID(),
        player1,
        player2,
        startTime: new Date().toISOString(),
    };

    return reply.code(201).send(match);
}

// Handler to get match details by matchId
export async function getMatchIdHandler(req: FastifyRequest<{ Params: MatchIdParams }>, reply: FastifyReply) {
    const { matchId } = req.params;

    if (!matchId) {
        return reply.code(400).send({ error: 'Match ID is required' });
    }
    req.log.info(`Fetching match details for matchId: ${matchId}`);
    
    try {
        const match = await getRowByMatchId(matchId);
        if (match) {
            return reply.code(200).send({
                data: {
                    id: match.id,
                    matchId: match.matchId,
                    player1_id: match.player1_id,
                    player2_id: match.player2_id,
                    player1_socket: match.player1_socket,
                    player2_socket: match.player2_socket,
                    player1_score: match.player1_score,
                    player2_score: match.player2_score,
                    winner_id: match.winner_id,
                    win_type: match.win_type,
                    created_at: match.created_at,
                    status: match.status
                }
            });
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

// si tu utilises des schemas zod pour tes routes, tu peux faire comme ca
// type AuthenticatedRequest = FastifyRequest & { user: JWTPayload };
// export async function getMatchByUserHandler(req: AuthenticatedRequest, reply: FastifyReply) {
export async function getMatchByUserHandler(req: FastifyRequest<{ Params: MatchUserIdParams}>, reply: FastifyReply) {
    // tu recois forcement une sting ici dans req.params.userId donc
    // const userId = parseInt(req.params.userId, 10); // si pas de schemas zod pour tes routes
    // const userId = parseInt((req.params as UserIdParams).userId, 10); // si tu utilises des schemas zod pour tes routes
    const { userId } = req.params;

    if (!userId) {
        return reply.code(400).send({ error: 'UserId is required'});
    }
    req.log.info(`Fetching matches history for user: ${userId}`);
    
    try {
        const matches = await getMatchesByUserId(userId);
        // console.log(matches);
        return reply.code(200).send(matches);

    } catch (err: unknown) {
        if (err instanceof Error) {
            req.log.error(err);
            return reply.code(500).send({ error: err.message });
        }
    }

}

// --- PAS ENCORE IMPLEMENTE -----------
export async function getMatchStateHandler(eq: FastifyRequest, reply: FastifyReply) {

}

export async function quitMatchHandler(req: FastifyRequest, reply: FastifyReply) {

}

// MAYBE BE DEPRECATED
export async function startMatchHandler(req: FastifyRequest, reply: FastifyReply) {

}

// FOR INVITATION FUNCTIONALITY
export async function acceptMatchHandler(req: FastifyRequest, reply: FastifyReply) {

}

export async function rejectMatchHandler(req: FastifyRequest, reply: FastifyReply) {

}

// --------------------------------------