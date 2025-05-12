//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createMatchHandler, getMatchStateHandler,
   acceptMatchHandler, rejectMatchHandler, startMatchHandler, quitMatchHandler } from '../handlers/matchHandlers.ts'
import { createMatchSchema } from '../middleware/matchSchemas.ts';

async function matchRemoteRoutes(fastify: FastifyInstance, options: any) {
   fastify.post('/', {  
      // local --> no need for JWT verification, remote --> authenticate
      preHandler: async (req, reply) => {
         // sanitaze incoming data with zod (--> middleware)
         const reqValidation = createMatchSchema.safeParse(req.body);
         if (!reqValidation.success) {
            return reply.code(400).send({ errors: reqValidation.error.errors});
        }

        const { isLocal } = reqValidation.data;
        if (!isLocal) {
         await fastify.authenticate(req, reply);
        }

        req.validatedBody = reqValidation.data;
      },
      handler: createMatchHandler,
   }); // button Start
   
   // fastify.get('/match/:matchId', { schema: matchSchemas.idOnly}, getMatchIdHandler);
   // fastify.get('/match/:matchId/state', { schema: matchSchemas.idOnly }, getMatchStateHandler);
   // fastify.post('/match/:matchId/accept', { schema: matchSchemas.accept }, acceptMatchHandler);
   // fastify.post('/match/:matchId/reject', { schema: matchSchemas.reject }, rejectMatchHandler);
   // fastify.post('/match/:matchId/start', { schema: matchSchemas.start }, startMatchHandler);
   // fastify.post('/match/:matchId/quit', { schema: matchSchemas.quit }, quitMatchHandler);

   fastify.log.info('Remote Match routes registered');

}

export default matchRemoteRoutes;