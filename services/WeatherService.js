const https = require("https");

const LATITUDE = parseFloat(process.env.WEATHER_LAT);
const LONGITUDE = parseFloat(process.env.WEATHER_LON);
const CITY = (process.env.WEATHER_CITY || "").trim();
const COUNTRY = (process.env.WEATHER_COUNTRY || "").trim();
const FAKE_TEMPERATURE = process.env.WEATHER_FAKE_TEMPERATURE;
const CACHE_TTL = parsePositiveInteger(process.env.WEATHER_CACHE_TTL_MS, 60 * 60 * 1000);
const REQUEST_TIMEOUT = parsePositiveInteger(process.env.WEATHER_REQUEST_TIMEOUT_MS, 8 * 1000);

let cachedReadout = null;
let cacheExpiresAt = 0;
let disabledWarningLogged = false;
let resolvedLocation = Number.isFinite(LATITUDE) && Number.isFinite(LONGITUDE)
  ? { latitude: LATITUDE, longitude: LONGITUDE, label: null }
  : null;

function parsePositiveInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isConfigured() {
  return FAKE_TEMPERATURE !== undefined ||
    resolvedLocation !== null ||
    CITY.length > 0;
}

function buildReadout(temperature, observedAt, location) {
  if (!Number.isFinite(temperature)) {
    throw new Error("Weather API returned an invalid temperature");
  }

  return {
    temperature: Math.round(temperature * 1000),
    observedAt: observedAt || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    location: location || null,
    stale: false,
  };
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        "User-Agent": "HomeMonitor/1.0",
      },
    }, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Weather API request failed with status ${response.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`Unable to parse API response: ${err.message}`));
        }
      });
    });

    request.setTimeout(REQUEST_TIMEOUT, () => {
      request.destroy(new Error("Weather API request timed out"));
    });
    request.on("error", reject);
  });
}

async function resolveLocation() {
  if (resolvedLocation) {
    return resolvedLocation;
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", COUNTRY ? `${CITY}, ${COUNTRY}` : CITY);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await requestJson(url);
  const match = data.results && data.results[0];
  if (!match || !Number.isFinite(match.latitude) || !Number.isFinite(match.longitude)) {
    throw new Error(`Unable to find weather location for ${CITY}${COUNTRY ? `, ${COUNTRY}` : ""}`);
  }

  resolvedLocation = {
    latitude: match.latitude,
    longitude: match.longitude,
    label: [match.name, match.country].filter(Boolean).join(", "),
  };
  console.log(`Weather location resolved: ${resolvedLocation.label}`);
  return resolvedLocation;
}

async function requestCurrentWeather() {
  const location = await resolveLocation();
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", location.latitude);
  url.searchParams.set("longitude", location.longitude);
  url.searchParams.set("current", "temperature_2m");

  const data = await requestJson(url);
  return buildReadout(
    data.current && data.current.temperature_2m,
    data.current && data.current.time,
    location.label
  );
}

exports.getCachedReadout = function () {
  return cachedReadout ? Object.assign({}, cachedReadout) : null;
};

exports.getReadout = async function () {
  if (!isConfigured()) {
    if (!disabledWarningLogged) {
      console.log("Outside weather disabled: set WEATHER_CITY or WEATHER_LAT and WEATHER_LON");
      disabledWarningLogged = true;
    }
    return null;
  }

  if (cachedReadout && Date.now() < cacheExpiresAt) {
    return Object.assign({}, cachedReadout);
  }

  try {
    const readout = FAKE_TEMPERATURE !== undefined
      ? buildReadout(parseFloat(FAKE_TEMPERATURE), null, CITY || null)
      : await requestCurrentWeather();

    cachedReadout = readout;
    cacheExpiresAt = Date.now() + CACHE_TTL;
    return Object.assign({}, readout);
  } catch (err) {
    console.error("Error fetching outside temperature:", err.message);

    if (cachedReadout) {
      return Object.assign({}, cachedReadout, { stale: true });
    }

    return null;
  }
};
