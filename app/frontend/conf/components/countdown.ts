export async function initCountdown(container: HTMLDivElement) {
	const countdownIsDone = sessionStorage.getItem('countdown') === 'true';
	// Countdown logic
	if (!countdownIsDone) {
		let countdownValue = 3;
		const interval = setInterval(() => {
			if (countdownValue > 1) {
				countdownValue--;
				container.textContent = `Start in ${countdownValue}...`;
			} else {
				container.remove(); // remove overlay
				clearInterval(interval);
				sessionStorage.setItem('countdown', 'true');

			}
		}, 1000);
	} else {
		container.remove();
	}
}
