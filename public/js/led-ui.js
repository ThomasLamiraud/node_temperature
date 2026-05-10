import { TEMPERATURE_LED_RANGES } from "./temperature-led-ranges.js";

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

    for (const range of TEMPERATURE_LED_RANGES) {
        const item = document.createElement("div");
        item.className = "led-legend-item";

        const dot = document.createElement("span");
        dot.className = "led-dot";
        dot.style.backgroundColor = range.color;
        if (range.key === "white") dot.classList.add("led-dot-bordered");

        const label = document.createElement("span");
        label.innerText = `${range.label} ${range.rangeText} - ${range.description}`;

        item.append(dot, label);
        legend.appendChild(item);
    }
}
