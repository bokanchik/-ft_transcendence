import './style.css'

const app = document.getElementById('app')
if (app) {
  const msg = document.createElement('p')
  msg.textContent = 'Frontend is working with Tailwind + TypeScript!'
  msg.className = 'mt-4 text-green-600'
  app.appendChild(msg)
}

// Fonction pour rediriger vers la page de connexion
const loginUser = async () => {
  try {
    const response = await fetch('http://api.example.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'user', password: 'password' }),
    });

    if (!response.ok) {
      throw new Error('Failed to log in');
    }

    const data = await response.json();
    console.log('Logged in:', data);
    // Redirection après connexion
    window.location.href = '/dashboard'; // Exemple de redirection après une connexion réussie
  } catch (error) {
    console.error('Login error:', error);
  }
};

// Fonction pour rediriger vers la page d'inscription
const registerUser = async () => {
  try {
    const response = await fetch('http://api.example.com/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'newuser', password: 'newpassword' }),
    });

    if (!response.ok) {
      throw new Error('Failed to register');
    }

    const data = await response.json();
    console.log('Registered:', data);
    // Redirection après inscription réussie
    window.location.href = '/welcome'; // Exemple de redirection après une inscription réussie
  } catch (error) {
    console.error('Registration error:', error);
  }
};

// Ajoute des écouteurs d'événements sur les boutons
const loginButton = document.getElementById('login-btn') as HTMLButtonElement;
const registerButton = document.getElementById('register-btn') as HTMLButtonElement;

if (loginButton) {
  loginButton.addEventListener('click', loginUser);
}

if (registerButton) {
  registerButton.addEventListener('click', registerUser);
}
