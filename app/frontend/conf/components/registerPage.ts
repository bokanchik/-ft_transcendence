import { attemptRegister } from '../services/authService.js';
import { RegisterRequestBody, ApiResult } from '../shared/types.js'

export function RegisterPage(): HTMLElement {
	const container = document.createElement('div');
	container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';

	const formContainer = document.createElement('div');
	formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';

	formContainer.innerHTML = `
        <h2 class="text-3xl font-bold mb-6 text-center text-gray-800">Register</h2>
        <form id="register-form">
            <div class="mb-4">
                <label for="username" class="block text-gray-700 text-sm font-bold mb-2">Username</label>
                <input type="text" id="username" name="username" required minlength="3" maxlength="20"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <p class="text-xs text-gray-600 mt-1">3 to 20 characters.</p>
            </div>
            <div class="mb-4">
                <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input type="email" id="email" name="email" required
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
             <div class="mb-4">
                <label for="display_name" class="block text-gray-700 text-sm font-bold mb-2">Display Name</label>
                <input type="text" id="display_name" name="display_name" required minlength="3" maxlength="20"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <p class="text-xs text-gray-600 mt-1">3 to 20 characters.</p>
            </div>
            <div class="mb-4">
                <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <input type="password" id="password" name="password" required minlength="8" maxlength="100"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                 <p class="text-xs text-gray-600 mt-1">8 to 100 characters.</p>
            </div>
             <div class="mb-6">
                <label for="confirm_password" class="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
                <input type="password" id="confirm_password" name="confirm_password" required minlength="8" maxlength="100"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="mb-6">
                <label for="avatar_url" class="block text-gray-700 text-sm font-bold mb-2">Avatar URL (Optional)</label>
                <input type="url" id="avatar_url" name="avatar_url" placeholder="https://example.com/avatar.jpg"
                       class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            </div>
            <div class="flex items-center justify-between">
                <button type="submit" id="register-button"
                        class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-300 ease-in-out">
                    Register
                </button>
            </div>
        </form>
        <div id="register-message" class="mt-4 text-center text-sm"></div>
        <div class="mt-6 text-center">
          <a href="/" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Back to Home
          </a>
          <span class="mx-2 text-gray-400">|</span>
          <a href="/login" data-link class="text-blue-600 hover:text-blue-800 text-sm">
            Already have an account? Login
          </a>
        </div>
    `;

	container.appendChild(formContainer);

	// --- Logique du formulaire d'inscription ---
	const form = container.querySelector('#register-form') as HTMLFormElement;
	const usernameInput = container.querySelector('#username') as HTMLInputElement;
	const emailInput = container.querySelector('#email') as HTMLInputElement;
	const displayNameInput = container.querySelector('#display_name') as HTMLInputElement;
	const passwordInput = container.querySelector('#password') as HTMLInputElement;
	const confirmPasswordInput = container.querySelector('#confirm_password') as HTMLInputElement;
	const avatarUrlInput = container.querySelector('#avatar_url') as HTMLInputElement;
	const messageDiv = container.querySelector('#register-message') as HTMLDivElement;
	const registerButton = container.querySelector('#register-button') as HTMLButtonElement;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		messageDiv.textContent = ''; // Clear previous messages
		messageDiv.className = 'mt-4 text-center text-sm'; // Reset style

		const username = usernameInput.value.trim();
		const email = emailInput.value.trim();
		const displayName = displayNameInput.value.trim();
		const password = passwordInput.value; // No trim on password
		const confirmPassword = confirmPasswordInput.value;
		const avatarUrl = avatarUrlInput.value.trim();

		// --- Validation côté client (basique) ---
		if (!username || !email || !displayName || !password || !confirmPassword) {
			messageDiv.textContent = 'Please fill in all required fields.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			return;
		}
		if (password !== confirmPassword) {
			messageDiv.textContent = 'Passwords do not match.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			passwordInput.value = ''; // Clear passwords
			confirmPasswordInput.value = '';
			return;
		}
		if (password.length < 8) {
			messageDiv.textContent = 'Password must be at least 8 characters long.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			return;
		}
		// Simple check for avatar URL format if provided
		if (avatarUrl && !isValidHttpUrl(avatarUrl)) {
			messageDiv.textContent = 'Avatar URL must be a valid HTTP/HTTPS URL.';
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			return;
		}

		// --- Appel à l'API ---
		messageDiv.textContent = 'Attempting registration...';
		messageDiv.className = 'mt-4 text-center text-sm text-gray-600';
		registerButton.disabled = true;
		registerButton.textContent = 'Registering...';

		const credentials: RegisterRequestBody = {
			username,
			email,
			password,
			display_name: displayName,
		};
		// Only add avatar_url if it's not empty
		if (avatarUrl) {
			credentials.avatar_url = avatarUrl;
		}

		const registrationResult: ApiResult = await attemptRegister(credentials);

		registerButton.disabled = false; // Re-enable button
		registerButton.textContent = 'Register';

		if (registrationResult.success) {
			messageDiv.textContent = `Registration successful for ${username}! Redirecting to login...`;
			messageDiv.className = 'mt-4 text-center text-sm text-green-600';
			form.reset(); // Clear the form fields

			// Rediriger vers la page de connexion après un délai
			setTimeout(() => {
				window.location.href = '/login'; // Ou utilisez votre système de routage: router.navigate('/login');
			}, 2000); // Délai de 2 secondes

		} else {
			// Échec (message déjà affiché par alert)
			messageDiv.textContent = 'Registration failed. Please check the details and try again.'; // Message générique post-alert
			messageDiv.className = 'mt-4 text-center text-sm text-red-600';
			passwordInput.value = ''; // Clear password fields on failure
			confirmPasswordInput.value = '';
		}
	});

	return container;
}

// Helper function for basic URL validation
function isValidHttpUrl(string: string): boolean {
	let url;
	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}
	return url.protocol === "http:" || url.protocol === "https:";
}
