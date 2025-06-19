import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { SendFriendRequestRouteSchema, FriendshipActionRouteSchema, GetFriendsListRouteSchema, GetPendingRequestsRouteSchema } from "../shared/schemas/friendsSchemas.js";
import { config } from "../shared/env.js";
import {
	acceptFriendRequestHandler,
	cancelFriendRequestHandler,
	removeFriendshipHandler,
	declineFriendRequestHandler,
	// friendshipActionHandler,
	// FriendshipActionRequest,
	getReceivedRequestsHandler,
	getSentRequestsHandler,
	sendFriendRequestHandler,
	getMyFriendsHandler,
} from "../handlers/friendsHandlers.js";

export default async function friendRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.post(
		config.URL_FRIEND_REQUEST,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: SendFriendRequestRouteSchema
		},
		sendFriendRequestHandler
	);
	fastify.get(
		config.URL_FRIEND_RECEIVED,
		{
			onRequest: [fastify.authenticate],
			schema: GetPendingRequestsRouteSchema
		},
		getReceivedRequestsHandler
	);
	fastify.get(
		config.URL_FRIEND_SENT,
		{
			onRequest: [fastify.authenticate],
			schema: GetPendingRequestsRouteSchema
		},
		getSentRequestsHandler
	);
	fastify.post(
		config.URL_FRIEND_ACCEPT,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		acceptFriendRequestHandler
		// (req, reply) => friendshipActionHandler(req, reply, 'accept')
	);
	fastify.post(
		config.URL_FRIEND_DECLINE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		declineFriendRequestHandler
		// (req, reply) => friendshipActionHandler(req, reply, 'decline')
	);
	fastify.post(
		config.URL_FRIEND_CANCEL,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		cancelFriendRequestHandler
		// (req, reply) => friendshipActionHandler(req, reply, 'cancel')
	);
	fastify.get(
		config.URL_FRIEND_LIST,
		{
			onRequest: [fastify.authenticate],
			schema: GetFriendsListRouteSchema
		},
		getMyFriendsHandler
	);
	fastify.post(
		config.URL_FRIEND_REMOVE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		removeFriendshipHandler
		// (req, reply) => friendshipActionHandler(req, reply, 'remove')
	);
};
