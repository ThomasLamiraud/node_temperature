export function getChartTheme(theme = document.documentElement.getAttribute("data-theme")) {
    const isLight = theme === "light";

    return {
        textColor: isLight ? "#64748b" : "#94a3b8",
        gridColor: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)",
        tooltipBg: isLight ? "#ffffff" : "#1e293b",
        tooltipTitle: isLight ? "#0f172a" : "#f1f5f9",
        tooltipBorder: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
    };
}

export function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
}

export function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);

    return newTheme;
}

function updateThemeIcon(theme) {
    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");
    if (!sunIcon || !moonIcon) return;

    if (theme === "light") {
        sunIcon.style.display = "none";
        moonIcon.style.display = "block";
    } else {
        sunIcon.style.display = "block";
        moonIcon.style.display = "none";
    }
}
