export interface VehicleOption {
    text: string;
    value: string;
}

export interface VehicleDetails {
    cityMpg: string;
    highwayMpg: string;
    combinedMpg: string;
    fuelType: string;
    drive: string;
    transmission: string;
}

/* ========================================
   API CONFIG
======================================== */

const BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

/* ========================================
   GENERIC XML FETCHER
======================================== */

async function fetchXML(endpoint: string): Promise<Document> {
    const url = `${BASE_URL}${endpoint}`;

    try {
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

        // Some APIs return HTML error pages
        if (text.includes('<html') || text.includes('502 Bad Gateway')) {
            throw new Error('Server returned invalid XML');
        }

        const parser = new DOMParser();

        const xml = parser.parseFromString(text, 'application/xml');

        const parserError = xml.querySelector('parsererror');

        if (parserError) {
            console.error('XML Parse Error:', parserError.textContent);

            throw new Error('XML parsing failed');
        }

        return xml;
    } catch (error) {
        console.error(`fetchXML failed for ${url}`, error);

        throw error;
    }
}

/* ========================================
   XML HELPERS
======================================== */

function getTextContent(
    parent: Element | Document,
    tag: string,
    fallback = ''
): string {
    return parent.getElementsByTagName(tag)[0]?.textContent?.trim() || fallback;
}

function parseMenuItems(xml: Document): Element[] {
    return Array.from(xml.getElementsByTagName('menuItem'));
}

/* ========================================
   YEARS
======================================== */

export async function getYears(): Promise<string[]> {
    try {
        const xml = await fetchXML('/vehicle/menu/year');

        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getYears failed', error);

        return [];
    }
}

/* ========================================
   MAKES
======================================== */

export async function getMakes(year: string): Promise<string[]> {
    try {
        const xml = await fetchXML(
            `/vehicle/menu/make?year=${encodeURIComponent(year)}`
        );

        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getMakes failed', error);

        return [];
    }
}

/* ========================================
   MODELS
======================================== */

export async function getModels(year: string, make: string): Promise<string[]> {
    try {
        const xml = await fetchXML(
            `/vehicle/menu/model?year=${encodeURIComponent(
                year
            )}&make=${encodeURIComponent(make)}`
        );

        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getModels failed', error);

        return [];
    }
}

/* ========================================
   OPTIONS / TRIMS
======================================== */

export async function getOptions(
    year: string,
    make: string,
    model: string
): Promise<VehicleOption[]> {
    try {
        const xml = await fetchXML(
            `/vehicle/menu/options?year=${encodeURIComponent(
                year
            )}&make=${encodeURIComponent(
                make
            )}&model=${encodeURIComponent(model)}`
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

/* ========================================
   VEHICLE DETAILS
======================================== */

export async function getVehicleDetails(id: string): Promise<VehicleDetails> {
    const fallback: VehicleDetails = {
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
