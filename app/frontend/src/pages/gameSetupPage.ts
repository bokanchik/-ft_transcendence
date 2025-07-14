import { navigateTo } from '../services/router.js';
import { handleOnlineGame, handleTournamentSearch, cleanupSocket } from '../services/initOnlineGame.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { User } from '../shared/schemas/usersSchemas.js';
import { getUserDataFromStorage, checkAuthStatus } from '../services/authService.js';
import { showToast, removeWaitingToast } from '../components/toast.js';
import { t } from '../services/i18nService.js';
import { createElement, createActionButton, clearElement } from '../utils/domUtils.js';
import socket from '../services/socket.js';

export function GamePage(): HTMLElement {
	const authData = getUserDataFromStorage();

	if (!authData) {
		console.warn("GamePage: User not authenticated, redirecting to login.");
		navigateTo('/login');
		return createElement('div');
	}
	const currentUser: User = authData as User;

	const buttonsContainer = createElement('div', { id: 'buttons-container', className: 'flex flex-col items-center space-y-4' });

	function setButtonsState(isSearching: boolean, searchingText: string = '...') {
		buttonsContainer.querySelectorAll('button').forEach(btn => {
			const actionButton = btn as HTMLButtonElement;
			if (actionButton.dataset.action === 'cancel-search') return;

			actionButton.disabled = isSearching;
			if (isSearching && actionButton.textContent === searchingText.split('...')[0]) {
				actionButton.textContent = searchingText;
			}
		});
	}

	const showInitialOptions = () => {
		clearElement(buttonsContainer);

		const quickMatchButton = createActionButton({
			text: t('game.quickMatch'),
			variant: 'primary',
			baseClass: 'bg-teal-800 hover:bg-green-600 text-gray-200 text-2xl font-beach font-medium py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out border border-green-500/50',
			onClick: async (e) => {
				(e.currentTarget as HTMLButtonElement).disabled = true;
				await onlineGameHandler();
			}
		});

		const tournamentButton = createActionButton({
			text: t('game.startTournament'),
			variant: 'secondary',
			baseClass: 'bg-yellow-700 hover:bg-yellow-600 text-white text-2xl font-beach font-medium py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out border border-yellow-500/50',
			onClick: () => showTournamentOptions()
		});

		buttonsContainer.append(quickMatchButton, tournamentButton);
	};

	const showTournamentOptions = () => {
		clearElement(buttonsContainer);

		const tournamentTitle = createElement('h3', { textContent: t('game.selectTournamentSize'), className: 'text-xl text-white font-semibold mb-3' });
		const optionsDiv = createElement('div', { className: 'flex justify-center gap-3' });

		[2, 4, 8].forEach(size => {
			const sizeButton = createActionButton({
				text: t('game.players', { count: size.toString() }),
				variant: 'info',
				baseClass: 'bg-teal-800 hover:bg-green-600 text-gray-200 text-xl font-beach font-medium py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out border border-green-500/50',
				onClick: async () => {
					const buttonText = t('game.players', { count: size.toString() });
					setButtonsState(true, buttonText + '...');
					setupCancelButton(showTournamentOptions);
					await tournamentSearchHandler(size);
				}
			});
			optionsDiv.appendChild(sizeButton);
		});

		const backButton = createActionButton({
			text: t('general.back'),
			variant: 'secondary',
			onClick: () => showInitialOptions()
		});

		buttonsContainer.append(tournamentTitle, optionsDiv, backButton);
	};

	function setupCancelButton(returnToState: () => void) {
		clearElement(buttonsContainer);
		const cancelButton = createActionButton({
			text: t('general.cancel'),
			variant: 'danger',
			dataAction: 'cancel-search',
			onClick: () => {
				cleanupSocket(socket);
				removeWaitingToast();
				returnToState();
			}
		});
		buttonsContainer.appendChild(cancelButton);
	}

	showInitialOptions();

	const title = createElement('h2', {
		textContent: t('game.welcome'),
		className: 'text-4xl font-medium mb-6 text-center text-white font-beach'
	});

	const homeLink = createElement('a', { href: '/', textContent: t('link.home'), className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors' });
	homeLink.setAttribute('data-link', '');

	const footer = createElement('div', { className: 'mt-6 text-center' }, [homeLink]);

	const formContainer = createElement('div', {
		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full'
	}, [title, buttonsContainer, footer]);

	const gameContentContainer = createElement('div', { className: 'flex-grow flex justify-center items-center p-4 sm:p-8' }, [formContainer]);

	const pageWrapper = createElement('div', {
		className: 'flex flex-col min-h-screen bg-cover bg-center bg-fixed'
	}, [
		HeaderComponent({ currentUser }),
		gameContentContainer
	]);
	pageWrapper.style.backgroundImage = "url('/assets/background.webp')";

	return pageWrapper;
}

async function onlineGameHandler() {
	try {
		const freshUser = await checkAuthStatus();
		if (!freshUser) {
			showToast(t('game.deniedMsg'), 'error');
			navigateTo('/login');
			return;
		}
		sessionStorage.setItem('gameMode', 'remote');
		await handleOnlineGame(freshUser.display_name, freshUser.id);
	} catch (err) {
		console.error(`Failed to initiate quick match:`, err);
		showToast(t('msg.error.any'), 'error');
	}
}

async function tournamentSearchHandler(size: number) {
	try {
		const freshUser = await checkAuthStatus();
		if (!freshUser) {
			showToast(t('game.deniedMsg'), 'error');
			navigateTo('/login');
			return;
		}
		sessionStorage.setItem('gameMode', 'onlineTournament');
		await handleTournamentSearch(size, freshUser.display_name, freshUser.id);
	} catch (err) {
		console.error(`Failed to initiate tournament search:`, err);
		showToast(t('msg.error.any'), 'error');
	}
}
