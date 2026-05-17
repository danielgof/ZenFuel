export interface VehicleOption {
  text: string;
  value: string;
}

const BASE_URL = "/api";

async function fetchXML(endpoint: string) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "application/xml,text/xml",
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();

    if (!text || text.includes("502 Bad Gateway")) {
      throw new Error("Invalid XML response");
    }

    const parser = new DOMParser();

    const xml = parser.parseFromString(text, "text/xml");

    const parserError =
      xml.getElementsByTagName("parsererror");

    if (parserError.length > 0) {
      throw new Error("XML Parsing failed");
    }

    return xml;
  } catch (err) {
    console.error("fetchXML failed:", endpoint, err);
    throw err;
  }
}

/* =========================
   YEARS
========================= */

export async function getYears(): Promise<string[]> {
  try {
    const xml = await fetchXML("/vehicle/menu/year");

    return Array.from(
      xml.getElementsByTagName("menuItem")
    ).map(
      (item) =>
        item.getElementsByTagName("value")[0]
          ?.textContent || ""
    );
  } catch (err) {
    console.error("getYears failed", err);
    return [];
  }
}

/* =========================
   MAKES
========================= */

export async function getMakes(
  year: string
): Promise<string[]> {
  try {
    const xml = await fetchXML(
      `/vehicle/menu/make?year=${encodeURIComponent(
        year
      )}`
    );

    return Array.from(
      xml.getElementsByTagName("menuItem")
    ).map(
      (item) =>
        item.getElementsByTagName("value")[0]
          ?.textContent || ""
    );
  } catch (err) {
    console.error("getMakes failed", err);
    return [];
  }
}

/* =========================
   MODELS
========================= */

export async function getModels(
  year: string,
  make: string
): Promise<string[]> {
  try {
    const xml = await fetchXML(
      `/vehicle/menu/model?year=${encodeURIComponent(
        year
      )}&make=${encodeURIComponent(make)}`
    );

    return Array.from(
      xml.getElementsByTagName("menuItem")
    ).map(
      (item) =>
        item.getElementsByTagName("value")[0]
          ?.textContent || ""
    );
  } catch (err) {
    console.error("getModels failed", err);
    return [];
  }
}

/* =========================
   OPTIONS / TRIMS
========================= */

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

    return Array.from(
      xml.getElementsByTagName("menuItem")
    ).map((item) => ({
      text:
        item.getElementsByTagName("text")[0]
          ?.textContent || "",

      value:
        item.getElementsByTagName("value")[0]
          ?.textContent || "",
    }));
  } catch (err) {
    console.error("getOptions failed", err);
    return [];
  }
}

/* =========================
   VEHICLE DETAILS
========================= */

export async function getVehicleDetails(id: string) {
  try {
    const xml = await fetchXML(
      `/vehicle/${encodeURIComponent(id)}`
    );

    return {
      cityMpg:
        xml.getElementsByTagName("city08")[0]
          ?.textContent || "N/A",

      highwayMpg:
        xml.getElementsByTagName("highway08")[0]
          ?.textContent || "N/A",

      combinedMpg:
        xml.getElementsByTagName("comb08")[0]
          ?.textContent || "N/A",

      fuelType:
        xml.getElementsByTagName("fuelType")[0]
          ?.textContent || "N/A",

      drive:
        xml.getElementsByTagName("drive")[0]
          ?.textContent || "N/A",

      transmission:
        xml.getElementsByTagName("trany")[0]
          ?.textContent || "N/A",
    };
  } catch (err) {
    console.error("getVehicleDetails failed", err);

    return {
      cityMpg: "N/A",
      highwayMpg: "N/A",
      combinedMpg: "N/A",
      fuelType: "N/A",
      drive: "N/A",
      transmission: "N/A",
    };
  }
}
