chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'VEHICLE_DETECTED') {
        const url = chrome.runtime.getURL('index.html');

        if (chrome.action?.openPopup) {
            chrome.action.openPopup().then(
                () => sendResponse({ ok: true, method: 'popup' }),
                (error) => {
                    console.warn('chrome.action.openPopup failed:', error);
                    chrome.windows.create(
                        {
                            url,
                            type: 'popup',
                            focused: true,
                            width: 900,
                            height: 850,
                        },
                        (window) => {
                            if (chrome.runtime.lastError) {
                                console.warn('chrome.windows.create failed:', chrome.runtime.lastError.message);
                                sendResponse({ ok: false, reason: 'windows.create failed' });
                                return;
                            }
                            sendResponse({ ok: true, method: 'window', windowId: window?.id });
                        }
                    );
                }
            );
            return true;
        }

        chrome.windows.create(
            {
                url,
                type: 'popup',
                focused: true,
                width: 900,
                height: 850,
            },
            (window) => {
                if (chrome.runtime.lastError) {
                    console.warn('chrome.windows.create failed:', chrome.runtime.lastError.message);
                    sendResponse({ ok: false, reason: 'windows.create failed' });
                    return;
                }
                sendResponse({ ok: true, method: 'window', windowId: window?.id });
            }
        );

        return true;
    }
    return true;
});
