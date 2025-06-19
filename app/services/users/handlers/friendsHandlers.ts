import { FastifyRequest, FastifyReply } from 'fastify';
import * as friendService from '../services/friendService.js';
import { JWTPayload } from '../shared/schemas/usersSchemas.js';

export async function sendFriendRequestHandler(req: FastifyRequest, reply: FastifyReply) {
	const requesterId = (req.user as JWTPayload).id;
	const { friendId } = req.body as { friendId: number };
	req.log.info({ requesterId, friendId }, 'Attempting to send friend request');
	const newFriendship = await friendService.sendFriendRequest(requesterId, friendId);
	return reply.code(201).send({
		message: 'Friend request sent successfully.',
		friendship: newFriendship
	});
}

export async function getReceivedRequestsHandler(req: FastifyRequest, reply: FastifyReply) {
	const userId = (req.user as JWTPayload).id;
	req.log.info({ userId }, 'Fetching received friend requests');
	const requests = await friendService.getReceivedFriendRequests(userId);
	return reply.send(requests);
}

export async function getSentRequestsHandler(req: FastifyRequest, reply: FastifyReply) {
	const userId = (req.user as JWTPayload).id;
	req.log.info({ userId }, 'Fetching sent friend requests');
	const requests = await friendService.getSentFriendRequests(userId);
	return reply.send(requests);
}

export async function acceptFriendRequestHandler(req: FastifyRequest, reply: FastifyReply) {
	const currentUserId = (req.user as JWTPayload).id;
	const friendshipId = parseInt((req.params as any).friendshipId, 10);
	req.log.info({ currentUserId, friendshipId }, 'Attempting to accept friend request');
	const result = await friendService.acceptFriendRequest(friendshipId, currentUserId);
	return reply.send(result);
}

export async function declineFriendRequestHandler(req: FastifyRequest, reply: FastifyReply) {
	const currentUserId = (req.user as JWTPayload).id;
	const friendshipId = parseInt((req.params as any).friendshipId, 10);
	req.log.info({ currentUserId, friendshipId }, 'Attempting to decline friend request');
	const result = await friendService.declineOrCancelFriendRequest(friendshipId, currentUserId);
	return reply.send(result);
}

export async function cancelFriendRequestHandler(req: FastifyRequest, reply: FastifyReply) {
	const currentUserId = (req.user as JWTPayload).id;
	const friendshipId = parseInt((req.params as any).friendshipId, 10);
	req.log.info({ currentUserId, friendshipId }, 'Attempting to cancel friend request');
	const result = await friendService.declineOrCancelFriendRequest(friendshipId, currentUserId);
	return reply.send(result);
}

export async function getMyFriendsHandler(req: FastifyRequest, reply: FastifyReply) {
	const userId = (req.user as JWTPayload).id;
	req.log.info({ userId }, 'Fetching user friends list');
	const friends = await friendService.getFriends(userId);
	return reply.send(friends);
}

export async function removeFriendshipHandler( req: FastifyRequest, reply: FastifyReply ) {
	const currentUserId = (req.user as JWTPayload).id;
	const friendshipId = parseInt((req.params as any).friendshipId, 10);
	req.log.info({ currentUserId, friendshipId }, 'Attempting to remove friendship');
	const result = await friendService.removeFriendship(friendshipId, currentUserId);
	return reply.send(result);
}

export async function blockUserHandler(req: FastifyRequest, reply: FastifyReply) {
	const blockerId = req.user.id;
	const userIdToBlock = parseInt((req.params as any).friendshipId, 10);
	req.log.info({ blockerId, userIdToBlock }, 'Attempting to block user');
	const result = await friendService.blockUser(blockerId, userIdToBlock);
	return reply.send(result);
}

export async function unblockUserHandler(req: FastifyRequest, reply: FastifyReply) {
	const unblockerId = req.user.id;
	const userIdToUnblock = parseInt((req.params as any).friendshipId, 10);
	req.log.info({ unblockerId, userIdToUnblock }, 'Attempting to unblock user');
	const result = await friendService.unblockUser(unblockerId, userIdToUnblock);
	return reply.send(result);
}

export async function getAllFriendshipsHandler(req: FastifyRequest, reply: FastifyReply) {
	req.log.info('Admin fetching all friendships');
	const friendships = await friendService.getAllFriendships();
	return reply.send(friendships);
}