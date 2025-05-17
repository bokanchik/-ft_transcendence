import { attemptLogin } from '../services/authService.js';
import { ApiResult } from '../shared/types.js'
import { navigateTo } from '../services/router.js';

export function LoginPage(): HTMLElement {
	const container = document.createElement('div');
	container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';

	formContainer.innerHTML = `
        <h2 class="text-3xl font-bold mb-6 text-center text-gray-800">Login</h2>
        <form id="login-form">
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
        <div id="login-message" class="mt-4 text-center text-sm"></div> <!-- Pour les messages d'erreur/succès -->
        <div class="mt-6 text-center">
          <a href="/" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Back to Home
          </a>
          <span class="mx-2 text-gray-400">|</span>
          <a href="/register" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Don't have an account? Register
          </a>
        </div>
    `;

	container.appendChild(formContainer);

	const form = container.querySelector('#login-form') as HTMLFormElement;
	const identifierInput = container.querySelector('#identifier') as HTMLInputElement;
	const passwordInput = container.querySelector('#password') as HTMLInputElement;
	const messageDiv = container.querySelector('#login-message') as HTMLDivElement;
	const loginButton = container.querySelector('#login-button') as HTMLButtonElement;

	form.addEventListener('submit', async (event) => {
		event.preventDefault(); // Empêche le rechargement de la page
		messageDiv.textContent = 'Attempting login...';
		messageDiv.className = 'mt-4 text-center text-sm text-gray-600';
		loginButton.disabled = true; // Désactive le bouton pendant la requête
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

		const result: ApiResult = await attemptLogin({ identifier, password });

		loginButton.disabled = false; // Disable button after login attempt
		loginButton.textContent = 'Sign In';

		if (result.success) {
			messageDiv.textContent = `Login successful! Welcome ${result.data.user.display_name || result.data.user.username}! Token stored.`;
			messageDiv.className = 'mt-4 text-center text-sm text-green-600';
			setTimeout(() => { navigateTo('/dashboard'); }, 500); // 0.5 second of delay
		} else {
			messageDiv.textContent = result.error || 'Login failed. Please try again.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			passwordInput.value = '';
		}
	});
	return container;
}
