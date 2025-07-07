import type { FastifyInstance } from 'fastify';
import { LocalTournamentRouteSchema } from '../middleware/tournaments.schemas.ts';
import { createLocalTournament } from '../handlers/tournaments.handlers.ts';
import { downloadImage } from '../handlers/tournaments.handlers.ts';
import path from 'path';
import fs from 'fs/promises';

export function tournamentRoutes(fastify: FastifyInstance, _options: unknown) {
    
    fastify.post('/local/start', {
        schema: LocalTournamentRouteSchema,
        handler: createLocalTournament
    });\
};