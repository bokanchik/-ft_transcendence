//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createMatchHandler, getMatchIdHandler, getMatchStateHandler,
   acceptMatchHandler, rejectMatchHandler, startMatchHandler, quitMatchHandler } from '../handlers/matchHandlers.ts'

async function matchRoutes(fastify: FastifyInstance, options: any) {
   fastify.post('/match', { onRequest: [fastify.authenticate] }, createMatchHandler); // button Start
  
   // fastify.get('/match/:matchId', { schema: matchSchemas.idOnly}, getMatchIdHandler);
   // fastify.get('/match/:matchId/state', { schema: matchSchemas.idOnly }, getMatchStateHandler);
   // fastify.post('/match/:matchId/accept', { schema: matchSchemas.accept }, acceptMatchHandler);
   // fastify.post('/match/:matchId/reject', { schema: matchSchemas.reject }, rejectMatchHandler);
   // fastify.post('/match/:matchId/start', { schema: matchSchemas.start }, startMatchHandler);
   // fastify.post('/match/:matchId/quit', { schema: matchSchemas.quit }, quitMatchHandler);

   fastify.log.info('Match routes registered');

}

export default matchRoutes;