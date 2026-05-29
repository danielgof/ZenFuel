// public/content.js

function extractOptions(select) {
  if (!select) return [];

  return Array.from(select.options)
    .map((option) => option.text.trim())
    .filter(
      (text) =>
        text.length > 0 &&
        !["select", "choose", "year", "make", "model"].some((k) =>
          text.toLowerCase().includes(k),
        ),
    );
}

function findSelect(keywords) {
  const selects = Array.from(document.querySelectorAll("select"));

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
      document
        .querySelector(`label[for="${select.id}"]`)
        ?.textContent?.toLowerCase() || "";
    const combined = `${attrs} ${label}`;

    if (keywords.some((k) => combined.includes(k))) {
      return select;
    }
  }
  return null;
}

function parseVehicleDropdowns() {
  const yearSelect = findSelect(["year", "years"]);
  const makeSelect = findSelect(["make", "manufacturer", "brand"]);
  const modelSelect = findSelect(["model", "trim", "vehicle"]);

  return {
    years: extractOptions(yearSelect),
    makes: extractOptions(makeSelect),
    models: extractOptions(modelSelect),
  };
}

// =========================================================================
// Listen for a direct request from App.tsx
// =========================================================================
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "SCRAPE_VEHICLE_DROPDOWNS") {
    console.log(message);
    const currentVehicleData = parseVehicleDropdowns();

    console.log("Scraped Vehicle Data on Demand:", currentVehicleData);

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
