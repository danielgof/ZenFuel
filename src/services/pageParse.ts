type VehicleData = {
  years: string[];
  makes: string[];
  models: string[];
};

declare const chrome: any;

/**
 * Extracts options from a <select> element.
 */
function extractOptions(select: HTMLSelectElement | null): string[] {
  if (!select) return [];

  return Array.from(select.options)
    .map((option) => option.text.trim())
    .filter(
      (text) =>
        text.length > 0 &&
        text.toLowerCase() !== "select" &&
        text.toLowerCase() !== "choose"
    );
}

/**
 * Finds a select element using multiple strategies.
 */
function findSelect(
  keywords: string[]
): HTMLSelectElement | null {
  const selects = Array.from(
    document.querySelectorAll("select")
  ) as HTMLSelectElement[];

  for (const select of selects) {
    const attrs = [
      select.name,
      select.id,
      select.getAttribute("aria-label"),
      select.getAttribute("placeholder"),
      select.className,
    ]
      .join(" ")
      .toLowerCase();

    const label =
      document.querySelector(`label[for="${select.id}"]`)
        ?.textContent?.toLowerCase() || "";

    const combined = `${attrs} ${label}`;

    if (keywords.some((k) => combined.includes(k))) {
      return select;
    }
  }

  return null;
}

/**
 * Main parser function
 */
function parseVehicleDropdowns(): VehicleData {
  const yearSelect = findSelect([
    "year",
    "years",
  ]);

  const makeSelect = findSelect([
    "make",
    "manufacturer",
    "brand",
  ]);

  const modelSelect = findSelect([
    "model",
    "trim",
    "vehicle",
  ]);

  return {
    years: extractOptions(yearSelect),
    makes: extractOptions(makeSelect),
    models: extractOptions(modelSelect),
  };
}

// Execute parser
const vehicleData = parseVehicleDropdowns();

console.log("Vehicle Data:", vehicleData);

// Optional: send data back to extension popup/background
chrome.runtime?.sendMessage?.({
  type: "VEHICLE_DATA",
  payload: vehicleData,
});

