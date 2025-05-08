import { navigateTo } from "../services/router.js";
export function promptAliasForm() {
    // --- Main Container ---
    const container = document.createElement('div');
    container.className = 'bg-gradient-to-r from-blue-500 to-purple-600 flex justify-center items-center min-h-screen p-8';
    const formContainer = document.createElement('div');
    formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';
    // --- Title ---
    const title = document.createElement('h2');
    title.textContent = 'Select Game Mode';
    title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';
    // --- Input form ---
    const form = document.createElement('form');
    form.className = 'space-y-6';
    const gameModeField = createSelectField('gameMode', 'Game Mode', ['1v1', 'Tournament', 'Battle Royale']);
    const dynamicInputs = document.createElement('div');
    // --- Buttons ---
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'buttons-container';
    buttonsContainer.className = 'flex justify-end space-x-4';
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded transition duration-200';
    const submitButton = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.textContent = 'Start';
    submitButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200';
    buttonsContainer.append(cancelButton, submitButton);
    // --- Le pied du page ---
    const footer = document.createElement('div');
    footer.className = 'mt-6 text-center';
    const homeLink = document.createElement('a');
    homeLink.href = '/'; // lien vers la page d'accueil
    homeLink.textContent = 'Back to Home';
    homeLink.setAttribute('data-link', ''); // intercepte par le router dans le main.ts
    homeLink.className = 'text-blue-600 hover:text-blue-800 text-sm';
    // --- Ajout des éléments au conteneur principal ---
    footer.appendChild(homeLink);
    form.append(gameModeField, dynamicInputs, buttonsContainer);
    formContainer.append(title, form, footer);
    container.appendChild(formContainer);
    // --- Event: Cancel button clicked
    cancelButton.addEventListener('click', async () => {
        navigateTo('/game');
    });
    // --- Input depends on gameMode
    const selectElemet = gameModeField.querySelector('select');
    selectElemet.addEventListener('change', (e) => {
        const value = e.target.value;
        dynamicInputs.innerHTML = ''; // reset a chaque changement
        if (value === '1v1') {
            dynamicInputs.append(createInputField('alias1', 'Player1'), createInputField('alias2', 'Player2'));
        }
        else if (value === 'Tournament' || value === 'Battle Royale') {
            const countField = createInputField('playerCount', 'How many players?');
            const inputElement = countField.querySelector('input');
            // ask for nb of players
            dynamicInputs.append(countField);
            // generate as many inputs as recieved in countField
            const aliasFields = document.createElement('div');
            dynamicInputs.append(aliasFields);
            inputElement.type = 'number';
            inputElement.min = '3';
            inputElement.max = '10';
            inputElement.addEventListener('input', () => {
                aliasFields.innerHTML = ''; // reset a chaque changement
                const count = parseInt(inputElement.value);
                if (isNaN(count) || count < 3 || count > 10)
                    return;
                let timeoutId = setTimeout(() => {
                    for (let i = 1; i <= count; i++) {
                        const delay = i * 150;
                        setTimeout(() => {
                            const field = createInputField(`alias${i}`, `Player ${i}`);
                            field.classList.add('animate-fade-in');
                            aliasFields.appendChild(field);
                        }, delay);
                    }
                }, 300);
            });
        }
    });
    selectElemet.dispatchEvent(new Event('change'));
    // --- Event: Submit form event triggered
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // prevents the page from refreshing
        const gameMode = form.querySelector('#gameMode');
        if (!gameMode) { // optional check ?
            alert('Please select a game mode.');
            return;
        }
        if (gameMode.value === "1v1") {
            const alias1 = form.querySelector('#alias1').value.trim();
            const alias2 = form.querySelector('#alias2').value.trim();
            if (!alias1 || !alias2) {
                alert('Please enter aliases for both players.');
                return;
            }
            // TODO ??: stocke les aliases pour GameRoomPage
            // sessionStorage.setItem('player1Alias', alias1);
            // sessionStorage.setItem('player2Alias', alias2);
            // sessionStorage.setItem('gameMode', gameMode.value);
            await createLocalMatch(alias1, alias2);
        }
        else { // TODO: les rooms pour le tournement et le battle royal
            alert('Tournement et le battle royal sont pas encore la :)');
            return;
        }
    });
    return container;
}
// --- Helper function to call an API
async function createLocalMatch(alias1, alias2) {
    try {
        const res = await fetch('/api/game/match/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player1: alias1,
                player2: alias2,
                isLocal: true,
            }),
        });
        if (!res.ok) {
            throw new Error('Failed to create local match');
        }
        const data = await res.json();
        const matchId = data.matchId;
        navigateTo(`/game-room?matchId=${matchId}`);
    }
    catch (err) {
        alert('Error starting local match');
        console.log(err);
    }
}
// -- Helper function for input
function createInputField(id, labelText) {
    const fieldDiv = document.createElement('div');
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.className = 'block text-sm font-medium text-gray-700 mb-1';
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.required = true;
    input.className = 'w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    fieldDiv.append(label, input);
    return fieldDiv;
}
;
// --- Helper function for game mode (menu delurant avec 3 options)
function createSelectField(id, labelText, options) {
    const fieldDiv = document.createElement('div');
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.className = 'block text-sm font-medium text-gray-700 mb-1';
    const select = document.createElement('select');
    select.id = id;
    select.required = true;
    select.className = 'w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
    for (const optionValue of options) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
    }
    fieldDiv.append(label, select);
    return fieldDiv;
}
