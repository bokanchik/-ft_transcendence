import { attemptLogin, verifyTwoFactorLogin, getUserDataFromStorage } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { LoginForm } from '../components/loginForm.js';
import { LoginRequestBody, User } from '../shared/schemas/usersSchemas.js';
import { t, setLanguage, getLanguage } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { createElement } from '../utils/domUtils.js';
import { config } from '../utils/config.js';

export function LoginPage(): HTMLElement {
	const currentUser = getUserDataFromStorage();

	const GOOGLE_CLIENT_ID = config.auth.googleId;
    const REDIRECT_URI = config.auth.callbackUri;

	const headerElement = HeaderComponent({ currentUser });

	const title = createElement('h2', {
		textContent: t('login.title'),
		className: 'text-3xl font-semibold font-beach mb-6 text-center text-gray-200'
	});

	const handleLoginAttempt = (credentials: LoginRequestBody) => attemptLogin(credentials);
	const handle2FAAttempt = (token: string) => verifyTwoFactorLogin(token);
	const handleLoginSuccess = async (userData: User) => {
		const userLanguage = userData.language || 'en';
		const currentInterfaceLanguage = getLanguage();
		if (userLanguage !== currentInterfaceLanguage) {
			await setLanguage(userLanguage);
		}
		navigateTo('/dashboard');
	};

	const loginFormComponent = LoginForm({
		onLoginAttempt: handleLoginAttempt,
		on2FAAttempt: handle2FAAttempt,
		onLoginSuccess: handleLoginSuccess,
	});

	const homeLink = createElement('a', { href: '/', textContent: t('link.home'), className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors' });
	homeLink.setAttribute('data-link', '');

	const registerLink = createElement('a', { href: '/register', textContent: t('login.registerLink'), className: 'text-blue-400 hover:text-blue-300 text-sm transition-colors' });
	registerLink.setAttribute('data-link', '');

	const linksDiv = createElement('div', { className: 'mt-6 text-center' }, [
		homeLink,
		createElement('span', { textContent: '|', className: 'mx-2 text-gray-400' }),
		registerLink
	]);

	const googleLoginButton = createElement('a', {
        href: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20profile%20email`,
        className: 'mt-4 w-full flex items-center justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium bg-blue-300 text-gray-700 hover:bg-gray-50 border'
    }, [
        createElement('img', { src: '/assets/google-icon.svg', className: 'h-5 w-5 mr-3' }),
        document.createTextNode(t('login.google'))
    ]);

	const formContainer = createElement('div', {
		className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full'
	}, [
		title,
		loginFormComponent,
		createElement('p', { textContent: t('general.or'), className: 'my-4 text-center text-gray-400' }),
        googleLoginButton,
		linksDiv
	]);

	const container = createElement('div', {
		className: 'flex-grow flex justify-center items-center p-4 sm:p-8'
	}, [formContainer]);

	const pageWrapper = createElement('div', {
		className: 'flex flex-col min-h-screen bg-cover bg-center bg-fixed'
	}, [headerElement, container]);

	pageWrapper.style.backgroundImage = "url('/assets/background.jpg')";

	return pageWrapper;
}
