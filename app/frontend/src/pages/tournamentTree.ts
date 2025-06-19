export function TournamentPage(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'p-8';

    const rawData = sessionStorage.getItem('tournamentData');
   
    if (!rawData) {
        container.innerHTML = `<p class="text-red-500">Aucune donnée de tournoi disponible.</p>`;
        return container;
    }

    let data;
    try {
        data = JSON.parse(rawData);
    } catch (err) {
        container.innerHTML = `<p class="text-red-500">Erreur de parsing des données du tournoi.</p>`;
        return container;
    }

    const rounds = new Map<number, { player1: string, player2: string }[]>();

    for (const pair of data.pairs) {
        if (!rounds.has(pair.round)) {
            rounds.set(pair.round, []);
        }
        rounds.get(pair.round)?.push({ player1: pair.player1, player2: pair.player2 });
    }

    const sortedRounds = [...rounds.entries()].sort((a, b) => a[0] - b[0]);

    for (const [round, matches] of sortedRounds) {
        const roundEl = document.createElement('div');
        roundEl.className = 'mb-6';
        roundEl.innerHTML = `<h2 class="text-xl font-bold mb-2">Round ${round}</h2>`;

        const list = document.createElement('ul');
        list.className = 'space-y-2';
        for (const match of matches) {
            const li = document.createElement('li');
            li.className = 'bg-gray-100 p-2 rounded shadow';
            li.textContent = `${match.player1} vs ${match.player2}`;
            list.appendChild(li);
        }

        roundEl.appendChild(list);
        container.appendChild(roundEl);
    }

    return container;
}
