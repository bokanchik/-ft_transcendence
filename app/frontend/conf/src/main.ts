import { HomePage } from './components/homePage.js';
import { LoginPage } from './components/loginPage.js'
import { RegisterPage } from './components/registerPage.js'
import { UsersPage } from './pages/userPage.js';
import { GamePage } from './components/gamePage.js';
import { GameRoomPage } from './pages/gameRoomPage.js';
import { navigateTo } from './services/router.js'; // à ajouter en haut
import { DashboardPage } from './components/dashboardPage.js'
import { ProfilePage } from './components/profilePage.js';
import { getUserDataFromStorage } from './services/authService.js';
import { promptAliasForm } from './components/aliasFormPage.js';
import { GameMode } from './components/gamePage.js'

// Conteneur où le contenu de la page sera injecté
const appContainer = document.getElementById('main');

interface RouteConfig {
	component: () => HTMLElement | Promise<HTMLElement>;
	requiredAuth?: boolean;
}

function renderNotFoundPage(): HTMLElement {
	const div = document.createElement('div');
	div.innerHTML = `
        <h1 class="text-3xl font-bold text-red-500 text-center p-8">404 - Page Non Trouvée</h1>
        <p class="text-center">Oups! Cette page n'existe pas.</p>
        <div class="text-center mt-4">
            <a href="/" data-link class="text-blue-500 hover:underline">Retour à l'accueil</a>
        </div>
    `;
	return div;
}

const routes: { [key: string]: RouteConfig } = {
	'/': { component: HomePage },
	'/users': { component: UsersPage },
	'/login': { component: LoginPage },
	'/register': { component: RegisterPage },
	'/dashboard': { component: DashboardPage, requiredAuth: true },
	'/profile': { component: ProfilePage, requiredAuth: true },
	'/game': { component: GamePage },
	'/local-game': { component: promptAliasForm},
	'/game-room': { component: () => GameRoomPageFromParams() },
};

function GameRoomPageFromParams(): HTMLElement {
	const urlParams = new URLSearchParams(window.location.search);
	const mode = urlParams.get('mode') as GameMode || 'local';
	return GameRoomPage(mode);
}

export async function router() {
	if (!appContainer) {
		console.error("ERREUR: Le conteneur #app est introuvable dans le DOM !");
		return;
	}
	const path = window.location.pathname;
	console.log(`navigateTo: ${path}`); // Read actual URL after domain name
	const routeCfg = routes[path];
	if (!routeCfg) {
		appContainer.innerHTML = '';
		appContainer.appendChild(renderNotFoundPage());
		return;
	}
	if (routeCfg.requiredAuth) {
		const authData = getUserDataFromStorage();
		if (!authData) {
			console.log('Utilisateur non authentifié, redirection vers la page de connexion.');

			navigateTo('/login');
			return;
		}
	}
	const renderFunction = routeCfg.component;
	appContainer.innerHTML = '';
	try {
		const pageContent = await renderFunction();
		appContainer.appendChild(pageContent);
	} catch (error) {
		console.error(`Erreur lors du rendu de la route ${path}:`, error);
		appContainer.innerHTML = `<p class="text-red-500 text-center p-8">Une erreur est survenue lors du chargement de la page.</p>`;
	}
}

// !! fonction est hebernée dans le fichier service/router.ts parce que j'ai besoin de l'utiliser dans d'autres fichiers
// export function navigateTo(url: string) {
// 	window.history.pushState({}, '', url);	// Met à jour l'URL dans la barre d'adresse sans recharger
// 	router();
// }

// Se déclenche lorsque le HTML initial est chargé
document.addEventListener('DOMContentLoaded', () => {
	// Attache un écouteur de clic global pour intercepter les liens SPA
	document.body.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		// Trouve l'élément <a> le plus proche qui a l'attribut [data-link]
		const linkElement = target.closest('a[data-link]') as HTMLAnchorElement | null;
		if (linkElement) {
			event.preventDefault(); // Empêche le navigateur de suivre le lien normalement
			const destination = linkElement.getAttribute('href');
			if (destination) {
				navigateTo(destination);
			}
		}
	});
	router();
});

// Se déclenche lorsque l'utilisateur utilise les boutons Précédent/Suivant du navigateur
window.addEventListener('popstate', () => {
	router();
});
