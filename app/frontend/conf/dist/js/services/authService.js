const AUTH_KEY = 'authDataKey';
// Recupere le token et les données utilisateur depuis localStorage (objet global du navigateur Web)
export function getUserDataFromStorage() {
    const data = localStorage.getItem(AUTH_KEY);
    try {
        const parsedData = data ? JSON.parse(data) : null;
        if (parsedData && parsedData.token && parsedData.user) {
            return parsedData;
        }
        localStorage.removeItem(AUTH_KEY);
        return parsedData;
        //return null;
    }
    catch (e) {
        console.error("Erreur lors de la lecture des données d'authentification", e);
        localStorage.removeItem(AUTH_KEY);
        throw new Error;
        //return null;
    }
}
// Fait un fetch POST /api/users/auth/login et stocke le token JWT dans localStorage en cas du succès
export async function attemptLogin(credentials) {
    const loginUrl = '/api/users/auth/login';
    try {
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
            let errorData = { error: `Server error (${response.status})` };
            try {
                errorData = await response.json();
            }
            catch (jsonError) {
                console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
            }
            return { success: false, error: errorData.error || response.statusText };
        }
        const data = await response.json();
        console.log("Connexion réussie:", data);
        // **Action cruciale : Stocker le token JWT**
        // localStorage est simple mais vulnérable au XSS. sessionStorage est légèrement mieux.
        // Les cookies HttpOnly gérés par le backend sont l'option la plus sûre.
        // Pour cet exemple, utilisons localStorage.
        /** Lorsque l'attribut HttpOnly est indiqué, le cookie est inaccessible
         *  en JavaScript et ne peut pas être manipulé avec l'API Document.cookie,
         * 	il est uniquement envoyé au serveur. Ainsi, les cookies qui persistent
         *  côté serveur pour les sessions n'ont pas besoin d'être disponibles en
         * 	JavaScript et devraient être paramétrés avec l'attribut HttpOnly.
         *  Cette précaution permet de réduire les risque d'attaque XSS. */
        if (data && data.token && data.user) {
            const dataToStore = { token: data.token, user: data.user };
            localStorage.setItem(AUTH_KEY, JSON.stringify(dataToStore));
            console.log("Token JWT stocké dans localStorage.");
            return { success: true, data: data };
        }
        else {
            console.warn("Aucun token reçu dans la réponse de connexion.");
            alert("Problème lors de la réception du token d'authentification.");
            return { success: false, error: "Problème lors de la réception du token d'authentification." };
        }
    }
    catch (error) {
        console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        return { success: false, error: `Erreur de connexion au serveur lors de la connexion. Vérifiez votre connexion (${errorMessage})` };
    }
}
// Supprime le token JWT du localStorage
export function logout() {
    localStorage.removeItem(AUTH_KEY);
    console.log("Token JWT supprimé.");
}
// POST vers /api/users/auth/register
export async function attemptRegister(credentials) {
    const registerUrl = '/api/users/auth/register';
    try {
        // Remove avatar_url if it's empty or null, as the backend schema might expect a valid URL or nothing
        const payload = { ...credentials };
        if (!payload.avatar_url) {
            delete payload.avatar_url;
        }
        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            // Gérer les erreurs HTTP (400, 409, 5xx)
            console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
            let errorData = { error: `Server error (${response.status})` };
            try {
                errorData = await response.json();
            }
            catch (jsonError) {
                console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
            }
            return { success: false, error: errorData.error || response.statusText };
        }
        // Si l'inscription réussit (status 201 Created)
        const data = await response.json();
        console.log("Inscription réussie:", data);
        return { success: true, data: data };
    }
    catch (error) {
        console.error("Erreur réseau ou autre problème lors de l'appel fetch:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        return { success: false, error: `Erreur de connexion au serveur lors de l'inscription. Vérifiez votre connexion (${errorMessage})` };
    }
}
// PATCH vers /api/users/me avec le token JWT dans le header
export async function updateUserProfile(payload) {
    // Déterminez l'URL de votre endpoint API pour la mise à jour
    const profileUpdateUrl = '/api/users/me'; // Commun, mais adaptez ! (pourrait être /api/users/:id)
    const authData = getUserDataFromStorage();
    if (!authData || !authData.token) {
        console.error("Tentative de mise à jour du profil sans être connecté.");
        return { success: false, error: "Authentification requise." };
    }
    const token = authData.token;
    try {
        const response = await fetch(profileUpdateUrl, {
            // Méthode: PATCH est souvent préféré pour les mises à jour partielles
            // PUT remplacerait toute la ressource (peut nécessiter tous les champs)
            method: 'PATCH', // Ou 'PUT' selon votre API
            headers: {
                'Content-Type': 'application/json',
                // Inclure le token JWT pour l'authentification
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status} ${response.statusText}`);
            let errorData = { error: `Erreur serveur (${response.status})` };
            try {
                errorData = await response.json();
            }
            catch (jsonError) {
                console.error("Impossible de parser la réponse d'erreur JSON:", jsonError);
            }
            return { success: false, error: errorData.error || response.statusText };
        }
        // Succès !
        const data = await response.json();
        console.log("Profil mis à jour avec succès via API:", data);
        // --- CRUCIAL: Mettre à jour les données dans localStorage ---
        // On combine le token existant avec les nouvelles données utilisateur reçues
        const updatedAuthData = {
            token: token, // Garder le même token
            user: data.user // Utiliser les données utilisateur fraîches de la réponse
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(updatedAuthData));
        console.log("Données d'authentification mises à jour dans localStorage.");
        // Retourner succès avec les données utilisateur mises à jour
        return { success: true, data: data.user };
    }
    catch (error) {
        console.error("Erreur réseau ou autre problème lors de la mise à jour du profil:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        return { success: false, error: `Erreur de connexion au serveur lors de la mise à jour (${errorMessage})` };
    }
}
