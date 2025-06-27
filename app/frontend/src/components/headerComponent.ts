import { User } from '../shared/schemas/usersSchemas.js';
import { navigateTo } from '../services/router.js';
import { logout } from '../services/authService.js';
import { showToast } from './toast.js';
import { t, getLanguage, setLanguage } from '../services/i18nService.js';

interface HeaderProps {
	currentUser?: User | null;
}

interface NavLink {
	href: string;
	textKey: string;
}

export function HeaderComponent(props: HeaderProps): HTMLElement {
	const { currentUser } = props;

	const headerContainer = document.createElement('div');
	headerContainer.className = 'relative z-50 flex justify-between items-center px-6 py-2 bg-gray-900/60 backdrop-blur-lg border-b border-gray-400/30 shadow-lg';

	// --- Left side: Language Button ---
	const leftSection = document.createElement('div');
	const langButton = document.createElement('button');

	langButton.className = 'flex items-center justify-center p-1.5 rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75';

	const flagImg = document.createElement('img');
	flagImg.className = 'h-8 w-auto object-contain rounded-md shadow-sm';

	const updateFlag = () => {
		const currentLang = getLanguage();
		if (currentLang === 'fr') {
			flagImg.src = '/assets/flagEn.svg';
			flagImg.alt = 'Switch to English';
		} else {
			flagImg.src = '/assets/flagFr.svg';
			flagImg.alt = 'Passer en Français';
		}
	};
	updateFlag();
	langButton.appendChild(flagImg);

	langButton.addEventListener('click', () => {
		const newLang = getLanguage() === 'fr' ? 'en' : 'fr';
		setLanguage(newLang);
		updateFlag();
	});
	leftSection.appendChild(langButton);

	// --- Center: Navigation Links ---
	const centerSection = document.createElement('div');
	centerSection.className = 'flex-grow flex justify-center space-x-2 sm:space-x-4';

	const navLinks: NavLink[] = [
		{ href: '/', textKey: 'header.home' },
		...(currentUser ? [
			{ href: '/game', textKey: 'header.game' },
			{ href: '/dashboard', textKey: 'header.dashboard' },
		] : [
			{ href: '/local-game', textKey: 'header.game' }
		]),
	];

	navLinks.forEach(linkInfo => {
		const linkElement = document.createElement('a');
		linkElement.href = linkInfo.href;
		linkElement.textContent = t(linkInfo.textKey);
		linkElement.className = 'text-gray-200 hover:text-white hover:bg-white/10 font-medium px-4 py-2 rounded-lg transition-all duration-200 ease-in-out text-base';
		linkElement.setAttribute('data-link', '');
		centerSection.appendChild(linkElement);
	});

	// --- Right side: User Menu OR Auth Buttons ---
	const rightSection = document.createElement('div');
	rightSection.className = 'flex items-center space-x-4 relative';

	// --- LOGGED-IN STATE ---
	if (currentUser) {
		const userHeader = document.createElement('div');
		userHeader.className = 'flex items-center space-x-4 relative';

		const avatarDisplayWrapper = document.createElement('div');
		avatarDisplayWrapper.className = 'bg-teal-600/20 hover:bg-teal-500/30 border border-teal-500/30 p-1.5 rounded-lg flex items-center space-x-3 cursor-pointer select-none transition-all duration-200 hover:scale-105';
		const displayNameHeader = document.createElement('span');
		displayNameHeader.className = 'text-white font-semibold text-base pr-1';
		displayNameHeader.textContent = currentUser.display_name || currentUser.username;

		const avatarHeader = document.createElement('img');
		avatarHeader.className = 'w-8 h-8 rounded-full object-cover border-2 border-white';
		const avatarFallbackName = currentUser.display_name || currentUser.username;
		avatarHeader.src = currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarFallbackName)}&background=0D8ABC&color=fff&size=128`;
		avatarHeader.alt = 'User Avatar';

		avatarDisplayWrapper.appendChild(displayNameHeader);
		avatarDisplayWrapper.appendChild(avatarHeader);

		const miniMenu = document.createElement('div');
		miniMenu.className = 'absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-600/50 z-50 hidden flex-col origin-top-right';
		miniMenu.style.top = '110%';

		const settingsButton = document.createElement('a');
		settingsButton.href = '/profile';
		settingsButton.setAttribute('data-link', '');
		settingsButton.className = 'block px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-t-lg transition-colors';
		settingsButton.textContent = t('header.settings');

		const logoutButtonEl = document.createElement('button');
		// logoutButtonEl.className = 'block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-b-lg transition-colors';
		logoutButtonEl.className = 'block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-b-lg transition-colors';
		logoutButtonEl.textContent = t('header.logout');
		logoutButtonEl.addEventListener('click', async (e) => {
			e.stopPropagation();
			try {
				await logout();
				showToast(t('header.logoutSuccess'), 'success');
			} catch (error) {
				showToast(t('header.logoutError'), 'error');
			} finally {
				navigateTo('/');
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
			miniMenu.classList.toggle('flex', menuOpen);
		};

		avatarDisplayWrapper.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleMenu(!menuOpen);
		});

		document.addEventListener('click', (event: MouseEvent) => {
			if (menuOpen && !userHeader.contains(event.target as Node)) {
				toggleMenu(false);
			}
		});

		// --- LOGGED-OUT STATE ---
	} else {
		const authLinks = document.createElement('div');
		authLinks.className = 'flex items-center space-x-2 sm:space-x-4';

		const loginLink = document.createElement('a');
		loginLink.href = "/login";
		loginLink.setAttribute('data-link', '');
		loginLink.className = "text-sm sm:text-base font-semibold px-4 py-2 rounded-lg text-gray-200 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors duration-300";
		loginLink.textContent = t('login.title');

		const registerLink = document.createElement('a');
		registerLink.href = "/register";
		registerLink.setAttribute('data-link', '');
		registerLink.className = "text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105";
		registerLink.textContent = t('register.title');

		authLinks.appendChild(loginLink);
		authLinks.appendChild(registerLink);
		rightSection.appendChild(authLinks);
	}

	headerContainer.appendChild(leftSection);
	headerContainer.appendChild(centerSection);
	headerContainer.appendChild(rightSection);

	return headerContainer;
}
