//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createLocalMatchHandler, getMatchIdHandler, getMatchByUserHandler, cancelLocalMatchHandler, getLocalMatchState, createInternalMatchHandler, startOnlineMatchHandler, declareMatchForfeitHandler } from '../handlers/matchHandlers.ts'
import { createLocalMatchBody, createLocalMatchRouteSchema, GetMatchIdRouteSchema, GetMatchByUserIdRouteSchema, cancelLocalMatchRouteSchema, cancelLocalMatchBody, getLocalMatchStateRouteSchema } from '../shared/schemas/matchesSchemas.ts';

function matchRoutes(fastify: FastifyInstance, _options: unknown, done: () => void) {

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
      schema: createLocalMatchRouteSchema,
      handler: createLocalMatchHandler,
   
   });

   fastify.post('/match/local/cancel', {
      preHandler: async (req, reply) => {
         const reqValidation = cancelLocalMatchBody.safeParse(req.body);
         if (!reqValidation.success) {
            req.log.error('Validation failed:', reqValidation.error.errors); // for debbuging
            return reply.code(400).send({
               message: 'Invalid request body',
               errors: reqValidation.error.errors
            });
         }
         req.validatedBody = reqValidation.data;
      },
      schema: cancelLocalMatchRouteSchema,
      handler: cancelLocalMatchHandler
   });

   fastify.get('/match/local/state/:matchId', {
       schema: getLocalMatchStateRouteSchema,
       handler: getLocalMatchState
   });

   fastify.get('/match/remote/:matchId', {
     onRequest: [fastify.authenticate],
      schema: GetMatchIdRouteSchema,
      handler: getMatchIdHandler,
   });

   fastify.get('/history/:userId', {
      onRequest: [fastify.authenticate],
      schema: GetMatchByUserIdRouteSchema,
      handler: getMatchByUserHandler
   });
   fastify.post('/match/internal/create', {
      onRequest: [fastify.authenticateService],
      handler: createInternalMatchHandler
   });
   fastify.post('/match/internal/start', {
      onRequest: [fastify.authenticateService],
      handler: startOnlineMatchHandler
   });
   fastify.post('/match/intenal/forfeit', {
      onRequest: [fastify.authenticateService],
      handler: declareMatchForfeitHandler
   });

   done();
}


export default matchRoutes;
