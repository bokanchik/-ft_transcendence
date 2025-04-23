// src/services/authService.ts

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginSuccessResponse {
  message: string;
  token: string;
  user: { // Adapter cette interface à la structure exacte retournée par votre backend
    id: number;
    username: string;
    email: string;
    display_name: string;
    // Ajoutez d'autres champs si nécessaire (avatar_url, etc.)
  };
}

// Interface pour la réponse d'erreur attendue du backend
export interface ApiErrorResponse {
    error: string;
}

// Fonction pour tenter la connexion
export async function attemptLogin(credentials: LoginCredentials): Promise<LoginSuccessResponse | null> {
  // Déterminez l'URL correcte de votre API login.
  // Si vous avez un préfixe '/api/v1' dans Fastify (via fastify.register), utilisez-le.
  // Sinon, si la route est juste '/login', utilisez '/login'.
  // Adaptez cette URL si nécessaire !
  const loginUrl = '/api/v1/login'; // <-- !! ADAPTEZ SI VOTRE PREFIXE EST DIFFERENT ou absent !!

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      // Gérer les erreurs HTTP (4xx, 5xx)
      console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
      let errorData: ApiErrorResponse = { error: "Une erreur inconnue est survenue côté serveur." };
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
      }
      // Afficher l'erreur spécifique retournée par l'API si possible
      alert(`Échec de la connexion : ${errorData.error || response.statusText}`);
      return null; // Indique l'échec
    }

    // Si la connexion réussit (status 2xx)
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


    // Retourner les données de succès (token + user info)
    return data;

  } catch (error) {
    // Gérer les erreurs réseau (serveur injoignable, CORS, etc.)
    console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
    alert("Erreur de connexion au serveur. Vérifiez votre connexion ou réessayez plus tard.");
    return null; // Indique l'échec
  }
}

// Fonction pour récupérer le token stocké
export function getAuthToken(): string | null {
    return localStorage.getItem('authToken');
}

// Fonction pour se déconnecter (supprimer le token)
export function logout(): void {
    localStorage.removeItem('authToken');
    console.log("Token JWT supprimé.");
    // Vous voudrez probablement aussi rediriger l'utilisateur vers la page de connexion/accueil
    // window.location.href = '/login'; // Ou utiliser votre système de routage
}
