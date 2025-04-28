export interface User {
	id: number;
	username: string;
	email: string;
	display_name: string;
	avatar_url: string | null;
	wins: number;
	losses: number;
	created_at: string;
	updated_at: string;
}

export async function fetchUsers(): Promise<User[]> {
	try {
		const response = await fetch('/api/users/'); // NGINX ADDRESS
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

async function attemptCreateUser(userData: any) {
	try {
		const response = await fetch('/api/users', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				// Ajouter d'autres headers si nécessaire (ex: Authorization)
			},
			body: JSON.stringify(userData), // Convertit l'objet JS en chaîne JSON
		});

		// --- C'EST LA VÉRIFICATION CRUCIALE ---
		if (!response.ok) {
			// response.ok est false pour les statuts HTTP 4xx et 5xx
			console.error(`HTTP error! status: ${response.status} ${response.statusText}`);

			// Essayer de lire le corps de l'erreur JSON envoyé par Fastify
			let errorData = { message: "Une erreur inconnue est survenue." }; // Valeur par défaut
			try {
				// Attend que le corps de la réponse (qui contient l'erreur JSON) soit lu
				errorData = await response.json();
			} catch (jsonError) {
				// Si le corps de la réponse n'était pas du JSON valide
				console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
				// On garde le message d'erreur par défaut
			}

			// Afficher l'erreur à l'utilisateur de manière appropriée
			// NE PAS afficher directement errorData si ça contient des détails techniques !
			// Utilise le message si disponible et pertinent, sinon un message générique.
			alert(`Erreur lors de la création : ${errorData.message || 'Vérifiez les informations fournies.'}`); // Exemple simple avec alert

			// Peut-être retourner null ou lancer une erreur spécifique du frontend
			return null;
		}

		// --- Si response.ok est true (statut 2xx, ex: 201 Created) ---
		console.log("Utilisateur créé avec succès !");

		// Lire le corps de la réponse de succès (l'utilisateur créé)
		const createdUser = await response.json();
		console.log("Données de l'utilisateur créé:", createdUser);

		// Faire quelque chose avec l'utilisateur créé (ex: mettre à jour l'UI, rediriger...)
		alert(`Utilisateur ${createdUser.username} créé avec succès !`);
		return createdUser; // Retourner l'utilisateur créé

	} catch (error) {
		// Ce bloc 'catch' attrape principalement les erreurs RÉSEAU
		// (ex: serveur injoignable, problème DNS, CORS bloqué...)
		console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
		alert("Erreur de connexion au serveur. Veuillez réessayer plus tard.");
		return null;
	}
}

// Exemple d'utilisation (ex: depuis un formulaire)
// const formData = { username: 'testuser', email: 'invalid-email', /* ... autres champs ... */ };
// attemptCreateUser(formData);
