const BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

async function fetchXML(endpoint) {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/xml',
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    if (!text) {
        throw new Error('Empty response');
    }

    if (text.includes('<html') || text.includes('502 Bad Gateway')) {
        throw new Error('Server returned invalid XML');
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');

    if (xml.querySelector('parsererror')) {
        throw new Error('XML parsing failed');
    }

    return xml;
}

function getTextContent(parent, tag, fallback = '') {
    return parent.getElementsByTagName(tag)[0]?.textContent?.trim() || fallback;
}

function parseMenuItems(xml) {
    return Array.from(xml.getElementsByTagName('menuItem'));
}

export async function getYears() {
    try {
        const xml = await fetchXML('/vehicle/menu/year');
        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getYears failed', error);
        return [];
    }
}

export async function getMakes(year) {
    try {
        const xml = await fetchXML(`/vehicle/menu/make?year=${encodeURIComponent(year)}`);
        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getMakes failed', error);
        return [];
    }
}

export async function getModels(year, make) {
    try {
        const xml = await fetchXML(
            `/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}`
        );
        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getModels failed', error);
        return [];
    }
}

export async function getOptions(year, make, model) {
    try {
        const xml = await fetchXML(
            `/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
        );
        return parseMenuItems(xml).map((item) => ({
            text: getTextContent(item, 'text'),
            value: getTextContent(item, 'value'),
        }));
    } catch (error) {
        console.error('getOptions failed', error);
        return [];
    }
}

export async function getVehicleDetails(id) {
    const fallback = {
        cityMpg: 'N/A',
        highwayMpg: 'N/A',
        combinedMpg: 'N/A',
        fuelType: 'N/A',
        drive: 'N/A',
        transmission: 'N/A',
    };

    try {
        const xml = await fetchXML(`/vehicle/${encodeURIComponent(id)}`);
        return {
            cityMpg: getTextContent(xml, 'city08', 'N/A'),
            highwayMpg: getTextContent(xml, 'highway08', 'N/A'),
            combinedMpg: getTextContent(xml, 'comb08', 'N/A'),
            fuelType: getTextContent(xml, 'fuelType', 'N/A'),
            drive: getTextContent(xml, 'drive', 'N/A'),
            transmission: getTextContent(xml, 'trany', 'N/A'),
        };
    } catch (error) {
        console.error('getVehicleDetails failed', error);
        return fallback;
    }
}
