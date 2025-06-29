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

// Objet de configuration pour les langues
const languages: Record<string, { flag: string; name: string }> = {
    fr: { flag: '/assets/flagFr.svg', name: 'Français' },
    en: { flag: '/assets/flagEn.svg', name: 'English' },
    es: { flag: '/assets/flagEs.svg', name: 'Español' },
	ru: { flag: '/assets/flagRu.svg', name: 'Русский' },
};

export function HeaderComponent(props: HeaderProps): HTMLElement {
	const { currentUser } = props;

	const headerContainer = document.createElement('div');
	headerContainer.className = 'relative z-50 flex justify-between items-center px-6 py-2 bg-gray-900/60 backdrop-blur-lg border-b border-gray-400/30 shadow-lg';

	// --- Left side: Language Dropdown ---
	const leftSection = document.createElement('div');
	leftSection.className = 'relative';

	const currentLanguage = getLanguage();
	const currentLangData = languages[currentLanguage] || languages['en'];

	const langButton = document.createElement('button');
	langButton.className = 'flex items-center justify-center p-1.5 rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75';
	
	const flagImg = document.createElement('img');
	flagImg.className = 'h-8 w-auto object-contain rounded-md shadow-sm';
	flagImg.src = currentLangData.flag;
	flagImg.alt = `Current language: ${currentLangData.name}`;
	langButton.appendChild(flagImg);

	const langMenu = document.createElement('div');
	langMenu.className = 'absolute left-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-xl border border-gray-600/50 z-50 hidden flex-col origin-top-left';

	Object.entries(languages).forEach(([langCode, langData]) => {
		if (langCode !== currentLanguage) {
			const menuItem = document.createElement('button');
			menuItem.className = 'w-full flex items-center px-4 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors rounded-md';
			menuItem.dataset.lang = langCode;

			const menuItemFlag = document.createElement('img');
			menuItemFlag.src = langData.flag;
			menuItemFlag.className = 'h-6 w-6 mr-3 rounded-sm';
			menuItemFlag.alt = langData.name;

			menuItem.appendChild(menuItemFlag);
			menuItem.appendChild(document.createTextNode(langData.name));
			langMenu.appendChild(menuItem);
		}
	});

	let langMenuOpen = false;
	const toggleLangMenu = (show: boolean) => {
		langMenuOpen = show;
		langMenu.classList.toggle('hidden', !langMenuOpen);
		langMenu.classList.toggle('flex', langMenuOpen);
	};

	langButton.addEventListener('click', (e) => {
		e.stopPropagation();
		toggleLangMenu(!langMenuOpen);
	});

	langMenu.addEventListener('click', (e) => {
		const targetButton = (e.target as HTMLElement).closest('button[data-lang]');
		if (targetButton instanceof HTMLButtonElement) {
			const newLang = targetButton.dataset.lang;
			if (newLang) {
				setLanguage(newLang);
				toggleLangMenu(false);
			}
		}
	});

	leftSection.appendChild(langButton);
	leftSection.appendChild(langMenu);

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
		linkElement.className = 'text-gray-200 hover:text-gray-200 hover:bg-white/10 font-medium px-4 py-2 rounded-lg transition-all duration-200 ease-in-out text-xl font-roar';
		linkElement.setAttribute('data-link', '');
		centerSection.appendChild(linkElement);
	});

	// --- Right side: User Menu OR Auth Buttons ---
	const rightSection = document.createElement('div');
	rightSection.className = 'flex items-center space-x-4';

	if (currentUser) {
		const userHeader = document.createElement('div');
		userHeader.className = 'flex items-center space-x-4 relative';

		const avatarDisplayWrapper = document.createElement('div');
		avatarDisplayWrapper.className = 'bg-teal-600/20 hover:bg-teal-500/30 border border-teal-500/30 p-1.5 rounded-lg flex items-center space-x-3 cursor-pointer select-none transition-all duration-200 hover:scale-105';
		const displayNameHeader = document.createElement('span');
		displayNameHeader.className = 'text-gray-300 font-semibold text-xl pr-1 font-roar';
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

		let userMenuOpen = false;
		const toggleUserMenu = (show: boolean) => {
			userMenuOpen = show;
			miniMenu.classList.toggle('hidden', !userMenuOpen);
			miniMenu.classList.toggle('flex', userMenuOpen);
		};

		avatarDisplayWrapper.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleUserMenu(!userMenuOpen);
		});

		document.addEventListener('click', (event: MouseEvent) => {
			if (userMenuOpen && !userHeader.contains(event.target as Node)) {
				toggleUserMenu(false);
			}
			if (langMenuOpen && !leftSection.contains(event.target as Node)) {
				toggleLangMenu(false);
			}
		});
	} else {
		// --- LOGGED-OUT STATE ---
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

        document.addEventListener('click', (event: MouseEvent) => {
			if (langMenuOpen && !leftSection.contains(event.target as Node)) {
				toggleLangMenu(false);
			}
		});
	}

	headerContainer.appendChild(leftSection);
	headerContainer.appendChild(centerSection);
	headerContainer.appendChild(rightSection);

	return headerContainer;
}