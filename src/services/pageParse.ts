// type VehicleData = {
//   years: string[];
//   makes: string[];
//   models: string[];
// };

// declare const chrome: any;

// function extractOptions(select: HTMLSelectElement | null): string[] {
//   if (!select) return [];

//   return Array.from(select.options)
//     .map((option) => option.text.trim())
//     .filter(
//       (text) =>
//         text.length > 0 &&
//         !["select", "choose", "year", "make", "model"].some(k => text.toLowerCase().includes(k))
//     );
// }

// function findSelect(keywords: string[]): HTMLSelectElement | null {
//   const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];

//   for (const select of selects) {
//     const attrs = [
//       select.name,
//       select.id,
//       select.getAttribute("aria-label"),
//       select.getAttribute("placeholder"),
//       select.className,
//     ].join(" ").toLowerCase();

//     const label = document.querySelector(`label[for="${select.id}"]`)?.textContent?.toLowerCase() || "";
//     const combined = `${attrs} ${label}`;

//     if (keywords.some((k) => combined.includes(k))) {
//       return select;
//     }
//   }
//   return null;
// }

// function parseVehicleDropdowns(): VehicleData {
//   const yearSelect = findSelect(["year", "years"]);
//   const makeSelect = findSelect(["make", "manufacturer", "brand"]);
//   const modelSelect = findSelect(["model", "trim", "vehicle"]);

//   return {
//     years: extractOptions(yearSelect),
//     makes: extractOptions(makeSelect),
//     models: extractOptions(modelSelect),
//   };
// }

// // =========================================================================
// // THE FIX: Listen for a direct request from App.tsx instead of running blind
// // =========================================================================
// chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: (response: any) => void) => {
//   if (message.action === "SCRAPE_VEHICLE_DROPDOWNS") {
//     const currentVehicleData = parseVehicleDropdowns();

//     console.log("Scraped Vehicle Data on Demand:", currentVehicleData);

//     // Respond directly back to the popup tab that called it
//     sendResponse(currentVehicleData);
//   }
//   return true; // Essential for handling asynchronous message channels in Chrome extensions
// });
