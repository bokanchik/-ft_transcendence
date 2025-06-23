import { t } from '../services/i18nService.js';

export function HomePage(): HTMLElement {

	const container = document.createElement('div');
	container.className = 'relative bg-cover bg-center min-h-screen text-white flex flex-col items-center justify-between p-4 sm:p-8';
	container.style.backgroundImage = "url('https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8anVuZ2xlfGVufDB8fDB8fHww')";

	const overlay = document.createElement('div');
	overlay.className = 'absolute inset-0 bg-black/40';

	const header = document.createElement('header');
	header.className = 'relative z-10 w-full flex justify-between items-center';

	const logo = document.createElement('h1');
	logo.className = 'text-2xl sm:text-3xl font-bold tracking-wider text-shadow';
	logo.innerHTML = `🏓 <span class="hidden sm:inline">${t('app.title')}</span>`;

	const authLinks = document.createElement('div');
	authLinks.className = 'flex items-center space-x-2 sm:space-x-4';
	authLinks.innerHTML = `
		<a href="/login" data-link class="text-sm sm:text-base font-semibold px-4 py-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-300">
			${t('login.title')}
		</a>
		<a href="/register" data-link class="text-sm sm:text-base bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-full shadow-lg transition-transform duration-300 transform hover:scale-105">
			${t('register.title')}
		</a>
	`;
	header.appendChild(logo);
	header.appendChild(authLinks);

	const mainContent = document.createElement('main');
	mainContent.className = 'relative z-10 flex flex-col items-center text-center';

	const title = document.createElement('h2');
	title.className = 'text-4xl sm:text-6xl md:text-7xl font-extrabold mb-4 text-shadow-lg';
	title.textContent = t('app.subtitle');

	const subtitle = document.createElement('p');
	subtitle.className = 'text-lg sm:text-xl text-gray-200 mb-12 max-w-2xl text-shadow';
	subtitle.textContent = t('app.catchPhrase');

	const playButton = document.createElement('a');
	playButton.href = '/local-game';
	playButton.setAttribute('data-link', '');
	playButton.className = `
		bg-red-600 hover:bg-red-500 text-white font-black 
		text-2xl sm:text-4xl py-4 sm:py-6 px-10 sm:px-16 rounded-full shadow-2xl 
		uppercase tracking-widest 
		transition-all duration-300 ease-in-out 
		transform hover:scale-110 hover:shadow-red-500/50
	`;
	playButton.textContent = t('app.button');

	mainContent.appendChild(title);
	mainContent.appendChild(subtitle);
	mainContent.appendChild(playButton);

	const footer = document.createElement('footer');
	footer.className = 'relative z-10 w-full text-center';

	const apiLink = document.createElement('a');
	apiLink.href = '/game';
	apiLink.setAttribute('data-link', '');
	apiLink.className = 'text-xs text-gray-400 hover:text-white hover:underline transition-colors duration-300';
	apiLink.textContent = t('app.gameApi');

	footer.appendChild(apiLink);

	container.appendChild(overlay);
	container.appendChild(header);
	container.appendChild(mainContent);
	container.appendChild(footer);

	const style = document.createElement('style');
	style.textContent = `
		.text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
		.text-shadow-lg { text-shadow: 0 4px 8px rgba(0,0,0,0.5); }
	`;
	container.appendChild(style);

	return container;
}
