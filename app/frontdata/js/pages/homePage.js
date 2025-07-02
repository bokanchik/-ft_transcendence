import { t } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { getUserDataFromStorage } from '../services/authService.js';
import { createElement } from '../utils/domUtils.js';
export function HomePage() {
    const currentUser = getUserDataFromStorage();
    const title = createElement('h2', {
        textContent: t('app.subtitle'),
        className: 'text-4xl sm:text-6xl md:text-7xl font-extrabold mb-4 text-shadow-lg font-beach'
    });
    const subtitle = createElement('p', {
        textContent: t('app.catchPhrase'),
        className: 'text-lg sm:text-xl text-gray-200 mb-12 max-w-2xl text-shadow font-beach'
    });
    const playButton = createElement('a', {
        href: '/local-game',
        textContent: t('app.button'),
        className: 'bg-red-800 hover:bg-red-600 text-white font-black text-2xl sm:text-4xl py-4 sm:py-6 px-10 sm:px-16 rounded-full shadow-2xl uppercase tracking-widest transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-red-600/50 font-beach'
    });
    playButton.setAttribute('data-link', '');
    const mainContent = createElement('main', {
        className: 'relative z-10 flex flex-col items-center text-center'
    }, [title, subtitle, playButton]);
    const styleElement = createElement('style', {
        textContent: `
			.text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
			.text-shadow-lg { text-shadow: 0 4px 8px rgba(0,0,0,0.5); }
		`
    });
    const container = createElement('div', {
        className: 'relative bg-cover bg-center flex-grow text-white flex flex-col items-center justify-center p-4 sm:p-8'
    }, [mainContent, styleElement]);
    const pageWrapper = createElement('div', {
        className: 'flex flex-col min-h-screen bg-cover bg-center'
    }, [
        HeaderComponent({ currentUser }),
        container
    ]);
    pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
    return pageWrapper;
}
