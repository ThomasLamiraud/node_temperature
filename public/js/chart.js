import { getChartTheme } from "./theme.js";

let tempChart;

export function initChart() {
    const ctx = document.getElementById("tempChart").getContext("2d");
    const { textColor, gridColor, tooltipBg, tooltipTitle, tooltipBorder } = getChartTheme();

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.5)");
    gradient.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    const humidityGradient = ctx.createLinearGradient(0, 0, 0, 400);
    humidityGradient.addColorStop(0, "rgba(129, 140, 248, 0.35)");
    humidityGradient.addColorStop(1, "rgba(129, 140, 248, 0.0)");

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    tempChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Temperature (°C)",
                data: [],
                yAxisID: "y",
                borderColor: "#38bdf8",
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: "#38bdf8",
                pointBorderColor: "#fff",
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4,
            }, {
                label: "Humidity (%)",
                data: [],
                yAxisID: "y1",
                borderColor: "#818cf8",
                backgroundColor: humidityGradient,
                borderWidth: 2,
                pointBackgroundColor: "#818cf8",
                pointBorderColor: "#fff",
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                },
                tooltip: {
                    mode: "index",
                    intersect: false,
                    backgroundColor: tooltipBg,
                    titleColor: tooltipTitle,
                    bodyColor: "#38bdf8",
                    borderColor: tooltipBorder,
                    borderWidth: 1,
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        stepSize: 1,
                    },
                    grid: {
                        color: gridColor,
                    }
                },
                y1: {
                    beginAtZero: true,
                    max: 100,
                    position: "right",
                    grid: {
                        drawOnChartArea: false,
                        color: gridColor,
                    }
                }
            },
            interaction: {
                mode: "nearest",
                axis: "x",
                intersect: false,
            }
        }
    });
}

export function updateChartTheme(theme) {
    if (!tempChart) return;

    const { textColor, gridColor, tooltipBg, tooltipTitle, tooltipBorder } = getChartTheme(theme);

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    tempChart.options.scales.y.grid.color = gridColor;
    tempChart.options.scales.y1.grid.color = gridColor;
    tempChart.options.plugins.tooltip.backgroundColor = tooltipBg;
    tempChart.options.plugins.tooltip.titleColor = tooltipTitle;
    tempChart.options.plugins.tooltip.borderColor = tooltipBorder;

    tempChart.update();
}

export function setChartHistory(history) {
    if (!tempChart) return;

    tempChart.data.labels = history.map((row) => {
        const date = new Date(row.date);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    });
    tempChart.data.datasets[0].data = history.map((row) => row.value / 1000);
    tempChart.data.datasets[1].data = history.map((row) => row.humidity === null ? null : Number(row.humidity));
    tempChart.update();
}

export function appendReadoutToChart(formattedReadout) {
    if (!tempChart) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    tempChart.data.labels.push(now);
    tempChart.data.datasets[0].data.push(Number(formattedReadout.celsius));
    tempChart.data.datasets[1].data.push(formattedReadout.humidity);

    if (tempChart.data.labels.length > 100) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
        tempChart.data.datasets[1].data.shift();
    }

    tempChart.update();
}
