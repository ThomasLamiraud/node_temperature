import { TEMPERATURE_LED_RANGES } from "./temperature-led-ranges.js";

const SCALE_MIN_CELSIUS = 16;
const SCALE_MAX_CELSIUS = 32;

let ledsEnabled = true;

export function getLedsEnabled() {
    return ledsEnabled;
}

export function updateLedStatus(status) {
    if (!status) return;

    ledsEnabled = Boolean(status.enabled);

    const button = document.getElementById("led-toggle");
    const label = document.getElementById("led-status");
    if (!button || !label) return;

    button.innerText = ledsEnabled ? "Disable LEDs" : "Enable LEDs";
    button.classList.toggle("active", ledsEnabled);
    label.innerText = ledsEnabled ? "LEDs enabled" : "LEDs disabled";

    if (status.available === false) {
        label.innerText = "LEDs unavailable";
    }
}

export function renderLedLegend() {
    const legend = document.getElementById("led-legend");
    if (!legend) return;

    const scaleWrapper = document.createElement("div");
    scaleWrapper.className = "led-scale-wrapper";

    const scale = document.createElement("div");
    scale.className = "led-scale";

    for (const range of TEMPERATURE_LED_RANGES) {
        const segment = document.createElement("span");
        segment.className = "led-scale-segment";
        segment.style.backgroundColor = range.color;
        scale.appendChild(segment);
    }

    const caret = document.createElement("span");
    caret.id = "led-scale-caret";
    caret.className = "led-scale-caret";

    scaleWrapper.append(scale, caret);

    const labels = document.createElement("div");
    labels.className = "led-scale-labels";

    for (const range of TEMPERATURE_LED_RANGES) {
        const label = document.createElement("span");
        label.innerText = `${range.rangeText} ${range.description}`;
        labels.appendChild(label);
    }

    legend.append(scaleWrapper, labels);
}

export function updateLedScaleCaret(temperature) {
    const caret = document.getElementById("led-scale-caret");
    if (!caret || !Number.isFinite(temperature)) return;

    const celsius = temperature / 1000;
    const clampedCelsius = Math.min(Math.max(celsius, SCALE_MIN_CELSIUS), SCALE_MAX_CELSIUS);
    const position = ((clampedCelsius - SCALE_MIN_CELSIUS) / (SCALE_MAX_CELSIUS - SCALE_MIN_CELSIUS)) * 100;

    caret.style.left = `${position}%`;
    caret.classList.add("active");
}
