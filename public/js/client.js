const socket = io();
let tempChart;
let ledsEnabled = true;

const TEMPERATURE_LEDS_COLORS = [
    { matches: (temperature) => temperature < 20000, color: "#f8fafc" },
  { matches: (temperature) => temperature <= 24000, color: "#22c55e" },
  { matches: (temperature) => temperature <= 28000, color: "#f97316" },
  { matches: () => true, color: "#ef4444" },
]

function addColorToValueDisplay(html_tag, value) {
  color = TEMPERATURE_LEDS_COLORS.find((led) => led.matches(value)).color;
  html_tag.style.color = color;
}

// Theme handling
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon(newTheme);
    updateChartTheme(newTheme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    
    if (theme === 'light') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

function updateChartTheme(theme) {
    if (!tempChart) return;
    
    const isLight = theme === 'light';
    const textColor = isLight ? '#64748b' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    const tooltipBg = isLight ? '#ffffff' : '#1e293b';
    const tooltipTitle = isLight ? '#0f172a' : '#f1f5f9';
    const tooltipBorder = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
    
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    
    tempChart.options.scales.y.grid.color = gridColor;
    tempChart.options.scales.y1.grid.color = gridColor;
    tempChart.options.plugins.tooltip.backgroundColor = tooltipBg;
    tempChart.options.plugins.tooltip.titleColor = tooltipTitle;
    tempChart.options.plugins.tooltip.borderColor = tooltipBorder;
    
    tempChart.update();
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

function initChart() {
    const ctx = document.getElementById('tempChart').getContext('2d');
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)');   // Light blue
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');   // Transparent

    const humidityGradient = ctx.createLinearGradient(0, 0, 0, 400);
    humidityGradient.addColorStop(0, 'rgba(129, 140, 248, 0.35)');
    humidityGradient.addColorStop(1, 'rgba(129, 140, 248, 0.0)');

    const textColor = isLight ? '#64748b' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    const tooltipBg = isLight ? '#ffffff' : '#1e293b';
    const tooltipTitle = isLight ? '#0f172a' : '#f1f5f9';
    const tooltipBorder = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                yAxisID: 'y',
                borderColor: '#38bdf8',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#38bdf8',
                pointBorderColor: '#fff',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4 // Smoother curves
            }, {
                label: 'Humidity (%)',
                data: [],
                yAxisID: 'y1',
                borderColor: '#818cf8',
                backgroundColor: humidityGradient,
                borderWidth: 2,
                pointBackgroundColor: '#818cf8',
                pointBorderColor: '#fff',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: tooltipBg,
                    titleColor: tooltipTitle,
                    bodyColor: '#38bdf8',
                    borderColor: tooltipBorder,
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y1: {
                    beginAtZero: true,
                    max: 100,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                        color: gridColor
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function requestHistory(range) {
    socket.emit('get history', range);
    
    // Update active button state
    document.querySelectorAll('.chart-controls button').forEach(btn => btn.classList.remove('active'));
    const btnId = `btn-${range}`;
    const btn = document.getElementById(btnId);
    if(btn) btn.classList.add('active');
}

function toggleLedStatus() {
    socket.emit('set led enabled', !ledsEnabled);
}

function updateLedStatus(status) {
    if (!status) return;

    ledsEnabled = Boolean(status.enabled);

    const button = document.getElementById('led-toggle');
    const label = document.getElementById('led-status');
    if (!button || !label) return;

    button.innerText = ledsEnabled ? 'Disable LEDs' : 'Enable LEDs';
    button.classList.toggle('active', ledsEnabled);
    label.innerText = ledsEnabled ? 'LEDs enabled' : 'LEDs disabled';

    if (status.available === false) {
        label.innerText = 'LEDs unavailable';
    }
}

socket.on('history', function(history) {
    if (!tempChart) return;
    
    const labels = history.map(row => {
        const date = new Date(row.date);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const temperatureData = history.map(row => row.value / 1000);
    const humidityData = history.map(row => row.humidity === null ? null : Number(row.humidity));
    
    tempChart.data.labels = labels;
    tempChart.data.datasets[0].data = temperatureData;
    tempChart.data.datasets[1].data = humidityData;
    tempChart.update();
});

socket.on('led status', updateLedStatus);

function normalizeReadout(readout) {
    if (typeof readout === 'number') {
        return {
            temperature: readout,
            humidity: null,
        };
    }

    return readout;
}

socket.on('sending temperature', function(readout) {
  const sensorReadout = normalizeReadout(readout);
  console.log("Received sensor readout:", sensorReadout);

  if (!sensorReadout || sensorReadout.temperature === undefined) return;

  const temperatureDisplay = document.getElementById("temperature-display");
  const humidityDisplay = document.getElementById("humidity-display");
  if (temperatureDisplay) {
    const celsius = (sensorReadout.temperature / 1000).toFixed(1);
    const humidity = Number.isFinite(sensorReadout.humidity) ? Number(sensorReadout.humidity.toFixed(1)) : null;
    
    temperatureDisplay.classList.remove('loading');
    humidityDisplay.classList.remove('loading');
    
    temperatureDisplay.innerText = `${celsius} °C`;
    addColorToValueDisplay(temperatureDisplay, sensorReadout.temperature);
    humidityDisplay.innerText =  `${humidity.toFixed(1)} %`
    document.getElementById("last-updated").innerText = "Last updated: " + new Date().toLocaleTimeString();

    // Update chart
    if (tempChart) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        tempChart.data.labels.push(now);
        tempChart.data.datasets[0].data.push(Number(celsius));
        tempChart.data.datasets[1].data.push(humidity);
        
        // Keep only last 50 points if we are in "all" mode (default)
        // If viewing history, we might want to just append or refresh, but typically realtime updates happen in 'live' mode
        // For simplicity, we'll shift if the list gets too long to keep performance up
        if (tempChart.data.labels.length > 100) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
            tempChart.data.datasets[1].data.shift();
        }
        tempChart.update();
    }
  }
});

window.onload = function() {
    initChart();
    // Ensure icon state matches saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    updateThemeIcon(savedTheme);
};
