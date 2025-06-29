
import { fetchUserDetails } from '../services/authService.js';
import { fetchMatchHistoryForUser } from '../services/authService.js';
import { t } from '../services/i18nService.js';

export interface MatchHistoryComponentProps {
	userId: number;
}

const opponentsDetailsCache: { [key: number]: { display_name: string; avatar_url: string | null } } = {};

export async function MatchHistoryComponent(props: MatchHistoryComponentProps): Promise<HTMLElement> {
	const { userId: profiledUserId } = props;

	const el = document.createElement('div');
	el.className = 'p-4';
	el.innerHTML = `<h3 class="text-xl font-semibold mb-4 text-white">${t('match.history.title')}</h3>`;

	const loadingMessage = document.createElement('p');
	loadingMessage.className = 'text-gray-300 italic';
	loadingMessage.textContent = t('match.history.loading');
	el.appendChild(loadingMessage);

	try {
		const matches = await fetchMatchHistoryForUser(profiledUserId);
		loadingMessage.remove();

		if (!matches || matches.length === 0) {
			el.innerHTML += `<p class="text-gray-300">${t('match.history.noMatches')}</p>`;
			return el;
		}

		const list = document.createElement('ul');
		list.className = 'space-y-3';

		for (const match of matches) {
			let opponentId: number;
			let profiledUserScore: number;
			let opponentScore: number;

			if (match.player1_id === profiledUserId) {
				opponentId = match.player2_id;
				profiledUserScore = match.player1_score;
				opponentScore = match.player2_score;
			} else if (match.player2_id === profiledUserId) {
				opponentId = match.player1_id;
				profiledUserScore = match.player2_score;
				opponentScore = match.player1_score;
			} else {
				continue;
			}

			if (!opponentsDetailsCache[opponentId]) {
				try {
					const opponentUser = await fetchUserDetails(opponentId);
					opponentsDetailsCache[opponentId] = {
						display_name: opponentUser?.display_name || `${t('match.details.player')} ${opponentId}`,
						avatar_url: opponentUser?.avatar_url || null
					};
				} catch (e) {
					opponentsDetailsCache[opponentId] = {
						display_name: `${t('match.details.player')} ${opponentId}`,
						avatar_url: null
					};
				}
			}
			const { display_name: opponentDisplayName, avatar_url: opponentAvatarUrl } = opponentsDetailsCache[opponentId];
			const initials = opponentDisplayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
			const avatarSrc = opponentAvatarUrl || `https://ui-avatars.com/api/?name=${initials}&background=e2e8f0&color=111827&size=96&bold=true`;

			const isWin = match.winner_id === profiledUserId;
			const isDraw = !match.winner_id;
			const resultText = isWin ? t('match.history.victory') : (isDraw ? t('match.history.draw') : t('match.history.defeat'));
			const resultColorClass = isWin ? 'text-green-400' : (isDraw ? 'text-gray-400' : 'text-red-500');

			let backgroundClass = 'bg-[#111827]';
            if (isWin) {
                backgroundClass = 'bg-green-900/30 hover:bg-green-800/40';
            } else if (!isDraw) {
                backgroundClass = 'bg-red-900/30 hover:bg-red-800/40';
            }

			const item = document.createElement('li');
			item.className = `h-24 border border-gray-700/50 rounded-lg flex items-center p-4 gap-4 transition-colors duration-200 ${backgroundClass}`;
			const dateFromDb = new Date(match.created_at + 'Z');
			const formattedTime = formatTimeAgo(dateFromDb);
			const fullDate = formatFullDate(dateFromDb); 

			item.innerHTML = `
                <!-- 1. VS + Avatar -->
                <div class="flex items-center gap-5 flex-shrink-0">
                    <span class="text-5xl font-jurassic ${resultColorClass}">VS</span>
                    <img src="${avatarSrc}" alt="${opponentDisplayName}" class="h-16 w-16 rounded-full object-cover">
                </div>

                <!-- 2. Bloc central avec espacement égal -->
                <div class="flex-grow flex justify-between items-center px-4">
                    <!-- Nom de l'adversaire (aligné à gauche) -->
                    <div class="text-left">
                        <span class="text-lg text-gray-300 font-roar">${opponentDisplayName}</span>
                    </div>

                    <div class="text-center">
                        <span class="text-5xl font-jurassic tracking-wide ${resultColorClass}">${resultText.toUpperCase()}</span>
                    </div>

                    <!-- Score (aligné à droite) -->
                    <div class="flex justify-end items-baseline text-3xl font-light">
                        <span class="${isWin ? 'font-semibold text-white font-roar' : 'text-gray-400 font-roar'}">${profiledUserScore}</span>
                        <span class="mx-3 text-gray-600 font-roar">/</span>
                        <span class="${!isWin && !isDraw ? 'font-semibold text-white font-roar' : 'text-gray-400 font-roar'}">${opponentScore}</span>
                    </div>
                </div>

                <!-- 3. Date / Type (à l'extrémité droite) -->
                <div class="flex flex-col justify-center items-end text-right w-28 flex-shrink-0">
                    <span class="text-sm text-gray-400" title="${fullDate}">${formattedTime}</span>
                    <span class="text-xs text-gray-500">${match.win_type || 'Score'}</span>
                </div>
            `;
			list.appendChild(item);
		}
		el.appendChild(list);

	} catch (error) {
		console.error("Error while loading Match history.", error);
		loadingMessage.textContent = `${t('match.history.error')}: ${(error as Error).message}`;
		loadingMessage.classList.remove('text-gray-300', 'italic');
		loadingMessage.classList.add('text-red-400');
	}

	return el;
}

function formatFullDate(date: Date): string {
	const adjustedTimestamp = date.getTime();
    const adjustedDate = new Date(adjustedTimestamp);
    return adjustedDate.toLocaleString();
}

function formatTimeAgo(date: Date): string {
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	const years = Math.floor(seconds / 31536000);
	if (years > 0) return t(years === 1 ? 'time.ago.year' : 'time.ago.years', { count: years.toString() });

	const months = Math.floor(seconds / 2592000);
	if (months > 0) return t(months === 1 ? 'time.ago.month' : 'time.ago.months', { count: months.toString() });

	const days = Math.floor(seconds / 86400);
	if (days > 0) return t(days === 1 ? 'time.ago.day' : 'time.ago.days', { count: days.toString() });

	const hours = Math.floor(seconds / 3600);
	if (hours > 0) return t(hours === 1 ? 'time.ago.hour' : 'time.ago.hours', { count: hours.toString() });

	const minutes = Math.floor(seconds / 60);
	if (minutes > 0) return t(minutes === 1 ? 'time.ago.minute' : 'time.ago.minutes', { count: minutes.toString() });

	return t('time.ago.now');
}
