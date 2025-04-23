// src/services/authService.ts

// Interface for the data needed for registration
export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
    display_name: string;
    avatar_url?: string; // Optional
}

// Interface for the expected successful registration response from the backend
export interface RegisterSuccessData {
    message: string;
    user: { // Reuse or adapt your User interface
        id: number;
        username: string;
        email: string;
        display_name: string;
        avatar_url: string | null;
        // Add other fields returned by the backend on registration if needed
    };
}

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
  const loginUrl = '/api/users/auth/login'; // <-- !! ADAPTEZ SI VOTRE PREFIXE EST DIFFERENT ou absent !!

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
