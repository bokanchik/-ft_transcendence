import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { SendFriendRequestRouteSchema, FriendshipActionRouteSchema } from "../shared/schemas/friendsSchemas.js";
import { config } from "../shared/env.js";
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
		{ onRequest: [fastify.authenticate] },
		getReceivedRequestsHandler
	);
	fastify.get(
		config.URL_FRIEND_SENT,
		{ onRequest: [fastify.authenticate] },
		getSentRequestsHandler
	);
	fastify.post(
		config.URL_FRIEND_ACCEPT,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		acceptFriendRequestHandler
	);
	fastify.post(
		config.URL_FRIEND_DECLINE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		declineFriendRequestHandler
	);
	fastify.post(
		config.URL_FRIEND_CANCEL,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		cancelFriendRequestHandler
	);
	fastify.get(
		config.URL_FRIEND_LIST,
		{ onRequest: [fastify.authenticate] },
		getMyFriendsHandler
	);
	fastify.post(
		config.URL_FRIEND_REMOVE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: FriendshipActionRouteSchema
		},
		removeFriendshipHandler
	);
};
