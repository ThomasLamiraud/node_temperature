const queries = require("./db/queries");

const SENSOR_TYPE = parseInt(process.env.DHT_SENSOR_TYPE || '22', 10);
const GPIO_PIN = parseInt(process.env.DHT_GPIO_PIN || '4', 10);
const FAKE_TEMPERATURE = process.env.DHT_FAKE_TEMPERATURE;
const FAKE_HUMIDITY = process.env.DHT_FAKE_HUMIDITY;
const MAX_READ_ATTEMPTS = parsePositiveInteger(process.env.DHT_MAX_READ_ATTEMPTS, 3);
const RETRY_DELAY_MS = parsePositiveInteger(process.env.DHT_RETRY_DELAY_MS, 2000);

let sensorLib = null;
let sensorInitialized = false;

function parsePositiveInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isFakeModeEnabled() {
  return FAKE_TEMPERATURE !== undefined && FAKE_HUMIDITY !== undefined;
}

function getSensorLib() {
  if (isFakeModeEnabled()) {
    if (!sensorInitialized) {
      console.log('DHT sensor test mode enabled');
      sensorInitialized = true;
    }

    return {
      read: function () {
        return {
          temperature: parseFloat(FAKE_TEMPERATURE),
          humidity: parseFloat(FAKE_HUMIDITY),
        };
      },
    };
  }

  if (!sensorLib) {
    sensorLib = require('node-dht-sensor');
  }

  if (!sensorInitialized) {
    sensorInitialized = true;
  }

  return sensorLib;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isValidReadout(readout) {
  return Boolean(
    readout &&
    readout.isValid !== false &&
    Number.isFinite(readout.temperature) &&
    Number.isFinite(readout.humidity)
  );
}

exports.getReadout = async function () {
  let sensor;
  try {
    sensor = getSensorLib();
  } catch (err) {
    console.error("Unable to initialize DHT sensor:", err.message);
    return null;
  }

  for (let attempt = 1; attempt <= MAX_READ_ATTEMPTS; attempt += 1) {
    try {
      const readout = sensor.read(SENSOR_TYPE, GPIO_PIN);

      if (isValidReadout(readout)) {
        const tempValue = Math.round(readout.temperature * 1000);
        const humidity = Number(readout.humidity.toFixed(1));
        console.log(`DHT${SENSOR_TYPE} readout: ${readout.temperature.toFixed(1)}°C, ${readout.humidity.toFixed(1)}% humidity`);

        queries.insertRow(tempValue, humidity);

        return {
          temperature: tempValue,
          humidity,
        };
      }

      console.error(`Invalid DHT sensor readout (attempt ${attempt}/${MAX_READ_ATTEMPTS})`, readout);
    } catch (err) {
      console.error(`Error reading DHT sensor (attempt ${attempt}/${MAX_READ_ATTEMPTS}):`, err.message);
    }

    if (attempt < MAX_READ_ATTEMPTS) {
      await delay(RETRY_DELAY_MS);
    }
  }

  console.error(`DHT${SENSOR_TYPE} read failed after ${MAX_READ_ATTEMPTS} attempts`);
  return null;
};

exports.getTemp = async function () {
  const readout = await exports.getReadout();
  return readout ? readout.temperature : null;
};
