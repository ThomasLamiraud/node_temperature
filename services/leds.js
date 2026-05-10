const ON = 1;
const OFF = 0;

const TEMPERATURE_LEDS = [
  { name: "cold / white", pin: 23, matches: (temperature) => temperature < 20000 },
  { name: "comfortable / green", pin: 24, matches: (temperature) => temperature <= 24000 },
  { name: "warm / orange", pin: 25, matches: (temperature) => temperature <= 28000 },
  { name: "hot / red", pin: 18, matches: () => true },
];

let gpioReady = false;
let hardwareAvailable = true;
let userEnabled = true;
let exportedLeds = [];
let activeLedName = null;
let cleanupHandlersRegistered = false;
let lastTemperature = null;

function getActiveTemperatureLed(temperature) {
  return TEMPERATURE_LEDS.find((led) => led.matches(temperature));
}

function markHardwareUnavailable(message) {
  if (hardwareAvailable) {
    console.warn(`LED status disabled: ${message}`);
  }

  hardwareAvailable = false;
  cleanup();
}

function canUseHardware() {
  return hardwareAvailable;
}

function initialize() {
  if (gpioReady || !canUseHardware()) return canUseHardware();

  let Gpio;
  try {
    ({ Gpio } = require("onoff"));
  } catch (error) {
    markHardwareUnavailable(error.message);
    return false;
  }

  try {
    for (const led of TEMPERATURE_LEDS) {
      exportedLeds.push({
        ...led,
        gpio: new Gpio(led.pin, "out"),
      });
    }

    gpioReady = true;
    turnAllOff();
    registerCleanupHandlers();
    return true;
  } catch (error) {
    markHardwareUnavailable(error.message);
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
  gpioReady = false;
  activeLedName = null;
}

exports.updateTemperature = function (temperature) {
  if (!Number.isFinite(temperature)) {
    console.warn("LED status skipped: invalid temperature value");
    return;
  }

  lastTemperature = temperature;

  if (!userEnabled) {
    if (gpioReady) turnAllOff();
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
    markHardwareUnavailable(error.message);
  }
};

exports.setEnabled = function (nextEnabled) {
  userEnabled = Boolean(nextEnabled);

  if (!userEnabled) {
    cleanup();
    return;
  }

  if (lastTemperature !== null) {
    exports.updateTemperature(lastTemperature);
  }
};

exports.getStatus = function () {
  return {
    enabled: userEnabled,
    available: hardwareAvailable,
    activeLed: activeLedName,
  };
};

exports.cleanup = cleanup;
