import { appendReadoutToChart, initChart, setChartHistory, updateChartTheme } from "./chart.js";
import { getLedsEnabled, renderLedLegend, updateLedScaleCaret, updateLedStatus } from "./led-ui.js";
import { normalizeReadout, updateSensorDisplay } from "./sensor-display.js";
import { initTheme, toggleTheme } from "./theme.js";

const socket = io();

function requestHistory(range) {
    socket.emit("get history", range);

    document.querySelectorAll(".chart-controls button").forEach((button) => {
        button.classList.toggle("active", button.dataset.range === range);
    });
}

function toggleLedStatus() {
    socket.emit("set led enabled", !getLedsEnabled());
}

function bindEventListeners() {
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
        const theme = toggleTheme();
        updateChartTheme(theme);
    });

    document.getElementById("led-toggle")?.addEventListener("click", toggleLedStatus);

    document.querySelectorAll(".chart-controls button").forEach((button) => {
        button.addEventListener("click", () => requestHistory(button.dataset.range));
    });
}

socket.on("history", setChartHistory);
socket.on("led status", updateLedStatus);

socket.on("sending temperature", function (readout) {
    const sensorReadout = normalizeReadout(readout);
    console.log("Received sensor readout:", sensorReadout);

    if (!sensorReadout || sensorReadout.temperature === undefined) return;

    const formattedReadout = updateSensorDisplay(sensorReadout);
    if (!formattedReadout) return;

    updateLedScaleCaret(sensorReadout.temperature);
    appendReadoutToChart(formattedReadout);
});

window.addEventListener("load", () => {
    initTheme();
    initChart();
    renderLedLegend();
    bindEventListeners();
});
