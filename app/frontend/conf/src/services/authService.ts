export interface RegisterCredentials {
	username: string;
	email: string;
	password: string;
	display_name: string;
	avatar_url?: string; // ? -> optional
}

export interface RegisterSuccessData {
	message: string;
	user: {
		id: number;
		username: string;
		email: string;
		display_name: string;
		avatar_url: string | null;
	};
}

export interface LoginCredentials {
	identifier: string;
	password: string;
}

export interface LoginSuccessResponse {
	message: string;
	token: string;
	user: {
		id: number;
		username: string;
		email: string;
		display_name: string;
	};
}

export interface ApiErrorResponse {
	error: string;
}

export async function attemptLogin(credentials: LoginCredentials): Promise<LoginSuccessResponse | null> {
	const loginUrl = '/api/users/auth/login';

	try {
		const response = await fetch(loginUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(credentials),
		});

		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
			let errorData: ApiErrorResponse = { error: "Une erreur inconnue est survenue côté serveur." };
			try {
				errorData = await response.json();
			} catch (jsonError) {
				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
			}
			alert(`Échec de la connexion : ${errorData.error || response.statusText}`);
			return null;
		}
		const data: LoginSuccessResponse = await response.json();
		console.log("Connexion réussie:", data);

		// **Action cruciale : Stocker le token JWT**
		// localStorage est simple mais vulnérable au XSS. sessionStorage est légèrement mieux.
		// Les cookies HttpOnly gérés par le backend sont l'option la plus sûre.
		// Pour cet exemple, utilisons localStorage.
		if (data.token) {
			localStorage.setItem('authToken', data.token);
			console.log("Token JWT stocké dans localStorage.");
		} else {
			console.warn("Aucun token reçu dans la réponse de connexion.");
			alert("Problème lors de la réception du token d'authentification.");
			return null;
		}
		return data;
	} catch (error) {
		console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
		alert("Erreur de connexion au serveur. Vérifiez votre connexion ou réessayez plus tard.");
		return null;
	}
}

export function getAuthToken(): string | null {
	return localStorage.getItem('authToken');
}

export function logout(): void {
	localStorage.removeItem('authToken');
	console.log("Token JWT supprimé.");
	// Vous voudrez probablement aussi rediriger l'utilisateur vers la page de connexion/accueil
	// window.location.href = '/login'; // Ou utiliser votre système de routage
}

export async function attemptRegister(credentials: RegisterCredentials): Promise<RegisterSuccessData['user'] | null> {
	// Adapt this URL if your Fastify prefix or route name is different!
	const registerUrl = '/api/users/auth/register'; // <-- !! ADAPTEZ SI NECESSAIRE !!

	try {
		// Remove avatar_url if it's empty or null, as the backend schema might expect a valid URL or nothing
		const payload: any = { ...credentials };
		if (!payload.avatar_url) {
			delete payload.avatar_url;
		}

		const response = await fetch(registerUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			// Gérer les erreurs HTTP (400, 409, 5xx)
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
			let errorData: ApiErrorResponse = { error: "Une erreur inconnue est survenue lors de l'inscription." };
			try {
				errorData = await response.json();
			} catch (jsonError) {
				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
			}

			// Afficher l'erreur spécifique retournée par l'API
			alert(`Échec de l'inscription : ${errorData.error || response.statusText}`);
			return null; // Indique l'échec
		}

		// Si l'inscription réussit (status 201 Created)
		const data: RegisterSuccessData = await response.json();
		console.log("Inscription réussie:", data);
		alert(data.message || "Inscription réussie ! Vous pouvez maintenant vous connecter.");

		// Retourner les données de l'utilisateur créé
		return data.user;

	} catch (error) {
		// Gérer les erreurs réseau
		console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
		alert("Erreur de connexion au serveur lors de l'inscription. Veuillez réessayer.");
		return null; // Indique l'échec
	}
}
