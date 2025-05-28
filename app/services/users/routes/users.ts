import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
	getUsersHandler,
	getUserMeHandler,
	getUserInfoHandler,
	getUserMeMatchHandler,
	updateUserMeHandler,
} from '../handlers/userHandlers.js';
import { UpdateUserPayload } from '../shared/types.js';
import { config } from '../shared/env.js';
import { updateUserSchema, userIdParamSchema, userResponseSchema } from '../schemas/userSchemas.js';


export default async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

	fastify.get(
		config.URL_ALL_USERS,
		getUsersHandler
	);

	fastify.get(
		config.URL_USER_ME,
		{ onRequest: [fastify.authenticate] },
		getUserMeHandler
	);

	fastify.get<{ Params: { userId: string } }>(
		config.URL_USER,
		{
			onRequest: [fastify.authenticate],
			schema: {
				params: userIdParamSchema.params,
				response: {
					200: userResponseSchema
				}
			}
		},
		getUserInfoHandler
	);

	fastify.patch<{ Body: UpdateUserPayload }>(
		config.URL_USER_ME,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: updateUserSchema
		},
		updateUserMeHandler
	);

	fastify.get(
		config.URL_USER_MATCH,
		{ onRequest: [fastify.authenticate] },
		getUserMeMatchHandler
	);
}


// import { FastifyInstance, FastifyPluginOptions } from 'fastify';
// import {
//     getUsersHandler,
//     getUserMeHandler,
//     getUserInfoHandler,
//     getUserMeMatchHandler,
//     updateUserMeHandler,
// } from '../handlers/userHandlers.js';
// // Importez vos NOUVEAUX schémas Zod
// import {
//     updateUserSchema, // Contient updateUserBodySchema
//     userIdParamSchema, // Contient userIdParamsSchema
//     userResponseSchemaZod, // Directement le schéma Zod pour la réponse
// } from '../schemas/userSchemas.js';
// import { config } from '../shared/env.js'; // Vérifiez le chemin

// export default async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

//     fastify.get(
//         config.URL_ALL_USERS,
//         // Pour la réponse, si c'est un tableau d'utilisateurs:
//         // { schema: { response: { 200: z.array(userResponseSchemaZod) } } }, // Nécessite d'importer z de zod
//         getUsersHandler
//     );

//     fastify.get(
//         config.URL_USER_ME,
//         {
//             onRequest: [fastify.authenticate],
//             schema: {
//                 response: {
//                     200: userResponseSchemaZod // Utilisez le schéma Zod directement
//                 }
//             }
//         },
//         getUserMeHandler
//     );

//     // Notez que UpdateUserPayload sera maintenant inféré grâce à ZodTypeProvider
//     // plus besoin de le typer explicitement ici si le schéma est bien défini.
//     fastify.patch(
//         config.URL_USER, // Supposons que c'est pour /me, donc pas de :userId
//         {
//             onRequest: [fastify.authenticate, fastify.csrfProtection],
//             schema: { // updateUserSchema contient { body: updateUserBodySchema }
//                 ...updateUserSchema,
//                 response: { // Définir aussi le schéma de réponse pour la mise à jour
//                     200: z.object({ // Importez z de zod si besoin
//                         message: z.string(),
//                         user: userResponseSchemaZod
//                     })
//                 }
//             }
//         },
//         updateUserMeHandler // req.body sera typé comme UpdateUserPayloadZod
//     );


//     fastify.get(
//         `${config.URL_USER}/:userId`, // Changement pour refléter l'URL_USER et le paramètre
//         {
//             onRequest: [fastify.authenticate],
//             schema: {
//                 ...userIdParamSchema, // Contient { params: userIdParamsSchema }
//                 response: {
//                     200: userResponseSchemaZod, // Schéma Zod direct
//                     404: z.object({ error: z.string() })
//                 }
//             }
//         },
//         getUserInfoHandler // req.params sera typé comme { userId: number } grâce à la transformation
//     );


//     fastify.get(
//         config.URL_USER_MATCH,
//         { onRequest: [fastify.authenticate] },
//         // Ajoutez un schéma de réponse pour les matchs si vous en avez un
//         getUserMeMatchHandler
//     );
// }