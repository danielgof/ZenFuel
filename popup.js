/**
 * Content script function that extracts the entire plain text content of the active tab's body.
 * @returns {string} The text content of the document body.
 */
function grabDOMContent() {
  return document.body.innerText;
}

document.getElementById("read-btn").addEventListener("click", async () => {
  const outputDiv = document.getElementById("output");
  outputDiv.innerText = "Reading...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      outputDiv.innerText = "No active tab found.";
      return;
    }

    const [executionResult] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: grabDOMContent,
    });

    const pageText = executionResult.result;
    console.log("Full text:", pageText);

    const vehicleDetails = parseVehicleDetails(pageText);
    console.log(vehicleDetails);

    if (vehicleDetails) {
      const { year, make, model } = vehicleDetails;
      
      getVehicleMpg(year, make, model).then((data) => {
        console.log(data);
        if (!data) {
          outputDiv.innerText = "Failed to fetch MPG data";
          return;
        }
        
        const statusMessage = document.getElementById("status-message");
        if (statusMessage) {
          statusMessage.classList.add("d-none");
        }

        const carTitle = document.getElementById("car-title");
        if (carTitle) carTitle.innerText = data.vehicle;
        
        const carFuel = document.getElementById("car-fuel");
        if (carFuel) carFuel.innerText = data.fuelType;

        const mpgCity = document.getElementById("mpg-city");
        if (mpgCity) mpgCity.innerText = data.cityMpg;
        
        const mpgComb = document.getElementById("mpg-comb");
        if (mpgComb) mpgComb.innerText = data.combinedMpg;
        
        const mpgHwy = document.getElementById("mpg-hwy");
        if (mpgHwy) mpgHwy.innerText = data.highwayMpg;

        const dataCard = document.getElementById("data-card");
        if (dataCard) dataCard.classList.remove("d-none");
      });
    } else {
      outputDiv.innerText = JSON.stringify(vehicleDetails, null, 2);
    }
  } catch (error) {
    outputDiv.innerText = "Error: " + error.message;
    console.error(error);
  }
});

/**
 * List of known multi-word and single-word vehicle manufacturers for matching.
 * @type {string[]}
 */
const KNOWN_MAKES = [
  "Aston Martin", "Alfa Romeo", "Audi", "Bentley", "BMW", "Bugatti", "Buick",
  "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford",
  "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia",
  "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus", "Maserati", "Mazda",
  "Mercedes-Benz", "MINI", "Mitsubishi", "Nissan", "Polestar", "Porsche", "Ram",
  "Rivian", "Rolls-Royce", "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

/**
 * Fallback mapping of common vehicle models to their respective manufacturers.
 * @type {Object.<string, string>}
 */
const MODEL_TO_MAKE = {
  "CR-V": "Honda", Civic: "Honda", Accord: "Honda", Pilot: "Honda", Odyssey: "Honda", Ridgeline: "Honda",
  Camry: "Toyota", Corolla: "Toyota", RAV4: "Toyota", Highlander: "Toyota",
  Mustang: "Ford", "F-150": "Ford", Escape: "Ford", Explorer: "Ford",
  Silverado: "Chevrolet", Equinox: "Chevrolet", Tahoe: "Chevrolet",
  Cherokee: "Jeep", Wrangler: "Jeep", CRV: "Honda",
};

/**
 * Parses raw text to extract vehicle details like year, make, model, and remaining options.
 * * @param {string} text - The unstructured page text to parse.
 * @returns {Object|null} An object containing the extracted vehicle properties, or null if no year is found.
 * @returns {number} return.year - The 4-digit automotive year.
 * @returns {string} return.make - The extracted or inferred manufacturer name.
 * @returns {string} return.model - The extracted model name.
 * @returns {string} return.options - Any remaining trim/spec text following the model.
 */
function parseVehicleDetails(text) {
  const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[1]);
  const afterYearText = text.substring(text.indexOf(yearMatch[1]) + yearMatch[1].length).trim();
  const words = afterYearText.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return null;

  let make = null;
  let makeWordCount = 0;

  for (let i = Math.min(3, words.length); i >= 1; i--) {
    const combinedWords = words.slice(0, i).join(" ");
    const matchedMake = KNOWN_MAKES.find(
      (km) => km.toLowerCase() === combinedWords.toLowerCase(),
    );

    if (matchedMake) {
      make = matchedMake;
      makeWordCount = i;
      break;
    }
  }

  const remainingWords = words.slice(makeWordCount);
  const model = remainingWords[0] || "";

  if (!make && model) {
    make = MODEL_TO_MAKE[model] || "";
  }

  const options = remainingWords.slice(1).join(" ");

  return {
    year,
    make: make || "",
    model: model || "",
    options: options || "",
  };
}

/**
 * Fuel economy details compiled from the FuelEconomy.gov API.
 * @typedef {Object} VehicleMpgData
 * @property {string} vehicle - Fully formatted vehicle string including title and configuration.
 * @property {number} cityMpg - Estimated city miles per gallon.
 * @property {number} highwayMpg - Estimated highway miles per gallon.
 * @property {number} combinedMpg - Estimated combined miles per gallon.
 * @property {string} fuelType - Fuel requirement description (e.g., Regular, Premium, Electricity).
 *
 * Fetches EPA fuel economy configuration details using the FuelEconomy.gov REST API.
 * * @param {number} year - The manufacturing year of the vehicle.
 * @param {string} make - The vehicle's manufacturer name.
 * @param {string} model - The vehicle's model name.
 * @returns {Promise<VehicleMpgData|null>} A promise resolving to the MPG metric object, or null on error.
 */
async function getVehicleMpg(year, make, model) {
  const base_url = "https://www.fueleconomy.gov/ws/rest";
  const headers = { Accept: "application/json" };

  try {
    const modelsUrl = `${base_url}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`;
    console.log("Fetching models from:", modelsUrl);
    const modelsResponse = await fetch(modelsUrl, { headers });
    const modelsData = await modelsResponse.json();
    console.log("Models data:", modelsData);

    const modelList = Array.isArray(modelsData.menuItem)
      ? modelsData.menuItem
      : [modelsData.menuItem];

    console.log("Available models:", modelList.map((m) => m?.value));

    let matchedModel = modelList.find(
      (m) => m?.value.toLowerCase() === model.toLowerCase(),
    );

    if (!matchedModel) {
      matchedModel = modelList.find((m) =>
        m?.value.toLowerCase().includes(model.toLowerCase()),
      );
    }

    if (!matchedModel) {
      throw new Error(
        `Model "${model}" not found for ${year} ${make}. Available: ${modelList.map((m) => m?.value).join(", ")}`,
      );
    }

    console.log(`Using model: ${matchedModel.value}`);

    const optionsUrl = `${base_url}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(matchedModel.value)}`;
    console.log("Fetching options from:", optionsUrl);
    const optionsResponse = await fetch(optionsUrl, { headers });
    const optionsData = await optionsResponse.json();
    console.log("Options data:", optionsData);

    const optionList = Array.isArray(optionsData.menuItem)
      ? optionsData.menuItem
      : [optionsData.menuItem];

    if (!optionList || optionList.length === 0 || !optionList[0]) {
      throw new Error("No vehicle configurations/options found.");
    }

    console.log("Available options:", optionList.map((o) => ({ text: o?.text, value: o?.value })));

    const vehicleId = optionList[0].value;
    console.log("Using vehicle ID:", vehicleId);

    const vehicleUrl = `${base_url}/vehicle/${vehicleId}`;
    console.log("Fetching vehicle data from:", vehicleUrl);
    const vehicleResponse = await fetch(vehicleUrl, { headers });

    if (!vehicleResponse.ok) {
      throw new Error(`API returned status ${vehicleResponse.status}`);
    }

    const vehicleData = await vehicleResponse.json();
    console.log("Vehicle data:", vehicleData);

    return {
      vehicle: `${year} ${make} ${matchedModel.value} (${optionList[0].text})`,
      cityMpg: vehicleData.city08,
      highwayMpg: vehicleData.highway08,
      combinedMpg: vehicleData.comb08,
      fuelType: vehicleData.fuelType,
    };
  } catch (error) {
    console.error("Failed to fetch MPG:", error);
    return null;
  }
}
