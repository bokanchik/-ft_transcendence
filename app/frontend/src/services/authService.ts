import { fetchWithCsrf, fetchCsrfToken } from './csrf.js';
import { 
    ApiResult, 
    ApiLoginSuccessData, 
    ApiRegisterSuccessData,
    ApiUpdateUserSuccessData
} from '../utils/types.js';
import {
	User,
	UserBaseSchema,
	LoginRequestBody,
	RegisterRequestBody,
	UpdateUserPayload,
	GetUsersListRouteSchema,
	GetMeRouteSchema,
	LoginRouteSchema,
	RegisterRouteSchema,
	UpdateUserRouteSchema,
	LogoutRouteSchema
} from '../shared/schemas/usersSchemas.js';
import { Match, GetMatchByUserIdRouteSchema } from '../shared/schemas/matchesSchemas.js';
import { handleApiResponse, ClientApiError } from './error.js';
import { config } from '../utils/config.js';

// Clés pour le localStorage
const USER_DATA_KEY = 'userDataKey';
const USER_DATA_EXPIRATION_KEY = 'userDataExpiration';

/**
 * Récupère les données utilisateur depuis le localStorage, en vérifiant leur expiration.
 * @returns {User | null} L'utilisateur si disponible et non expiré, sinon null.
 */
export function getUserDataFromStorage(): User | null {
	const expiration = localStorage.getItem(USER_DATA_EXPIRATION_KEY);
	if (expiration && new Date().getTime() > parseInt(expiration, 10)) {
		localStorage.removeItem(USER_DATA_KEY);
		localStorage.removeItem(USER_DATA_EXPIRATION_KEY);
		return null;
	}

	const data = localStorage.getItem(USER_DATA_KEY);
	if (!data) return null;

	try {
		const parsedData = UserBaseSchema.parse(JSON.parse(data));
		return parsedData;
	} catch (e) {
		console.error("Error parsing user data from localStorage:", e);
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	}
}

/**
 * Récupère la liste de tous les utilisateurs.
 * @returns {Promise<User[]>} Un tableau d'utilisateurs.
 */
export async function fetchUsers(): Promise<User[]> {
	try {
		const response = await fetch(config.api.users.all);
		const data = await handleApiResponse(response, GetUsersListRouteSchema.response);
		return data;
	} catch (error) {
		console.error("Failed to fetch users:", error);
		return [];
	}
}

/**
 * Récupère les détails d'un utilisateur par son ID.
 * @param {number} userId - L'ID de l'utilisateur.
 * @returns {Promise<User>} L'objet utilisateur.
 */
export async function fetchUserDetails(userId: number): Promise<User> {
	const response = await fetch(config.api.users.byId(userId), {
		credentials: 'include',
	});
	return handleApiResponse(response, GetMeRouteSchema.response);
}

/**
 * Récupère l'historique des matchs pour un utilisateur.
 * @param {number} userId - L'ID de l'utilisateur.
 * @returns {Promise<Match[]>} Un tableau de matchs.
 */
export async function fetchMatchHistoryForUser(userId: number): Promise<Match[]> {
	const response = await fetch(config.api.game.matchHistory(userId), {
		credentials: 'include',
	});
	return await handleApiResponse(response, GetMatchByUserIdRouteSchema.response);
}

/**
 * Vérifie le statut d'authentification en appelant une route protégée.
 * @returns {Promise<User | null>} L'utilisateur si authentifié, sinon null.
 */
export async function checkAuthStatus(): Promise<User | null> {
	try {
		const response = await fetch(config.api.users.me, { credentials: 'include' });
		const user = await handleApiResponse(response, GetMeRouteSchema.response);
		const ttl = 60 * 60 * 1000; // 1 heure en ms
		localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
		localStorage.setItem(USER_DATA_EXPIRATION_KEY, (new Date().getTime() + ttl).toString());

		return user;
	} catch (error) {
		if (!(error instanceof ClientApiError && error.httpStatus === 401)) {
			console.error("Error verifying authentication status:", error);
		}
		localStorage.removeItem(USER_DATA_KEY);
		localStorage.removeItem(USER_DATA_EXPIRATION_KEY);
		return null;
	}
}

/**
 * Tente de connecter un utilisateur.
 * @param {LoginRequestBody} credentials - Les identifiants de connexion.
 * @returns {Promise<ApiResult>} Un objet indiquant le succès ou l'échec.
 * @returns {Promise<ApiLoginSuccessResponse>} Un objet indiquant le succès ou l'échec.
 *
 */
export async function attemptLogin(credentials: LoginRequestBody): Promise<ApiResult<ApiLoginSuccessData>> {
	try {
		const response = await fetch(config.api.auth.login, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credentials),
			credentials: 'include',
		});

		const data = await handleApiResponse(response, LoginRouteSchema.response);
		if (data.user) {
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
			const ttl = 60 * 60 * 1000;
			localStorage.setItem(USER_DATA_EXPIRATION_KEY, (new Date().getTime() + ttl).toString());
			await fetchCsrfToken();
		}
		return { success: true, data };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error during login";
		const statusCode = error instanceof ClientApiError ? error.httpStatus : undefined;
		return { success: false, error: errorMessage, statusCode };
	}
}

/**
 * Vérifie le code 2FA et finalise la connexion.
 * @param token Le code 2FA à 6 chiffres.
 * @returns {Promise<ApiResult<ApiLoginSuccessResponse>>} Un objet avec les données utilisateur en cas de succès.
 */
export async function verifyTwoFactorLogin(token: string): Promise<ApiResult<ApiLoginSuccessData>> {
    try {
        // const response = await fetchWithCsrf('/api/users/2fa/login', {
        const response = await fetch('/api/users/2fa/login', {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await handleApiResponse(response, LoginRouteSchema.response);
        
        if (data.user) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
            const ttl = 60 * 60 * 1000;
            localStorage.setItem(USER_DATA_EXPIRATION_KEY, (new Date().getTime() + ttl).toString());
            return { success: true, data };
        }
        throw new Error('2FA verification failed to return user data.');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error during 2FA verification";
		const statusCode = error instanceof ClientApiError ? error.httpStatus : undefined;
        return { success: false, error: errorMessage, statusCode };
    }
}

/**
 * Déconnecte l'utilisateur.
 */
export async function logout(): Promise<void> {
	localStorage.removeItem(USER_DATA_KEY);
	localStorage.removeItem(USER_DATA_EXPIRATION_KEY);
	console.log("User data removed from localStorage.");

	try {
		const response = await fetchWithCsrf(config.api.auth.logout, { method: 'POST' });
		await handleApiResponse(response, LogoutRouteSchema.response);
		console.log("Server-side logout successful.");
	} catch (error) {
		console.error("Error attempting server logout:", error);
	}
}

/**
 * Tente d'inscrire un nouvel utilisateur.
 * @param {RegisterRequestBody} credentials - Les informations d'inscription.
 * @returns {Promise<ApiResult>} Un objet indiquant le succès ou l'échec.
 */
export async function attemptRegister(credentials: RegisterRequestBody): Promise<ApiResult<ApiRegisterSuccessData>> {	try {
		const payload = { ...credentials };
		if (!payload.avatar_url) {
			delete payload.avatar_url;
		}

		const response = await fetch(config.api.auth.register, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const data = await handleApiResponse(response, RegisterRouteSchema.response);
		// return { success: true, data: { message: data.message, user: {} as User } };
		return { success: true, data: { message: data.message } };

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error during registration";
		return { success: false, error: errorMessage };
	}
}

/**
 * Met à jour le profil de l'utilisateur connecté.
 * @param {UpdateUserPayload} payload - Les données à mettre à jour.
 * @returns {Promise<ApiResult>} Un objet indiquant le succès ou l'échec.
 */
export async function updateUserProfile(payload: UpdateUserPayload): Promise<ApiResult<ApiUpdateUserSuccessData>> {
	const cleanPayload: Partial<UpdateUserPayload> = { ...payload };
	if (cleanPayload.avatar_url === '') {
		cleanPayload.avatar_url = null; // Envoyer null pour effacer l'avatar
	}

	try {
		const response = await fetchWithCsrf(config.api.users.me, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cleanPayload),
		});

		const data = await handleApiResponse(response, UpdateUserRouteSchema.response);

		localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
		console.log("User data updated in localStorage.");

		return { success: true, data };

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error during profile update";
		return { success: false, error: errorMessage };
	}
}
