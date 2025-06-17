//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createLocalMatchHandler, getMatchIdHandler, getMatchByUserHandler } from '../handlers/matchHandlers.ts'
//import { createLocalMatchBody, GetMatchIdRouteSchema, GetMatchByUserIdRouteSchema, InviteFriendRouteSchema } from '../shared/schemas/matchesSchemas.ts';
import { createLocalMatchBody, GetMatchIdRouteSchema, GetMatchByUserIdRouteSchema } from '../middleware/matchesSchemas.ts';

function matchRoutes(fastify: FastifyInstance, _options: unknown) {

   fastify.post('/match/local', {  
      preHandler: async (req, reply) => {
         const reqValidation = createLocalMatchBody.safeParse(req.body);
         if (!reqValidation.success) {
            req.log.error('Validation failed:', reqValidation.error.errors); // for debugging
            return reply.code(400).send({
               message: 'Invalid request body',
               errors: reqValidation.error.errors
            });
         }
        req.validatedBody = reqValidation.data;
      },
      handler: createLocalMatchHandler,
   
   });

   fastify.get('/match/:matchId', {
     onRequest: [fastify.authenticate],
      schema: GetMatchIdRouteSchema,
      handler: getMatchIdHandler,
   });

   fastify.get('/history/:userId', {
      onRequest: [fastify.authenticate],
      schema: GetMatchByUserIdRouteSchema,
      handler: getMatchByUserHandler
   });
   
   
   fastify.log.info('Match routes registered');
   
}


export default matchRoutes;
