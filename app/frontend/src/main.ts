import { HomePage } from './pages/homePage.js';
import { LoginPage } from './pages/loginPage.js'
import { RegisterPage } from './components/registerPage.js'
// import { UsersPage } from './pages/userPage.js';
import { GamePage } from './components/gamePage.js';
import { GameRoomPage } from './pages/gameRoomPage.js';
import { navigateTo } from './services/router.js';
import { DashboardPage } from './pages/dashboardPage.js'
import { SettingsPage } from './pages/settingsPage.js';
import { ProfilePage } from './pages/profilePage.js';
import { getUserDataFromStorage } from './services/authService.js';
import { promptAliasForm } from './components/aliasFormPage.js';
import { GameMode } from './components/gamePage.js'
import { initI18n, t } from './services/i18nService.js';
import { PlayAFriendPage } from './components/playAFriendPage.js';
const appContainer = document.getElementById('main');

interface RouteConfig {
    component: (params?: { [key: string]: string }) => HTMLElement | Promise<HTMLElement>;
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
    // '/users': { component: UsersPage },
    '/login': { component: LoginPage },
    '/register': { component: RegisterPage },
    '/dashboard': { component: DashboardPage, requiredAuth: true },
    '/profile': { component: SettingsPage, requiredAuth: true },
    '/profile/:id': {
        component: (params) => ProfilePage(params ?? {}),
        requiredAuth: true
    },
    '/game': { component: GamePage },
    '/invite': { component: PlayAFriendPage },
    '/local-game': { component: promptAliasForm },
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
    console.log(`navigateTo: ${path}`);

    let routeCfg = routes[path];
    let params: { [key: string]: string } = {};

    // Gestion des routes dynamiques (ex: /profile/:id)
    if (!routeCfg) {
        // Cherche une route dynamique qui matche
        for (const routePattern in routes) {
            if (routePattern.includes('/:')) {
                const base = routePattern.split('/:')[0];
                if (path.startsWith(base + '/')) {
                    const paramName = routePattern.split('/:')[1];
                    const paramValue = path.slice(base.length + 1);
                    routeCfg = routes[routePattern];
                    params[paramName] = paramValue;
                    break;
                }
            }
        }
    }

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
        // Passe les params à la page si besoin
        params.userId = params.id;
        const pageContent = await renderFunction(params);
        appContainer.appendChild(pageContent);
    } catch (error) {
        console.error(`Erreur lors du rendu de la route ${path}:`, error);
        appContainer.innerHTML = `<p class="text-red-500 text-center p-8">Une erreur est survenue lors du chargement de la page.</p>`;
    }
}

// Se déclenche lorsque le HTML initial est chargé
document.addEventListener('DOMContentLoaded', async () => {
    await initI18n(); // Initialise le service de traduction
    document.title = t('app.title');
	document.body.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		const linkElement = target.closest('a[data-link]') as HTMLAnchorElement | null;
		if (linkElement) {
			event.preventDefault();
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
