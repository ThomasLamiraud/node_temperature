const http = require('http'); 
const hostname = '0.0.0.0'; // Listen on all interfaces
const port = 8000;
const express = require('express');
const app = express();
const server = http.createServer(app);
const queries = require("./services/db/queries");
const { Server } = require("socket.io");
const io = new Server(server);
const createDbConnection = require("./services/db/db")
const temperatureService = require("./services/TemperatureService");

// Initialize DB
createDbConnection();

app.use(express.static('public'));

app.get('/', async (_req, res) => {
  res.sendFile(__dirname + '/index.html');
})

server.listen(port, hostname, () => {
    console.log(`Server is running on http://${hostname}:${port}`);
});

// Polling every 5 minutes (300000 ms)
const POLLING_INTERVAL = 5 * 60 * 1000;

function pollTemperature() {
    console.log("Polling temperature...");
    const temp = temperatureService.getTemp();
    if (temp !== null) {
        console.log("New temperature:", temp);
        io.emit('sending temperature', temp);
    }
}

// Start polling
setInterval(pollTemperature, POLLING_INTERVAL);

// Initial poll on startup (optional, but good for testing)
pollTemperature();

io.on("connection", async (socket) => {
  console.log("Client connected");
  
  // Send last known temperature to the new client
  try {
      const rows = await queries.selectLastTemperature();
      if (rows && rows.length > 0) {
          socket.emit('sending temperature', rows[0].value);
      }
      
      const history = await queries.selectTemperaturesByRange();
      socket.emit('history', history);
  } catch (err) {
      console.error("Error fetching last temperature:", err);
  }

  socket.on('get history', async (range) => {
    try {
        const history = await queries.selectTemperaturesByRange(range);
        socket.emit('history', history);
    } catch (err) {
        console.error("Error fetching history:", err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  })
})
