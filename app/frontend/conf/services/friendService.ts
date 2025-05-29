import { fetchWithCsrf } from './csrf.js';
//@ts-ignore
import { Friend, PendingFriendRequest } from '../shared/types.js';
import { handleApiResponse } from './apiUtils.js';

/**
 * Retrieves the friend requests received by the logged-in user.
 * @returns A list of pending friend requests.
 */
export async function getReceivedFriendRequests(): Promise<PendingFriendRequest[]> {
	const response = await fetch('/api/users/friends/requests/received', {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
	});
	return handleApiResponse(response);
}

/**
 * Retrieves the list of friends of the logged-in user.
 * @returns A list of friends.
 */
export async function getFriendsList(): Promise<Friend[]> {
	const response = await fetch('/api/users/friends/friends', {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
	});
	return handleApiResponse(response);
}

/**
 * Retrieves the friend requests sent by the logged-in user.
 * @returns A list of sent friend requests.
 */
export async function getSentFriendRequests(): Promise<PendingFriendRequest[]> {
	const response = await fetch('/api/users/friends/requests/sent', {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
	});
	return handleApiResponse(response);
}

/**
 * Accepts a friend request.
 * @param friendshipId The ID of the friendship (obtained from a received request).
 * @returns A message indicating the result of the operation.
 */
export async function acceptFriendRequest(friendshipId: number): Promise<{ message: string }> {
	const response = await fetchWithCsrf(`/api/users/friends/requests/${friendshipId}/accept`, {
		method: 'POST',
	});
	return handleApiResponse(response);
}

/**
 * Declines a received friend request.
 * @param friendshipId The ID of the friendship.
 * @returns A message indicating the result of the operation.
 */
export async function declineFriendRequest(friendshipId: number): Promise<{ message: string }> {
	const response = await fetchWithCsrf(`/api/users/friends/requests/${friendshipId}/decline`, {
		method: 'POST',
	});
	return handleApiResponse(response);
}

/**
 * Cancels a sent friend request.
 * @param friendshipId The ID of the friendship.
 * @returns A message indicating the result of the operation.
 */
export async function cancelFriendRequest(friendshipId: number): Promise<{ message: string }> {
	const response = await fetchWithCsrf(`/api/users/friends/requests/${friendshipId}/cancel`, {
		method: 'POST',
	});
	return handleApiResponse(response);
}

/**
 * Sends a friend request to another user.
 * @param friendId The ID of the friend to be added.
 * @returns A message indicating the result of the operation.
 */
export async function sendFriendRequest(friendId: number): Promise<{ message: string }> {
	const response = await fetchWithCsrf('/api/users/friends/requests', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ friendId }),
	});
	return handleApiResponse(response);
}

/**
 * Removes a friend by friendshipId.
 * @param friendshipId The ID of the friendship to remove.
 * @returns A message indicating the result of the operation.
 */
export async function removeFriend(friendshipId: number): Promise<{ message: string }> {
	const response = await fetchWithCsrf(`/api/users/friends/${friendshipId}/remove`, {
		method: 'POST',
	});
	return handleApiResponse(response);
}
