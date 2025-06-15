//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createMatchHandler, getMatchIdHandler, getMatchByUserHandler, inviteFriendHandler } from '../handlers/matchHandlers.ts'
//import { createLocalMatchBody, GetMatchIdRouteSchema, GetMatchByUserIdRouteSchema, InviteFriendRouteSchema } from '../shared/schemas/matchesSchemas.ts';
import { createLocalMatchBody, GetMatchIdRouteSchema, GetMatchByUserIdRouteSchema, InviteFriendRouteSchema } from '../middleware/matchesSchemas.ts';

function matchRoutes(fastify: FastifyInstance, _options: unknown) {

   fastify.post('/match/', {  
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
      handler: createMatchHandler,
   
   });

   fastify.post('/match/invites',
      {
         preHandler: [fastify.authenticate, fastify.csrfProtection],
         schema: InviteFriendRouteSchema
      },
      inviteFriendHandler
   );

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

// fastify.get('/match/:matchId/state', { schema: matchSchemas.idOnly }, getMatchStateHandler);
// fastify.post('/match/:matchId/accept', { schema: matchSchemas.accept }, acceptMatchHandler);
// fastify.post('/match/:matchId/reject', { schema: matchSchemas.reject }, rejectMatchHandler);
// fastify.post('/match/:matchId/start', { schema: matchSchemas.start }, startMatchHandler);
// fastify.post('/match/:matchId/quit', { schema: matchSchemas.quit }, quitMatchHandler);

export default matchRoutes;
