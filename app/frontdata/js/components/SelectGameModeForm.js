// import { navigateTo } from "../services/router.js";
// import { initLocalGame } from "../services/initLocalGame.js";
// import { showToast } from "./toast.js";
// import { t } from "../services/i18nService.js";
// // import { createInputField, createInputField } from "../utils/domUtils.js";
// import { HeaderComponent } from "./headerComponent.js";
// import { getUserDataFromStorage } from "../services/authService.js";
// export function promptAliasForm(): HTMLDivElement {
// 	const currentUser = getUserDataFromStorage();
// 	const pageWrapper = document.createElement('div');
// 	pageWrapper.className = 'flex flex-col min-h-screen bg-cover bg-center bg-fixed';
// 	pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
// 	// --- Header ---
// 	const headerElement = HeaderComponent({ currentUser });
// 	pageWrapper.appendChild(headerElement);
// 	// --- Main Container ---
// 	const container: HTMLDivElement = document.createElement('div');
// 	// container.className = 'bg-white flex justify-center items-center min-h-screen p-8';
// 	container.className = 'flex-grow flex items-center justify-center p-4 sm:p-8';
// 	pageWrapper.appendChild(container);
// 	const formContainer: HTMLDivElement = document.createElement('div');
// 	// formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';
// 	formContainer.className = 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full';
// 	// --- Title ---
// 	const title: HTMLHeadingElement = document.createElement('h2');
// 	title.textContent = t('game.settings.gameMode');
// 	// title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
// 	title.className = 'text-3xl font-bold mb-6 text-center text-white';
// 	// --- Input form ---
// 	const form: HTMLFormElement = document.createElement('form');
// 	form.className = 'space-y-6';
// 	const gameModeField = createSelectField('gameMode', t('game.settings.gameMode'), [t('game.settings.duel'), t('game.settings.tournament')]);
// 	const dynamicInputs = document.createElement('div');
// 	dynamicInputs.className = 'space-y-4';
// 	// --- Buttons ---
// 	const buttonsContainer: HTMLDivElement = document.createElement('div');
// 	buttonsContainer.id = 'buttons-container';
// 	// buttonsContainer.className = 'flex justify-end space-x-4';
// 	buttonsContainer.className = 'flex justify-end space-x-4 pt-4 border-t border-gray-500/30';
// 	const cancelButton: HTMLButtonElement = document.createElement('button');
// 	cancelButton.type = 'button';
// 	cancelButton.id = 'cancel-button';
// 	cancelButton.textContent = t('general.cancel');
// 	// cancelButton.className = 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded transition duration-200';
// 	cancelButton.className = 'px-4 py-2 rounded-md text-sm font-medium text-gray-200 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors duration-200';
// 	const submitButton: HTMLButtonElement = document.createElement('button');
// 	submitButton.id = 'submit-button';
// 	submitButton.textContent = t('game.button');
// 	// submitButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200';
// 	submitButton.className = 'px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-green-500/50 transition-colors duration-200';
// 	buttonsContainer.append(cancelButton, submitButton);
// 	// --- Le pied de page ---
// 	const footer: HTMLDivElement = document.createElement('div');
// 	footer.className = 'mt-6 text-center';
// 	const homeLink: HTMLAnchorElement = document.createElement('a');
// 	homeLink.href = '/'; // lien vers la page d'accueil
// 	homeLink.textContent = t('link.home');
// 	homeLink.setAttribute('data-link', ''); // intercepte par le router dans le main.ts
// 	// homeLink.className = 'text-blue-600 hover:text-blue-800 text-sm';
// 	homeLink.className = 'text-blue-400 hover:text-blue-300 text-sm transition-colors';
// 	// --- Ajout des éléments au conteneur principal ---
// 	footer.appendChild(homeLink);
// 	form.append(gameModeField, dynamicInputs, buttonsContainer);
// 	formContainer.append(title, form, footer);
// 	container.appendChild(formContainer);
// 	// --- Event: Cancel button clicked
// 	cancelButton.addEventListener('click', async () => {
// 		sessionStorage.clear();
// 		navigateTo('/');
// 	});
// 	// --- Input depends on gameMode
// 	const selectElement: HTMLSelectElement = (gameModeField.querySelector('select') as HTMLSelectElement);
// 	selectElement.addEventListener('change', (e) => {
// 		const value = (e.target as HTMLSelectElement).value;
// 		dynamicInputs.innerHTML = ''; // reset a chaque changement
// 		if (value === t('game.settings.duel')) { // a verifier si j'ai pas fait nimp
// 			dynamicInputs.append(
// 				createInputField('alias1', 'Player1'),
// 				createInputField('alias2', 'Player2')
// 			);
// 		} else if (value === t('game.settings.tournament')) {
// 			const countField = createInputField('playerCount', t('game.settings.nbPlayers'));
// 			const inputElement = countField.querySelector('input') as HTMLInputElement;
// 			inputElement.placeholder = t('game.settings.nbPlayersPlaceholder');
// 			dynamicInputs.append(countField);
// 			// generate as many inputs as recieved in countField
// 			const aliasFields = document.createElement('div');
// 			dynamicInputs.append(aliasFields);
// 			inputElement.type = 'number';
// 			inputElement.min = '2';
// 			inputElement.max = '8';
// 			inputElement.addEventListener('input', () => {
// 				aliasFields.innerHTML = ''; // reset a chaque changement
// 				const count: number = parseInt(inputElement.value);
// 				if (isNaN(count) || count < 2 || count > 10 || ((count & (count - 1)) !== 0)) {
// 					showToast(t('game.settings.nbPlayersSpec'), 'error');
// 					return;
// 				}
// 				for (let i = 1; i <= count; i++) {
// 					const field = createInputField(`alias${i}`, `${t('game.player')} ${i}`);
// 					field.classList.add('animate-fade-in');
// 					aliasFields.appendChild(field);
// 				}
// 			});
// 		}
// 	});
// 	// diffuser l'event 'change'
// 	selectElement.dispatchEvent(new Event('change'));
// 	// --- Event: Submit form event triggered
// 	form.addEventListener('submit', async (event) => {
// 		sessionStorage.clear();
// 		event.preventDefault(); // prevents the page from refreshing
// 		await initLocalGame(form);
// 	});
// 	// return container;
// 	return pageWrapper;
// }
// // -- Helper function for input
// function createInputField(id: string, labelText: string): HTMLDivElement {
// 	const fieldDiv = document.createElement('div');
// 	const label = document.createElement('label');
// 	label.htmlFor = id;
// 	label.textContent = labelText;
// 	// label.className = 'block text-sm font-medium text-gray-700 mb-1';
// 	label.className = 'block text-sm font-medium text-gray-300 mb-1';
// 	const input = document.createElement('input');
// 	input.type = 'text';
// 	input.id = id;
// 	input.name = id;
// 	input.required = true;
// 	// input.className = 'w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
// 	input.className = 'w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400';
// 	fieldDiv.append(label, input);
// 	return fieldDiv;
// }
// // --- Helper function for game mode (menu delurant avec 3 options)
// function createSelectField(id: string, labelText: string, options: string[]): HTMLDivElement {
// 	const fieldDiv = document.createElement('div');
// 	const label = document.createElement('label');
// 	label.htmlFor = id;
// 	label.textContent = labelText;
// 	label.className = 'block text-sm font-medium text-gray-700 mb-1';
// 	const select = document.createElement('select');
// 	select.id = id;
// 	select.required = true;
// 	// select.className = 'w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
// 	select.className = 'w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400';
// 	for (const optionValue of options) {
// 		const option = document.createElement('option');
// 		option.value = optionValue;
// 		option.textContent = optionValue;
// 		select.appendChild(option);
// 	}
// 	fieldDiv.append(label, select);
// 	return fieldDiv;
// }
import { navigateTo } from "../services/router.js";
import { initLocalGame } from "../services/initLocalGame.js";
import { showToast } from "./toast.js";
import { t } from "../services/i18nService.js";
import { HeaderComponent } from "./headerComponent.js";
import { getUserDataFromStorage } from "../services/authService.js";
import { createElement, createInputField, createActionButton, createSelectField, clearElement } from "../utils/domUtils.js";
export function promptAliasForm() {
    const currentUser = getUserDataFromStorage();
    const dynamicInputs = createElement('div', { className: 'space-y-4' });
    const aliasFields = createElement('div', { className: 'space-y-4' });
    const scrollableContent = createElement('div', {
        className: 'flex-grow overflow-y-auto space-y-6 pr-4',
    }, [
        createSelectField('gameMode', t('game.settings.gameMode'), [t('game.settings.duel'), t('game.settings.tournament')]),
        dynamicInputs
    ]);
    const cancelButton = createActionButton({
        text: t('general.cancel'),
        variant: 'secondary',
        onClick: () => {
            sessionStorage.clear();
            navigateTo('/');
        }
    });
    const submitButton = createElement('button', {
        type: 'submit',
        textContent: t('game.button'),
        className: 'px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-green-500/50 transition-colors duration-200'
    });
    const buttonContainer = createElement('div', {
        className: 'flex-shrink-0 flex justify-end space-x-4 pt-4 mt-auto border-t border-gray-500/30' // mt-auto pousse les boutons vers le bas
    }, [cancelButton, submitButton]);
    const form = createElement('form', {
        className: 'flex flex-col flex-grow min-h-0'
    }, [
        scrollableContent,
        buttonContainer
    ]);
    const formContainer = createElement('div', {
        className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col max-h-[90vh]' // CHANGEMENTS CLÉS ICI
    }, [
        createElement('h2', {
            textContent: t('game.settings.gameMode'),
            className: 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-white' // flex-shrink-0 pour empêcher le titre de rétrécir
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
        className: 'flex flex-col h-screen bg-cover bg-center bg-fixed' // h-screen au lieu de min-h-screen
    }, [
        HeaderComponent({ currentUser }),
        createElement('div', {
            className: 'flex-grow flex items-center justify-center p-4 sm:p-8'
        }, [
            formContainer
        ])
    ]);
    pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
    const selectElement = form.querySelector('#gameMode');
    selectElement.addEventListener('change', () => {
        const value = selectElement.value;
        clearElement(dynamicInputs);
        clearElement(aliasFields);
        if (value === t('game.settings.duel')) {
            dynamicInputs.append(createInputField('alias1', `${t('game.player')} 1`), createInputField('alias2', `${t('game.player')} 2`));
        }
        else if (value === t('game.settings.tournament')) {
            const countField = createInputField('playerCount', t('game.settings.nbPlayers'), {
                type: 'number',
                min: '2',
                max: '8',
                placeholder: t('game.settings.nbPlayersPlaceholder'),
            });
            const inputElement = countField.querySelector('input');
            dynamicInputs.append(countField, aliasFields);
            inputElement.addEventListener('input', () => {
                clearElement(aliasFields);
                const count = parseInt(inputElement.value);
                const validCounts = [2, 4, 8];
                if (isNaN(count) || !validCounts.includes(count)) {
                    if (inputElement.value)
                        showToast(t('game.settings.nbPlayersSpec'), 'error');
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
        const gameModeValue = selectElement.value;
        const mode = gameModeValue === t('game.settings.duel') ? 'duel' : 'tournament';
        const players = Array.from(form.querySelectorAll('input[name^="alias"]'))
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
