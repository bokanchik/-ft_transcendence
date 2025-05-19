import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
	acceptFriendRequestHandler,
	declineFriendRequestHandler,
	getReceivedRequestsHandler,
	getSentRequestsHandler,
	sendFriendRequestHandler,
	cancelFriendRequestHandler,
	getMyFriendsHandler,
	removeFriendshipHandler,
} from "../handlers/friendsHandlers.js";
import {
	sendFriendRequestSchema,
	friendshipIdParamSchema,
} from "../schemas/friendsSchemas.js";

type FriendshipIdRoute = {
	Params: { friendshipId: string }
};

export default async function friendRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.post(
		'/requests',
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: sendFriendRequestSchema
		},
		sendFriendRequestHandler
	);
	fastify.get(
		'/requests/received',
		{ onRequest: [fastify.authenticate] },
		getReceivedRequestsHandler
	);
	fastify.get(
		'/requests/sent',
		{ onRequest: [fastify.authenticate] },
		getSentRequestsHandler
	);
	fastify.post(
		'/requests/:friendshipId/accept',
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: friendshipIdParamSchema
		},
		acceptFriendRequestHandler
	);
	fastify.post(
		'/requests/:friendshipId/decline',
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: friendshipIdParamSchema
		},
		declineFriendRequestHandler
	);
	fastify.post(
		'/requests/:friendshipId/cancel',
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: friendshipIdParamSchema
		},
		cancelFriendRequestHandler
	);
	fastify.get(
		'/friends',
		{ onRequest: [fastify.authenticate] },
		getMyFriendsHandler
	);
	fastify.post(
//	fastify.post<FriendshipIdRoute>(
		'/:friendshipId/remove',
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: friendshipIdParamSchema
		},
		removeFriendshipHandler
	);
};
