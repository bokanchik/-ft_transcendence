// handlers/friendsHandlers.js
import * as friendService from '../services/friendService.js';
import { AppError } from '../utils/appError.js'; // Si vous utilisez une classe d'erreur personnalisée
import { ERROR_MESSAGES } from '../utils/appError.js';

/**
 * Handler pour envoyer une demande d'amitié.
 */
export async function sendFriendRequestHandler(req, reply) {
	const requesterId = req.user.id;
	const { receiverUsername } = req.body;

	req.log.info({ requesterId, receiverUsername }, 'Attempting to send friend request');
	const newFriendship = await friendService.sendFriendRequest(requesterId, receiverUsername);
	return reply.code(201).send({
		message: 'Friend request sent successfully.',
		friendship: newFriendship // Renvoyer les détails de l'amitié créée
	});
}

/**
 * Handler pour récupérer les demandes d'amitié reçues.
 */
export async function getReceivedRequestsHandler(req, reply) {
	const userId = req.user.id;
	req.log.info({ userId }, 'Fetching received friend requests');
	const requests = await friendService.getReceivedFriendRequests(userId);
	return reply.send(requests);
}

/**
 * Handler pour récupérer les demandes d'amitié envoyées.
 */
export async function getSentRequestsHandler(req, reply) {
	const userId = req.user.id;
	req.log.info({ userId }, 'Fetching sent friend requests');
	const requests = await friendService.getSentFriendRequests(userId);
	return reply.send(requests);
}

/**
 * Handler pour accepter une demande d'amitié.
 */
export async function acceptFriendRequestHandler(req, reply) {
	const currentUserId = req.user.id;
	const friendshipId = parseInt(req.params.friendshipId, 10); // Assurer que c'est un nombre

	if (isNaN(friendshipId)) {
		throw new AppError(ERROR_MESSAGES.INVALID_FRIENDSHIP_ID, 400); // Ou utilisez la validation de schéma Fastify
	}

	req.log.info({ currentUserId, friendshipId }, 'Attempting to accept friend request');
	const result = await friendService.acceptFriendRequest(friendshipId, currentUserId);
	return reply.send(result); // Ex: { message: 'Friend request accepted.' }
}

/**
 * Handler pour refuser une demande d'amitié.
 */
export async function declineFriendRequestHandler(req, reply) {
	const currentUserId = req.user.id;
	const friendshipId = parseInt(req.params.friendshipId, 10);

	if (isNaN(friendshipId)) {
		throw new AppError('Invalid friendship ID format.', 400);
	}

	req.log.info({ currentUserId, friendshipId }, 'Attempting to decline friend request');
	// declineOrCancelFriendRequest gère à la fois le refus et l'annulation
	const result = await friendService.declineOrCancelFriendRequest(friendshipId, currentUserId);
	return reply.send(result);
}

/**
 * Handler pour annuler une demande d'amitié envoyée.
 */
export async function cancelFriendRequestHandler(req, reply) {
	const currentUserId = req.user.id;
	const friendshipId = parseInt(req.params.friendshipId, 10);

	if (isNaN(friendshipId)) {
		throw new AppError('Invalid friendship ID format.', 400);
	}

	req.log.info({ currentUserId, friendshipId }, 'Attempting to cancel friend request');
	// declineOrCancelFriendRequest gère à la fois le refus et l'annulation
	const result = await friendService.declineOrCancelFriendRequest(friendshipId, currentUserId);
	return reply.send(result);
}

/**
 * Handler pour récupérer la liste d'amis de l'utilisateur connecté.
 */
export async function getMyFriendsHandler(req, reply) {
	const userId = req.user.id;
	req.log.info({ userId }, 'Fetching user friends list');
	const friends = await friendService.getFriends(userId);
	return reply.send(friends);
}

/**
 * Handler pour bloquer un utilisateur (exemple).
 * Vous aurez besoin d'une route pour cela, ex: POST /api/users/friends/block/:userIdToBlock
 */
export async function blockUserHandler(req, reply) {
	const blockerId = req.user.id;
	const userIdToBlock = parseInt(req.params.userIdToBlock, 10);

	if (isNaN(userIdToBlock)) {
		throw new AppError('Invalid user ID to block.', 400);
	}
	req.log.info({ blockerId, userIdToBlock }, 'Attempting to block user');
	const result = await friendService.blockUser(blockerId, userIdToBlock);
	return reply.send(result);
}

/**
 * Handler pour débloquer un utilisateur (exemple).
 */
export async function unblockUserHandler(req, reply) {
	const unblockerId = req.user.id;
	const userIdToUnblock = parseInt(req.params.userIdToUnblock, 10);

	if (isNaN(userIdToUnblock)) {
		throw new AppError('Invalid user ID to unblock.', 400);
	}
	req.log.info({ unblockerId, userIdToUnblock }, 'Attempting to unblock user');
	const result = await friendService.unblockUser(unblockerId, userIdToUnblock);
	return reply.send(result);
}


// Handler pour l'admin pour voir toutes les relations (optionnel)
export async function getAllFriendshipsHandler(req, reply) {
	// Ajoutez une vérification de rôle admin ici si nécessaire
	// if (!req.user.isAdmin) { throw new AppError('Forbidden', 403); }
	req.log.info('Admin fetching all friendships');
	const friendships = await friendService.getAllFriendships();
	return reply.send(friendships);
}
