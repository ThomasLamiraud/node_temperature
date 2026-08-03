import { getTemperatureLedRange } from "./temperature-led-ranges.js";

export function normalizeReadout(readout) {
    if (typeof readout === "number") {
        return {
            temperature: readout,
            humidity: null,
        };
    }

    return readout;
}

export function updateSensorDisplay(sensorReadout) {
    const temperatureDisplay = document.getElementById("temperature-display");
    const humidityDisplay = document.getElementById("humidity-display");
    if (!temperatureDisplay || !humidityDisplay) return null;

    const formattedReadout = formatSensorReadout(sensorReadout);

    temperatureDisplay.classList.remove("loading");
    humidityDisplay.classList.remove("loading");

    temperatureDisplay.innerText = `${formattedReadout.celsius} °C`;
    updateTemperatureColor(temperatureDisplay, sensorReadout.temperature);
    humidityDisplay.innerText = formattedReadout.humidity === null ? "--.- %" : `${formattedReadout.humidity.toFixed(1)} %`;
    document.getElementById("last-updated").innerText = "Updated " + new Date().toLocaleTimeString();

    return formattedReadout;
}

function formatSensorReadout(sensorReadout) {
    return {
        celsius: (sensorReadout.temperature / 1000).toFixed(1),
        humidity: Number.isFinite(sensorReadout.humidity) ? Number(sensorReadout.humidity.toFixed(1)) : null,
    };
}

function updateTemperatureColor(element, temperature) {
    const ledRange = getTemperatureLedRange(temperature);
    element.style.color = ledRange.color;
}
