import type { FastifyInstance, FastifyRequest } from 'fastify';
import { LocalTournamentRouteSchema } from '../middleware/tournaments.schemas.ts';
import { createLocalTournament, handleMatchEnd } from '../handlers/tournamentHandler.ts';
import { findActiveTournamentByPlayerId } from '../database/dbModels.ts';

export function tournamentRoutes(fastify: FastifyInstance, _options: unknown) {
    
    fastify.post('/local/start', {
        schema: LocalTournamentRouteSchema,
        handler: createLocalTournament
    });
    fastify.post('/internal/match-result', {
        onRequest: [fastify.authenticateService],
        handler: async (req, reply) => {
            const { tournamentId, matchId, winnerId } = req.body as any;
            
            if (!tournamentId || !matchId || !winnerId) {
                 return reply.code(400).send({ error: 'Missing parameters for match result' });
            }

            await handleMatchEnd(tournamentId, matchId, winnerId);

            return reply.code(200).send({ message: 'Result received' });
        }
    });
    fastify.get('/player-status', {
        onRequest: [fastify.authenticate],
        handler: async (req: FastifyRequest, reply) => {
            const user = (req as any).user;
            if (!user || !user.id) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const activeTournament = await findActiveTournamentByPlayerId(user.id);

            if (activeTournament) {
                return reply.code(200).send({ activeTournamentId: activeTournament.id });
            } else {
                return reply.code(200).send({ activeTournamentId: null });
            }
        }
    });
};