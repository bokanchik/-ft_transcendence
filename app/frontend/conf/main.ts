import { HomePage } from './components/homePage.ts';
import { LoginPage } from './pages/loginPage.ts'
import { RegisterPage } from './components/registerPage.ts'
import { UsersPage } from './pages/userPage.ts';
import { GamePage } from './components/gamePage.ts';
import { GameRoomPage } from './pages/gameRoomPage.ts';
import { navigateTo } from './services/router.ts';
import { DashboardPage } from './pages/dashboardPage.ts'
import { SettingsPage } from './pages/settingsPage.ts';
import { ProfilePage } from './pages/profilePage.ts';
import { getUserDataFromStorage } from './services/authService.ts';
import { promptAliasForm } from './components/aliasFormPage.ts';
import { GameMode } from './components/gamePage.ts'
import { showcase } from './components/showcase.ts';
import './style/style.css';
import './style/plant1.css';

// Conteneur où le contenu de la page sera injecté
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
    '/': { component: showcase },
	'/homePage': { component: HomePage },
    '/users': { component: UsersPage },
    '/login': { component: LoginPage },
    '/register': { component: RegisterPage },
    '/dashboard': { component: DashboardPage, requiredAuth: true },
    '/profile': { component: SettingsPage, requiredAuth: true },
    '/profile/:id': {
        component: (params) => ProfilePage(params ?? {}),
        requiredAuth: true
    },
    '/game': { component: GamePage },
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
    appContainer.innerHTML = `
	<div class="relative bg-amber-900">
		<div class="plant1 pointer-none absolute top-1/2 right-0 bg-blue-600 translate-25">	
			<div class="rotate-parent">
				<div class="rotate-hover">
					<svg width="400" height="352" viewBox="0 0 405 352" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g class="plant1 fixed pointer-none">
							<path id="branch" d="M368.535 206.71C368.234 207.318 367.71 207.848 366.977 208.302C357.01 209.056 328.707 208.314 282.573 201.239C173.195 180.655 13.0573 135.558 138.297 169.734C197.576 185.91 245.753 195.591 282.573 201.239C324.38 209.106 358.772 213.393 366.977 208.302C371.788 207.938 372.326 207.226 368.535 206.71Z" fill="#0E3C05" stroke="#0E3C05" stroke-width="2"/>
							<g id="leaves">
								<path class=" origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M342.946 211.23C330.392 253.91 296.969 303.929 281.826 323.603C307.903 260.73 308.333 250.777 342.946 211.23Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M343.503 208.24C358.893 165.954 341.338 113.805 333.199 93.2834C335.109 133.353 339.476 188.896 343.503 208.24Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M310.952 207.035C282.949 254.734 249.054 301.565 235.607 319.019C249.386 287.497 283.745 220.97 310.952 207.035Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M310.867 204.343C324.596 147.618 299.536 98.0579 283.011 71.8242C288.568 107.723 301.919 184.485 310.867 204.343Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M288.91 203.269C255.532 255.503 238.611 272.756 187.938 303.797C198.978 289.547 234.628 249.491 288.91 203.269Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M286.561 202.414C285.73 122.83 262.286 95.1421 246.101 79.6734C255.662 106.033 271.58 160.247 286.561 202.414Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M262.299 198.904C235.052 232.831 190.87 262.119 172.185 272.523C187.284 254.429 226.445 214.374 262.299 198.904Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M256.234 195.1C262.22 175.144 238.82 143.535 212.652 82.3975C213.473 98.659 223.339 143.966 256.234 195.1Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M234.32 192.445C183.694 239.147 153.265 256.769 144.379 259.742C150.947 249.008 178.129 220.52 234.32 192.445Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M219.926 186.674C219.082 152.739 193.452 102.014 180.742 80.893C183.67 101.114 195.605 150.579 219.926 186.674Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M206 186.926C175.019 220.878 162.118 224.163 125.376 237.395C137.867 227.93 171.479 204.584 206 186.926Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M195.364 182.523C182.836 136.247 150.833 104.593 136.397 94.5496C143.754 110.884 165.847 151.347 195.364 182.523Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M177.253 179.656C138.697 206.061 109.094 213.91 99.1117 214.533C108.626 205.935 137.574 186.923 177.253 179.656Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:verySmallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M157.647 173.584C147.335 143.439 120.015 119.093 107.643 110.689C116.51 125.799 138.924 159.533 157.647 173.584Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:verySmallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M126.209 166.398C88.3365 190.924 66.9933 195.571 61.0557 194.829C70.2851 187.014 96.2368 170.388 126.209 166.398Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M107.543 160.668C87.3878 134.177 57.4035 122.022 54.4986 122.207C73.8701 140.325 97.9329 155.397 107.543 160.668Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:verySmallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M94.8138 157.632C68.5314 165.518 42.0868 153.871 32.1498 147.062C35.6103 145.838 52.9878 146.239 94.8138 157.632Z" fill="#067042" stroke="#067042"/>
							</g>
						</g>
					</svg>
				</div>
			</div>
		</div>
		<div class="plant2 pointer-none absolute top-0 left-0">
			<div class="rotate-parent origin-top rotate-90 translate-25">
				<div class="rotate-hover ">
					<svg width="492" height="400" viewBox="0 0 492 737" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g id="Plant2">
							<g id="branch2">
								<path d="M296.239 736C212.827 644.571 99.2878 432.449 300.292 207.38C319.177 185.66 338.302 167.254 355.5 152.5C334.912 170.84 316.571 189.153 300.292 207.38C207.177 314.475 119.906 502.115 298.239 729.5L296.239 736Z" fill="#0E3C05"/>
								<path d="M296.239 736C206.072 637.167 80.7 397.3 355.5 152.5C253.5 240 83.7386 456 298.239 729.5L296.239 736Z" stroke="#0E3C05"/>
							</g>
							<path class="origin-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M246.5 666.5C181.167 641.167 40.6 579.9 1 537.5C22.1667 575.5 100.9 654.5 246.5 666.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M230 639.5C180 618.667 64.9 543.1 4.5 407.5C57.6667 462.167 177.2 585.1 230 639.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M214 599.5C171 566 74.1 462.1 30.5 314.5C85 393.333 198 560.7 214 599.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M209 564C227.5 529.5 274.7 453.6 315.5 426C273.333 439 193 484.8 209 564Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M195.5 507C213.833 461.333 277.2 368.3 384 361.5C330.667 343.5 218.3 347.4 195.5 507Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M190.5 497C147.667 462.5 62.2 353.9 63 195.5C88.9999 274.167 150.9 444.6 190.5 497Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M138.5 288.5C170.1 340.9 186.333 414.667 190.5 445C197.167 416.5 195.087 358.163 179.5 323.5C146 249 125 194.5 113.5 119C108.667 153.667 106.9 236.1 138.5 288.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M193 432.5C233.667 384.833 324.1 288.8 360.5 286C318.333 281.167 225.8 303.7 193 432.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallnegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M206.5 364C195.833 290.5 168.8 126.4 146 58C176.833 96.3333 232.1 211.2 206.5 364Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M236.5 300C217 231.333 197.6 75.4 276 1C265.333 32.1667 242.5 135.6 236.5 300Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M265 250C252.5 212.167 242.9 113.4 304.5 21C298 76.1667 281 199.2 265 250Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M304.5 200.5C301.167 153 315.6 49.1 400 13.5C378 54.3333 328.1 148.9 304.5 200.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M345.5 162C372.333 134.667 438.9 75.6 490.5 58C462.5 95.5 394.3 168.8 345.5 162Z" fill="#25885D" stroke="#25885D"/>
						</g>
					</svg>
				</div>
			</div>
		</div>
		<div class="plant1 pointer-none absolute top-1/2 left-1 bg-blue-600 -translate-25 [transform:scaleX(-1)]">	
			<div class="rotate-parent ">
				<div class="rotate-hover">
					<svg width="400" height="352" viewBox="0 0 405 352" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g class="plant1 fixed pointer-none">
							<path id="branch1" d="M368.535 206.71C368.234 207.318 367.71 207.848 366.977 208.302C357.01 209.056 328.707 208.314 282.573 201.239C173.195 180.655 13.0573 135.558 138.297 169.734C197.576 185.91 245.753 195.591 282.573 201.239C324.38 209.106 358.772 213.393 366.977 208.302C371.788 207.938 372.326 207.226 368.535 206.71Z" fill="#0E3C05" stroke="#0E3C05" stroke-width="2"/>
							<g id="leaves">
								<path class=" origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M342.946 211.23C330.392 253.91 296.969 303.929 281.826 323.603C307.903 260.73 308.333 250.777 342.946 211.23Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M343.503 208.24C358.893 165.954 341.338 113.805 333.199 93.2834C335.109 133.353 339.476 188.896 343.503 208.24Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M310.952 207.035C282.949 254.734 249.054 301.565 235.607 319.019C249.386 287.497 283.745 220.97 310.952 207.035Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M310.867 204.343C324.596 147.618 299.536 98.0579 283.011 71.8242C288.568 107.723 301.919 184.485 310.867 204.343Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M288.91 203.269C255.532 255.503 238.611 272.756 187.938 303.797C198.978 289.547 234.628 249.491 288.91 203.269Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M286.561 202.414C285.73 122.83 262.286 95.1421 246.101 79.6734C255.662 106.033 271.58 160.247 286.561 202.414Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M262.299 198.904C235.052 232.831 190.87 262.119 172.185 272.523C187.284 254.429 226.445 214.374 262.299 198.904Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M256.234 195.1C262.22 175.144 238.82 143.535 212.652 82.3975C213.473 98.659 223.339 143.966 256.234 195.1Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M234.32 192.445C183.694 239.147 153.265 256.769 144.379 259.742C150.947 249.008 178.129 220.52 234.32 192.445Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M219.926 186.674C219.082 152.739 193.452 102.014 180.742 80.893C183.67 101.114 195.605 150.579 219.926 186.674Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M206 186.926C175.019 220.878 162.118 224.163 125.376 237.395C137.867 227.93 171.479 204.584 206 186.926Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M195.364 182.523C182.836 136.247 150.833 104.593 136.397 94.5496C143.754 110.884 165.847 151.347 195.364 182.523Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M177.253 179.656C138.697 206.061 109.094 213.91 99.1117 214.533C108.626 205.935 137.574 186.923 177.253 179.656Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:verySmallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M157.647 173.584C147.335 143.439 120.015 119.093 107.643 110.689C116.51 125.799 138.924 159.533 157.647 173.584Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:verySmallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M126.209 166.398C88.3365 190.924 66.9933 195.571 61.0557 194.829C70.2851 187.014 96.2368 170.388 126.209 166.398Z" fill="#067042" stroke="#067042"/>
								<path class="origin-top-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M107.543 160.668C87.3878 134.177 57.4035 122.022 54.4986 122.207C73.8701 140.325 97.9329 155.397 107.543 160.668Z" fill="#067042" stroke="#067042"/>
								<path class="origin-bottom [animation:verySmallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M94.8138 157.632C68.5314 165.518 42.0868 153.871 32.1498 147.062C35.6103 145.838 52.9878 146.239 94.8138 157.632Z" fill="#067042" stroke="#067042"/>
							</g>
						</g>
					</svg>
				</div>
			</div>
		</div>
		<div class="plant2 pointer-none absolute top-100 left-0">
			<div class="rotate-parent origin-top rotate-80 translate-25">
				<div class="rotate-hover ">
					<svg width="350" height="300" viewBox="0 0 492 737" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g id="Plant2">
							<g id="branch2">
								<path d="M296.239 736C212.827 644.571 99.2878 432.449 300.292 207.38C319.177 185.66 338.302 167.254 355.5 152.5C334.912 170.84 316.571 189.153 300.292 207.38C207.177 314.475 119.906 502.115 298.239 729.5L296.239 736Z" fill="#0E3C05"/>
								<path d="M296.239 736C206.072 637.167 80.7 397.3 355.5 152.5C253.5 240 83.7386 456 298.239 729.5L296.239 736Z" stroke="#0E3C05"/>
							</g>
							<path class="origin-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M246.5 666.5C181.167 641.167 40.6 579.9 1 537.5C22.1667 575.5 100.9 654.5 246.5 666.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M230 639.5C180 618.667 64.9 543.1 4.5 407.5C57.6667 462.167 177.2 585.1 230 639.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M214 599.5C171 566 74.1 462.1 30.5 314.5C85 393.333 198 560.7 214 599.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M209 564C227.5 529.5 274.7 453.6 315.5 426C273.333 439 193 484.8 209 564Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M195.5 507C213.833 461.333 277.2 368.3 384 361.5C330.667 343.5 218.3 347.4 195.5 507Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M190.5 497C147.667 462.5 62.2 353.9 63 195.5C88.9999 274.167 150.9 444.6 190.5 497Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M138.5 288.5C170.1 340.9 186.333 414.667 190.5 445C197.167 416.5 195.087 358.163 179.5 323.5C146 249 125 194.5 113.5 119C108.667 153.667 106.9 236.1 138.5 288.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M193 432.5C233.667 384.833 324.1 288.8 360.5 286C318.333 281.167 225.8 303.7 193 432.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallnegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M206.5 364C195.833 290.5 168.8 126.4 146 58C176.833 96.3333 232.1 211.2 206.5 364Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M236.5 300C217 231.333 197.6 75.4 276 1C265.333 32.1667 242.5 135.6 236.5 300Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M265 250C252.5 212.167 242.9 113.4 304.5 21C298 76.1667 281 199.2 265 250Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M304.5 200.5C301.167 153 315.6 49.1 400 13.5C378 54.3333 328.1 148.9 304.5 200.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M345.5 162C372.333 134.667 438.9 75.6 490.5 58C462.5 95.5 394.3 168.8 345.5 162Z" fill="#25885D" stroke="#25885D"/>
						</g>
					</svg>
				</div>
			</div>
		</div>
		<div class="plant2 pointer-none absolute top-70 left-0">
			<div class="rotate-parent origin-top rotate-70 translate-25">
				<div class="rotate-hover ">
					<svg width="350" height="400" viewBox="0 0 492 737" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g id="Plant2">
							<g id="branch2">
								<path d="M296.239 736C212.827 644.571 99.2878 432.449 300.292 207.38C319.177 185.66 338.302 167.254 355.5 152.5C334.912 170.84 316.571 189.153 300.292 207.38C207.177 314.475 119.906 502.115 298.239 729.5L296.239 736Z" fill="#0E3C05"/>
								<path d="M296.239 736C206.072 637.167 80.7 397.3 355.5 152.5C253.5 240 83.7386 456 298.239 729.5L296.239 736Z" stroke="#0E3C05"/>
							</g>
							<path class="origin-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M246.5 666.5C181.167 641.167 40.6 579.9 1 537.5C22.1667 575.5 100.9 654.5 246.5 666.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M230 639.5C180 618.667 64.9 543.1 4.5 407.5C57.6667 462.167 177.2 585.1 230 639.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M214 599.5C171 566 74.1 462.1 30.5 314.5C85 393.333 198 560.7 214 599.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M209 564C227.5 529.5 274.7 453.6 315.5 426C273.333 439 193 484.8 209 564Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M195.5 507C213.833 461.333 277.2 368.3 384 361.5C330.667 343.5 218.3 347.4 195.5 507Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M190.5 497C147.667 462.5 62.2 353.9 63 195.5C88.9999 274.167 150.9 444.6 190.5 497Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M138.5 288.5C170.1 340.9 186.333 414.667 190.5 445C197.167 416.5 195.087 358.163 179.5 323.5C146 249 125 194.5 113.5 119C108.667 153.667 106.9 236.1 138.5 288.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M193 432.5C233.667 384.833 324.1 288.8 360.5 286C318.333 281.167 225.8 303.7 193 432.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallnegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M206.5 364C195.833 290.5 168.8 126.4 146 58C176.833 96.3333 232.1 211.2 206.5 364Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M236.5 300C217 231.333 197.6 75.4 276 1C265.333 32.1667 242.5 135.6 236.5 300Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M265 250C252.5 212.167 242.9 113.4 304.5 21C298 76.1667 281 199.2 265 250Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M304.5 200.5C301.167 153 315.6 49.1 400 13.5C378 54.3333 328.1 148.9 304.5 200.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M345.5 162C372.333 134.667 438.9 75.6 490.5 58C462.5 95.5 394.3 168.8 345.5 162Z" fill="#25885D" stroke="#25885D"/>
						</g>
					</svg>
				</div>
			</div>
		</div>
		<div class="plant2 pointer-none absolute top-10 right-0 [transform:scaleX(-1)]">
			<div class="rotate-parent origin-top rotate-70 translate-25">
				<div class="rotate-hover ">
					<svg width="350" height="400" viewBox="0 0 492 737" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g id="Plant2">
							<g id="branch2">
								<path d="M296.239 736C212.827 644.571 99.2878 432.449 300.292 207.38C319.177 185.66 338.302 167.254 355.5 152.5C334.912 170.84 316.571 189.153 300.292 207.38C207.177 314.475 119.906 502.115 298.239 729.5L296.239 736Z" fill="#0E3C05"/>
								<path d="M296.239 736C206.072 637.167 80.7 397.3 355.5 152.5C253.5 240 83.7386 456 298.239 729.5L296.239 736Z" stroke="#0E3C05"/>
							</g>
							<path class="origin-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M246.5 666.5C181.167 641.167 40.6 579.9 1 537.5C22.1667 575.5 100.9 654.5 246.5 666.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M230 639.5C180 618.667 64.9 543.1 4.5 407.5C57.6667 462.167 177.2 585.1 230 639.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M214 599.5C171 566 74.1 462.1 30.5 314.5C85 393.333 198 560.7 214 599.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M209 564C227.5 529.5 274.7 453.6 315.5 426C273.333 439 193 484.8 209 564Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M195.5 507C213.833 461.333 277.2 368.3 384 361.5C330.667 343.5 218.3 347.4 195.5 507Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M190.5 497C147.667 462.5 62.2 353.9 63 195.5C88.9999 274.167 150.9 444.6 190.5 497Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M138.5 288.5C170.1 340.9 186.333 414.667 190.5 445C197.167 416.5 195.087 358.163 179.5 323.5C146 249 125 194.5 113.5 119C108.667 153.667 106.9 236.1 138.5 288.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallNegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M193 432.5C233.667 384.833 324.1 288.8 360.5 286C318.333 281.167 225.8 303.7 193 432.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-right [animation:smallnegativeRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M206.5 364C195.833 290.5 168.8 126.4 146 58C176.833 96.3333 232.1 211.2 206.5 364Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M236.5 300C217 231.333 197.6 75.4 276 1C265.333 32.1667 242.5 135.6 236.5 300Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M265 250C252.5 212.167 242.9 113.4 304.5 21C298 76.1667 281 199.2 265 250Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M304.5 200.5C301.167 153 315.6 49.1 400 13.5C378 54.3333 328.1 148.9 304.5 200.5Z" fill="#25885D" stroke="#25885D"/>
							<path class="origin-bottom-left [animation:smallPositiveRotation_1s_ease-in-out_infinite_alternate] [transform-box:fill-box]" d="M345.5 162C372.333 134.667 438.9 75.6 490.5 58C462.5 95.5 394.3 168.8 345.5 162Z" fill="#25885D" stroke="#25885D"/>
						</g>
					</svg>
				</div>
			</div>
		</div>
	</div>
`;
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
document.addEventListener('DOMContentLoaded', () => {
	console.log("main.js chargé à " + new Date().toLocaleTimeString());
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
