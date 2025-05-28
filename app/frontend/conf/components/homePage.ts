export function HomePage(): HTMLElement {
	const container = document.createElement('div');
	container.className = 'bg-white flex flex-col justify-center items-center min-h-screen text-black p-8';

	const innerDiv = document.createElement('div');
	innerDiv.className = 'text-center bg-grey-300 bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 container mx-auto';

	innerDiv.innerHTML = `
        <h1 class="text-5xl font-bold mb-8 drop-shadow-lg">
          🏓 King-Pong 🏓
        </h1>
        <p class="text-xl mb-10 drop-shadow-md">
          The ultimate jungle Pong experience. Ready to play?
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/users" data-link class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            View User List
          </a>
          <a href="/login" data-link class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Login
          </a>
          <a href="/register" data-link class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Register
          </a>
          <a href="/game" data-link class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Check Game API
          </a>
          <a href="/local-game" data-link class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
            Local Game
          </a>
        </div>
    `;
	container.appendChild(innerDiv);
	return container;
}
