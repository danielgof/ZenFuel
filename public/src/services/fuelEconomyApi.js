/**
 * Base URL for the fuel economy REST API.
 * @constant {string}
 */
const BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

/**
 * Fetches an XML response from the fuel economy API and returns a parsed XML Document.
 *
 * @param {string} endpoint - The API endpoint (should begin with `/`).
 * @returns {Promise<Document>} A parsed XML Document.
 * @throws {Error} When the network request fails, the response is empty, contains HTML
 *                 instead of XML, or when XML parsing fails.
 */
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

/**
 * Safely reads the text content of the first child element with the given tag name.
 *
 * @param {Document|Element} parent - XML Document or Element to search within.
 * @param {string} tag - Tag name of the child element to read.
 * @param {string} [fallback=''] - Value to return when the element or its text is missing.
 * @returns {string} The trimmed text content or the fallback value.
 */
function getTextContent(parent, tag, fallback = '') {
    return parent.getElementsByTagName(tag)[0]?.textContent?.trim() || fallback;
}

/**
 * Extracts `menuItem` elements from a returned XML document.
 *
 * @param {Document} xml - Parsed XML Document returned by the API.
 * @returns {Element[]} Array of `menuItem` elements.
 */
function parseMenuItems(xml) {
    return Array.from(xml.getElementsByTagName('menuItem'));
}

/**
 * Retrieves the list of available model years from the API.
 *
 * @returns {Promise<string[]>} Array of year values (strings). Returns an empty array on error.
 */
export async function getYears() {
    try {
        const xml = await fetchXML('/vehicle/menu/year');
        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getYears failed', error);
        return [];
    }
}

/**
 * Retrieves the list of vehicle makes for a given year.
 *
 * @param {string|number} year - Model year to query.
 * @returns {Promise<string[]>} Array of make values (strings). Returns an empty array on error.
 */
export async function getMakes(year) {
    try {
        const xml = await fetchXML(`/vehicle/menu/make?year=${encodeURIComponent(year)}`);
        return parseMenuItems(xml).map((item) => getTextContent(item, 'value'));
    } catch (error) {
        console.error('getMakes failed', error);
        return [];
    }
}

/**
 * Retrieves the list of vehicle models for a given year and make.
 *
 * @param {string|number} year - Model year to query.
 * @param {string} make - Make name to query.
 * @returns {Promise<string[]>} Array of model values (strings). Returns an empty array on error.
 */
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

/**
 * Retrieves option entries for a specific year/make/model combination.
 *
 * @param {string|number} year - Model year to query.
 * @param {string} make - Make name to query.
 * @param {string} model - Model name to query.
 * @returns {Promise<Array<{text: string, value: string}>>} Array of option objects. Returns an empty array on error.
 */
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

/**
 * Retrieves detailed vehicle information for a specific vehicle id.
 *
 * @param {string|number} id - Vehicle id returned from the options/menu endpoints.
 * @returns {Promise<{cityMpg: string, highwayMpg: string, combinedMpg: string, fuelType: string, drive: string, transmission: string}>}
 *          Object with MPG and drivetrain fields. Fields will be `'N/A'` when missing or on error.
 */
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
