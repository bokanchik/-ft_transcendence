import { fastify, type FastifyReply, type FastifyRequest } from 'fastify';
import { createMatchSchema } from '../middleware/matchSchemas.ts';
import db from '../database/connectDB.ts'
import type { Match } from '../models/gameModel.ts';
import { getRowByMatchId } from '../database/dbModels.ts';

// http post /api/game/match
export async function createMatchHandler(req: FastifyRequest, reply: FastifyReply) {
    req.log.info(`Client envoie: ${JSON.stringify(req.validatedBody)}`);
    
    const { player1, player2 } = req.validatedBody;

    // reponse envoyee au client
    const match = {
        matchId: crypto.randomUUID(),
        player1,
        player2,
        startTime: new Date().toISOString(),
    };

    return reply.code(201).send(match);
}

// Handler to get match details by matchId
export async function getMatchIdHandler(req: FastifyRequest, reply: FastifyReply) {
    const matchId = (req.params as { matchId: string}).matchId;
    
    req.log.info(`Fetching match details for matchId: ${matchId}`);

    if (!matchId) {
        return reply.status(400).send({ error: 'Match ID is required' });
    }

    try {
        const match = await getRowByMatchId(matchId);
        if (match) {
            let data = {
                id: match.id,
                player1_id: match.player1_id,
                player2_id: match.player2_id,
                player1_score: match.player1_score,
                player2_score: match.player1_score,
                winner_id: match.winner_id,
                win_type: match.win_type,
            };
            return reply.code(200).send({ data });
        }   

    } catch (err: unknown) { 
        if (err instanceof Error) {
            req.log.error(err);
            return reply.code(500).send({ error: err.message });
        }
    }
}

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
