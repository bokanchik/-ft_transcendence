//import fastify from '../server.ts';
import type { FastifyInstance } from 'fastify';
import { createLocalMatchHandler, getMatchIdHandler, getMatchByUserHandler, cancelLocalMatchHandler, getLocalMatchState } from '../handlers/matchHandlers.ts'
import { createLocalMatchBody, createLocalMatchRouteSchema, GetMatchIdRouteSchema, GetMatchByUserIdRouteSchema, cancelLocalMatchRouteSchema, cancelLocalMatchBody, getLocalMatchStateRouteSchema } from '../shared/schemas/matchesSchemas.ts';

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
   // fastify.post('/match/internal/create', {
   //    // Cette route doit être protégée par une clé API, pas par un JWT utilisateur
   //    onRequest: [fastify.authenticateService], // Assurez-vous d'avoir un plugin pour ça !
   //    handler: async (req, reply) => {
   //       const { player1_id, player2_id, tournament_id, round_number } = req.body as any;
   //       const matchId = crypto.randomUUID();

   //       await addMatchToTournament(tournament_id, matchId, player1_id, player2_id, round_number);
         
   //       req.log.info(`Internal request: Created match ${matchId} for tournament ${tournament_id}`);
         
   //       return reply.code(201).send({ matchId });
   //    }
   // });
}


export default matchRoutes;
