import type { FastifyInstance } from 'fastify';
import { LocalTournamentRouteSchema, getTournamentByIdRouteSchema } from '../middleware/tournaments.schemas.ts';
import { createLocalTournament, getTournamentById, updateScore } from '../handlers/tournaments.handlers.ts';

export function tournamentRoutes(fastify: FastifyInstance, _options: unknown) {
    
    fastify.post('/local/start', {
        schema: LocalTournamentRouteSchema,
        handler: createLocalTournament
    });

    fastify.get('/local/:tournamentId', {
       schema: getTournamentByIdRouteSchema,
       handler: getTournamentById,
    });
    
    // fastify.patch('/local/:tournamentId/update-score', {
    //     schema: updateScoreRouteSchema,
    //     handler: updateScore
    // })
};

