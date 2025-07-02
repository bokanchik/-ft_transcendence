import { HomePage } from './pages/homePage.js';
import { LoginPage } from './pages/loginPage.js';
import { RegisterPage } from './pages/registerPage.js';
import { GameRoomPage } from './pages/gameRoomPage.js';
import { DashboardPage } from './pages/dashboardPage.js';
import { SettingsPage } from './pages/settingsPage.js';
import { ProfilePage } from './pages/profilePage.js';
import { GamePage } from './components/gamePage.js';
import { TournamentPage } from './pages/tournamentTree.js';
import { getUserDataFromStorage } from './services/authService.js';
import { promptAliasForm } from './components/SelectGameModeForm.js';
import { navigateTo } from './services/router.js';
import { initI18n, t } from './services/i18nService.js';
import { showcase } from './components/showcase.js';
import { createElement, clearElement } from './utils/domUtils.js';
const appContainer = document.getElementById('main');
function renderNotFoundPage() {
    const backLink = createElement('a', {
        href: '/',
        textContent: 'Back to Home',
        className: 'text-blue-500 hover:underline'
    });
    backLink.setAttribute('data-link', '');
    return createElement('div', {}, [
        createElement('h1', { textContent: '404 - Page Not Found', className: 'text-3xl font-bold text-red-500 text-center p-8' }),
        createElement('p', { textContent: 'Oops! This page does not exist.', className: 'text-center' }),
        createElement('div', { className: 'text-center mt-4' }, [backLink])
    ]);
}
const routes = {
    '/': { component: showcase },
    '/homePage': { component: HomePage },
    '/login': { component: LoginPage },
    '/register': { component: RegisterPage },
    '/dashboard': { component: DashboardPage, requiredAuth: true },
    '/profile': { component: SettingsPage, requiredAuth: true },
    '/profile/:id': { component: (params) => ProfilePage(params ?? {}), requiredAuth: true },
    '/game': { component: GamePage },
    '/local-game': { component: promptAliasForm },
    '/game-room': { component: () => GameRoomPageFromParams() },
    '/tournament': { component: TournamentPage }
};
function GameRoomPageFromParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'local';
    return GameRoomPage(mode);
}
export async function router() {
    if (!appContainer) {
        console.error("ERROR: The #app container was not found in the DOM!");
        return;
    }
    const path = window.location.pathname;
    console.log(`navigateTo: ${path}`);
    let routeCfg = routes[path];
    let params = {};
    if (!routeCfg) {
        for (const routePattern in routes) {
            if (routePattern.includes('/:')) {
                const base = routePattern.split('/:')[0];
                if (path.startsWith(base + '/')) {
                    const paramName = routePattern.split('/:')[1];
                    const paramValue = path.slice(base.length + 1);
                    routeCfg = routes[routePattern];
                    if (paramName === 'id') {
                        params.userId = paramValue;
                    }
                    else {
                        params[paramName] = paramValue;
                    }
                    break;
                }
            }
        }
    }
    if (!routeCfg) {
        clearElement(appContainer);
        appContainer.appendChild(renderNotFoundPage());
        return;
    }
    if (routeCfg.requiredAuth) {
        const authData = getUserDataFromStorage();
        if (!authData) {
            console.log('User not logged in, redirecting to login page...');
            navigateTo('/login');
            return;
        }
    }
    const renderFunction = routeCfg.component;
    clearElement(appContainer);
    try {
        const pageContent = await renderFunction(params);
        appContainer.appendChild(pageContent);
    }
    catch (error) {
        console.error(`Error while rendering route "${path}":`, error);
        const errorElement = createElement('p', {
            textContent: 'An error occurred while loading the page.',
            className: 'text-red-500 text-center p-8'
        });
        appContainer.appendChild(errorElement);
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    document.title = t('app.title');
    document.body.addEventListener('click', (event) => {
        const target = event.target;
        const linkElement = target.closest('a[data-link]');
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
window.addEventListener('popstate', router);
