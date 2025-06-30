// import { attemptRegister } from '../services/authService.js';
// import { RegisterRequestBody } from '../shared/schemas/usersSchemas.js'
// import { ApiResult, ApiRegisterSuccessData } from '../utils/types.js'
// import { navigateTo } from '../services/router.js';
// import { t, getLanguage } from '../services/i18nService.js';
// import { HeaderComponent } from '../components/headerComponent.js';
// import { getUserDataFromStorage } from '../services/authService.js';

// // Configuration des langues pour le menu déroulant
// const supportedLanguages = {
//     'en': 'English',
//     'fr': 'Français',
//     'es': 'Español',
//     'ru': 'Русский'
// };

// export async function RegisterPage(): Promise<HTMLElement> {
// 	const currentUser = getUserDataFromStorage();

// 	const pageWrapper = document.createElement('div');
// 	// pageWrapper.className = 'flex flex-col min-h-screen bg-cover bg-center bg-fixed';
// 	// pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";
// 	pageWrapper.className = 'flex flex-col h-screen';

// 	const headerElement = HeaderComponent({ currentUser });
// 	pageWrapper.appendChild(headerElement);


// 	const container = document.createElement('div');
// 	// container.className = 'flex-grow flex justify-center items-center p-4 sm:p-8';
// 	container.className = 'flex-grow overflow-y-auto flex justify-center items-center p-4 sm:p-8';
// 	pageWrapper.appendChild(container);

// 	// Générer les options pour le sélecteur de langue
//     const currentLang = getLanguage();
//     const languageOptions = Object.entries(supportedLanguages).map(([code, name]) => 
//         `<option value="${code}" ${currentLang === code ? 'selected' : ''}>${name}</option>`
//     ).join('');

// 	const formContainer = document.createElement('div');
// 	formContainer.className = 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full';
// 	formContainer.innerHTML = `
//         <h2 class="text-3xl font-bold mb-6 text-center text-white">${t('register.title')}</h2>
//         <form id="register-form">
//             <div class="mb-4">
//                 <label for="username" class="block text-sm font-medium text-gray-300 mb-1">${t('user.username')}</label>
//                 <input type="text" id="username" name="username" required minlength="3" maxlength="20"
//                        class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
//                 <p class="text-xs text-gray-400 mt-1">${t('register.nameSpec')}</p>
//             </div>
//             <div class="mb-4">
//                 <label for="email" class="block text-sm font-medium text-gray-300 mb-1">${t('user.email')}</label>
//                 <input type="email" id="email" name="email" required
//                        class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
//             </div>
//              <div class="mb-4">
//                 <label for="display_name" class="block text-sm font-medium text-gray-300 mb-1">${t('user.displayName')}</label>
//                 <input type="text" id="display_name" name="display_name" required minlength="3" maxlength="20"
//                        class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
//                 <p class="text-xs text-gray-400 mt-1">${t('register.nameSpec')}</p>
//             </div>
//             <div class="mb-4">
//                 <label for="password" class="block text-sm font-medium text-gray-300 mb-1">${t('user.password')}</label>
//                 <input type="password" id="password" name="password" required minlength="8" maxlength="20"
//                        class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
//                  <p class="text-xs text-gray-400 mt-1">${t('register.passwordSpec')}</p>
//             </div>
//              <div class="mb-6">
//                 <label for="confirm_password" class="block text-sm font-medium text-gray-300 mb-1">${t('register.confirmPassword')}</label>
//                 <input type="password" id="confirm_password" name="confirm_password" required minlength="8" maxlength="100"
//                        class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
//             </div>
//             <div class="mb-6">
//                 <label for="avatar_url" class="block text-sm font-medium text-gray-300 mb-1">${t('register.avatarUrl')}</label>
//                 <input type="url" id="avatar_url" name="avatar_url" placeholder="https://example.com/avatar.jpg"
//                        class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
//             </div>

// 			<!-- AJOUT DU SÉLECTEUR DE LANGUE -->
//             <div class="mb-6">
//                 <label for="language" class="block text-sm font-medium text-gray-300 mb-1">${t('header.language')}</label>
//                 <select id="language" name="language" class="w-full p-2 bg-black/20 border border-gray-500/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
//                     ${languageOptions}
//                 </select>
//             </div>

//             <div class="flex items-center justify-between">
//                 <button type="submit" id="register-button"
//                         class="w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out bg-yellow-500 hover:bg-yellow-600 text-black border border-yellow-400/50">
//                     ${t('register.button')}
//                 </button>
//             </div>
//         </form>
//         <div id="register-message" class="mt-4 text-center text-sm"></div>
//         <div class="mt-6 text-center">
//           <a href="/" data-link class="text-blue-400 hover:text-blue-300 text-sm transition-colors">
//             ${t('link.home')}
//           </a>
//           <span class="mx-2 text-gray-400">|</span>
//           <a href="/login" data-link class="text-blue-400 hover:text-blue-300 text-sm transition-colors">
//             ${t('register.loginLink')}
//           </a>
//         </div>
//     `;

// 	container.appendChild(formContainer);
// 	// pageWrapper.appendChild(container);

// 	const form = formContainer.querySelector('#register-form') as HTMLFormElement;
// 	const usernameInput = formContainer.querySelector('#username') as HTMLInputElement;
// 	const emailInput = formContainer.querySelector('#email') as HTMLInputElement;
// 	const displayNameInput = formContainer.querySelector('#display_name') as HTMLInputElement;
// 	const passwordInput = formContainer.querySelector('#password') as HTMLInputElement;
// 	const confirmPasswordInput = formContainer.querySelector('#confirm_password') as HTMLInputElement;
// 	const avatarUrlInput = formContainer.querySelector('#avatar_url') as HTMLInputElement;
// 	// AJOUT : Récupérer le sélecteur
//     const languageSelect = formContainer.querySelector('#language') as HTMLSelectElement;
// 	const messageDiv = formContainer.querySelector('#register-message') as HTMLDivElement;
// 	const registerButton = formContainer.querySelector('#register-button') as HTMLButtonElement;

// 	form.addEventListener('submit', async (event) => {
// 		event.preventDefault();
// 		messageDiv.textContent = '';
// 		messageDiv.className = 'mt-4 text-center text-sm';

// 		const username = usernameInput.value.trim();
// 		const email = emailInput.value.trim();
// 		const displayName = displayNameInput.value.trim();
// 		const password = passwordInput.value;
// 		const confirmPassword = confirmPasswordInput.value;
// 		const avatarUrl = avatarUrlInput.value.trim();
// 		// AJOUT : Récupérer la valeur de la langue
//         const language = languageSelect.value;

// 		if (!username || !email || !displayName || !password || !confirmPassword) {
// 			messageDiv.textContent = t('register.fillAllFields');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			return;
// 		}
// 		if (!isValidEmail(email)) {
// 			messageDiv.textContent = t('register.emailInvalid'); // Ajoutez cette clé à vos fichiers de traduction !
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-400 font-semibold';
// 			return;
// 		}
// 		if (password !== confirmPassword) {
// 			messageDiv.textContent = t('register.passwordMismatch');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			passwordInput.value = ''; // Clear passwords
// 			confirmPasswordInput.value = '';
// 			return;
// 		}
// 		if (password.length < 8) {
// 			messageDiv.textContent = t('register.passwordLength');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			return;
// 		}
// 		// Simple check for avatar URL format if provided
// 		if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
// 			messageDiv.textContent = t('register.avatarSpec');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			return;
// 		}

// 		// --- Appel à l'API ---
// 		messageDiv.textContent = t('register.attemptingRegistration');
// 		messageDiv.className = 'mt-4 text-center text-sm text-gray-600';
// 		registerButton.disabled = true;
// 		registerButton.textContent = t('register.registering');

// 		const credentials: RegisterRequestBody = {
// 			username,
// 			email,
// 			password,
// 			display_name: displayName,
// 			language: language, // AJOUT : Inclure la langue
// 		};
// 		if (avatarUrl) {
// 			credentials.avatar_url = avatarUrl;
// 		}

// 		const registrationResult: ApiResult<ApiRegisterSuccessData> = await attemptRegister(credentials);

// 		registerButton.disabled = false;
// 		registerButton.textContent = t('register.button');

// 		if (registrationResult.success) {
// 			messageDiv.textContent = t('register.success');
// 			messageDiv.className = 'mt-4 text-center text-sm text-green-600';
// 			form.reset();
// 			setTimeout(() => { navigateTo('/login'); }, 500);

// 		} else {
// 			messageDiv.textContent = `${t('register.failure')} ${registrationResult.error} `; // Message générique post-alert
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			passwordInput.value = ''; // Clear password fields on failure
// 			confirmPasswordInput.value = '';
// 		}
// 	});

// 	return pageWrapper;
// }

// function isValidHttpUrl(string: string): boolean {
// 	let url;
// 	try {
// 		url = new URL(string);
// 	} catch (_) {
// 		return false;
// 	}
// 	return url.protocol === "http:" || url.protocol === "https:";
// }

// function isValidEmail(email: string): boolean {
//     const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\[(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|IPv6:[a-fA-F0-9:.]+)\]))$/;
//     return emailRegex.test(email);
// }

// import { attemptRegister } from '../services/authService.js';
// import { RegisterRequestBody } from '../shared/schemas/usersSchemas.js';
// import { ApiResult, ApiRegisterSuccessData } from '../utils/types.js';
// import { navigateTo } from '../services/router.js';
// import { t, getLanguage } from '../services/i18nService.js';
// import { HeaderComponent } from '../components/headerComponent.js';
// import { getUserDataFromStorage } from '../services/authService.js';
// import { createElement, createInputField } from '../utils/domUtils.js';

// const supportedLanguages = {
//     'en': 'English',
//     'fr': 'Français',
//     'es': 'Español',
//     'ru': 'Русский'
// };

// export async function RegisterPage(): Promise<HTMLElement> {
// 	const currentUser = getUserDataFromStorage();

//     let usernameInput: HTMLInputElement,
//         emailInput: HTMLInputElement,
//         displayNameInput: HTMLInputElement,
//         passwordInput: HTMLInputElement,
//         confirmPasswordInput: HTMLInputElement,
//         avatarUrlInput: HTMLInputElement,
//         languageSelect: HTMLSelectElement;

// 	// --- Construction de l'interface avec createElement ---
// 	const headerElement = HeaderComponent({ currentUser });
// 	const container = createElement('div', { className: 'flex-grow overflow-y-auto flex justify-center items-center p-4 sm:p-8' });
// 	const pageWrapper = createElement('div', { className: 'flex flex-col h-screen' }, [headerElement, container]);

// 	const title = createElement('h2', { textContent: t('register.title'), className: 'text-3xl font-bold mb-6 text-center text-white' });

// 	const usernameField = createInputField('username', t('user.username'), { required: true, minLength: 3, maxLength: 20, helpText: t('register.nameSpec') });
// 	usernameInput = usernameField.querySelector('input')!;
	
// 	const emailField = createInputField('email', t('user.email'), { type: 'email', required: true });
// 	emailInput = emailField.querySelector('input')!;

// 	const displayNameField = createInputField('display_name', t('user.displayName'), { required: true, minLength: 3, maxLength: 20, helpText: t('register.nameSpec') });
// 	displayNameInput = displayNameField.querySelector('input')!;

// 	const passwordField = createInputField('password', t('user.password'), { type: 'password', required: true, minLength: 8, maxLength: 20, helpText: t('register.passwordSpec') });
// 	passwordInput = passwordField.querySelector('input')!;

// 	const confirmPasswordField = createInputField('confirm_password', t('register.confirmPassword'), { type: 'password', required: true, minLength: 8, maxLength: 100 });
// 	confirmPasswordInput = confirmPasswordField.querySelector('input')!;

// 	const avatarUrlField = createInputField('avatar_url', t('register.avatarUrl'), { type: 'url', placeholder: 'https://example.com/avatar.jpg' });
// 	avatarUrlInput = avatarUrlField.querySelector('input')!;

// 	const currentLang = getLanguage();
	// languageSelect = createElement('select', { 
    //     id: 'language', 
    //     name: 'language', 
    //     className: 'w-full p-2 bg-black/20 border border-gray-500/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400' 
    // });
	// Object.entries(supportedLanguages).forEach(([code, name]) => {
	// 	const option = document.createElement('option');
	// 	option.value = code;
	// 	option.textContent = name;
	// 	if (currentLang === code) {
	// 		option.selected = true;
	// 	}
	// 	languageSelect.append(option);
	// });
	// const languageField = createElement('div', { className: 'mb-6' }, [
	// 	createElement('label', { htmlFor: 'language', textContent: t('header.language'), className: 'block text-sm font-medium text-gray-300 mb-1' }),
	// 	languageSelect
	// ]);

// 	const registerButton = createElement('button', {
// 		type: 'submit',
// 		id: 'register-button',
// 		textContent: t('register.button'),
// 		className: 'w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out bg-yellow-500 hover:bg-yellow-600 text-black border border-yellow-400/50'
// 	});

// 	const form = createElement('form', { id: 'register-form' }, [
// 		usernameField, emailField, displayNameField, passwordField,
// 		confirmPasswordField, avatarUrlField, languageField,
// 		createElement('div', { className: 'flex items-center justify-between' }, [registerButton])
// 	]);

// 	const messageDiv = createElement('div', { id: 'register-message', className: 'mt-4 text-center text-sm' });

// 	const homeLink = createElement('a', { href: '/', textContent: t('link.home'), className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors' });
// 	homeLink.setAttribute('data-link', '');
// 	const loginLink = createElement('a', { href: '/login', textContent: t('register.loginLink'), className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors' });
// 	loginLink.setAttribute('data-link', '');
// 	const linksDiv = createElement('div', { className: 'mt-6 text-center' }, [
// 		homeLink,
// 		createElement('span', { textContent: '|', className: 'mx-2 text-gray-400' }),
// 		loginLink
// 	]);

// 	const formContainer = createElement('div', { className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full' }, [
// 		title, form, messageDiv, linksDiv
// 	]);
	
// 	container.append(formContainer);

// 	// --- Logique d'événements ---
// 	form.addEventListener('submit', async (event) => {
// 		event.preventDefault();
// 		messageDiv.textContent = '';
// 		messageDiv.className = 'mt-4 text-center text-sm';

// 		const username = usernameInput.value.trim();
// 		const email = emailInput.value.trim();
// 		const displayName = displayNameInput.value.trim();
// 		const password = passwordInput.value;
// 		const confirmPassword = confirmPasswordInput.value;
// 		const avatarUrl = avatarUrlInput.value.trim();
//         const language = languageSelect.value;
		
// 		// La logique de validation et de soumission reste identique
// 		if (!username || !email || !displayName || !password || !confirmPassword) {
// 			messageDiv.textContent = t('register.fillAllFields');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			return;
// 		}
// 		if (!isValidEmail(email)) {
// 			messageDiv.textContent = t('register.emailInvalid');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-400 font-semibold';
// 			return;
// 		}
// 		if (password !== confirmPassword) {
// 			messageDiv.textContent = t('register.passwordMismatch');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			passwordInput.value = '';
// 			confirmPasswordInput.value = '';
// 			return;
// 		}
// 		if (password.length < 8) {
// 			messageDiv.textContent = t('register.passwordLength');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			return;
// 		}
// 		if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
// 			messageDiv.textContent = t('register.avatarSpec');
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			return;
// 		}

// 		messageDiv.textContent = t('register.attemptingRegistration');
// 		messageDiv.className = 'mt-4 text-center text-sm text-gray-600';
// 		registerButton.disabled = true;
// 		registerButton.textContent = t('register.registering');

// 		const credentials: RegisterRequestBody = {
// 			username, email, password, display_name: displayName, language,
// 		};
// 		if (avatarUrl) {
// 			credentials.avatar_url = avatarUrl;
// 		}

// 		const registrationResult: ApiResult<ApiRegisterSuccessData> = await attemptRegister(credentials);

// 		registerButton.disabled = false;
// 		registerButton.textContent = t('register.button');

// 		if (registrationResult.success) {
// 			messageDiv.textContent = t('register.success');
// 			messageDiv.className = 'mt-4 text-center text-sm text-green-600';
// 			form.reset();
// 			setTimeout(() => { navigateTo('/login'); }, 500);
// 		} else {
// 			messageDiv.textContent = `${t('register.failure')} ${registrationResult.error} `;
// 			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
// 			passwordInput.value = '';
// 			confirmPasswordInput.value = '';
// 		}
// 	});

// 	return pageWrapper;
// }

// function isValidHttpUrl(string: string): boolean {
// 	try {
// 		new URL(string);
// 		return true;
// 	} catch (_) {
// 		return false;
// 	}
// }

// function isValidEmail(email: string): boolean {
//     const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\[(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|IPv6:[a-fA-F0-9:.]+)\]))$/;
//     return emailRegex.test(email);
// }

import { attemptRegister } from '../services/authService.js';
import { RegisterRequestBody } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiRegisterSuccessData } from '../utils/types.js';
import { navigateTo } from '../services/router.js';
import { t, getLanguage } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { getUserDataFromStorage } from '../services/authService.js';
import { createElement, createInputField } from '../utils/domUtils.js';

const supportedLanguages = {
    'en': 'English',
    'fr': 'Français',
    'es': 'Español',
    'ru': 'Русский'
};

export async function RegisterPage(): Promise<HTMLElement> {
    const currentUser = getUserDataFromStorage();

    let usernameInput: HTMLInputElement,
        emailInput: HTMLInputElement,
        displayNameInput: HTMLInputElement,
        passwordInput: HTMLInputElement,
        confirmPasswordInput: HTMLInputElement,
        avatarUrlInput: HTMLInputElement,
        languageSelect: HTMLSelectElement;

    const usernameField = createInputField('username', t('user.username'), { required: true, minLength: 3, maxLength: 20, helpText: t('register.nameSpec') });
    usernameInput = usernameField.querySelector('input')!;

    const emailField = createInputField('email', t('user.email'), { type: 'email', required: true });
    emailInput = emailField.querySelector('input')!;

    const displayNameField = createInputField('display_name', t('user.displayName'), { required: true, minLength: 3, maxLength: 20, helpText: t('register.nameSpec') });
    displayNameInput = displayNameField.querySelector('input')!;

    const passwordField = createInputField('password', t('user.password'), { type: 'password', required: true, minLength: 8, maxLength: 20, helpText: t('register.passwordSpec') });
    passwordInput = passwordField.querySelector('input')!;

    const confirmPasswordField = createInputField('confirm_password', t('register.confirmPassword'), { type: 'password', required: true, minLength: 8, maxLength: 100 });
    confirmPasswordInput = confirmPasswordField.querySelector('input')!;

    const avatarUrlField = createInputField('avatar_url', t('register.avatarUrl'), { type: 'url', placeholder: 'https://example.com/avatar.jpg' });
    avatarUrlInput = avatarUrlField.querySelector('input')!;

    const currentLang = getLanguage();
	languageSelect = createElement('select', { 
        id: 'language', 
        name: 'language', 
        className: 'w-full p-2 bg-black/20 border border-gray-500/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400' 
    });
	Object.entries(supportedLanguages).forEach(([code, name]) => {
		const option = document.createElement('option');
		option.value = code;
		option.textContent = name;
		if (currentLang === code) {
			option.selected = true;
		}
		languageSelect.append(option);
	});
	const languageField = createElement('div', { className: 'mb-6' }, [
		createElement('label', { htmlFor: 'language', textContent: t('header.language'), className: 'block text-sm font-medium text-gray-300 mb-1' }),
		languageSelect
	]);

    const scrollableContent = createElement('div', {
        className: 'flex-grow overflow-y-auto space-y-4 pr-4 -mr-4',
    }, [
        usernameField, emailField, displayNameField, passwordField,
        confirmPasswordField, avatarUrlField, languageField
    ]);

    const registerButton = createElement('button', {
        type: 'submit', id: 'register-button', textContent: t('register.button'),
        className: 'w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out bg-yellow-500 hover:bg-yellow-600 text-black border border-yellow-400/50'
    });
    const buttonContainer = createElement('div', {
        className: 'flex-shrink-0 pt-4 mt-auto'
    }, [
        registerButton
    ]);

    const form = createElement('form', { 
        id: 'register-form',
        className: 'flex flex-col flex-grow min-h-0' 
    }, [
        scrollableContent,
        buttonContainer
    ]);
    
    const messageDiv = createElement('div', { id: 'register-message', className: 'flex-shrink-0 mt-4 text-center text-sm' });

    const homeLink = createElement('a', { href: '/', textContent: t('link.home'), className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors' });
    homeLink.setAttribute('data-link', '');

    const loginLink = createElement('a', { href: '/login', textContent: t('register.loginLink'), className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors' });
    loginLink.setAttribute('data-link', '');

    const linksDiv = createElement('div', { className: 'flex-shrink-0 mt-6 text-center' }, [
        homeLink,
        createElement('span', { textContent: '|', className: 'mx-2 text-gray-400' }),
        loginLink
    ]);
    
    const formContainer = createElement('div', {
        className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col max-h-[90vh]'
    }, [
        createElement('h2', { textContent: t('register.title'), className: 'flex-shrink-0 text-3xl font-bold mb-6 text-center text-white' }),
        form,
        messageDiv,
        linksDiv
    ]);

    const headerElement = HeaderComponent({ currentUser });
    const container = createElement('div', { className: 'flex-grow flex justify-center items-center p-4 sm:p-8' }, [formContainer]);
    const pageWrapper = createElement('div', { 
        className: 'flex flex-col h-screen bg-cover bg-center bg-fixed' 
    }, [headerElement, container]);
    pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = '';
		messageDiv.className = 'mt-4 text-center text-sm';

		const username = usernameInput.value.trim();
		const email = emailInput.value.trim();
		const displayName = displayNameInput.value.trim();
		const password = passwordInput.value;
		const confirmPassword = confirmPasswordInput.value;
		const avatarUrl = avatarUrlInput.value.trim();
        const language = languageSelect.value;
		
		if (!username || !email || !displayName || !password || !confirmPassword) {
			messageDiv.textContent = t('register.fillAllFields');
			messageDiv.className = 'mt-4 text-center text-sm text-red-500';
			return;
		}
		if (!isValidEmail(email)) {
			messageDiv.textContent = t('register.emailInvalid');
			messageDiv.className = 'mt-4 text-center text-sm text-red-400 font-semibold';
			return;
		}
		if (password !== confirmPassword) {
			messageDiv.textContent = t('register.passwordMismatch');
			messageDiv.className = 'mt-4 text-center text-sm text-red-500';
			passwordInput.value = '';
			confirmPasswordInput.value = '';
			return;
		}
		if (password.length < 8) {
			messageDiv.textContent = t('register.passwordLength');
			messageDiv.className = 'mt-4 text-center text-sm text-red-500';
			return;
		}
		if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
			messageDiv.textContent = t('register.avatarSpec');
			messageDiv.className = 'mt-4 text-center text-sm text-red-500';
			return;
		}

		messageDiv.textContent = t('register.attemptingRegistration');
		messageDiv.className = 'mt-4 text-center text-sm text-gray-400';
		registerButton.disabled = true;
		registerButton.textContent = t('register.registering');

		const credentials: RegisterRequestBody = {
			username, email, password, display_name: displayName, language,
		};
		if (avatarUrl) {
			credentials.avatar_url = avatarUrl;
		}

		const registrationResult: ApiResult<ApiRegisterSuccessData> = await attemptRegister(credentials);

		registerButton.disabled = false;
		registerButton.textContent = t('register.button');

		if (registrationResult.success) {
			messageDiv.textContent = t('register.success');
			messageDiv.className = 'mt-4 text-center text-sm text-green-500';
			form.reset();
			setTimeout(() => { navigateTo('/login'); }, 1500);
		} else {
			messageDiv.textContent = registrationResult.error || t('register.failure');
			messageDiv.className = 'mt-4 text-center text-sm text-red-500';
			passwordInput.value = '';
			confirmPasswordInput.value = '';
		}
	});

    return pageWrapper;
}

function isValidHttpUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function isValidEmail(email: string): boolean {
    const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\[(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|IPv6:[a-fA-F0-9:.]+)\]))$/;
    return emailRegex.test(email);
}