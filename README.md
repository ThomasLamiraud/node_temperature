# node_temperature

Simple application to display temperature and humidity from a DHT22 sensor.

## Configuration

The DHT22 data pin is read through `node-dht-sensor`. Configure the sensor with:

- `DHT_SENSOR_TYPE`: defaults to `22`
- `DHT_GPIO_PIN`: defaults to `4` and uses the BCM GPIO number

For local development without hardware, set both `DHT_FAKE_TEMPERATURE` and `DHT_FAKE_HUMIDITY`.

## Local Preview

On a Mac, install only the non-hardware dependencies:

```sh
npm install --omit=optional
```

Then start the app with fake DHT22 values:

```sh
DHT_FAKE_TEMPERATURE=21.5 DHT_FAKE_HUMIDITY=48.2 node server.js
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

Quick deploy only syncs the source files and restarts the existing container. Use it after JavaScript, HTML, CSS, or README changes, but not after dependency or Docker configuration changes.

The SQLite database is persisted on the Pi through this Docker Compose mount:

```yaml
- ./db:/app/db
```

That means normal deploys and container restarts keep the existing data in `~/node_temperature/db/temperature_db.db`.