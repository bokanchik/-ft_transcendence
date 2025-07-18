// services/friendService.js
import * as friendModel from '../models/friendModel.js';
import * as userModel from '../models/userModel.js';
import { ERROR_KEYS, AppError, ConflictError, NotFoundError, ValidationError, ForbiddenError } from '../utils/appError.js';
import { Friend, PendingFriendRequest, Friendship, FriendshipStatus } from '../shared/schemas/friendsSchemas.js';

/**
 * Creates a friend request.
 * @param {number} requesterId - ID of the user sending the request.
 * @param {number} receiverId - Username of the user receiving the request.
 * @throws {ValidationError} If required parameters are missing or invalid.
 * @throws {NotFoundError} If the receiver does not exist.
 * @throws {ConflictError} If a friendship or request already exists.
 * @returns {Promise<Friendship>} The created friendship request.
 */
export async function sendFriendRequest(requesterId: number, receiverId: number): Promise<Friendship> {
	if (requesterId === undefined || receiverId === undefined) {
		throw new ValidationError('Requester ID and receiver username are required.');
	}

	const receiver = await userModel.getUserByIdFromDb(receiverId);
	if (!receiver) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}

	if (requesterId === receiverId) {
		throw new ValidationError("You cannot send a friend request to yourself.");
	}

	const [id1, id2] = requesterId < receiverId ? [requesterId, receiverId] : [receiverId, requesterId];
	const existingFriendship = await friendModel.getFriendshipByUsersInDb(id1, id2);

	if (existingFriendship) {
		if (existingFriendship.status === 'accepted') {
			throw new ConflictError('You are already friends with this user.');
		} else if (existingFriendship.status === 'pending') {
			if (existingFriendship.initiator_id === requesterId) {
				throw new ConflictError('A friend request to this user is already pending from you.');
			} else {
				throw new ConflictError('This user has already sent you a friend request. Please respond to it.');
			}
		} else if (existingFriendship.status === 'declined' || existingFriendship.status === 'blocked') {
			throw new ConflictError(`A previous interaction (${existingFriendship.status}) exists with this user.`);
		}
	}
	return friendModel.createFriendshipRequestInDb(id1, id2, requesterId);
}

/**
 * Accepts a friend request.
 * @param {number} friendshipId - ID of the friendship request.
 * @param {number} currentUserId - ID of the user accepting the request.
 * @throws {NotFoundError} If the friendship request does not exist.
 * @throws {ConflictError} If the request is not pending.
 * @throws {ForbiddenError} If the user is not authorized to accept the request.
 * @returns {Promise<{ message: string }>} A success message.
 */
export async function acceptFriendRequest(friendshipId: number, currentUserId: number): Promise<{ message: string }> {
	const friendship = await friendModel.getFriendshipByIdInDb(friendshipId);

	if (!friendship) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	if (friendship.status !== FriendshipStatus.PENDING) {
		throw new ConflictError(`This friend request is already '${friendship.status}'.`);
	}
	if (friendship.initiator_id === currentUserId) {
		throw new ForbiddenError("You cannot accept a friend request you initiated.");
	}
	if (friendship.user1_id !== currentUserId && friendship.user2_id !== currentUserId) {
		throw new ForbiddenError("You are not part of this friendship request.");
	}

	const result = await friendModel.updateFriendshipStatusInDb(friendshipId, FriendshipStatus.ACCEPTED);
	if (result.changes === 0) {
		throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500, { detail: 'Accept friend request DB write failed.' });
	}
	return { message: 'friend.requestAccepted' };
}

/**
 * Declines or cancels a friend request, or removes an existing friendship.
 * @param {number} friendshipId - ID of the friendship.
 * @param {number} currentUserId - ID of the user performing the action.
 * @throws {NotFoundError} If the friendship does not exist.
 * @throws {ForbiddenError} If the user is not part of the friendship.
 * @returns {Promise<Object>} A success message.
 */
export async function declineOrCancelFriendRequest(friendshipId: number, currentUserId: number): Promise<{ message: string }> {
	const friendship = await friendModel.getFriendshipByIdInDb(friendshipId);

	if (!friendship) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	if (friendship.user1_id !== currentUserId && friendship.user2_id !== currentUserId) {
		throw new ForbiddenError("You are not part of this friendship.");
	}

	let actionMessage = '';
	if (friendship.status === 'pending') {
		if (friendship.initiator_id === currentUserId) {
			actionMessage = 'friend.requestCanceled';
		} else {
			actionMessage = 'friend.requestDeclined';
		}
		await friendModel.deleteFriendshipInDb(friendshipId);
	} else if (friendship.status === 'accepted') {
		await friendModel.deleteFriendshipInDb(friendshipId);
		actionMessage = 'friend.requestRemoved';
	} else {
		await friendModel.deleteFriendshipInDb(friendshipId);
		actionMessage = `Friendship with status '${friendship.status}' removed.`;
	}
	return { message: actionMessage };
}

/**
 * Retrieves the list of accepted friends for a user.
 * @param {number} userId - ID of the user.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<Friend[]>} List of friends.
 */
export async function getFriends(userId: number): Promise<Friend[]> {
	const user = await userModel.getUserByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	return friendModel.getAcceptedFriendsForUserInDb(userId);
}

/**
 * Retrieves pending friend requests received by a user.
 * @param {number} userId - ID of the user.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<PendingFriendRequest[]>} List of received friend requests.
 */
export async function getReceivedFriendRequests(userId: number): Promise<PendingFriendRequest[]> {
	const user = await userModel.getUserByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	return friendModel.getPendingReceivedFriendRequestsInDb(userId);
}

/**
 * Retrieves pending friend requests sent by a user.
 * @param {number} userId - ID of the user.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<PendingFriendRequest[]>} List of sent friend requests.
 */
export async function getSentFriendRequests(userId: number): Promise<PendingFriendRequest[]> {
	const user = await userModel.getUserByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	return friendModel.getPendingSentFriendRequestsInDb(userId);
}

export async function removeFriendship(friendshipId: number, currentUserId: number): Promise<{ message: string }> {

	const friendship = await friendModel.getFriendshipByIdInDb(friendshipId);
	console.log('[removeFriendship] Called with friendshipId:', friendshipId, 'currentUserId:', currentUserId);
	console.log('[removeFriendship] DB result for friendship:', friendship);

	if (!friendship) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	if (friendship.user1_id !== currentUserId && friendship.user2_id !== currentUserId) {
		throw new ForbiddenError("You are not part of this friendship.");
	}
	if (friendship.status !== 'accepted') {
		throw new ConflictError('You can only remove an accepted friend.');
	}

	const result = await friendModel.deleteFriendshipInDb(friendshipId);
	if (result.changes === 0) {
		throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500, { detail: 'Remove friend DB write failed.' });
	}
	return { message: 'friend.requestRemoved' };
}

/**
 * Retrieves all friendships (admin only).
 * @returns {Promise<Friendship[]>} List of all friendships.
 */
export async function getAllFriendships(): Promise<Friendship[]> {
	return friendModel.getAllFriendshipsInDb();
}

/**
 * Blocks a user.
 * @param {number} blockerId - ID of the user blocking.
 * @param {number} blockedUserId - ID of the user to block.
 * @throws {ValidationError} If the blocker tries to block themselves.
 * @throws {NotFoundError} If the user to block does not exist.
 * @returns {Promise<{ message: string }>} A success message.
 */
export async function blockUser(blockerId: number, blockedUserId: number): Promise<{ message: string }> {
	if (blockerId === blockedUserId) {
		throw new ValidationError("You cannot block yourself.");
	}
	const userToBlock = await userModel.getUserByIdFromDb(blockedUserId);
	if (!userToBlock) {
		throw new NotFoundError("No active block found for this user or you cannot unblock.");
	}

	const [id1, id2] = blockerId < blockedUserId ? [blockerId, blockedUserId] : [blockedUserId, blockerId];
	let friendship = await friendModel.getFriendshipByUsersInDb(id1, id2);

	if (friendship) {
		await friendModel.updateFriendshipStatusInDb(friendship.id, FriendshipStatus.BLOCKED);
	} else {
		friendship = await friendModel.createFriendshipRequestInDb(id1, id2, blockerId);
		await friendModel.updateFriendshipStatusInDb(friendship.id, FriendshipStatus.BLOCKED);
	}
	return { message: `User ${userToBlock.username} has been blocked.` };
}

/**
 * Unblocks a user.
 * @param {number} unblockerId - ID of the user unblocking.
 * @param {number} unblockedUserId - ID of the user to unblock.
 * @throws {NotFoundError} If no active block exists.
 * @returns {Promise<{ message: string }>} A success message.
 */
export async function unblockUser(unblockerId: number, unblockedUserId: number): Promise<{ message: string }> {
	const [id1, id2] = unblockerId < unblockedUserId ? [unblockerId, unblockedUserId] : [unblockedUserId, unblockerId];
	const friendship = await friendModel.getFriendshipByUsersInDb(id1, id2);

	if (!friendship || friendship.status !== 'blocked') {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	await friendModel.deleteFriendshipInDb(friendship.id);
	return { message: "User has been unblocked. They can send/receive friend requests again." };
}
