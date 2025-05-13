import {
	acceptFriendRequestHandler,
	declineFriendRequestHandler,
	getReceivedRequestsHandler,
	getSentRequestsHandler,
	sendFriendRequestHandler,
	cancelFriendRequestHandler,
	getMyFriendsHandler,
} from "../handlers/friendsHandlers.js";
import { sendFriendRequestSchema, friendshipIdParamSchema } from "../schemas/friendsSchemas.js";

export default async function friendRoutes(fastify, options) {
	fastify.post(
		'/requests',
		{ onRequest: [fastify.authenticate], schema: sendFriendRequestSchema },
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
		{ onRequest: [fastify.authenticate], schema: friendshipIdParamSchema },
		acceptFriendRequestHandler
	)
	fastify.post(
		'/requests/:friendshipId/decline',
		{ onRequest: [fastify.authenticate], schema: friendshipIdParamSchema },
		declineFriendRequestHandler
	);
	fastify.post(
		'/requests/:friendshipId/cancel',
		{ onRequest: [fastify.authenticate], schema: friendshipIdParamSchema },
		cancelFriendRequestHandler
	);
	fastify.get(
		'/friends',
		{ onRequest: [fastify.authenticate] },
		getMyFriendsHandler
	);
};
