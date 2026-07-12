# ZenFuel

ZenFuel is a Chrome extension that extracts vehicle details from the currently active page and looks up EPA fuel economy data from fueleconomy.gov.

## Features

- Reads page text from the active browser tab
- Detects vehicle year, make, and model
- Calls FuelEconomy.gov APIs to fetch MPG and fuel type
- Displays city / highway / combined MPG values in a small popup UI

## Files

- `index.html` — extension popup UI
- `popup.js` — main extension logic that parses page text and fetches MPG data
- `styles.css` — popup styling
- `manifest.json` — Chrome extension manifest
- `tests/getModel.test.js` — unit test for model matching logic

## Installation

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `ZenFuel` project folder.

## Usage

1. Open a web page containing vehicle details.
2. Click the ZenFuel extension icon.
3. Press **Get vehicle MPG**.
4. The popup will display the detected vehicle and its MPG data.

## Development

- Edit `popup.js` to modify parsing, matching, or API behavior.
- Use `tests/getModel.test.js` to validate the model matching function.

## Notes

- The extension uses only local script resources to comply with Chrome extension CSP.
- If the page text does not clearly expose a vehicle model, the popup may not return MPG data.
