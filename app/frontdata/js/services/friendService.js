import { fetchWithCsrf } from './csrf.js';
import { GetPendingRequestsRouteSchema, GetFriendsListRouteSchema, FriendshipActionRouteSchema, } from '../shared/schemas/friendsSchemas.js';
import { config } from '../utils/config.js';
import { handleApiResponse } from './responseService.js';
/**
 * Retrieves the friend requests received by the logged-in user.
 * @returns A list of pending friend requests.
 */
export async function getReceivedFriendRequests() {
    const url = config.api.friends.receivedRequests;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response, GetPendingRequestsRouteSchema.response);
}
/**
 * Retrieves the list of friends of the logged-in user.
 * @returns A list of friends.
 */
export async function getFriendsList() {
    const url = config.api.friends.list;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response, GetFriendsListRouteSchema.response);
}
/**
 * Retrieves the friend requests sent by the logged-in user.
 * @returns A list of sent friend requests.
 */
export async function getSentFriendRequests() {
    const url = config.api.friends.sentRequests;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    return handleApiResponse(response, GetPendingRequestsRouteSchema.response);
}
/**
 * Accepts a friend request.
 * @param friendshipId The ID of the friendship (obtained from a received request).
 * @returns A message indicating the result of the operation.
 */
export async function acceptFriendRequest(friendshipId) {
    const url = config.api.friends.acceptRequest(friendshipId);
    const response = await fetchWithCsrf(url, {
        method: 'POST',
    });
    return handleApiResponse(response, FriendshipActionRouteSchema.response);
}
/**
 * Declines a received friend request.
 * @param friendshipId The ID of the friendship.
 * @returns A message indicating the result of the operation.
 */
export async function declineFriendRequest(friendshipId) {
    const url = config.api.friends.declineRequest(friendshipId);
    const response = await fetchWithCsrf(url, {
        method: 'POST',
    });
    return handleApiResponse(response, FriendshipActionRouteSchema.response);
}
/**
 * Cancels a sent friend request.
 * @param friendshipId The ID of the friendship.
 * @returns A message indicating the result of the operation.
 */
export async function cancelFriendRequest(friendshipId) {
    const url = config.api.friends.cancelRequest(friendshipId);
    const response = await fetchWithCsrf(url, {
        method: 'POST',
    });
    return handleApiResponse(response, FriendshipActionRouteSchema.response);
}
/**
 * Sends a friend request to another user.
 * @param friendId The ID of the friend to be added.
 * @returns A message indicating the result of the operation.
 */
export async function sendFriendRequest(friendId) {
    const url = config.api.friends.sendRequest;
    const response = await fetchWithCsrf(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
    });
    return handleApiResponse(response, FriendshipActionRouteSchema.response);
}
/**
 * Removes a friend by friendshipId.
 * @param friendshipId The ID of the friendship to remove.
 * @returns A message indicating the result of the operation.
 */
export async function removeFriend(friendshipId) {
    const url = config.api.friends.remove(friendshipId);
    const response = await fetchWithCsrf(url, {
        method: 'POST',
    });
    return handleApiResponse(response, FriendshipActionRouteSchema.response);
}
