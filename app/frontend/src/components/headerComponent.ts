// src/components/headerComponent.ts
import { User } from '../shared/schemas/usersSchemas.js';
import { navigateTo } from '../services/router.js'; // Assuming navigateTo handles data-link
import { logout } from '../services/authService.js';
import { showToast } from './toast.js';
import { t, getLanguage, setLanguage } from '../services/i18nService.js';

interface HeaderProps {
	currentUser: User;
}

interface NavLink {
	href: string;
	textKey: string; // On utilise une clé de traduction au lieu de texte en dur
}

export function HeaderComponent(props: HeaderProps): HTMLElement {
	const { currentUser } = props;

	const headerContainer = document.createElement('div');
	headerContainer.className = 'flex justify-between items-center p-4 border-b border-gray-200 bg-white';

	// --- Left side: Language Button ---
	const leftSection = document.createElement('div');
	const langButton = document.createElement('button');
	langButton.className = 'bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-blue-600 transition-colors';
    
    // Le bouton affiche la langue vers laquelle on veut basculer
	langButton.textContent = getLanguage() === 'fr' ? 'EN' : 'FR';
	
    langButton.addEventListener('click', () => {
        const newLang = getLanguage() === 'fr' ? 'en' : 'fr';
        setLanguage(newLang); // Appelle la fonction qui change la langue et rafraîchit tout
    });
	leftSection.appendChild(langButton);

	// --- Center: Navigation Links ---
	const centerSection = document.createElement('div');
	centerSection.className = 'flex-grow flex justify-center space-x-4 sm:space-x-6';

	const navLinks: NavLink[] = [
		{ href: '/', textKey: 'header.home' },
		{ href: '/game', textKey: 'header.game' },
		{ href: '/dashboard', textKey: 'header.dashboard' },
	];

	navLinks.forEach(linkInfo => {
		const linkElement = document.createElement('a');
		linkElement.href = linkInfo.href;
		linkElement.textContent = t(linkInfo.textKey); // traduit
		linkElement.className = 'text-gray-600 hover:text-blue-600 font-medium transition-colors px-2 py-1 text-sm sm:text-base';
		linkElement.setAttribute('data-link', '');
		centerSection.appendChild(linkElement);
	});

	// --- Right side: User Header (Avatar & Menu) ---
	const rightSection = document.createElement('div');
    const userHeader = document.createElement('div');
	userHeader.className = 'flex items-center space-x-4 relative';

	const avatarDisplayWrapper = document.createElement('div');
	avatarDisplayWrapper.className = 'bg-orange-400 p-2 rounded-lg flex items-center space-x-3 cursor-pointer select-none';

	const displayNameHeader = document.createElement('span');
	displayNameHeader.className = 'text-white font-semibold text-sm';
	displayNameHeader.textContent = currentUser.display_name || currentUser.username;

	const avatarHeader = document.createElement('img');
	avatarHeader.className = 'w-10 h-10 rounded-full object-cover border-2 border-white';
	const avatarFallbackName = currentUser.display_name || currentUser.username;
	avatarHeader.src = currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarFallbackName)}&background=0D8ABC&color=fff&size=128`;
	avatarHeader.alt = 'User Avatar';

	avatarDisplayWrapper.appendChild(displayNameHeader);
	avatarDisplayWrapper.appendChild(avatarHeader);


	const miniMenu = document.createElement('div');
	miniMenu.className = 'absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50 hidden flex-col';
	miniMenu.style.top = '110%';

	const settingsButton = document.createElement('a');
	settingsButton.href = '/profile';
	settingsButton.setAttribute('data-link', '');
	settingsButton.className = 'block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg';
	settingsButton.textContent = t('header.settings'); // Traduction

	const logoutButtonEl = document.createElement('button');
	logoutButtonEl.className = 'block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg';
	logoutButtonEl.textContent = t('header.logout'); // Traduction
	logoutButtonEl.addEventListener('click', async (e) => {
		e.stopPropagation();
		try {
			await logout();
			showToast('You have been logged out.', 'success'); // a traduire
		} catch (error) {
			showToast('Error logging out.', 'error'); // a traduire
		} finally {
			navigateTo('/login');
		}
	});

	miniMenu.appendChild(settingsButton);
	miniMenu.appendChild(logoutButtonEl);
	userHeader.appendChild(avatarDisplayWrapper);
	userHeader.appendChild(miniMenu);
	rightSection.appendChild(userHeader);

    let menuOpen = false;
	const toggleMenu = (show: boolean) => {
		menuOpen = show;
		miniMenu.classList.toggle('hidden', !menuOpen);
	};

	avatarDisplayWrapper.addEventListener('click', (e) => {
		e.stopPropagation();
		toggleMenu(!menuOpen);
	});

	const globalClickListener = (event: MouseEvent) => {
		if (menuOpen && !userHeader.contains(event.target as Node)) {
			toggleMenu(false);
		}
	};
	document.addEventListener('click', globalClickListener);


	// Assemble the header sections
	headerContainer.appendChild(leftSection);
	headerContainer.appendChild(centerSection);
	headerContainer.appendChild(rightSection);

	return headerContainer;
}