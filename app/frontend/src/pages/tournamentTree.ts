import { showToast } from "../components/toast.js";
import { navigateTo } from "../services/router.js";

export async function TournamentPage(params: { [key: string]: string }): Promise<HTMLElement> {
	const container = document.createElement("div");
	container.className = "p-8 flex flex-col items-center";

	const tournamentId = sessionStorage.getItem("tournamentId");

	if (!tournamentId) {
		showToast("No tournament found", "error");
		navigateTo("/local-game");
		return document.createElement("div");
	}

	const data = await fetchTournamentById(tournamentId);

	if (!data) {
		showToast("No tournament data found", "error");
		navigateTo("/local-game");
		return document.createElement("div");
	}

	const title = document.createElement("h1");
	title.className = "text-3xl font-bold mb-4 text-center";
	title.textContent = "King-Pong Tournoi";
	container.appendChild(title);

	const rounds: { [round: number]: { id: string; player1: string; player2: string }[] } = {};
	for (const match of data.matches) {
		if (!rounds[match.round]) {
			rounds[match.round] = [];
		}
		rounds[match.round].push({
			id: match.id,
			player1: match.player1,
			player2: match.player2,
		});
	}

	const round = 1;
	const roundEl = document.createElement("div");
	roundEl.className = "mb-8 bg-white shadow-lg rounded-lg p-6 border border-gray-200 w-full max-w-3xl";

	const header = document.createElement("h2");
	header.className = "text-2xl font-semibold mb-4 text-indigo-600";
	header.textContent = "Round 1";
	roundEl.appendChild(header);

	const list = document.createElement("ul");
	list.className = "space-y-3";

	const matches = rounds[round];

	if (matches && matches.length > 0) {
		for (let i = 0; i < matches.length; i++) {
			const match = matches[i];
			const hasPlayers = match.player1 && match.player2;

			const li = document.createElement("li");

			if (hasPlayers) {
				li.className =
					"bg-gray-100 p-6 rounded-lg flex justify-between items-center shadow-md cursor-pointer transition hover:bg-indigo-100 hover:shadow-lg text-lg";

				li.innerHTML = `
					<span class="font-medium text-gray-700">${match.player1}</span>
					<span class="text-gray-500">vs</span>
					<span class="font-medium text-gray-700">${match.player2}</span>
				`;

				li.addEventListener("click", () => {
					sessionStorage.setItem("player1", match.player1);
					sessionStorage.setItem("player2", match.player2);
					sessionStorage.setItem("gameMode", "local");
					sessionStorage.setItem("matchId", match.id);
					sessionStorage.setItem("gameRegime", "tournament");
					navigateTo(`/game-room?matchId=${match.id}`);
				});
			} else {
				li.className =
					"bg-gray-50 p-3 rounded-md flex justify-between items-center text-gray-400 italic border border-dashed border-gray-300";
				li.innerHTML = `
					<span>Unknown Player 1</span>
					<span>vs</span>
					<span>Unknown Player 2</span>
				`;
			}

			list.appendChild(li);
		}
	}

	roundEl.appendChild(list);
	container.appendChild(roundEl);

	const cancelButton = document.createElement("button");
	cancelButton.textContent = "Cancel Tournament";
	cancelButton.className =
		"mt-10 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition";
	cancelButton.addEventListener("click", () => {
		sessionStorage.clear();
		navigateTo("/local-game");
	});
	container.appendChild(cancelButton);

	return container;
}

export async function fetchTournamentById(id: string) {
	try {
		const response = await fetch(`/api/tournament/local/${id}`);
		if (!response.ok) throw new Error("Failed to fetch tournament by id");
		const data = await response.json();
		return data;
	} catch (err: unknown) {
		console.error(`Failed to fetch tournament from server: ${err}`);
		throw err;
	}
}