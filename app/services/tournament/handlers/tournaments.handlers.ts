import { FastifyReply, FastifyRequest } from 'fastify';
import { LocalTournamentBodySchema } from '../middleware/tournaments.schemas.ts';
import { singleEliminationMatches } from '../utils/matchmaking.tournament.ts';

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

