import { attemptLogin, verifyTwoFactorLogin, getUserDataFromStorage } from '../services/authService.js';
import { navigateTo } from '../services/router.js';
import { LoginForm } from '../components/loginForm.js';
import { t, setLanguage, getLanguage } from '../services/i18nService.js';
import { HeaderComponent } from '../components/headerComponent.js';
import { createElement } from '../utils/domUtils.js';
export function LoginPage() {
    const currentUser = getUserDataFromStorage();
    const headerElement = HeaderComponent({ currentUser });
    const title = createElement('h2', {
        textContent: t('login.title'),
        className: 'text-3xl font-bold mb-6 text-center text-white'
    });
    const handleLoginAttempt = (credentials) => attemptLogin(credentials);
    const handle2FAAttempt = (token) => verifyTwoFactorLogin(token);
    const handleLoginSuccess = async (userData) => {
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
    const formContainer = createElement('div', {
        className: 'bg-gray-900/60 backdrop-blur-lg border border-gray-400/30 rounded-2xl shadow-2xl p-8 max-w-md w-full'
    }, [
        title,
        loginFormComponent,
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
