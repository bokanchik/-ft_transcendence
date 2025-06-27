import { LoginRequestBody, User } from '../shared/schemas/usersSchemas.js';
import { ApiResult, ApiLoginSuccessData } from '../utils/types.js';
import { t } from '../services/i18nService.js';

interface LoginFormProps {
	onLoginAttempt: (credentials: LoginRequestBody) => Promise<ApiResult<ApiLoginSuccessData>>;
	on2FAAttempt: (token: string) => Promise<ApiResult<ApiLoginSuccessData>>;
	onLoginSuccess: (userData: User) => void;
}

export function LoginForm(props: LoginFormProps): HTMLElement {
	const { onLoginAttempt, on2FAAttempt, onLoginSuccess } = props;
	const wrapper = document.createElement('div');

	const renderPasswordStep = () => {
		wrapper.innerHTML = `
            <form id="login-form-component" class="space-y-6">
                <div>
                    <label for="identifier" class="block text-sm font-medium text-gray-300 mb-1">${t('login.identifierLabel')}</label>
                    <input type="text" id="identifier" name="identifier" required placeholder="${t('login.identifierPlaceholder')}" 
                           class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-300 mb-1">${t('login.passwordLabel')}</label>
                    <input type="password" id="password" name="password" required 
                           class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
                </div>
                <div>
                    <button type="submit" id="login-button" 
                            class="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium disabled:opacity-50 transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white border border-green-400/50">
                        ${t('login.button')}
                    </button>
                </div>
            </form>
            <div id="login-message-component" class="mt-4 text-center text-sm min-h-[20px]"></div>
        `;

		wrapper.querySelector('#login-form-component')?.addEventListener('submit', handlePasswordSubmit);
	};

	const renderTwoFactorStep = () => {
		wrapper.innerHTML = `
            <form id="two-fa-form-component" class="space-y-6">
                <h3 class="text-xl font-semibold text-center text-white">${t('login.2fa.title')}</h3>
                <div>
                    <label for="two-fa-token" class="block text-sm font-medium text-gray-300 mb-1">${t('login.2fa.instruction')}</label>
                    <input type="text" id="two-fa-token" name="two-fa-token" required autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6"
                           class="w-full p-2 bg-black/20 border border-gray-500/50 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-center tracking-[1em]">
                </div>
                <div>
                    <button type="submit" id="two-fa-button" class="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium disabled:opacity-50 transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white border border-green-400/50">
                        ${t('login.2fa.button')}
                    </button>
                </div>
            </form>
            <div id="login-message-component" class="mt-4 text-center text-sm min-h-[20px]"></div>
        `;

		wrapper.querySelector('#two-fa-form-component')?.addEventListener('submit', handleTwoFactorSubmit);
		(wrapper.querySelector('#two-fa-token') as HTMLInputElement)?.focus();
	};

	const handlePasswordSubmit = async (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const button = form.querySelector<HTMLButtonElement>('#login-button');
		const messageDiv = wrapper.querySelector<HTMLDivElement>('#login-message-component');

		if (button) button.disabled = true;
		if (messageDiv) {
			messageDiv.textContent = t('login.attemptingLogin');
			messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-gray-300';
		}

		const identifier = (form.elements.namedItem('identifier') as HTMLInputElement).value;
		const password = (form.elements.namedItem('password') as HTMLInputElement).value;

		const result = await onLoginAttempt({ identifier, password });

		if (result.success) {
			if (result.data.two_fa_required) {
				renderTwoFactorStep();
			} else if (result.data.user) {
				onLoginSuccess(result.data.user);
			}
		} else {
			if (messageDiv) {
				messageDiv.textContent = result.error;
				messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-red-400 font-semibold';
            }
            if (button) button.disabled = false;
		}
	};

	const handleTwoFactorSubmit = async (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const button = form.querySelector<HTMLButtonElement>('#two-fa-button');
		const messageDiv = wrapper.querySelector<HTMLDivElement>('#login-message-component');

		if (button) button.disabled = true;
		if (messageDiv) {
			messageDiv.textContent = t('login.2fa.verifying');
			messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-gray-300';
		}

		const token = (form.elements.namedItem('two-fa-token') as HTMLInputElement).value;

		const result = await on2FAAttempt(token);

		if (result.success) {
			if (result.data.user) {
				onLoginSuccess(result.data.user);
			}
		} else {
			if (messageDiv) {
				messageDiv.textContent = result.error;
				messageDiv.className = 'mt-4 text-center text-sm min-h-[20px] text-red-400 font-semibold';
			}
			if (button) button.disabled = false;
		}
	};

	renderPasswordStep();
	return wrapper;
}
