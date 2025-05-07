import type { FastifyReply, FastifyRequest } from 'fastify';
import { createMatchSchema } from '../schemas/matchSchemas.ts';
import db from '../database/connectDB.ts'
import type { Match } from '../models/gameModel.ts';

// http post /api/game/1v1/match
export async function createMatchHandler(req: FastifyRequest, reply: FastifyReply) {
    // check JWT token of a player
    const reqValidation = createMatchSchema.safeParse(req.body);
    if (!reqValidation.success) {
        return reply.code(400).send({ errors: reqValidation.error.errors});
    }
    const match = {
        matchId: crypto.randomUUID(),
        player1: reqValidation.data.player1,
        player2: reqValidation.data.player2 ?? null,
        gameMode: reqValidation.data.gameMode,
        startTime: new Date().toISOString(),
    };

    return reply.code(201).send(match);
}

// Handler to get match details by matchId
export async function getMatchIdHandler(req: FastifyRequest, reply: FastifyReply) {
    const matchId = req.params;
   // req.log.info(`Fetching match details for matchId: ${matchId}`);
    if (!matchId) {
        return reply.status(400).send({ error: 'Match ID is required' });
    }

    let sql = "SELECT * FROM matches WHERE id = ?"; // refaire avec model
    try {
        db.get(sql, [matchId], (err, row) => {
            if (err) {
                return reply.code(500).send({ error: err.message });
            }

            if (!row) {
                return reply.code(404).send({ error: 'Match not found' });
            }

            const match = row as Match;
            let data = {
                id: match.id,
                player1_id: match.player1_id,
                player2_id: match.player2_id,
                winner_id: match.winner_id,
                created_at: match.created_at,
                state: match.state
            };

            return reply.code(200).send({ data });

        });

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
