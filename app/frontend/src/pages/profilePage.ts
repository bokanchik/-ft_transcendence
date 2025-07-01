import { navigateTo } from '../services/router.js';
import { getUserDataFromStorage, fetchUserDetails } from '../services/authService.js';
import { fetchCsrfToken } from '../services/csrf.js';
import { User } from '../shared/schemas/usersSchemas.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { showToast } from '../components/toast.js';
import { MatchHistoryComponent } from '../components/matchHistoryComponent.js';
import { t } from '../services/i18nService.js';
import { createElement } from '../utils/domUtils.js';

export async function ProfilePage(params: { userId?: string }): Promise<HTMLElement> {
	const loggedInUser: User | null = getUserDataFromStorage();

	if (!loggedInUser) {
		navigateTo('/login');
		return createElement('div', { textContent: t('msg.redirect.login'), className: 'min-h-screen flex items-center justify-center text-xl' });
	}

	const userIdToViewStr = params.userId;
	const userIdToView = userIdToViewStr ? parseInt(userIdToViewStr, 10) : loggedInUser.id;

	if (isNaN(userIdToView)) {
		return createElement('div', { textContent: t('msg.error.user.invalidUserId'), className: 'min-h-screen flex items-center justify-center text-xl text-red-500' });
	}

	try {
		await fetchCsrfToken();
	} catch (error) {
		console.error("Fail to recover CSRF token:", error);
		showToast(t('msg.error.user.errorCsrf'), 'error');
		return createElement('div', { textContent: t('msg.error.user.errorCsrf'), className: 'min-h-screen flex items-center justify-center text-xl text-red-500' });
	}

	const pageContainer = createElement('div', {
		className: 'min-h-screen p-4 sm:p-8 flex flex-col items-center bg-cover bg-center bg-fixed'
	});
	pageContainer.style.backgroundImage = "url('/assets/background.jpg')";
	
	const contentArea = createElement('div', { className: 'flex flex-1 w-full' });
	
	const profileWrapper = createElement('div', {
		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden'
	}, [
		HeaderComponent({ currentUser: loggedInUser }),
		createElement('div', { className: 'flex flex-1 min-h-[calc(100vh-150px)]' }, [contentArea])
	]);
	
	pageContainer.append(profileWrapper);

	const loadingProfileMsg = createElement('p', {
		textContent: t('user.loading'),
		className: 'text-center text-gray-200 py-20 flex-1 text-lg'
	});
	contentArea.append(loadingProfileMsg);

	try {
		const profiledUser = await fetchUserDetails(userIdToView);
		loadingProfileMsg.remove(); // Enlève le message de chargement

		// --- Création de la Sidebar ---
		const sidebar = createProfileSidebar(profiledUser, loggedInUser);
		
		// --- Création du contenu principal ---
		const matchHistoryElement = await MatchHistoryComponent({ userId: profiledUser.id });
		const contentWrapper = createElement('main', {
			className: 'w-3/4 p-6 flex flex-col overflow-y-auto'
		}, [matchHistoryElement]);

		contentArea.append(sidebar, contentWrapper);

	} catch (error) {
		console.error("An error occurred when loading profile page:", error);
		loadingProfileMsg.textContent = `${t('msg.error.user.loadingProfile')} : ${(error as Error).message}.`;
		loadingProfileMsg.classList.replace('text-gray-200', 'text-red-400');
	}

	return pageContainer;
}


function createProfileSidebar(profiledUser: User, loggedInUser: User): HTMLElement {
	const createSidebarItem = (label: string, value: string | number | Date | undefined | null, isSensitive: boolean = false): HTMLElement | null => {
		if (isSensitive && loggedInUser.id !== profiledUser.id) {
			return null;
		}
		const valueText = (value instanceof Date) ? value.toLocaleDateString() : (value?.toString() || 'N/A');
		return createElement('div', { className: 'p-3 bg-black/20 border border-gray-400/20 rounded-lg' }, [
			createElement('span', { textContent: label, className: 'text-xs text-gray-300 block mb-0.5 uppercase tracking-wider' }),
			createElement('p', { textContent: valueText, className: 'text-sm text-white font-medium truncate' })
		]);
	};
	
	const avatarImg = createElement('img', {
		src: profiledUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profiledUser.display_name)}&background=random&color=fff&size=128`,
		alt: `Avatar de ${profiledUser.display_name}`,
		className: 'w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-400/30 shadow-md mb-2'
	});

	const displayNameEl = createElement('h2', {
		textContent: profiledUser.display_name,
		className: 'text-xl font-semibold text-white text-center'
	});

	const avatarContainer = createElement('div', {
		className: 'flex flex-col items-center mb-4'
	}, [avatarImg, displayNameEl]);

	const infoItems = [
		createSidebarItem(t('user.email'), profiledUser.email, true),
		createSidebarItem(t('user.createdAt'), new Date(profiledUser.created_at)),
		createSidebarItem(t('user.wins'), profiledUser.wins ?? 0),
		createSidebarItem(t('user.losses'), profiledUser.losses ?? 0),
		createSidebarItem(t('user.status.title'), profiledUser.status),
	].filter(item => item !== null) as HTMLElement[];

	// return createElement('aside', {
	// 	className: 'w-1/4 p-6 border-r border-gray-400/30 space-y-4 overflow-y-auto flex flex-col'
	// }, [avatarContainer, ...infoItems]);

	return createElement('aside', {
		className: 'w-1/4 p-6 border-r border-gray-400/30 space-y-4 overflow-y-auto flex flex-col',
        role: 'complementary' // Ajout du rôle pour le test
	}, [avatarContainer, ...infoItems]);
}