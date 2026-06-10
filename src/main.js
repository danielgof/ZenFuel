import './index.css';
import {
    getYears,
    getMakes,
    getModels,
    getOptions,
    getVehicleDetails,
} from './services/fuelEconomyApi.js';

const yearSelect = document.getElementById('year-select');
const makeSelect = document.getElementById('make-select');
const modelSelect = document.getElementById('model-select');
const trimSelect = document.getElementById('trim-select');
const detectBtn = document.getElementById('detect-btn');
const detectBanner = document.getElementById('detect-banner');
const status = document.getElementById('status');
const loading = document.getElementById('loading');
const resultPanel = document.getElementById('result-panel');
const metricsGrid = document.getElementById('metrics-grid');
const infoGrid = document.getElementById('info-grid');

const state = {
    detectedVehicle: null,
    makes: [],
    models: [],
    options: [],
    vehicleData: null,
};

const MAKES = [
    'Acura',
    'Audi',
    'BMW',
    'Buick',
    'Cadillac',
    'Chevrolet',
    'Chrysler',
    'Dodge',
    'Ford',
    'GMC',
    'Honda',
    'Hyundai',
    'Infiniti',
    'Jeep',
    'Kia',
    'Lexus',
    'Mazda',
    'Mercedes',
    'Nissan',
    'Subaru',
    'Tesla',
    'Toyota',
    'Volkswagen',
    'Volvo',
];

function parseVehicleTitle(title) {
    const cleaned = title
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

    for (const word of words) {
        const found = MAKES.find((m) => m.toLowerCase() === word.toLowerCase());
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

function parseVehicleText(text) {
    if (!text) {
        return { year: '', make: '', model: '' };
    }

    const parsed = parseVehicleTitle(text);
    if (parsed.year || parsed.make || parsed.model) {
        return parsed;
    }

    const simplified = text.replace(/[-–—|:]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return parseVehicleTitle(simplified);
}

function setStatus(message) {
    status.textContent = message || '';
}

function setLoading(value) {
    loading.hidden = !value;
    if (value) {
        resultPanel.hidden = true;
    }
}

function resetResults() {
    state.vehicleData = null;
    resultPanel.hidden = true;
    metricsGrid.innerHTML = '';
    infoGrid.innerHTML = '';
}

function populateSelect(select, items, placeholder) {
    select.innerHTML = '';
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);

    items.forEach((item) => {
        const option = document.createElement('option');
        if (typeof item === 'string') {
            option.value = item;
            option.textContent = item;
        } else {
            option.value = item.value;
            option.textContent = item.text;
        }
        select.appendChild(option);
    });

    select.disabled = items.length === 0;
}

function renderVehicleData() {
    if (!state.vehicleData) {
        resultPanel.hidden = true;
        return;
    }

    resultPanel.hidden = false;
    metricsGrid.innerHTML = '';
    infoGrid.innerHTML = '';

    const metrics = [
        { label: 'City MPG', value: state.vehicleData.cityMpg },
        { label: 'Highway MPG', value: state.vehicleData.highwayMpg },
        { label: 'Combined MPG', value: state.vehicleData.combinedMpg },
    ];

    metrics.forEach((metric) => {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `
            <div class="metric-meta">
                <span>${metric.label}</span>
            </div>
            <div class="metric-value">${metric.value}</div>
        `;
        metricsGrid.appendChild(card);
    });

    const infos = [
        { label: 'Fuel Type', value: state.vehicleData.fuelType },
        { label: 'Transmission', value: state.vehicleData.transmission },
        { label: 'Drive', value: state.vehicleData.drive },
    ];

    infos.forEach((info) => {
        const card = document.createElement('div');
        card.className = 'info-card';
        card.innerHTML = `
            <div class="info-label">${info.label}</div>
            <div class="info-value">${info.value}</div>
        `;
        infoGrid.appendChild(card);
    });
}

function setDetectedVehicle(parsed) {
    state.detectedVehicle = parsed;

    if (parsed.year || parsed.make || parsed.model) {
        detectBanner.hidden = false;
        detectBanner.textContent = `Detected ${parsed.year || ''} ${parsed.make || ''} ${parsed.model || ''}`.trim();
    } else {
        detectBanner.hidden = true;
    }
}

function tryMatchDetectedYear() {
    const parsed = state.detectedVehicle;
    if (!parsed?.year) {
        return;
    }

    if (Array.from(yearSelect.options).some((option) => option.value === parsed.year)) {
        yearSelect.value = parsed.year;
        handleYearSelection();
    }
}

function tryMatchDetectedMake() {
    const parsed = state.detectedVehicle;
    if (!parsed?.make || state.makes.length === 0) {
        return;
    }

    const matchedMake = state.makes.find(
        (make) => make.toLowerCase() === parsed.make.toLowerCase()
    );

    if (matchedMake) {
        makeSelect.value = matchedMake;
        handleMakeSelection();
    }
}

function tryMatchDetectedModel() {
    const parsed = state.detectedVehicle;
    if (!parsed?.model || state.models.length === 0) {
        return;
    }

    const normalizedDetected = parsed.model.toLowerCase().replace(/\s+/g, '');
    const matchedModel = state.models.find((model) => {
        const normalizedModel = model.toLowerCase().replace(/\s+/g, '');
        return (
            normalizedModel.includes(normalizedDetected) ||
            normalizedDetected.includes(normalizedModel)
        );
    });

    if (matchedModel) {
        modelSelect.value = matchedModel;
        handleModelSelection();
    }
}

async function handleYearSelection() {
    const year = yearSelect.value;
    resetResults();
    populateSelect(makeSelect, [], 'Select');
    populateSelect(modelSelect, [], 'Select');
    populateSelect(trimSelect, [], 'Select');

    if (!year) {
        setStatus('Choose a year to continue.');
        return;
    }

    setStatus('Loading makes...');
    try {
        state.makes = await getMakes(year);
        populateSelect(makeSelect, state.makes, 'Select');
        setStatus('');
        tryMatchDetectedMake();
    } catch (error) {
        console.error(error);
        setStatus('Unable to load makes.');
    }
}

async function handleMakeSelection() {
    const year = yearSelect.value;
    const make = makeSelect.value;
    resetResults();
    populateSelect(modelSelect, [], 'Select');
    populateSelect(trimSelect, [], 'Select');

    if (!year || !make) {
        setStatus('Choose a make to continue.');
        return;
    }

    setStatus('Loading models...');
    try {
        state.models = await getModels(year, make);
        populateSelect(modelSelect, state.models, 'Select');
        setStatus('');
        tryMatchDetectedModel();
    } catch (error) {
        console.error(error);
        setStatus('Unable to load models.');
    }
}

async function handleModelSelection() {
    const year = yearSelect.value;
    const make = makeSelect.value;
    const model = modelSelect.value;
    resetResults();
    populateSelect(trimSelect, [], 'Select');

    if (!year || !make || !model) {
        setStatus('Choose a model to continue.');
        return;
    }

    setStatus('Loading trims...');
    try {
        state.options = await getOptions(year, make, model);
        populateSelect(trimSelect, state.options, 'Select');
        setStatus('');
    } catch (error) {
        console.error(error);
        setStatus('Unable to load trim options.');
    }
}

async function handleTrimSelection() {
    const vehicleId = trimSelect.value;
    resetResults();

    if (!vehicleId) {
        setStatus('Choose a trim to see fuel economy.');
        return;
    }

    setLoading(true);
    setStatus('Loading vehicle data...');

    try {
        state.vehicleData = await getVehicleDetails(vehicleId);
        setStatus('');
        renderVehicleData();
    } catch (error) {
        console.error(error);
        setStatus('Unable to load vehicle data.');
    } finally {
        setLoading(false);
    }
}

function detectVehicleFromTab() {
    setStatus('Detecting vehicle from active tab...');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        if (!activeTab?.id || !activeTab.url) {
            setStatus('Unable to find the active tab.');
            return;
        }

        if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('edge://')) {
            setStatus('Cannot inspect browser internal pages.');
            return;
        }

        chrome.tabs.sendMessage(
            activeTab.id,
            { action: 'SCRAPE_VEHICLE_DROPDOWNS' },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    setStatus('Page script did not respond. Refresh the tab and try again.');
                    return;
                }

                if (!response) {
                    setStatus('No response from page scraping.');
                    return;
                }

                const parsedFromTitle = parseVehicleText(response.title || '');
                const parsedFromHeading = Array.isArray(response.headings)
                    ? response.headings.map(parseVehicleText).find((item) => item.year || item.make || item.model)
                    : null;
                const parsed = parsedFromTitle.year || parsedFromTitle.make || parsedFromTitle.model
                    ? parsedFromTitle
                    : parsedFromHeading || { year: '', make: '', model: '' };

                setDetectedVehicle(parsed);
                setStatus(
                    parsed.year || parsed.make || parsed.model
                        ? `Detected ${parsed.year || ''} ${parsed.make || ''} ${parsed.model || ''}`.trim()
                        : 'No vehicle details detected from this page.'
                );

                if (parsed.year) {
                    tryMatchDetectedYear();
                }
            }
        );
    });
}

async function loadYears() {
    setStatus('Loading years...');
    try {
        const years = await getYears();
        populateSelect(yearSelect, years, 'Select');
        setStatus('');
        tryMatchDetectedYear();
    } catch (error) {
        console.error(error);
        setStatus('Unable to load years.');
    }
}

yearSelect.addEventListener('change', handleYearSelection);
makeSelect.addEventListener('change', handleMakeSelection);
modelSelect.addEventListener('change', handleModelSelection);
trimSelect.addEventListener('change', handleTrimSelection);
detectBtn.addEventListener('click', detectVehicleFromTab);

window.addEventListener('DOMContentLoaded', async () => {
    loadYears();
    detectVehicleFromTab();
});
