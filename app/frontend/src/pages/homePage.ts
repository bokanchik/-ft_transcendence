import { t } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { getUserDataFromStorage } from '../services/authService.js';

export function HomePage(): HTMLElement {
	const currentUser = getUserDataFromStorage();

	const pageWrapper = document.createElement('div');
	pageWrapper.className = 'flex flex-col min-h-screen bg-gray-100';

	const headerElement = HeaderComponent({ currentUser });
	pageWrapper.appendChild(headerElement);

	const container = document.createElement('div');
	container.className = 'relative bg-cover bg-center flex-grow text-white flex flex-col items-center justify-center p-4 sm:p-8';
	container.style.backgroundImage = "url('https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8anVuZ2xlfGVufDB8fDB8fHww')";

	const overlay = document.createElement('div');
	overlay.className = 'absolute inset-0 bg-black/40';

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
	// playButton.href = currentUser ? '/game' : '/local-game'; // If you want to redirect to the game page for logged-in users
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
	// footer.className = 'relative z-10 w-full text-center py-4';
	footer.className = 'relative z-10 w-full text-center py-2 bg-gray-900 bg-opacity-70';

	const apiLink = document.createElement('a');
	apiLink.href = '/game';
	apiLink.setAttribute('data-link', '');
	apiLink.className = 'text-xs text-gray-400 hover:text-white hover:underline transition-colors duration-300';
	apiLink.textContent = t('app.gameApi');

	footer.appendChild(apiLink);

	container.appendChild(overlay);
	container.appendChild(mainContent);

	pageWrapper.appendChild(container);
	pageWrapper.appendChild(footer);

	const style = document.createElement('style');
	style.textContent = `
		.text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
		.text-shadow-lg { text-shadow: 0 4px 8px rgba(0,0,0,0.5); }
	`;
	container.appendChild(style);

	return pageWrapper;
}
