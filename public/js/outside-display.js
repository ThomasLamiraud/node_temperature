export function updateOutsideDisplay(readout) {
    if (!readout || !Number.isFinite(readout.temperature)) return;

    const temperatureDisplay = document.getElementById("outside-temperature-display");
    const locationDisplay = document.getElementById("outside-location");
    const statusDisplay = document.getElementById("outside-last-updated");
    if (!temperatureDisplay || !locationDisplay || !statusDisplay) return;

    temperatureDisplay.classList.remove("loading");
    temperatureDisplay.innerText = `${(readout.temperature / 1000).toFixed(1)} °C`;
    locationDisplay.innerText = readout.location || "Configured location";

    const timestamp = readout.fetchedAt || readout.observedAt;
    const updatedAt = timestamp ? new Date(timestamp) : null;
    const timeLabel = updatedAt && !Number.isNaN(updatedAt.getTime())
        ? updatedAt.toLocaleTimeString()
        : "unknown time";

    const status = readout.stale
        ? `Last available ${timeLabel}`
        : `Updated ${timeLabel}`;
    statusDisplay.innerText = status;
    statusDisplay.classList.toggle("stale", Boolean(readout.stale));
}
