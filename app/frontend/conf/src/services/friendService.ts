import { UserData } from './authService.js'; // Or the correct path

let csrfToken: string | null = null;

export interface FriendRequestUserData {
    id: number;
    username: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
}

export interface PendingFriendRequest {
    friendship_id: number;
    requester?: FriendRequestUserData; // Used for received requests
    receiver?: FriendRequestUserData; // Used for sent requests
    created_at: string;
}

export interface ApiErrorResponse {
    error: string;
    details?: any;
}

export interface Friend {
    friendship_id: number;
    friendship_status: string;
    friend_id: number;             // Used for data-friend-id and data-user-id
    friend_username: string;       // Used for display
    friend_display_name?: string;  // Used for display
    friend_avatar_url?: string;    // Used for avatar
    friend_wins?: number;
    friend_losses?: number;
    friend_online_status?: 'online' | 'offline' | 'in-game'; // Used for status indicator
}

type FriendRequestResult =
    | { success: true; data: PendingFriendRequest[] }
    | { success: false; error: string };

type FriendActionResult =
    | { success: true; message: string }
    | { success: false; error: string };

/**
 * Handles API responses by checking for errors and parsing the response JSON.
 * @param response The HTTP response object.
 * @returns The parsed JSON data if the response is successful.
 * @throws An error if the response is not successful.
 */
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
        try {
            errorData = await response.json();
        } catch (jsonError) {
            // The error is not JSON, fallback to statusText
        }
        throw new Error(errorData.error || response.statusText);
    }
    return response.json();
};

/**
 * Retrieves the friend requests received by the logged-in user.
 * @returns A list of pending friend requests.
 */
export async function getReceivedFriendRequests(): Promise<PendingFriendRequest[]> {
    const response = await fetch('/api/friends/requests/received', {
    //const response = await fetchWithCsrf('/api/friends/requests/received', {
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
    const response = await fetch('/api/friends/friends', {
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
    const response = await fetch('/api/friends/requests/sent', {
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
    const response = await fetchWithCsrf(`/api/friends/requests/${friendshipId}/accept`, {
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
    const response = await fetchWithCsrf(`/api/friends/requests/${friendshipId}/decline`, {
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
    const response = await fetchWithCsrf(`/api/friends/requests/${friendshipId}/cancel`, {
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
    const response = await fetchWithCsrf('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
    });
    return handleApiResponse(response);
}

export async function fetchCsrfToken() {
    try {
        const response = await fetch('/api/users/csrf-token', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch CSRF token');
        const data = await response.json();
        csrfToken = data.csrfToken;
        console.log('CSRF Token fetched and stored:', csrfToken);
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

function getCsrfTokenOrThrow(): string {
    if (!csrfToken) throw new Error('CSRF token missing. Please refresh the page.');
    return csrfToken;
}

async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getCsrfTokenOrThrow();
    const headers = new Headers(options.headers || {});
    headers.set('x-csrf-token', token);
    return fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });
}
