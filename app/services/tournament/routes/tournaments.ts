import type { FastifyInstance } from 'fastify';
import { LocalTournamentRouteSchema } from '../middleware/tournaments.schemas.ts';
import { createLocalTournament, handleMatchEnd } from '../handlers/tournamentHandler.ts';

export function tournamentRoutes(fastify: FastifyInstance, _options: unknown) {
    
    fastify.post('/local/start', {
        schema: LocalTournamentRouteSchema,
        handler: createLocalTournament
    });
    fastify.post('/internal/match-result', {
        onRequest: [fastify.authenticateService], // Protection par clé API
        handler: async (req, reply) => {
            const { tournamentId, matchId, winnerId } = req.body as any;
            
            if (!tournamentId || !matchId || !winnerId) {
                 return reply.code(400).send({ error: 'Missing parameters for match result' });
            }

            await handleMatchEnd(tournamentId, matchId, winnerId);

            return reply.code(200).send({ message: 'Result received' });
        }
    });
};