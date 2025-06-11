import { navigateTo } from "../services/router.js";
import { initLocalGame } from "../services/initLocalGame.js";
// import { createInputField, createInputField } from "../utils/domUtils.js";

export function promptAliasForm(): HTMLDivElement {

    // --- Main Container ---
    const container: HTMLDivElement = document.createElement('div');
	container.className = 'bg-white flex justify-center items-center min-h-screen p-8';

    const formContainer: HTMLDivElement = document.createElement('div');
    formContainer.className = 'bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl p-8 max-w-md w-full';

    // --- Title ---
    const title: HTMLHeadingElement = document.createElement('h2');
    title.textContent = 'Select Game Mode';
    title.className = 'text-3xl font-bold mb-6 text-center text-gray-800';

    // --- Input form ---
    const form: HTMLFormElement = document.createElement('form');
    form.className = 'space-y-6';

    const gameModeField = createSelectField('gameMode', 'Game Mode', ['1v1', 'Tournament']);
    const dynamicInputs = document.createElement('div');

    // --- Buttons ---
    const buttonsContainer: HTMLDivElement = document.createElement('div');
    buttonsContainer.id = 'buttons-container';
    buttonsContainer.className = 'flex justify-end space-x-4';

    const cancelButton: HTMLButtonElement = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.id = 'cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded transition duration-200';

    const submitButton: HTMLButtonElement = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.textContent = 'Start';
    submitButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200';

    buttonsContainer.append(cancelButton, submitButton);
    
    // --- Le pied de page ---
    const footer: HTMLDivElement = document.createElement('div');
    footer.className = 'mt-6 text-center';

    const homeLink: HTMLAnchorElement = document.createElement('a');
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
        // need to abort the fetch ?
        navigateTo('/game');
    });
    
    // --- Input depends on gameMode
    const selectElement: HTMLSelectElement = (gameModeField.querySelector('select') as HTMLSelectElement);
    selectElement.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value;
        dynamicInputs.innerHTML = ''; // reset a chaque changement

        if (value === '1v1') {
            dynamicInputs.append(
                createInputField('alias1', 'Player1'),
                createInputField('alias2', 'Player2')
            );
        } else if (value === 'Tournament' || value === 'Battle Royale') {
            const countField = createInputField('playerCount', 'How many players?');
            const inputElement = countField.querySelector('input') as HTMLInputElement;
            inputElement.placeholder = 'Enter a number between 3 and 10';
            
            dynamicInputs.append(countField);

            // generate as many inputs as recieved in countField
            const aliasFields = document.createElement('div');
            dynamicInputs.append(aliasFields);

            inputElement.type = 'number';
            inputElement.min = '3';
            inputElement.max = '10';

            inputElement.addEventListener('input', () => {
                aliasFields.innerHTML = ''; // reset a chaque changement
                const count: number = parseInt(inputElement.value);
                if (isNaN(count) || count < 3 || count > 10) return;

                for (let i = 1; i <= count; i++) {
                    const field = createInputField(`alias${i}`, `Player ${i}`);
                    field.classList.add('animate-fade-in');
                    aliasFields.appendChild(field);
                }
            });
        }
    });

    // diffuser l'event 'change'
    selectElement.dispatchEvent(new Event('change'));

    // --- Event: Submit form event triggered
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // prevents the page from refreshing
        await initLocalGame(form);
    });
    
    return container;
}


// -- Helper function for input
function createInputField(id: string, labelText: string): HTMLDivElement {
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

// --- Helper function for game mode (menu delurant avec 3 options)
function createSelectField(id: string, labelText: string, options: string[]): HTMLDivElement {
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
