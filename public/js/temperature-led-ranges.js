export const TEMPERATURE_LED_RANGES = [
    {
        key: "white",
        label: "White",
        rangeText: "< 20°C",
        description: "Cold",
        color: "#f8fafc",
        matches: (temperature) => temperature < 20000,
    },
    {
        key: "green",
        label: "Green",
        rangeText: "20-24°C",
        description: "Comfortable",
        color: "#22c55e",
        matches: (temperature) => temperature <= 24000,
    },
    {
        key: "orange",
        label: "Orange",
        rangeText: "24-28°C",
        description: "Warm",
        color: "#f97316",
        matches: (temperature) => temperature <= 28000,
    },
    {
        key: "red",
        label: "Red",
        rangeText: "> 28°C",
        description: "Hot",
        color: "#ef4444",
        matches: () => true,
    },
];

export function getTemperatureLedRange(temperature) {
    return TEMPERATURE_LED_RANGES.find((range) => range.matches(temperature));
}
(function (root, factory) {
  const temperatureLedConfig = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = temperatureLedConfig;
  }

  if (root) {
    root.temperatureLedConfig = temperatureLedConfig;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ranges = [
    {
      key: "white",
      label: "White",
      rangeText: "< 20°C",
      description: "Cold",
      color: "#f8fafc",
      matches: (temperature) => temperature < 20000,
    },
    {
      key: "green",
      label: "Green",
      rangeText: "20-24°C",
      description: "Comfortable",
      color: "#22c55e",
      matches: (temperature) => temperature <= 24000,
    },
    {
      key: "orange",
      label: "Orange",
      rangeText: "24-28°C",
      description: "Warm",
      color: "#f97316",
      matches: (temperature) => temperature <= 28000,
    },
    {
      key: "red",
      label: "Red",
      rangeText: "> 28°C",
      description: "Hot",
      color: "#ef4444",
      matches: () => true,
    },
  ];

  function getTemperatureLedRange(temperature) {
    return ranges.find((range) => range.matches(temperature));
  }

  return {
    ranges,
    getTemperatureLedRange,
  };
});
