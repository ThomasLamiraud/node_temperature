const queries = require("./db/queries");

const SENSOR_TYPE = parseInt(process.env.DHT_SENSOR_TYPE || '22', 10);
const GPIO_PIN = parseInt(process.env.DHT_GPIO_PIN || '4', 10);
const FAKE_TEMPERATURE = process.env.DHT_FAKE_TEMPERATURE;
const FAKE_HUMIDITY = process.env.DHT_FAKE_HUMIDITY;

let sensorLib = null;
let sensorInitialized = false;

function getSensorLib() {
  if (!sensorLib) {
    sensorLib = require('node-dht-sensor');
  }

  if (!sensorInitialized) {
    if (FAKE_TEMPERATURE !== undefined && FAKE_HUMIDITY !== undefined) {
      sensorLib.initialize({
        test: {
          fake: {
            temperature: parseFloat(FAKE_TEMPERATURE),
            humidity: parseFloat(FAKE_HUMIDITY),
          },
        },
      });
      console.log('DHT sensor test mode enabled');
    }

    sensorInitialized = true;
  }

  return sensorLib;
}

exports.getTemp = function () {
  try {
    const sensor = getSensorLib();
    const readout = sensor.read(SENSOR_TYPE, GPIO_PIN);

    if (!readout || !Number.isFinite(readout.temperature) || !Number.isFinite(readout.humidity)) {
      console.error("Invalid DHT sensor readout", readout);
      return null;
    }

    const tempValue = Math.round(readout.temperature * 1000);
    console.log(`DHT${SENSOR_TYPE} readout: ${readout.temperature.toFixed(1)}°C, ${readout.humidity.toFixed(1)}% humidity`);
    
    queries.insertRow(tempValue);

    return tempValue;
  } catch (err) {
    console.error("Error reading DHT sensor:", err.message);
    return null;
  }
}
