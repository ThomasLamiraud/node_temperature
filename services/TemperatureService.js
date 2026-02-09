const queries = require("./db/queries");
const fs = require('fs');
const path = require('path');

// Base directory for 1-wire devices (can be overridden by environment variable)
// Default for production (Raspberry Pi default): /sys/bus/w1/devices
// Fallback for local development if not set: ./sys/bus/w1/devices
const W1_BASE_PATH = process.env.W1_BASE_PATH || './sys/bus/w1/devices';

let cachedSensorPath = null;

function findSensorPath() {
    // If cached, return it
    if (cachedSensorPath && fs.existsSync(cachedSensorPath)) return cachedSensorPath;
    
    // Clear cache if path doesn't exist anymore
    cachedSensorPath = null;

    try {
        if (!fs.existsSync(W1_BASE_PATH)) {
            // Only log this once or if really needed, to avoid spamming
            // But here we return null so the calling function handles it
            return null; 
        }

        const files = fs.readdirSync(W1_BASE_PATH);
        // Find a directory starting with '28-' (standard DS18B20 prefix)
        const sensorDir = files.find(file => file.startsWith('28-'));

        if (!sensorDir) {
            console.error(`No sensor found in ${W1_BASE_PATH} (looking for '28-')`);
            return null;
        }

        cachedSensorPath = path.join(W1_BASE_PATH, sensorDir, 'w1_slave');
        console.log(`Found sensor at: ${cachedSensorPath}`);
        return cachedSensorPath;
    } catch (err) {
        console.error("Error searching for sensor:", err);
        return null;
    }
}

exports.getTemp = function () {
  try {
    const sensorPath = findSensorPath();
    
    if (!sensorPath) {
        console.error(`Sensor path not resolved. Base: ${W1_BASE_PATH}`);
        return null;
    }

    const data = fs.readFileSync(sensorPath, 'utf8');
    
    // Check for YES (CRC check)
    if (!data.includes('YES')) {
      console.error("CRC check failed");
      return null;
    }

    const match = data.match(/t=(\d+)/);
    if (!match || match.length < 2) {
      console.error("Temperature not found in file content");
      return null;
    }

    const tempValue = parseInt(match[1]);
    
    // Insert into DB
    queries.insertRow(tempValue);

    return tempValue;
  } catch (err) {
    console.error("Error reading temperature:", err.message);
    // If read fails, maybe the file disappeared? Clear cache.
    cachedSensorPath = null;
    return null;
  }
}
