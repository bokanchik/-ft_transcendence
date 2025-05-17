export function showToast(message: string, type: 'success' | 'error' = 'success') {
    let toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed top-6 left-6 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all
        ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}