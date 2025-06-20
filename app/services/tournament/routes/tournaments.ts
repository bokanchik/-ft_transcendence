import type { FastifyInstance } from 'fastify';
import { LocalTournamentRouteSchema } from '../middleware/tournaments.schemas.ts';
import { createLocalTournament } from '../handlers/tournaments.handlers.ts';

export function tournamentRoutes(fastify: FastifyInstance, _options: unknown) {
    
    fastify.post('/local/start', {
        schema: LocalTournamentRouteSchema,
        handler: createLocalTournament
    });
    
};