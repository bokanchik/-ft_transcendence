import { fetchWithCsrf, setCsrfToken } from './csrf.js';
import { ApiSuccessResponse, ApiResult, Match } from '../shared/types.js';
import { User, LoginRequestBody, RegisterRequestBody, UpdateUserPayload } from '../shared/schemas/usersSchemas.js';
import { handleApiResponse } from './apiUtils.js';

const USER_DATA_KEY = 'userDataKey';
const USER_DATA_EXPIRATION_KEY = 'userDataExpiration';

/**
 * Retrieves user data (not the token) from localStorage.
 * The presence of this data does not guarantee that the user is still authenticated
 * (the JWT cookie might have expired). An API call is required to confirm authentication.
 * @returns {User | null} User if available, null otherwise.
 */
export function getUserDataFromStorage(): User | null {
	const expiration = localStorage.getItem(USER_DATA_EXPIRATION_KEY);
	if (expiration && new Date().getTime() > parseInt(expiration, 10)) {
		localStorage.removeItem(USER_DATA_KEY);
		localStorage.removeItem(USER_DATA_EXPIRATION_KEY);
		return null;
	}

	const data = localStorage.getItem(USER_DATA_KEY);
	try {
		const parsedData = data ? JSON.parse(data) as User : null;
		if (parsedData && parsedData.id && parsedData.username) {
			return parsedData;
		}
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	} catch (e) {
		console.error("Error reading user data", e);
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	}
}

/**
 * Fetches the list of all users from the API.
 *
 * @returns {Promise<User[]>} An array of User objects. Returns an empty array if the request fails.
 */
export async function fetchUsers(): Promise<User[]> {
	try {
		const response = await fetch('/api/users/');
		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status}`);
			return [];
		}
		const users = await response.json() as User[];
		return users;
	} catch (error) {
		console.error("Failed to fetch users:", error);
		return [];
	}
}

/**
 * Fetches the details of a user by their ID.
 * @param {number} userId - The ID of the user to fetch.
 * @returns {Promise<User>} The user object.
 * @throws {Error} If the fetch fails.
 */
export async function fetchUserDetails(userId: number): Promise<User> {
	try {
		const response = await fetch(`/api/users/${userId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: 'include',
		});
		return await handleApiResponse<User>(response);
	} catch (error) {
		console.error(`Error fetching details for user ${userId}:`, error);
		throw error;
	}
}

/**
 * Fetches the match history for a given user.
 * @param {number} userId - The ID of the user whose match history to fetch.
 * @returns {Promise<Match[]>} An array of matches.
 * @throws {Error} If the fetch fails.
 */
export async function fetchMatchHistoryForUser(userId: number): Promise<Match[]> {
	try {
		const response = await fetch(`/api/users/${userId}/matches`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			credentials: 'include',
		});
		return await handleApiResponse<Match[]>(response);
	} catch (error) {
		console.error(`Error fetching match history for user ${userId}:`, error);
		throw error;
	}
}

/**
 * Attempts to verify the authentication status by calling a protected endpoint.
 * The server will verify the JWT cookie.
 * @returns {Promise<User | null>} User if authenticated, null otherwise.
 */
export async function checkAuthStatus(): Promise<User | null> {
	const meUrl = '/api/users/me';
	try {
		const response = await fetch(meUrl, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
		});
		const user = await handleApiResponse<User>(response);
		localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
		return user;
	} catch (error) {
		console.error("Error verifying authentication status:", error);
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	}
}

/**
 * Attempts to log in with the provided credentials.
 * @param {LoginRequestBody} credentials - Login credentials (identifier and password).
 * @returns {Promise<ApiResult>} LoginResult indicating success or failure.
 */
export async function attemptLogin(credentials: LoginRequestBody): Promise<ApiResult> {
	if (!credentials.identifier || !credentials.password) {
		return { success: false, error: "Identifier and password are required." };
	}

	const loginUrl = '/api/users/auth/login';

	try {
		const response = await fetch(loginUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credentials),
			credentials: 'include',
		});

		const data: ApiSuccessResponse & { csrfToken: string } = await handleApiResponse(response);

		if (data && data.user) {
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
			setCsrfToken(data.csrfToken);
			return { success: true, data: data };
		} else {
			console.warn("No user data received in login response.");
			return { success: false, error: "Problem receiving user data." };
		}
	} catch (error) {
		console.error("Network error or other issue during fetch call:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return { success: false, error: `Server connection error (${errorMessage})` };
	}
}

/**
 * Logs out the user by removing local data and invalidating the server-side session.
 * @returns {Promise<void>}
 */
export async function logout(): Promise<void> {
	const logoutUrl = '/api/users/auth/logout';
	localStorage.removeItem(USER_DATA_KEY);
	console.log("User data removed from localStorage.");

	try {
		const response = await fetchWithCsrf(logoutUrl, {
			method: 'POST',
			credentials: 'include',
		});
		await handleApiResponse<{ message: string }>(response);
		console.log("Server-side logout successful (cookie invalidated).");
	} catch (error) {
		console.error("Error attempting server logout:", error);
	}
}

/**
 * Attempts to register a new user with the provided credentials.
 * @param {RegisterRequestBody} credentials - Registration credentials (username, email, password, etc.).
 * @returns {Promise<ApiResult>} RegisterResult indicating success or failure.
 */
export async function attemptRegister(credentials: RegisterRequestBody): Promise<ApiResult> {
	const registerUrl = '/api/users/auth/register';

	try {
		const payload: any = { ...credentials };
		if (!payload.avatar_url) {
			delete payload.avatar_url;
		}

		const response = await fetch(registerUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const data: ApiSuccessResponse = await handleApiResponse(response);

		return { success: true, data };

	} catch (error) {
		console.error("Network error during registration:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return { success: false, error: `Server connection error during registration (${errorMessage})` };
	}
}

/**
 * Updates the user's profile with the provided payload.
 * @param {UpdateUserPayload} payload - Profile update payload (email, display name, avatar URL, etc.).
 * @returns {Promise<ApiResult>} UpdateProfileResult indicating success or failure.
 */
export async function updateUserProfile(payload: UpdateUserPayload): Promise<ApiResult> {
	const profileUpdateUrl = '/api/users/me';

	const cleanPayload = { ...payload };
	if (cleanPayload.avatar_url === undefined || cleanPayload.avatar_url === null || cleanPayload.avatar_url === '') {
		delete cleanPayload.avatar_url;
	}
	try {
		const response = await fetchWithCsrf(profileUpdateUrl, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cleanPayload),
			credentials: 'include',
		});

		const data: ApiSuccessResponse = await handleApiResponse(response);

		if (data.user) {
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
			console.log("User data updated in localStorage.");
		}
		return { success: true, data: data };

	} catch (error) {
		console.error("Network error during profile update:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return { success: false, error: `Server connection error during update (${errorMessage})` };
	}
}
