export const tg = window.Telegram?.WebApp;

export function initTelegram() {
    if (!tg) return;
    try {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#0b0c14');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0b0c14');
    } catch (e) {
        console.warn('Telegram WebApp SDK warning:', e);
    }
}

export function triggerHaptic(style = 'medium') {
    try {
        if (tg?.HapticFeedback) {
            if (['success', 'error', 'warning'].includes(style)) {
                tg.HapticFeedback.notificationOccurred(style);
            } else {
                tg.HapticFeedback.impactOccurred(style);
            }
        }
    } catch (e) {}
}