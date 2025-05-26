import { fetchWithCsrf, setCsrfToken } from './csrf.js';
import { User, LoginRequestBody, RegisterRequestBody, UpdateUserPayload, ApiErrorResponse, ApiSuccessResponse, ApiResult } from '../shared/types.js';
import { Match } from '../shared/types.js';

const USER_DATA_KEY = 'userDataKey';
const USER_DATA_EXPIRATION_KEY = 'userDataExpiration';

const handleApiResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		let errorData: ApiErrorResponse = { error: `Erreur serveur (${response.status})` };
		try {
			errorData = await response.json();
		} catch (jsonError) {
			// Si le corps de l'erreur n'est pas du JSON, ou si la réponse est vide
			console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
		}
		// Utilise le message d'erreur de l'API s'il existe, sinon le statut HTTP
		throw new Error(errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`);
	}
	// Gérer le cas où le statut est OK mais pas de contenu (ex: 204 No Content)
	if (response.status === 204) {
		return undefined as T; // Ou un objet vide, selon ce qui est attendu
	}
	return response.json() as Promise<T>;
};

/**
 * Retrieves user data (not the token) from localStorage.
 * The presence of this data does not guarantee that the user is still authenticated
 * (the JWT cookie might have expired). An API call is required to confirm authentication.
 * @returns User if available, null otherwise.
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

// --- Service pour récupérer les détails d'un utilisateur par ID ---
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
		if (response.status === 404) {
			throw new Error('Utilisateur non trouvé');
		}
		return await handleApiResponse<User>(response);
	} catch (error) {
		console.error(`Erreur lors de la récupération des détails de l'utilisateur ${userId}:`, error);
		// showToast(`Impossible de charger le profil : ${(error as Error).message}`, 'error'); // Optionnel: afficher un toast ici
		throw error; // Relancer pour que ProfilePage puisse gérer l'état de chargement/erreur
	}
}

// --- Service pour récupérer l'historique des matchs d'un utilisateur ---
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
		console.error(`Erreur lors de la récupération de l'historique des matchs pour l'utilisateur ${userId}:`, error);
		// showToast(`Impossible de charger l'historique des matchs : ${(error as Error).message}`, 'error'); // Optionnel
		throw error;
	}
}

/**
 * Attempts to verify the authentication status by calling a protected endpoint.
 * The server will verify the JWT cookie.
 * @returns User if authenticated, null otherwise.
 */
export async function checkAuthStatus(): Promise<User | null> {
	const meUrl = '/api/users/me';
	try {
		const response = await fetch(meUrl, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include', // Important to send cookie
		});
		if (response.ok) {
			const User: User = await response.json();
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(User)); // sync
			return User;
		}
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	} catch (error) {
		console.error("Error verifying authentication status:", error);
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	}
}

/**
 * Attempts to log in with the provided credentials.
 * @param credentials Login credentials (identifier and password).
 * @returns LoginResult indicating success or failure.
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

		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
			let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
			try {
				errorData = await response.json();
			} catch (jsonError) {
				console.error("Unable to parse JSON error response:", jsonError);
			}
			return { success: false, error: errorData.error || response.statusText };
		}

		const data: ApiSuccessResponse & { csrfToken: string } = await response.json();

		if (data && data.user) {
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
			setCsrfToken(data.csrfToken); // Stocker le token CSRF
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
		if (response.ok) {
			console.log("Server-side logout successful (cookie invalidated).");
		} else {
			console.warn("Server-side logout may have failed:", response.status);
		}
	} catch (error) {
		console.error("Error attempting server logout:", error);
	}
	// Redirect ?
}

/**
 * Attempts to register a new user with the provided credentials.
 * @param credentials Registration credentials (username, email, password, etc.).
 * @returns RegisterResult indicating success or failure.
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

		const data: ApiSuccessResponse = await response.json();

		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
			const errorMsg = (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
				? data.error
				: response.statusText;
			return { success: false, error: errorMsg };
		}

		// Succès : le backend ne renvoie qu'un message
		return { success: true, data };

	} catch (error) {
		console.error("Network error during registration:", error);
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		return { success: false, error: `Server connection error during registration (${errorMessage})` };
	}
}

/**
 * Updates the user's profile with the provided payload.
 * @param payload Profile update payload (email, display name, avatar URL, etc.).
 * @returns UpdateProfileResult indicating success or failure.
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
			credentials: 'include', // IMPORTANT
		});

		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
			let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
			try {
				errorData = await response.json();
			} catch (jsonError) {
				console.error("Unable to parse JSON error response:", jsonError);
			}
			if (response.status === 401) {
				logout();
				return { success: false, error: "Session expired or invalid. Please log in again." };
			}
			return { success: false, error: errorData.error || response.statusText };
		}

		const data: ApiSuccessResponse = await response.json();
		console.log("Profile successfully updated via API:", data);

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
