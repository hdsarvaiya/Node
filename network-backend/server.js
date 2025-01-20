const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const networkRouter = require('./routes/network');
const { startMonitoring } = require('./utils/networkMonitor');
const Network = require("../network-backend/models/Network");
const { pingNetwork } = require('./utils/tcp'); // Import the pingNetwork function

const app = express();
const server = http.createServer(app);
const ioInstance = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE'],
  },
});

global.io = ioInstance; // Make ioInstance globally available

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api/network', networkRouter(ioInstance));

mongoose.connect('mongodb://localhost:27017/network', { useNewUrlParser: true, useUnifiedTopology: true });
Network.findOne().then(console.log).catch(console.error);


  async function getNetworkData() {
  try {
    console.log('Attempting to fetch network data...');
    const networkData = await Network.findOne();
    if (!networkData) {
      console.error('No network data found in MongoDB');
    } else {
      console.log('Network data:', networkData);
      startMonitoring(networkData);
    }
  } catch (error) {
    console.error('Error fetching network data:', error.message);
  }
}

// Define API endpoint
app.get('/api/ping-network', async (req, res) => {
  try {
    const results = await fetchAndPingNetwork();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Socket.IO Events
ioInstance.on('connection', socket => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Automatically fetch network data and start monitoring after server is ready
server.listen(5000, async () => {
  console.log('Server is running on http://localhost:5000');
  await getNetworkData(); // Fetch network data and start monitoring automatically
});
