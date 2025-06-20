import { initLocalGame } from "../services/initLocalGame";

export function TournamentPage(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'p-8 flex flex-col items-center';
    
    // pairs of players from 1 round ?
    const rawData = sessionStorage.getItem('tournamentData');
    
    if (!rawData) {
        // remplacer par la page d'erreur
        container.innerHTML = `<div class="text-center text-red-500 text-lg">Aucune donnée de tournoi disponible.</div>`;
        return container;
    }
    
    let data;
    try {
        data = JSON.parse(rawData);
    } catch (err) {
        // remplacer par la page d'erreur
        container.innerHTML = `<div class="text-center text-red-500 text-lg">Erreur de parsing des données du tournoi.</div>`;
        return container;
    }

    console.log(`Data.pairs: `, data.pairs);
    
    const title = document.createElement('h1');
    title.className = 'text-3xl font-bold mb-6 text-center';
    title.textContent = 'King-Pong Tournoi';
    container.appendChild(title);

    // Initialisation avec Round 1
    const rounds: { [round: number]: { player1: string, player2: string }[] } = {};
    rounds[1] = data.pairs;

    let roundNumber = 1;
    while (rounds[roundNumber].length > 1) {
        const nextRound = roundNumber + 1;
        const currentMatches = rounds[roundNumber];

        const nextMatches: { player1: string, player2: string }[] = [];
        for (let i = 0; i < currentMatches.length; i += 2) {
            const winner1 = `Winner ${roundNumber}-${i + 1}`;
            const winner2 = `Winner ${roundNumber}-${i + 2}`;
            nextMatches.push({ player1: winner1, player2: winner2 });
        }

        rounds[nextRound] = nextMatches;
        roundNumber = nextRound;
    }

    // Affichage des rounds
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'w-full max-w-3xl';

    const sortedRounds = Object.entries(rounds).sort((a, b) => Number(a[0]) - Number(b[0]));
    for (const [roundStr, matches] of sortedRounds) {
        const round = parseInt(roundStr, 10);
        const roundEl = document.createElement('div');
        roundEl.className = 'mb-8 bg-white shadow-lg rounded-lg p-6 border border-gray-200';

        const header = document.createElement('h2');
        header.className = 'text-2xl font-semibold mb-4 text-indigo-600';
        header.textContent = round === roundNumber ? 'Finale' : `Round ${round}`;
        roundEl.appendChild(header);

        const list = document.createElement('ul');
        list.className = 'space-y-3';
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const li = document.createElement('li');
            li.className = 'bg-gray-100 p-3 rounded-md flex justify-between items-center shadow-sm';
            li.innerHTML = `
                <span class="font-medium text-gray-700">${match.player1}</span>
                <span class="text-gray-500">vs</span>
                <span class="font-medium text-gray-700">${match.player2}</span>
            `;
            list.appendChild(li);
        }

        roundEl.appendChild(list);
        contentWrapper.appendChild(roundEl);
    }

    container.appendChild(contentWrapper);

    const startButton = document.createElement('button');
    startButton.textContent = 'Start Tournament';
    startButton.className = 'mt-10 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition';


    startButton.addEventListener('click', () => {
      //  createLocalMatch()
    });

    container.appendChild(startButton);

    return container;
}
