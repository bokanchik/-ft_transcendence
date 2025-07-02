import { t } from '../services/i18nService.js';
import { createElement, createInputField, clearElement } from '../utils/domUtils.js';
export function LoginForm(props) {
    const { onLoginAttempt, on2FAAttempt, onLoginSuccess } = props;
    const wrapper = createElement('div');
    const renderPasswordStep = () => {
        clearElement(wrapper);
        const identifierField = createInputField('identifier', t('login.identifierLabel'), {
            type: 'text',
            required: true,
            placeholder: t('login.identifierPlaceholder'),
        });
        const passwordField = createInputField('password', t('login.passwordLabel'), {
            type: 'password',
            required: true,
        });
        const loginButton = createElement('button', {
            type: 'submit',
            id: 'login-button',
            textContent: t('login.button'),
            className: 'w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium disabled:opacity-50 transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white border border-green-400/50'
        });
        const form = createElement('form', { id: 'login-form-component', className: 'space-y-6' }, [
            identifierField,
            passwordField,
            createElement('div', {}, [loginButton])
        ]);
        const messageDiv = createElement('div', { id: 'login-message-component', className: 'mt-4 text-center text-sm min-h-[20px]' });
        wrapper.append(form, messageDiv);
        form.addEventListener('submit', handlePasswordSubmit);
        setTimeout(() => {
            const identifierInput = identifierField.querySelector('input');
            identifierInput?.focus();
        }, 0);
    };
    const renderTwoFactorStep = () => {
        clearElement(wrapper);
        const title = createElement('h3', { textContent: t('login.2fa.title'), className: 'text-xl font-semibold text-center text-white' });
        const twoFaTokenField = createInputField('two-fa-token', t('login.2fa.instruction'), {
            required: true,
            inputClass: 'w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-center tracking-[1em]'
        });
        const tokenInput = twoFaTokenField.querySelector('input');
        tokenInput.autocomplete = 'one-time-code';
        tokenInput.inputMode = 'numeric';
        tokenInput.pattern = '[0-9]{6}';
        tokenInput.maxLength = 6;
        const twoFaButton = createElement('button', {
            type: 'submit',
            id: 'two-fa-button',
            textContent: t('login.2fa.button'),
            className: 'w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium disabled:opacity-50 transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white border border-green-400/50'
        });
        const form = createElement('form', { id: 'two-fa-form-component', className: 'space-y-6' }, [
            title,
            twoFaTokenField,
            createElement('div', {}, [twoFaButton])
        ]);
        const messageDiv = createElement('div', { id: 'login-message-component', className: 'mt-4 text-center text-sm min-h-[20px]' });
        wrapper.append(form, messageDiv);
        form.addEventListener('submit', handleTwoFactorSubmit);
        tokenInput.focus();
    };
    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const button = form.querySelector('#login-button');
        const messageDiv = wrapper.querySelector('#login-message-component');
        if (button)
            button.disabled = true;
        if (messageDiv) {
            messageDiv.textContent = t('login.attemptingLogin');
            messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-gray-300';
        }
        const identifier = form.elements.namedItem('identifier').value;
        const password = form.elements.namedItem('password').value;
        const result = await onLoginAttempt({ identifier, password });
        if (result.success) {
            if (result.data.two_fa_required) {
                renderTwoFactorStep();
            }
            else if (result.data.user) {
                onLoginSuccess(result.data.user);
            }
        }
        else {
            if (messageDiv) {
                messageDiv.textContent = result.error;
                messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-red-400 font-medium';
            }
            if (button)
                button.disabled = false;
        }
    };
    const handleTwoFactorSubmit = async (event) => {
        event.preventDefault();
        const form = event.target;
        const button = form.querySelector('#two-fa-button');
        const messageDiv = wrapper.querySelector('#login-message-component');
        if (button)
            button.disabled = true;
        if (messageDiv) {
            messageDiv.textContent = t('login.2fa.verifying');
            messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-gray-300';
        }
        const token = form.elements.namedItem('two-fa-token').value;
        const result = await on2FAAttempt(token);
        if (result.success) {
            if (result.data.user) {
                onLoginSuccess(result.data.user);
            }
        }
        else {
            if (messageDiv) {
                messageDiv.textContent = result.error;
                messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-red-400 font-semibold';
            }
            if (button)
                button.disabled = false;
        }
    };
    renderPasswordStep();
    return wrapper;
}
