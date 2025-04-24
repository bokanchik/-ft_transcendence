import { createMatchHandler, getMatchHandler, getMatchStateHandler,
   acceptMatchHandler, rejectMatchHandler, startMatchHandler, quitMatchHandler } from '../handlers/matchHandlers.js'
import * as matchSchemas from '../schemas/matchSchemas.js'

async function matchRoutes(fastify, options) {
   fastify.post('/match', { schema: matchSchemas.create }, createMatchHandler);
   fastify.get('/match/:matchId', { schema: matchSchemas.idOnly}, getMatchHandler);
   fastify.get('/match/:matchId/state', { schema: matchSchemas.idOnly }, getMatchStateHandler);
   fastify.post('/match/:matchId/accept', { schema: matchSchemas.accept }, acceptMatchHandler);
   fastify.post('/match/:matchId/reject', { schema: matchSchemas.reject }, rejectMatchHandler);
   fastify.post('/match/:matchId/start', { schema: matchSchemas.start }, startMatchHandler);
   fastify.post('/match/:matchId/quit', { schema: matchSchemas.quit }, quitMatchHandler);

   fastify.log.info('Match routes registered');

}

export default matchRoutes;