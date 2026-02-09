FROM balenalib/raspberry-pi-node:12-buster

WORKDIR /app

# FIX: Point sources to Raspbian Legacy (correct for Pi/ARMv6)
RUN echo "deb [trusted=yes] http://legacy.raspbian.org/raspbian/ buster main contrib non-free rpi" > /etc/apt/sources.list && \
    echo "Acquire::Check-Valid-Until \"false\";" > /etc/apt/apt.conf.d/99no-check-valid-until

# Install build tools
RUN install_packages python make g++

COPY package*.json ./

# Install dependencies
RUN npm install --production

COPY . .

# Copy entrypoint script and ensure it is Unix format and executable
COPY entrypoint.sh /usr/local/bin/
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

VOLUME /sys/bus/w1/devices

EXPOSE 8000

# Use ENTRYPOINT for the script, CMD for the arguments
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
