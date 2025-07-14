import { initLocalGame } from "../services/initLocalGame.js";
import { cancelAllSearches, showToast } from "../components/toast.js";
import { t } from "../services/i18nService.js";
import { HeaderComponent } from "../components/headerComponent.js";
import { getUserDataFromStorage } from "../services/authService.js";
import { createElement, createInputField, createSelectField, clearElement } from "../utils/domUtils.js";

export function promptAliasForm(): HTMLElement {
	const currentUser = getUserDataFromStorage();

	const dynamicInputs = createElement('div', { className: 'space-y-4' });
	const aliasFields = createElement('div', { className: 'space-y-4' });

	const scrollableContent = createElement('div', {
		className: 'flex-grow overflow-y-auto space-y-6 pr-4',
	}, [
		createSelectField('gameMode', t('game.settings.gameMode'), [t('game.settings.duel'), t('game.settings.tournament')]),
		dynamicInputs
	]);

	const submitButton = createElement('button', {
		type: 'submit',
		textContent: t('game.button'),
		className: 'w-full bg-teal-700 hover:bg-teal-600 text-white text-3xl font-beach font-bold py-2 px-4 rounded-lg transition-colors duration-200 border border-teal-600/50'
	});

	const buttonContainer = createElement('div', { className: 'flex-shrink-0 flex justify-center pt-4 mt-auto border-t border-gray-500/30' }, [submitButton]);

	const form = createElement('form', {
		className: 'flex flex-col flex-grow min-h-0'
	}, [
		scrollableContent,
		buttonContainer
	]);

	const formContainer = createElement('div', {
		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col max-h-[90vh]'
	}, [
		createElement('h2', {
			textContent: t('game.settings.gameMode'),
			className: 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-gray-300 font-beach'
		}),
		form,
		createElement('div', { className: 'flex-shrink-0 mt-6 text-center' }, [
			createElement('a', {
				href: '/',
				textContent: t('link.home'),
				className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors'
			}, [])
		])
	]);

	const pageWrapper = createElement('div', {
		className: 'flex flex-col h-screen bg-cover bg-center bg-fixed'
	}, [
		HeaderComponent({ currentUser }),
		createElement('div', {
			className: 'flex-grow flex items-center justify-center p-4 sm:p-8'
		}, [
			formContainer
		])
	]);
	pageWrapper.style.backgroundImage = "url('/assets/background.webp')";

	const selectElement = form.querySelector('#gameMode') as HTMLSelectElement;

	selectElement.addEventListener('change', () => {
		const value = selectElement.value;
		clearElement(dynamicInputs);
		clearElement(aliasFields);

		if (value === t('game.settings.duel')) {
			dynamicInputs.append(
				createInputField('alias1', `${t('game.player')} 1`),
				createInputField('alias2', `${t('game.player')} 2`)
			);
		} else if (value === t('game.settings.tournament')) {
			const countField = createInputField('playerCount', t('game.settings.nbPlayers'), {
				type: 'number',
				min: '2',
				max: '8',
				placeholder: t('game.settings.nbPlayersPlaceholder'),
			});
			const inputElement = countField.querySelector('input')!;

			dynamicInputs.append(countField, aliasFields);

			inputElement.addEventListener('input', () => {
				clearElement(aliasFields);
				const count = parseInt(inputElement.value);
				const validCounts = [2, 4, 8];

				if (isNaN(count) || !validCounts.includes(count)) {
					if (inputElement.value) showToast(t('game.settings.nbPlayersSpec'), 'error');
					return;
				}
				for (let i = 1; i <= count; i++) {
					const field = createInputField(`alias${i}`, `${t('game.player')} ${i}`);
					field.classList.add('animate-fade-in');
					aliasFields.appendChild(field);
				}
			});
		}
	});

	selectElement.dispatchEvent(new Event('change'));

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		cancelAllSearches();
		const gameModeValue = selectElement.value;
		const mode = gameModeValue === t('game.settings.duel') ? 'duel' : 'tournament';

		const players = Array.from(form.querySelectorAll<HTMLInputElement>('input[name^="alias"]'))
			.map(input => input.value.trim());

		if (players.some(p => p === '')) {
			showToast(t('game.settings.allAliases'), 'error');
			return;
		}

		sessionStorage.clear();
		await initLocalGame({ mode, players });
	});

	return pageWrapper;
}
