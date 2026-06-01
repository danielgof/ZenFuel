// public/content.js

function injectAlwaysActiveLogic() {
    try {
        Object.defineProperty(document, 'visibilityState', {
            get: () => 'visible',
            configurable: true,
        });
        Object.defineProperty(document, 'hidden', {
            get: () => false,
            configurable: true,
        });

        const blockVisibilityEvent = (e) => {
            if (e.type === 'visibilitychange' || e.type === 'webkitvisibilitychange') {
                e.stopImmediatePropagation();
            }
        };

        document.addEventListener('visibilitychange', blockVisibilityEvent, true);
        document.addEventListener('webkitvisibilitychange', blockVisibilityEvent, true);

        Object.defineProperty(document, 'hasFocus', {
            value: () => true,
            configurable: true,
        });

        const blockBlurEvent = (e) => {
            if (e.type === 'blur' || e.type === 'focusout') {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        };

        window.addEventListener('blur', blockBlurEvent, true);
        window.addEventListener('focusout', blockBlurEvent, true);
    } catch (error) {
        console.warn('Always-active injection failed:', error);
    }
}

(function injectAlwaysActive() {
    const script = document.createElement('script');
    script.textContent = `(${injectAlwaysActiveLogic.toString()})();`;
    (document.documentElement || document.head || document.body || document.documentElement).appendChild(script);
    script.remove();
})();

function extractOptions(select) {
    if (!select) return [];

    return Array.from(select.options)
        .map((option) => option.text.trim())
        .filter(
            (text) =>
                text.length > 0 &&
                !['select', 'choose', 'year', 'make', 'model'].some((k) =>
                    text.toLowerCase().includes(k)
                )
        );
}

function findSelect(keywords) {
    const selects = Array.from(document.querySelectorAll('select'));

    for (const select of selects) {
        const placeholder = select.getAttribute('placeholder');
        const attrs = [
            select.name,
            select.id,
            select.getAttribute('aria-label'),
            placeholder,
            select.className,
        ]
            .join(' ')
            .toLowerCase();

        const label =
            document
                .querySelector(`label[for="${select.id}"]`)
                ?.textContent?.toLowerCase() || '';
        const combined = `${attrs} ${label}`;

        if (keywords.some((k) => combined.includes(k))) {
            return select;
        }
    }
    return null;
}

function getPageHeadings() {
    const headingSelectors = ['h1', 'h2', 'h3', '.title', '.headline', '.page-title'];
    const headings = headingSelectors
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .map((element) => element.textContent?.trim())
        .filter(Boolean);

    return [...new Set(headings)].slice(0, 5);
}

function parseVehicleDropdowns() {
    const yearSelect = findSelect(['year', 'years']);
    const makeSelect = findSelect(['make', 'manufacturer', 'brand']);
    const modelSelect = findSelect(['model', 'trim', 'vehicle']);

    return {
        years: extractOptions(yearSelect),
        makes: extractOptions(makeSelect),
        models: extractOptions(modelSelect),
        headings: getPageHeadings(),
    };
}

function parseVehicleText(text) {
    if (!text) {
        return { year: '', make: '', model: '' };
    }

    const cleaned = text
        .replace(/\|.*$/, '')
        .replace(/[-–—]/g, ' ')
        .replace(/[\u2018\u2019\u201C\u201D]/g, '')
        .trim();
    const words = cleaned.split(/\s+/);

    let year = '';
    let make = '';
    let model = '';

    const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        year = yearMatch[0];
    }

    const knownMakes = [
        'Acura','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge','Ford','GMC','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mercedes','Nissan','Subaru','Tesla','Toyota','Volkswagen','Volvo',
    ];

    for (const word of words) {
        const found = knownMakes.find((m) => m.toLowerCase() === word.toLowerCase());
        if (found) {
            make = found;
            break;
        }
    }

    if (make) {
        const makeIndex = words.findIndex((w) => w.toLowerCase() === make.toLowerCase());
        const stopWords = ['SUV', 'Sedan', 'Truck', 'Crossover', 'Hybrid', 'Coupe', 'EV', 'Electric', 'Vehicle', 'Cars', 'for', 'in', 'with'];
        const modelWords = [];

        for (let i = makeIndex + 1; i < words.length; i += 1) {
            const word = words[i];
            if (stopWords.some((stop) => stop.toLowerCase() === word.toLowerCase())) {
                break;
            }
            modelWords.push(word);
        }

        model = modelWords.join(' ').replace(/[^a-zA-Z0-9 ]/g, '').trim();
    }

    return { year, make, model };
}

function detectVehicleOnPage() {
    const pageTitleDetection = parseVehicleText(document.title || '');

    const headingDetection = getPageHeadings()
        .map(parseVehicleText)
        .find((candidate) => candidate.year || candidate.make || candidate.model);

    const dropdownData = parseVehicleDropdowns();
    const hasVehicleDropdowns = dropdownData.years.length > 0 || dropdownData.makes.length > 0 || dropdownData.models.length > 0;

    if (pageTitleDetection.year || pageTitleDetection.make || pageTitleDetection.model) {
        return { source: 'title', ...pageTitleDetection };
    }

    if (headingDetection) {
        return { source: 'heading', ...headingDetection };
    }

    if (hasVehicleDropdowns) {
        return { source: 'dropdown', year: '', make: '', model: '' };
    }

    return null;
}

let detectionSent = false;

function sendDetectionToBackground() {
    if (detectionSent) {
        return;
    }

    const detected = detectVehicleOnPage();
    if (!detected) {
        return;
    }

    detectionSent = true;
    chrome.runtime.sendMessage({ action: 'VEHICLE_DETECTED', detected }, () => {
        if (chrome.runtime.lastError) {
            console.warn('Vehicle detection notification failed:', chrome.runtime.lastError.message);
        }
    });
}

function watchForVehicleDetection() {
    sendDetectionToBackground();

    const observer = new MutationObserver(() => {
        if (!detectionSent) {
            sendDetectionToBackground();
        }
    });

    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
        attributes: true,
    });
}

// =========================================================================
// Listen for a direct request from App.js
// =========================================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'SCRAPE_VEHICLE_DROPDOWNS') {
        console.log(message);
        const currentVehicleData = parseVehicleDropdowns();

        console.log('Scraped Vehicle Data on Demand:', currentVehicleData);

        // Respond directly back to the popup tab that called it
        // sendResponse(currentVehicleData);
        sendResponse({
            ...currentVehicleData,
            html: document.documentElement.outerHTML,
            title: document.title,
            url: location.href,
        });
    }
    return true;
});

if (window.top === window) {
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            watchForVehicleDetection();
        });
    } else {
        watchForVehicleDetection();
    }
} else {
    // Avoid duplicate detection from subframes.
    console.debug('Skipping vehicle detection in subframe');
}
