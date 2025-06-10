import { fetchUserDetails } from '../services/authService.js';
import { fetchMatchHistoryForUser } from '../services/authService.js';

export interface MatchHistoryComponentProps {
	userId: number; // ID de l'utilisateur dont on affiche l'historique
}

export async function MatchHistoryComponent(props: MatchHistoryComponentProps): Promise<HTMLElement> {
	const { userId: profiledUserId } = props;

	const el = document.createElement('div');
	el.className = 'p-4';
	el.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-gray-800">Historique des Matchs</h3>`;

	const loadingMessage = document.createElement('p');
	loadingMessage.className = 'text-gray-500 italic';
	loadingMessage.textContent = 'Chargement de l\'historique des matchs...';
	el.appendChild(loadingMessage);

	try {
		const matches = await fetchMatchHistoryForUser(profiledUserId);
		loadingMessage.remove();

		if (!matches || matches.length === 0) {
			el.innerHTML += '<p class="text-gray-500">Aucun match trouvé pour cet utilisateur.</p>';
			return el;
		}

		const opponentsDetailsCache: { [key: number]: { display_name: string } } = {};
		const list = document.createElement('ul');
		list.className = 'space-y-3';

		for (const match of matches) {
			let opponentId: number;
			let profiledUserScore: number;
			let opponentScore: number;
			let opponentDisplayName = 'Adversaire Inconnu';

			if (match.player1_id === profiledUserId) {
				opponentId = match.player2_id;
				profiledUserScore = match.player1_score;
				opponentScore = match.player2_score;
			} else if (match.player2_id === profiledUserId) {
				opponentId = match.player1_id;
				profiledUserScore = match.player2_score;
				opponentScore = match.player1_score;
			} else {
				console.warn("Match ne semble pas impliquer l'utilisateur profilé:", match);
				continue;
			}
			
			if (!opponentsDetailsCache[opponentId]) {
				try {
					const opponentUser = await fetchUserDetails(opponentId);
					opponentsDetailsCache[opponentId] = { display_name: opponentUser?.display_name || `Joueur ${opponentId}` };
				} catch (e) {
					console.error(`Impossible de récupérer les détails pour l'utilisateur ${opponentId}`, e);
					opponentsDetailsCache[opponentId] = { display_name: `Joueur ${opponentId}` };
				}
			}
			opponentDisplayName = opponentsDetailsCache[opponentId].display_name;
			
			const resultText = match.winner_id === profiledUserId ? 'Victoire' : (match.winner_id ? 'Défaite' : 'Égalité/Annulé');
			const resultColor = match.winner_id === profiledUserId ? 'text-green-600' : (match.winner_id ? 'text-red-600' : 'text-gray-600');

			const item = document.createElement('li');
			item.className = 'p-3 bg-gray-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow';
			item.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="font-medium text-gray-700">Contre : ${opponentDisplayName}</span>
                    <span class="font-semibold ${resultColor}">${resultText}</span>
                </div>
                <div class="text-sm text-gray-600">
                    Score : ${profiledUserScore} - ${opponentScore}
                    <span class="mx-1">|</span>
                    Type : ${match.win_type}
                    <span class="mx-1">|</span>
                    Date : ${new Date(match.created_at).toLocaleDateString()}
                </div>
            `;
			list.appendChild(item);
		}
		el.appendChild(list);

	} catch (error) {
		console.error("Erreur lors du rendu de l'historique des matchs:", error);
		loadingMessage.textContent = `Erreur lors du chargement de l'historique des matchs: ${(error as Error).message}`;
		loadingMessage.classList.remove('text-gray-500', 'italic');
		loadingMessage.classList.add('text-red-500');
	}

	return el;
}