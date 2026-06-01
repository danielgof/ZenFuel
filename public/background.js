chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'VEHICLE_DETECTED' && sender.tab?.id) {
        if (chrome.action?.openPopup) {
            chrome.action.openPopup();
            sendResponse({ ok: true });
        } else {
            console.warn('chrome.action.openPopup is not available in this browser.');
            sendResponse({ ok: false, reason: 'openPopup unavailable' });
        }
    }
    return true;
});
