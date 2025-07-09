import { FastifyReply, FastifyRequest } from 'fastify';
import { LocalTournamentBodySchema } from '../middleware/tournaments.schemas.ts';
import { singleEliminationMatches } from '../utils/matchmaking.tournament.ts';
import { createTournament, getTournament } from '../utils/tournaments.init.ts';
import { GetTournamentByIdParams } from '../middleware/tournaments.schemas.ts';

// POST /api/tournament/local/start
export async function createLocalTournament(req: FastifyRequest, reply: FastifyReply) {
    const parseResult = LocalTournamentBodySchema.safeParse(req.body);

    if (!parseResult.success) {
        return reply.code(400).send({ error: parseResult.error.errors });
    }

    const { players } = parseResult.data;

    // data pour get /api/tournament/:id
    const matches = await singleEliminationMatches(players);

    const tournamentId = crypto.randomUUID();

    createTournament(tournamentId, matches);

    return reply.code(200).send({ tournamentId });
};

// GET /api/tournament/local/:tournamentId
export async function getTournamentById(req: FastifyRequest<{ Params: GetTournamentByIdParams }>, reply: FastifyReply) {
    const { tournamentId } = req.params;

    const tournament = getTournament(tournamentId);

    if (!tournament) {
        return reply.code(404).send({ error: 'Tournament not found' });
    }

    return reply.code(200).send(tournament);

}

export function updateScore() {
    
}