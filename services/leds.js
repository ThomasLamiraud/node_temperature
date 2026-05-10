const ON = 1;
const OFF = 0;

const TEMPERATURE_LEDS = [
  { name: "cold / white", pin: 23, matches: (temperature) => temperature < 20000 },
  { name: "comfortable / green", pin: 24, matches: (temperature) => temperature <= 24000 },
  { name: "warm / orange", pin: 25, matches: (temperature) => temperature <= 28000 },
  { name: "hot / red", pin: 18, matches: () => true },
];

let initialized = false;
let disabled = false;
let enabled = true;
let exportedLeds = [];
let activeLedName = null;
let cleanupHandlersRegistered = false;
let lastTemperature = null;

function getActiveTemperatureLed(temperature) {
  return TEMPERATURE_LEDS.find((led) => led.matches(temperature));
}

function disableLeds(message) {
  if (!disabled) {
    console.warn(`LED status disabled: ${message}`);
  }

  disabled = true;
  cleanup();
}

function initialize() {
  if (initialized || disabled) return !disabled;

  let Gpio;
  try {
    ({ Gpio } = require("onoff"));
  } catch (error) {
    disableLeds(error.message);
    return false;
  }

  try {
    for (const led of TEMPERATURE_LEDS) {
      exportedLeds.push({
        ...led,
        gpio: new Gpio(led.pin, "out"),
      });
    }

    initialized = true;
    turnAllOff();
    registerCleanupHandlers();
    return true;
  } catch (error) {
    disableLeds(error.message);
    return false;
  }
}

function registerCleanupHandlers() {
  if (cleanupHandlersRegistered) return;

  process.once("SIGINT", () => shutdown(130));
  process.once("SIGTERM", () => shutdown(143));
  process.once("beforeExit", cleanup);
  cleanupHandlersRegistered = true;
}

function shutdown(exitCode) {
  cleanup();
  process.exit(exitCode);
}

function turnAllOff() {
  for (const led of exportedLeds) {
    led.gpio.writeSync(OFF);
  }

  activeLedName = null;
}

function cleanup() {
  for (const led of exportedLeds) {
    try {
      led.gpio.writeSync(OFF);
      led.gpio.unexport();
    } catch (error) {
      console.warn(`Failed to cleanup GPIO${led.pin}: ${error.message}`);
    }
  }

  exportedLeds = [];
  initialized = false;
  activeLedName = null;
}

exports.updateTemperature = function (temperature) {
  if (!Number.isFinite(temperature)) {
    console.warn("LED status skipped: invalid temperature value");
    return;
  }

  lastTemperature = temperature;

  if (!enabled) {
    if (initialized) turnAllOff();
    return;
  }

  const activeLed = getActiveTemperatureLed(temperature);
  if (!activeLed || activeLed.name === activeLedName) return;

  if (!initialize()) return;

  try {
    turnAllOff();
    const led = exportedLeds.find((item) => item.name === activeLed.name);
    led.gpio.writeSync(ON);
    activeLedName = activeLed.name;
    console.log(`LED status: ${activeLed.name} on GPIO${activeLed.pin}`);
  } catch (error) {
    disableLeds(error.message);
  }
};

exports.setEnabled = function (nextEnabled) {
  enabled = Boolean(nextEnabled);

  if (!enabled) {
    cleanup();
    return;
  }

  if (lastTemperature !== null) {
    exports.updateTemperature(lastTemperature);
  }
};

exports.getStatus = function () {
  return {
    enabled,
    available: !disabled,
    activeLed: activeLedName,
  };
};

exports.cleanup = cleanup;
