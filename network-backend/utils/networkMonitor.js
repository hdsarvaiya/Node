const { fetchAndPingNetwork } = require('./tcp'); // Assuming tcp.js contains fetchAndPingNetwork

// Function to start monitoring the network
function startMonitoring() {
  setInterval(async () => {
    try {
      console.log('Starting network monitoring...');
      const statuses = await fetchAndPingNetwork();

      // Emit the status updates to the front-end via socket.io
      for (const ip in statuses) {
        if (statuses.hasOwnProperty(ip)) {
          console.log(`Emitting status: ${ip} - ${statuses[ip]}`);
          global.io.emit('nodeStatus', { ip, status: statuses[ip] });
        }
      }
      console.log('Network monitoring update sent to front-end.');
    } catch (error) {
      console.error('Error in network monitoring:', error.message);
    }
  }, 3000); // Ping the network every 3 seconds (adjust as needed)
}


module.exports = { startMonitoring };
