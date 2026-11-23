# HomeMonitor

Home monitoring app currently displaying temperature and humidity from a DHT22 sensor.

## Configuration

The DHT22 data pin is read through `node-dht-sensor`. Configure the sensor with:

- `DHT_SENSOR_TYPE`: defaults to `22`
- `DHT_GPIO_PIN`: defaults to `4` and uses the BCM GPIO number
- `DHT_MAX_READ_ATTEMPTS`: defaults to `3`
- `DHT_RETRY_DELAY_MS`: defaults to `2000` milliseconds between failed reads

For local development without hardware, set both `DHT_FAKE_TEMPERATURE` and `DHT_FAKE_HUMIDITY`.

### Outside weather

The dashboard retrieves the current outside temperature from [Open-Meteo](https://open-meteo.com/en/docs). No API key or additional Node.js dependency is required.

Configure the location with:

- `WEATHER_CITY`: city name
- `WEATHER_COUNTRY`: country name used to disambiguate the city
- `WEATHER_LAT` and `WEATHER_LON`: optional exact coordinates; when both are set, they override the city
- `WEATHER_POLL_INTERVAL_MS`: optional polling interval; defaults to 1 hour
- `WEATHER_CACHE_TTL_MS`: optional cache duration; defaults to 1 hour
- `WEATHER_REQUEST_TIMEOUT_MS`: optional request timeout; defaults to 8 seconds

Docker Compose defaults to Rouen, France. To use another city, copy `.env.example` to `.env` and edit its values:

```sh
cp .env.example .env
```

The deployment script does not copy `.env`. If overriding the default city, create the file in `~/node_temperature` on the Raspberry Pi before running a full deployment.

For local development without a network request, set `WEATHER_FAKE_TEMPERATURE`.

## Local Preview

On a Mac, install only the non-hardware dependencies:

```sh
npm install --omit=optional
```

Then start the app with fake DHT22 values:

```sh
DHT_FAKE_TEMPERATURE=21.5 DHT_FAKE_HUMIDITY=48.2 WEATHER_FAKE_TEMPERATURE=12.8 node server.js
```

Open `http://localhost:8000` in your browser.

The optional native packages `node-dht-sensor` and `sqlite3` are used on the Raspberry Pi. Local fake mode uses in-memory history so the UI can be previewed without compiling those native packages on macOS.

## Deployment

The app is deployed to the Raspberry Pi with `deploy.sh`. Update the configuration at the top of `deploy.sh` if your Pi user, IP address, or target directory is different:

- `PI_USER`
- `PI_HOST`
- `PI_DIR`

Before deploying, check `docker-compose.yaml` and make sure `DHT_GPIO_PIN` matches the BCM GPIO number used by the DHT22 data wire.

For a full deployment, Docker Desktop must be running on your Mac because the script builds the Raspberry Pi Docker image locally before copying it to the Pi.

For a full deployment, run:

```sh
./deploy.sh
```

Use a full deployment when dependencies, Docker files, or `docker-compose.yaml` change. This builds a new ARM image, copies it to the Pi, loads it there, and restarts the app with Docker Compose.

For a quick code-only update, run:

```sh
./deploy.sh --quick
```

Quick deploy only syncs source files into the existing container and restarts it. Use it after JavaScript, HTML, or CSS changes, but not after dependency, Dockerfile, or Docker Compose changes.

The SQLite database is persisted on the Pi through this Docker Compose mount:

```yaml
- ./db:/app/db
```

That means normal deploys and container restarts keep the existing data in `~/node_temperature/db/temperature_db.db`.

Sensor data is stored in the `sensor_readings` table. On startup, older rows from the previous `temperatures` table are copied into `sensor_readings` with `humidity = NULL`, so existing temperature history is preserved.
