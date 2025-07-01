import { fetchWithCsrf, fetchCsrfToken } from './csrf.js';
import * as type from '../utils/types.js';
import * as us from '../shared/schemas/usersSchemas.js';
import { Match, GetMatchByUserIdRouteSchema } from '../shared/schemas/matchesSchemas.js';
import { handleApiResponse, ClientApiError } from './responseService.js';
import { config } from '../utils/config.js';

// Clés pour le localStorage
const USER_DATA_KEY = 'userDataKey';
const USER_DATA_EXPIRATION_KEY = 'userDataExpiration';

export function setUserDataInStorage(user: us.User): void {
	const ttl = 60 * 60 * 1000; // 1 heure en millisecondes
	const expiration = new Date().getTime() + ttl;
	localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
	localStorage.setItem(USER_DATA_EXPIRATION_KEY, expiration.toString());
	console.log("User data stored in localStorage with expiration:", expiration);
}

export function clearUserDataFromStorage(): void {
	localStorage.removeItem(USER_DATA_KEY);
	localStorage.removeItem(USER_DATA_EXPIRATION_KEY);
	console.log("User data cleared from localStorage.");
}

/**
 * Récupère les données utilisateur depuis le localStorage, en vérifiant leur expiration.
 * @returns {User | null} L'utilisateur si disponible et non expiré, sinon null.
 */
export function getUserDataFromStorage(): us.User | null {
	const expiration = localStorage.getItem(USER_DATA_EXPIRATION_KEY);
	if (expiration && new Date().getTime() > parseInt(expiration, 10)) {
		localStorage.removeItem(USER_DATA_KEY);
		localStorage.removeItem(USER_DATA_EXPIRATION_KEY);
		return null;
	}

	const data = localStorage.getItem(USER_DATA_KEY);
	if (!data) return null;

	try {
		const parsedData = us.UserBaseSchema.parse(JSON.parse(data));
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
export async function fetchUsers(): Promise<us.User[]> {
	try {
		const response = await fetch(config.api.users.all);
		const data = await handleApiResponse(response, us.GetUsersListRouteSchema.response);
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
export async function fetchUserDetails(userId: number): Promise<us.User> {
	const response = await fetch(config.api.users.byId(userId), {
		credentials: 'include',
	});
	return handleApiResponse(response, us.GetMeRouteSchema.response);
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
export async function checkAuthStatus(): Promise<us.User | null> {
	try {
		const response = await fetch(config.api.users.me, { credentials: 'include' });
		const user = await handleApiResponse(response, us.GetMeRouteSchema.response);
		setUserDataInStorage(user);

		return user;
	} catch (error) {
		if (!(error instanceof ClientApiError && error.httpStatus === 401)) {
			console.error("Error verifying authentication status:", error);
		}
		clearUserDataFromStorage();
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
export async function attemptLogin(credentials: us.LoginRequestBody): Promise<type.ApiResult<type.ApiLoginSuccessData>> {
	try {
		const response = await fetch(config.api.auth.login, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(credentials),
			credentials: 'include',
		});

		const data = await handleApiResponse(response, us.LoginRouteSchema.response);
		if (data.user) {
			setUserDataInStorage(data.user);
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
export async function verifyTwoFactorLogin(token: string): Promise<type.ApiResult<type.ApiLoginSuccessData>> {
    try {
		const response = await fetch(config.api.users.twoFa.login, {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
			credentials: 'include',
        });
        const data = await handleApiResponse(response, us.LoginRouteSchema.response);
        
        if (data.user) {
			setUserDataInStorage(data.user);
            await fetchCsrfToken();
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
		await handleApiResponse(response, us.LogoutRouteSchema.response);
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
export async function attemptRegister(credentials: us.RegisterRequestBody): Promise<type.ApiResult<type.ApiRegisterSuccessData>> {	try {
		const payload = { ...credentials };
		if (!payload.avatar_url) {
			delete payload.avatar_url;
		}

		const response = await fetch(config.api.auth.register, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		const data = await handleApiResponse(response, us.RegisterRouteSchema.response);
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
export async function updateUserProfile(payload: us.UpdateUserPayload): Promise<type.ApiResult<type.ApiUpdateUserSuccessData>> {
	const cleanPayload: Partial<us.UpdateUserPayload> = { ...payload };
	if (cleanPayload.avatar_url === '') {
		cleanPayload.avatar_url = null; // Envoyer null pour effacer l'avatar
	}

	try {
		const response = await fetchWithCsrf(config.api.users.me, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(cleanPayload),
		});

		const data = await handleApiResponse(response, us.UpdateUserRouteSchema.response);
		setUserDataInStorage(data.user);
		return { success: true, data };

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error during profile update";
		return { success: false, error: errorMessage };
	}
}

/**
 * Demande au backend de générer un secret 2FA et un QR code.
 * @returns {Promise<Generate2FAResponse>} Les données pour la configuration.
 */
export async function generate2FASetup(): Promise<us.Generate2FAResponse> {
    const response = await fetchWithCsrf(config.api.users.twoFa.generate, { method: 'POST' });
    return handleApiResponse(response, us.Generate2FARouteSchema.response);
}

/**
 * Vérifie le token 2FA pour finaliser l'activation.
 * @param {string} token - Le token de l'application d'authentification.
 * @returns {Promise<{ message: string }>} Un message de succès.
 */
export async function verify2FASetup(token: string): Promise<{ message: string }> {
    const payload: us.Verify2FABodySchema = { token };
    const response = await fetchWithCsrf(config.api.users.twoFa.verify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const result = await handleApiResponse(response, us.Verify2FARouteSchema.response);
    
    const user = getUserDataFromStorage();
    if (user) {
        user.is_two_fa_enabled = true;
        setUserDataInStorage(user);
    }

    return result;
}

/**
 * Désactive la 2FA pour le compte de l'utilisateur.
 * @returns {Promise<{ message: string }>} Un message de succès.
 */
export async function disable2FA(): Promise<{ message: string }> {
    const response = await fetchWithCsrf(config.api.users.twoFa.disable, { method: 'POST' });
    const result = await handleApiResponse(response, us.Disable2FARouteSchema.response);

    const user = getUserDataFromStorage();
    if (user) {
        user.is_two_fa_enabled = false;
		clearUserDataFromStorage();
		setUserDataInStorage(user);
    }

    return result;
}
