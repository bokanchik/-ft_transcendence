// services/friendService.js
import * as friendModel from '../models/friendModel.js';
import * as userModel from '../models/userModel.js'; // Pour vérifier l'existence des utilisateurs
import { ConflictError, NotFoundError, ValidationError, ForbiddenError } from '../utils/appError.js';

/**
 * Crée une demande d'amitié.
 * @param {number} requesterId - ID de l'utilisateur qui fait la demande.
 * @param {number} receiverUsername - Username de l'utilisateur qui reçoit la demande.
 */
export async function sendFriendRequest(requesterId, receiverUsername) {
    if (requesterId === undefined || !receiverUsername) {
        throw new ValidationError('Requester ID and receiver username are required.');
    }

    const receiver = await userModel.getUserByUsernameFromDb(receiverUsername);
    if (!receiver) {
        throw new NotFoundError(`User with username '${receiverUsername}' not found.`);
    }
    const receiverId = receiver.id;

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
 * Accepte une demande d'amitié.
 * @param {number} friendshipId - ID de la relation d'amitié.
 * @param {number} currentUserId - ID de l'utilisateur qui accepte la demande (doit être le destinataire).
 */
export async function acceptFriendRequest(friendshipId, currentUserId) {
    const friendship = await friendModel.getFriendshipByIdInDb(friendshipId);

    if (!friendship) {
        throw new NotFoundError('Friend request not found.');
    }
    if (friendship.status !== 'pending') {
        throw new ConflictError(`This friend request is already '${friendship.status}'.`);
    }
    if (friendship.initiator_id === currentUserId) {
        throw new ForbiddenError("You cannot accept a friend request you initiated.");
    }
    if (friendship.user1_id !== currentUserId && friendship.user2_id !== currentUserId) {
        throw new ForbiddenError("You are not part of this friendship request.");
    }

    const result = await friendModel.updateFriendshipStatusInDb(friendshipId, 'accepted');
    if (result.changes === 0) {
        throw new Error('Failed to accept friend request, database reported no changes.');
    }
    return { message: 'Friend request accepted.' };
}

/**
 * Refuse ou annule une demande d'amitié (ou supprime une amitié existante).
 * @param {number} friendshipId - ID de la relation d'amitié.
 * @param {number} currentUserId - ID de l'utilisateur qui effectue l'action.
 */
export async function declineOrCancelFriendRequest(friendshipId, currentUserId) {
    const friendship = await friendModel.getFriendshipByIdInDb(friendshipId);

    if (!friendship) {
        throw new NotFoundError('Friendship or request not found.');
    }
    if (friendship.user1_id !== currentUserId && friendship.user2_id !== currentUserId) {
        throw new ForbiddenError("You are not part of this friendship.");
    }

    let actionMessage = '';
    if (friendship.status === 'pending') {
        if (friendship.initiator_id === currentUserId) {
            actionMessage = 'Friend request cancelled.';
        } else {
            actionMessage = 'Friend request declined.';
        }
        await friendModel.deleteFriendshipInDb(friendshipId);
    } else if (friendship.status === 'accepted') {
        await friendModel.deleteFriendshipInDb(friendshipId);
        actionMessage = 'Friend removed successfully.';
    } else {
        await friendModel.deleteFriendshipInDb(friendshipId);
        actionMessage = `Friendship with status '${friendship.status}' removed.`;
    }
    return { message: actionMessage };
}


/**
 * Récupère la liste des amis acceptés d'un utilisateur.
 * @param {number} userId
 */
export async function getFriends(userId) {
    const user = await userModel.getUserByIdFromDb(userId);
    if (!user) {
        throw new NotFoundError('User not found.');
    }
    return friendModel.getAcceptedFriendsForUserInDb(userId);
}

/**
 * Récupère les demandes d'amitié reçues et en attente pour un utilisateur.
 * @param {number} userId
 */
export async function getReceivedFriendRequests(userId) {
    const user = await userModel.getUserByIdFromDb(userId);
    if (!user) {
        throw new NotFoundError('User not found.');
    }
    return friendModel.getPendingReceivedFriendRequestsInDb(userId);
}

/**
 * Récupère les demandes d'amitié envoyées et en attente par un utilisateur.
 * @param {number} userId
 */
export async function getSentFriendRequests(userId) {
    const user = await userModel.getUserByIdFromDb(userId);
    if (!user) {
        throw new NotFoundError('User not found.');
    }
    return friendModel.getPendingSentFriendRequestsInDb(userId);
}

/**
 * Récupère toutes les relations d'amitié (admin).
 */
export async function getAllFriendships() {
    return friendModel.getAllFriendshipsInDb();
}

/**
 * Bloque un utilisateur.
 * Cela pourrait créer une relation avec status 'blocked' ou mettre à jour une existante.
 * @param {number} blockerId - ID de l'utilisateur qui bloque.
 * @param {number} blockedUserId - ID de l'utilisateur à bloquer.
 */
export async function blockUser(blockerId, blockedUserId) {
    if (blockerId === blockedUserId) {
        throw new ValidationError("You cannot block yourself.");
    }
    const userToBlock = await userModel.getUserByIdFromDb(blockedUserId);
    if (!userToBlock) {
        throw new NotFoundError("User to block not found.");
    }

    const [id1, id2] = blockerId < blockedUserId ? [blockerId, blockedUserId] : [blockedUserId, blockerId];
    let friendship = await friendModel.getFriendshipByUsersInDb(id1, id2);

    if (friendship) {
        await friendModel.updateFriendshipStatusInDb(friendship.id, 'blocked');
    } else {
        friendship = await friendModel.createFriendshipRequestInDb(id1, id2, blockerId);
        await friendModel.updateFriendshipStatusInDb(friendship.id, 'blocked');
    }
    return { message: `User ${userToBlock.username} has been blocked.` };
}

/**
 * Débloque un utilisateur.
 * @param {number} unblockerId - ID de l'utilisateur qui débloque.
 * @param {number} unblockedUserId - ID de l'utilisateur à débloquer.
 */
export async function unblockUser(unblockerId, unblockedUserId) {
    const [id1, id2] = unblockerId < unblockedUserId ? [unblockerId, unblockedUserId] : [unblockedUserId, unblockerId];
    const friendship = await friendModel.getFriendshipByUsersInDb(id1, id2);

    if (!friendship || friendship.status !== 'blocked') {
        throw new NotFoundError("No active block found for this user or you cannot unblock.");
    }
    await friendModel.deleteFriendshipInDb(friendship.id);
    return { message: "User has been unblocked. They can send/receive friend requests again." };
}
