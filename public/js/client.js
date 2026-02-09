const socket = io();
let tempChart;

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
                borderColor: '#38bdf8',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#38bdf8',
                pointBorderColor: '#fff',
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4 // Smoother curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
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
                    grid: {
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

socket.on('history', function(history) {
    if (!tempChart) return;
    
    const labels = history.map(row => {
        const date = new Date(row.date);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const data = history.map(row => (row.value / 1000).toFixed(1));
    
    tempChart.data.labels = labels;
    tempChart.data.datasets[0].data = data;
    tempChart.update();
});

socket.on('sending temperature', function(temperature) {
  console.log("Received temperature:", temperature);
  const display = document.getElementById("temperature-display");
  if (display) {
    // Temperature is in milliCelsius
    const celsius = (temperature / 1000).toFixed(1);
    
    // Remove loading class
    display.classList.remove('loading');
    
    display.innerText = `${celsius} °C`;
    document.getElementById("last-updated").innerText = "Last updated: " + new Date().toLocaleTimeString();

    // Update chart
    if (tempChart) {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        tempChart.data.labels.push(now);
        tempChart.data.datasets[0].data.push(celsius);
        
        // Keep only last 50 points if we are in "all" mode (default)
        // If viewing history, we might want to just append or refresh, but typically realtime updates happen in 'live' mode
        // For simplicity, we'll shift if the list gets too long to keep performance up
        if (tempChart.data.labels.length > 100) {
            tempChart.data.labels.shift();
            tempChart.data.datasets[0].data.shift();
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
