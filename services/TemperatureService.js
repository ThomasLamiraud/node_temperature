const queries = require("./db/queries");

const SENSOR_TYPE = parseInt(process.env.DHT_SENSOR_TYPE || '22', 10);
const GPIO_PIN = parseInt(process.env.DHT_GPIO_PIN || '4', 10);
const FAKE_TEMPERATURE = process.env.DHT_FAKE_TEMPERATURE;
const FAKE_HUMIDITY = process.env.DHT_FAKE_HUMIDITY;

let sensorLib = null;
let sensorInitialized = false;

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

exports.getReadout = function () {
  try {
    const sensor = getSensorLib();
    const readout = sensor.read(SENSOR_TYPE, GPIO_PIN);

    if (!readout || !Number.isFinite(readout.temperature) || !Number.isFinite(readout.humidity)) {
      console.error("Invalid DHT sensor readout", readout);
      return null;
    }

    const tempValue = Math.round(readout.temperature * 1000);
    const humidity = Number(readout.humidity.toFixed(1));
    console.log(`DHT${SENSOR_TYPE} readout: ${readout.temperature.toFixed(1)}°C, ${readout.humidity.toFixed(1)}% humidity`);
    
    queries.insertRow(tempValue, humidity);

    return {
      temperature: tempValue,
      humidity,
    };
  } catch (err) {
    console.error("Error reading DHT sensor:", err.message);
    return null;
  }
}

exports.getTemp = function () {
  const readout = exports.getReadout();
  return readout ? readout.temperature : null;
}
