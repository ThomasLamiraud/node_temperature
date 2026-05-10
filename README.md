# node_temperature

Simple application to display temperature from a DHT22 sensor.

## Configuration

The DHT22 data pin is read through `node-dht-sensor`. Configure the sensor with:

- `DHT_SENSOR_TYPE`: defaults to `22`
- `DHT_GPIO_PIN`: defaults to `4` and uses the BCM GPIO number

For local development without hardware, set both `DHT_FAKE_TEMPERATURE` and `DHT_FAKE_HUMIDITY`.

## Deployment

The app is deployed to the Raspberry Pi with `deploy.sh`. Update the configuration at the top of `deploy.sh` if your Pi user, IP address, or target directory is different:

- `PI_USER`
- `PI_HOST`
- `PI_DIR`

Before deploying, check `docker-compose.yaml` and make sure `DHT_GPIO_PIN` matches the BCM GPIO number used by the DHT22 data wire.

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
