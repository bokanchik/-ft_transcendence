import { User } from '../shared/schemas/usersSchemas.js';
import { navigateTo } from '../services/router.js';
import { logout } from '../services/authService.js';
import { showToast } from './toast.js';
import { t, getLanguage, setLanguage } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';

interface HeaderProps {
	currentUser?: User | null;
}

interface NavLink {
	href: string;
	textKey: string;
}

const languages: Record<string, { flag: string; name: string }> = {
    fr: { flag: '/assets/flagFr.svg', name: 'Français' },
    en: { flag: '/assets/flagEn.svg', name: 'English' },
    es: { flag: '/assets/flagEs.svg', name: 'Español' },
	ru: { flag: '/assets/flagRu.svg', name: 'Русский' },
};

export function HeaderComponent(props: HeaderProps): HTMLElement {
	const { currentUser } = props;

	// --- Left Side: Language Dropdown ---
	const currentLanguage = getLanguage();
	const currentLangData = languages[currentLanguage] || languages['en'];

	const flagImg = createElement('img', {
		src: currentLangData.flag,
		alt: `Current language: ${currentLangData.name}`,
		className: 'h-8 w-auto object-contain rounded-md shadow-sm'
	});
	const langButton = createElement('button', {
		className: 'flex items-center justify-center p-1.5 rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75'
	}, [flagImg]);

	const langMenuItems = Object.entries(languages)
		.filter(([langCode]) => langCode !== currentLanguage)
		.map(([langCode, langData]) => {
			const menuItem = createElement('button', {
				className: 'w-full flex items-center px-4 py-2 text-left text-gray-200 hover:bg-white/10 transition-colors rounded-md'
			}, [
				createElement('img', { src: langData.flag, alt: langData.name, className: 'h-6 w-6 mr-3 rounded-sm' }),
				document.createTextNode(langData.name)
			]);
			menuItem.dataset.lang = langCode;
			return menuItem;
		});

	const langMenu = createElement('div', {
		className: 'absolute left-0 mt-2 w-48 bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-lg shadow-xl z-50 hidden flex-col origin-top-left p-2'
	}, langMenuItems);

	const leftSection = createElement('div', { className: 'relative' }, [langButton, langMenu]);
	
	// --- Center: Navigation Links ---
	const navLinks: NavLink[] = [
		{ href: '/', textKey: 'header.home' },
		...(currentUser ? [
			{ href: '/game', textKey: 'header.game' },
			{ href: '/dashboard', textKey: 'header.dashboard' },
		] : [
			{ href: '/local-game', textKey: 'header.game' }
		]),
	];
	const navLinkElements = navLinks.map(linkInfo => {
		const link = createElement('a', {
			href: linkInfo.href,
			textContent: t(linkInfo.textKey),
			className: 'text-gray-200 hover:text-gray-200 hover:bg-white/10 font-medium px-4 py-2 rounded-lg transition-all duration-200 ease-in-out text-3xl font-beach'
		});
		link.setAttribute('data-link', '');
		return link;
	});
	const centerSection = createElement('div', {
		className: 'flex-grow flex justify-center space-x-2 sm:space-x-4'
	}, navLinkElements);

	// --- Right side: User Menu OR Auth Buttons ---
	const rightSection = createElement('div', { className: 'flex items-center space-x-4' });

	let userMenu: HTMLElement | null = null;
	if (currentUser) {
		const avatarFallbackName = currentUser.display_name || currentUser.username;
		const avatarHeader = createElement('img', {
			src: currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarFallbackName)}&background=0D8ABC&color=fff&size=128`,
			alt: 'User Avatar',
			className: 'w-8 h-8 rounded-full object-cover border-2 border-white'
		});
		const displayNameHeader = createElement('span', {
			textContent: currentUser.display_name || currentUser.username,
			className: 'text-gray-200 font-medium text-xl pr-1 font-beach'
		});
		const avatarDisplayWrapper = createElement('div', {
			className: 'bg-teal-600/20 hover:bg-teal-500/30 border border-teal-500/30 p-1.5 rounded-lg flex items-center space-x-3 cursor-pointer select-none transition-all duration-200 hover:scale-105'
		}, [displayNameHeader, avatarHeader]);

		const settingsButton = createElement('a', { href: '/profile', textContent: t('header.settings'), className: 'block px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-t-lg transition-colors' });
		settingsButton.setAttribute('data-link', '');

		const logoutButtonEl = createElement('button', { textContent: t('header.logout'), className: 'block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700 rounded-b-lg transition-colors' });
		logoutButtonEl.dataset.testid = 'logout-button';
		
		userMenu = createElement('div', {
			className: 'absolute right-0 mt-2 w-48 bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-lg shadow-xl z-50 hidden flex-col origin-top-right p-2 space-y-1'
		}, [settingsButton, logoutButtonEl]);
		userMenu.style.top = '110%';

		const userHeader = createElement('div', { className: 'flex items-center space-x-4 relative' }, [avatarDisplayWrapper, userMenu]);
		rightSection.append(userHeader);
		
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

		let userMenuOpen = false;
		const toggleUserMenu = (show: boolean) => {
			userMenuOpen = show;
			userMenu!.classList.toggle('hidden', !userMenuOpen);
			userMenu!.classList.toggle('flex', userMenuOpen);
		};
		avatarDisplayWrapper.addEventListener('click', (e) => {
			e.stopPropagation();
			toggleUserMenu(!userMenuOpen);
		});
	} else {
		// --- LOGGED-OUT STATE ---
		const loginLink = createElement('a', { href: "/login", textContent: t('login.title'), className: "text-sm sm:text-base font-semibold px-4 py-2 rounded-lg text-gray-200 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors duration-300" });
		loginLink.setAttribute('data-link', '');

		const registerLink = createElement('a', { href: "/register", textContent: t('register.title'), className: "text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105" });
		registerLink.setAttribute('data-link', '');
		
		const authLinks = createElement('div', { className: 'flex items-center space-x-2 sm:space-x-4' }, [loginLink, registerLink]);
		rightSection.append(authLinks);
	}

	// --- Assemblage final du header ---
	const headerContainer = createElement('div', {
		className: 'relative z-50 flex justify-between items-center px-6 py-2 bg-gray-900/60 backdrop-blur-lg border-b border-gray-400/30 shadow-lg'
	}, [leftSection, centerSection, rightSection]);

	// --- Logique des menus (dropdowns) ---
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

	document.addEventListener('click', (event: MouseEvent) => {
		const target = event.target as Node;
		if (langMenuOpen && !leftSection.contains(target)) {
			toggleLangMenu(false);
		}
		if (userMenu && rightSection.contains(userMenu) && rightSection.querySelector('.relative')?.contains(target) === false) {
			const userHeaderDiv = rightSection.querySelector('.relative');
			if (userHeaderDiv && !userHeaderDiv.contains(target)) {
				const userMenuState = !userMenu.classList.contains('hidden');
				if (userMenuState) {
					userMenu.classList.add('hidden');
					userMenu.classList.remove('flex');
				}
			}
		}
	}, { capture: true, once: true });

	return headerContainer;
}
