export interface UserData {
    id: number;
    username: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
}

export interface RegisterCredentials {
	username: string;
	email: string;
	password: string;
	display_name: string;
	avatar_url?: string;
}

export interface RegisterSuccessData {
	message: string;
	user: UserData;
}

export interface LoginCredentials {
	identifier: string;
	password: string;
}

// no token
export interface LoginSuccessResponse {
	message: string;
	user: UserData;
}

export interface ApiErrorResponse {
	error: string;
}

export interface UpdateProfilePayload {
	email?: string;
	display_name?: string;
	avatar_url?: string | null;
}

export interface UpdateProfileSuccessData {
	message: string;
	user: UserData;
}

export type UpdateProfileResult =
	| { success: true; data: UpdateProfileSuccessData['user'] }
	| { success: false; error: string };

export type LoginResult =
	| { success: true; data: LoginSuccessResponse } // data ne contient plus le token ici
	| { success: false; error: string };

export type RegisterResult =
	| { success: true; data: RegisterSuccessData }
	| { success: false; error: string };

// only user data
const USER_DATA_KEY = 'userDataKey';

/**
 * Récupère les données utilisateur (pas le token) depuis localStorage.
 * La présence de ces données ne garantit pas que l'utilisateur est toujours authentifié
 * (le cookie JWT pourrait avoir expiré). Pour cela, un appel API est nécessaire.
 */
export function getUserDataFromStorage(): UserData | null {
	const data = localStorage.getItem(USER_DATA_KEY);
	try {
		const parsedData = data ? JSON.parse(data) as UserData : null;
		if (parsedData && parsedData.id && parsedData.username) {
			return parsedData;
		}
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	} catch (e) {
		console.error("Erreur lors de la lecture des données utilisateur", e);
		localStorage.removeItem(USER_DATA_KEY);
		return null;
	}
}

/**
 * Tente de vérifier l'état d'authentification en appelant un endpoint protégé.
 * Le serveur vérifiera le cookie JWT.
 * @returns UserData si authentifié, null sinon.
 */
export async function checkAuthStatus(): Promise<UserData | null> {
    const meUrl = '/api/users/me'; // Endpoint qui renvoie les infos de l'utilisateur si authentifié
    try {
        const response = await fetch(meUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important pour envoyer les cookies
        });

        if (response.ok) {
            const userData: UserData = await response.json();
            // Optionnel: re-synchroniser localStorage avec les dernières données utilisateur
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            return userData;
        }
        // Si 401 ou autre erreur, l'utilisateur n'est pas (ou plus) authentifié
        localStorage.removeItem(USER_DATA_KEY); // Nettoyer si non authentifié
        return null;
    } catch (error) {
        console.error("Erreur lors de la vérification du statut d'authentification:", error);
        localStorage.removeItem(USER_DATA_KEY);
        return null;
    }
}


export async function attemptLogin(credentials: LoginCredentials): Promise<LoginResult> {
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
				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
			}
			return { success: false, error: errorData.error || response.statusText };
		}
		const data: LoginSuccessResponse = await response.json();
		console.log("Connexion réussie:", data);

		if (data && data.user) {
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
			console.log("Données utilisateur stockées dans localStorage.");
			return { success: true, data: data };
		} else {
			console.warn("Aucune donnée utilisateur reçue dans la réponse de connexion.");
			return { success: false, error: "Problème lors de la réception des données utilisateur." };
		}
	} catch (error) {
		console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
		return { success: false, error: `Erreur de connexion au serveur (${errorMessage})` };
	}
}

export async function logout(): Promise<void> {
    const logoutUrl = '/api/users/auth/logout'; // Endpoint serveur pour la déconnexion
	localStorage.removeItem(USER_DATA_KEY);
	console.log("Données utilisateur supprimées de localStorage.");

    try {
        const response = await fetch(logoutUrl, {
            method: 'POST', // Ou GET, selon votre API
            credentials: 'include', // S'assure que le cookie est envoyé pour que le serveur puisse l'invalider
        });
        if (response.ok) {
            console.log("Déconnexion réussie côté serveur (cookie invalidé).");
        } else {
            console.warn("La déconnexion côté serveur a peut-être échoué:", response.status);
        }
    } catch (error) {
        console.error("Erreur lors de la tentative de déconnexion du serveur:", error);
    }
    // Optionnel: rediriger l'utilisateur ou rafraîchir la page
}

export async function attemptRegister(credentials: RegisterCredentials): Promise<RegisterResult> {
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

		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
			let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
			try {
				errorData = await response.json();
			} catch (jsonError) {
				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
			}
			return { success: false, error: errorData.error || response.statusText };
		}

		const data: RegisterSuccessData = await response.json();
		console.log("Inscription réussie:", data);
        // Note: Après l'inscription, certaines applications connectent automatiquement l'utilisateur.
        // Si c'est le cas, le serveur devrait aussi définir le cookie JWT ici,
        // et vous devriez stocker data.user dans localStorage.
        // if (data.user) { // Si l'utilisateur est connecté après l'inscription
        //    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
        // }
		return { success: true, data: data };

	} catch (error) {
		console.error("Erreur réseau lors de l'inscription:", error);
		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
		return { success: false, error: `Erreur de connexion au serveur lors de l'inscription (${errorMessage})` };
	}
}

export async function updateUserProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResult> {
	const profileUpdateUrl = '/api/users/me';

    // On vérifie si on a des données utilisateur en local, mais la vraie auth se fait via cookie.
	const localUser = getUserDataFromStorage();
	if (!localUser) {
		// Cela ne signifie pas nécessairement que l'utilisateur n'est pas connecté
		// (le cookie pourrait exister), mais c'est une vérification rapide côté client.
		// L'appel API échouera avec un 401 si le cookie n'est pas valide.
		console.warn("Aucune donnée utilisateur locale, tentative de mise à jour quand même.");
        // return { success: false, error: "Utilisateur non connecté localement." };
	}

	try {
		const response = await fetch(profileUpdateUrl, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
            credentials: 'include', // ESSENTIEL pour que le navigateur envoie le cookie JWT
		});

		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
			let errorData: ApiErrorResponse = { error: `Erreur serveur (${response.status})` };
			try {
				errorData = await response.json();
			} catch (jsonError) {
				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
			}
            if (response.status === 401) { // Non autorisé
                logout(); // Déconnecter l'utilisateur côté client si le token n'est plus valide
                return { success: false, error: "Session expirée ou invalide. Veuillez vous reconnecter." };
            }
			return { success: false, error: errorData.error || response.statusText };
		}

		const data: UpdateProfileSuccessData = await response.json();
		console.log("Profil mis à jour avec succès via API:", data);

		// Mettre à jour les données utilisateur dans localStorage
		if (data.user) {
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
			console.log("Données utilisateur mises à jour dans localStorage.");
		}
		return { success: true, data: data.user };

	} catch (error) {
		console.error("Erreur réseau lors de la mise à jour du profil:", error);
		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
		return { success: false, error: `Erreur de connexion au serveur lors de la mise à jour (${errorMessage})` };
	}
}

// // with token
// export interface LoginSuccessResponse {
// 	message: string;
// 	token: string;
// 	user: UserData;
// }
// const AUTH_KEY = 'authDataKey'
//
// export function getUserDataFromStorage(): { token: string; user: LoginSuccessResponse['user'] } | null {
// 	const data = localStorage.getItem(AUTH_KEY);
// 	try {
// 		const parsedData = data ? JSON.parse(data) : null;
// 		if (parsedData && parsedData.token && parsedData.user) {
// 			return parsedData;
// 		}
// 		localStorage.removeItem(AUTH_KEY);
// 		return null;
// 	} catch (e) {
// 		console.error("Erreur lors de la lecture des données d'authentification", e);
// 		localStorage.removeItem(AUTH_KEY);
// 		return null;
// 	}
// }
//
// export async function attemptLogin(credentials: LoginCredentials): Promise<LoginResult> {
// 	const loginUrl = '/api/users/auth/login';
//
// 	try {
// 		const response = await fetch(loginUrl, {
// 			method: 'POST',
// 			headers: { 'Content-Type': 'application/json' },
// 			body: JSON.stringify(credentials),
// 		});
//
// 		if (!response.ok) {
// 			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
// 			let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
// 			try {
// 				errorData = await response.json();
// 			} catch (jsonError) {
// 				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
// 			}
// 			return { success: false, error: errorData.error || response.statusText };
// 		}
// 		const data: LoginSuccessResponse = await response.json();
// 		console.log("Connexion réussie:", data);
//
// 		// **Action cruciale : Stocker le token JWT**
// 		// localStorage est simple mais vulnérable au XSS. sessionStorage est légèrement mieux.
// 		// Les cookies HttpOnly gérés par le backend sont l'option la plus sûre.
// 		// Pour cet exemple, utilisons localStorage.
// 		if (data && data.token && data.user) {
// 			const dataToStore = { token: data.token, user: data.user };
// 			localStorage.setItem(AUTH_KEY, JSON.stringify(dataToStore));
// 			console.log("Token JWT stocké dans localStorage.");
// 			return { success: true, data: data };
// 		} else {
// 			console.warn("Aucun token reçu dans la réponse de connexion.");
// 			alert("Problème lors de la réception du token d'authentification.");
// 			return { success: false, error: "Problème lors de la réception du token d'authentification." };
// 		}
// 	} catch (error) {
// 		console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
// 		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
// 		return { success: false, error: `Erreur de connexion au serveur lors de la connexion. Vérifiez votre connexion (${errorMessage})` };
// 	}
// }
//
// export function logout(): void {
// 	localStorage.removeItem(AUTH_KEY);
// 	console.log("Token JWT supprimé.");
// }
//
// export async function attemptRegister(credentials: RegisterCredentials): Promise<RegisterResult> {
// 	const registerUrl = '/api/users/auth/register';
//
// 	try {
// 		// Remove avatar_url if it's empty or null, as the backend schema might expect a valid URL or nothing
// 		const payload: any = { ...credentials };
// 		if (!payload.avatar_url) {
// 			delete payload.avatar_url;
// 		}
//
// 		const response = await fetch(registerUrl, {
// 			method: 'POST',
// 			headers: { 'Content-Type': 'application/json' },
// 			body: JSON.stringify(payload),
// 		});
//
// 		if (!response.ok) {
// 			// Gérer les erreurs HTTP (400, 409, 5xx)
// 			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
// 			let errorData: ApiErrorResponse = { error: `Server error (${response.status})` };
// 			try {
// 				errorData = await response.json();
// 			} catch (jsonError) {
// 				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
// 			}
// 			return { success: false, error: errorData.error || response.statusText };
// 		}
//
// 		// Si l'inscription réussit (status 201 Created)
// 		const data: RegisterSuccessData = await response.json();
// 		console.log("Inscription réussie:", data);
// 		return { success: true, data: data };
//
// 	} catch (error) {
// 		console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
// 		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
// 		return { success: false, error: `Erreur de connexion au serveur lors de l'inscription. Vérifiez votre connexion (${errorMessage})` };
// 	}
// }
//
// export async function updateUserProfile(payload: UpdateProfilePayload): Promise<UpdateProfileResult> {
// 	// Déterminez l'URL de votre endpoint API pour la mise à jour
// 	const profileUpdateUrl = '/api/users/me'; // Commun, mais adaptez ! (pourrait être /api/users/:id)
//
// 	const authData = getUserDataFromStorage();
// 	if (!authData || !authData.token) {
// 		console.error("Tentative de mise à jour du profil sans être connecté.");
// 		return { success: false, error: "Authentification requise." };
// 	}
// 	const token = authData.token;
//
// 	try {
// 		const response = await fetch(profileUpdateUrl, {
// 			// Méthode: PATCH est souvent préféré pour les mises à jour partielles
// 			// PUT remplacerait toute la ressource (peut nécessiter tous les champs)
// 			method: 'PATCH', // Ou 'PUT' selon votre API
// 			headers: {
// 				'Content-Type': 'application/json',
// 				// Inclure le token JWT pour l'authentification
// 				'Authorization': `Bearer ${token}`
// 			},
// 			body: JSON.stringify(payload),
// 		});
//
// 		if (!response.ok) {
// 			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
// 			let errorData: ApiErrorResponse = { error: `Erreur serveur (${response.status})` };
// 			try {
// 				errorData = await response.json();
// 			} catch (jsonError) {
// 				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
// 			}
// 			return { success: false, error: errorData.error || response.statusText };
// 		}
//
// 		// Succès !
// 		const data: UpdateProfileSuccessData = await response.json();
// 		console.log("Profil mis à jour avec succès via API:", data);
//
// 		// --- CRUCIAL: Mettre à jour les données dans localStorage ---
// 		// On combine le token existant avec les nouvelles données utilisateur reçues
// 		const updatedAuthData = {
// 			token: token, // Garder le même token
// 			user: data.user // Utiliser les données utilisateur fraîches de la réponse
// 		};
// 		localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAuthData));
// 		console.log("Données d'authentification mises à jour dans localStorage.");
//
// 		// Retourner succès avec les données utilisateur mises à jour
// 		return { success: true, data: data.user };
//
// 	} catch (error) {
// 		console.error("Erreur réseau ou autre problème lors de la mise à jour du profil:", error);
// 		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
// 		return { success: false, error: `Erreur de connexion au serveur lors de la mise à jour (${errorMessage})` };
// 	}
// }
