// /components/loginForm.ts
import { LoginRequestBody, ApiResult } from '../shared/types.js';

interface LoginFormProps {
	onLoginAttempt: (credentials: LoginRequestBody) => Promise<ApiResult>;
	onLoginSuccess: (userData: any) => void; // Callback pour informer la page du succès
}

export function LoginForm(props: LoginFormProps): HTMLElement {
	const { onLoginAttempt, onLoginSuccess } = props;

	const formWrapper = document.createElement('div');
	// Pas besoin de classes spécifiques ici si elles sont déjà sur formContainer dans la page

	formWrapper.innerHTML = `
        <form id="login-form-component"> <!-- ID unique pour ce composant -->
            <div class="mb-4">
                <label for="identifier" class="block text-gray-700 text-sm font-bold mb-2">Username or Email</label>
                <input type="text" id="identifier" name="identifier" required placeholder="Enter your username or email"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-6">
                <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input type="password" id="password" name="password" required
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="flex items-center justify-between">
                <button type="submit" id="login-button"
                        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out">
                    Sign In
                </button>
            </div>
        </form>
        <div id="login-message-component" class="mt-4 text-center text-sm"></div>
    `;

	const form = formWrapper.querySelector('#login-form-component') as HTMLFormElement;
	const identifierInput = formWrapper.querySelector('#identifier') as HTMLInputElement;
	const passwordInput = formWrapper.querySelector('#password') as HTMLInputElement;
	const messageDiv = formWrapper.querySelector('#login-message-component') as HTMLDivElement;
	const loginButton = formWrapper.querySelector('#login-button') as HTMLButtonElement;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = 'Attempting login...';
		messageDiv.className = 'mt-4 text-center text-sm text-gray-600';
		loginButton.disabled = true;
		loginButton.textContent = 'Signing In...';

		const identifier = identifierInput.value.trim();
		const password = passwordInput.value;

		if (!identifier || !password) {
			messageDiv.textContent = 'Please enter both username/email and password.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			loginButton.disabled = false;
			loginButton.textContent = 'Sign In';
			return;
		}

		const result = await onLoginAttempt({ identifier, password });

		loginButton.disabled = false;
		loginButton.textContent = 'Sign In';

		if (result.success) {
			messageDiv.textContent = `Login successful! Welcome ${result.data.user.display_name || result.data.user.username}!`;
			messageDiv.className = 'mt-4 text-center text-sm text-green-600';
			onLoginSuccess(result.data.user); // Appeler le callback de succès
		} else {
			messageDiv.textContent = result.error || 'Login failed. Please try again.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			passwordInput.value = ''; // Vider le mot de passe en cas d'échec
		}
	});

	return formWrapper;
}
