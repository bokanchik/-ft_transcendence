export async function initCountdown(container: HTMLDivElement) {
	const countdownIsDone = sessionStorage.getItem('countdown') === 'true';

	if (!countdownIsDone) {
		let countdownValue = 3;
		container.textContent = `Start in ${countdownValue}...`;

		const interval = setInterval(() => {
			countdownValue--;

			if (countdownValue > 0) {
				container.textContent = `Start in ${countdownValue}...`;
			} else {
				clearInterval(interval);
				container.remove();
				sessionStorage.setItem('countdown', 'true');
			}
		}, 1000);
	} else {
		container.remove();
	}
}
