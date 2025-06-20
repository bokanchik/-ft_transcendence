import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { SendFriendRequestRouteSchema, FriendshipActionRouteSchema, GetFriendsListRouteSchema, GetPendingRequestsRouteSchema } from "../shared/schemas/friendsSchemas.js";
import { config } from "../shared/env.js";
import * as fh from "../handlers/friendsHandlers.js";

export default async function friendRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.post(
		config.URL_FRIEND_REQUEST,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: SendFriendRequestRouteSchema,
			handler: fh.sendFriendRequestHandler
		},
	);
	fastify.get(
		config.URL_FRIEND_RECEIVED,
		{
			onRequest: [fastify.authenticate],
			schema: GetPendingRequestsRouteSchema,
			handler: fh.getReceivedRequestsHandler
		},
	);
	fastify.get(
		config.URL_FRIEND_SENT,
		{
			onRequest: [fastify.authenticate],
			schema: GetPendingRequestsRouteSchema,
			handler: fh.getSentRequestsHandler
		},
	);
	fastify.post(
		config.URL_FRIEND_ACCEPT,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema,
			handler: fh.acceptFriendRequestHandler
		},
	);
	fastify.post(
		config.URL_FRIEND_DECLINE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema,
			handler: fh.declineFriendRequestHandler
		},
	);
	fastify.post(
		config.URL_FRIEND_CANCEL,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema,
			handler: fh.cancelFriendRequestHandler
		},
	);
	fastify.get(
		config.URL_FRIEND_LIST,
		{
			onRequest: [fastify.authenticate],
			schema: GetFriendsListRouteSchema,
			handler: fh.getMyFriendsHandler
		},
	);
	fastify.post(
		config.URL_FRIEND_REMOVE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema,
			handler: fh.removeFriendshipHandler
		},
	);
	fastify.post(
		config.URL_FRIEND_BLOCK,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema,
			handler: fh.blockUserHandler
		},
	);
	fastify.post(
		config.URL_FRIEND_UNBLOCK,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema,
			handler: fh.unblockUserHandler
		},
	);
	// fastify.get(
	// 	config.URL_FRIEND_BLOCKED,
	// 	{
	// 		onRequest: [fastify.authenticate],
	// 		schema: GetBlockedUsersRouteSchema,
	// 		handler: getBlockedUsersHandler
	// 	},
	// );
};
