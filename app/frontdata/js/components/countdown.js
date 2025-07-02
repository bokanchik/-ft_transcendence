import { t } from '../services/i18nService.js';
export function initCountdown(container) {
    return new Promise((resolve) => {
        const countdownIsDone = sessionStorage.getItem('countdown') === 'true';
        if (!countdownIsDone) {
            let countdownValue = 3;
            container.textContent = `${t('game.startIn')} ${countdownValue}...`;
            const interval = setInterval(() => {
                countdownValue--;
                if (countdownValue > 0) {
                    container.textContent = `${t('game.startIn')} ${countdownValue}...`;
                }
                else {
                    clearInterval(interval);
                    container.remove();
                    sessionStorage.setItem('countdown', 'true');
                    resolve();
                }
            }, 1000);
        }
        else {
            container.remove();
            resolve();
        }
    });
}
