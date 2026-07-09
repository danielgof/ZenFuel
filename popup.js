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
    // console.log("Full text:", pageText);

    const vehicleDetails = await parseVehicleDetails(pageText);
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
  "Aston Martin",
  "Alfa Romeo",
  "Audi",
  "Bentley",
  "BMW",
  "Bugatti",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Lotus",
  "Maserati",
  "Mazda",
  "Mercedes-Benz",
  "MINI",
  "Mitsubishi",
  "Nissan",
  "Polestar",
  "Porsche",
  "Ram",
  "Rivian",
  "Rolls-Royce",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];


/**
 *
 * @param {String} pageText
 * @returns {Number} year
 */
function getYear(pageText) {
  const yearMatch = pageText.match(/\b(20\d{2}|19\d{2})\b/);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[1]);
  console.log(year);
  return year;
}

function getMake(pageText) {
  if (!pageText) return null;

  const normalizedText = pageText.toLowerCase();
  const matchedMake = [...KNOWN_MAKES]
    .sort((a, b) => b.length - a.length)
    .find((make) => normalizedText.includes(make.toLowerCase()));

  console.log("matched make:", matchedMake);
  return matchedMake || null;
}

function getModel(pageText, availableModels) {
  if (!pageText || !Array.isArray(availableModels) || availableModels.length === 0) {
    return null;
  }

  const normalizedText = pageText.toLowerCase();

  const matchedModel = [...availableModels]
    .map((model) => ({
      model,
      score: model.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).reduce((sum, part) => {
        return sum + (normalizedText.includes(part) ? 1 : 0);
      }, 0),
    }))
    .sort((a, b) => b.score - a.score || a.model.length - b.model.length)
    .find((entry) => entry.score > 0);

  console.log("matched model:", matchedModel?.model || null);
  return matchedModel?.model || null;
}

/**
 * Parses raw text to extract vehicle details like year, make, model, and remaining options.
 * * @param {string} text - The unstructured page text to parse.
 * @returns {Object|null} An object containing the extracted vehicle properties, or null if no year is found.
 * @returns {number} return.year - The 4-digit automotive year.
 * @returns {string} return.make - The extracted or inferred manufacturer name.
 * @returns {string} return.model - The extracted model name.
 */
async function parseVehicleDetails(text) {
  // Get year
  const year = getYear(text);
  // Get make
  const make = getMake(text);

  let model = null;

  if (year && make) {
    try {
      const modelsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`;
      const response = await fetch(modelsUrl, { headers: { Accept: "application/json" } });
      const data = await response.json();
      const modelList = Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
      const availableModels = modelList.map((item) => item?.value).filter(Boolean);
      model = getModel(text, availableModels);
      console.log("Model found: ", model)
    } catch (error) {
      console.error("Failed to resolve model:", error);
    }
  }

  return {
    year,
    make: make || "",
    model: model || "",
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

    console.log(
      "Available models:",
      modelList.map((m) => m?.value),
    );

    const matchedModel = modelList.find((m) =>
      m?.value.toLowerCase().includes((model || "").toLowerCase()),
    );

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

    console.log(
      "Available options:",
      optionList.map((o) => ({ text: o?.text, value: o?.value })),
    );

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
