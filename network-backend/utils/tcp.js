const Network  = require('../models/Network'); // Import your Mongoose model
const ping = require('ping');

async function fetchAndPingNetwork() {
  try {
    console.log('Fetching network data...');
    const network = await Network.findOne();
    if (!network) throw new Error('No network data found in MongoDB');
    console.log('Network data fetched:', JSON.stringify(network, null, 2)); // Log network data

    const statuses = {};

    // Traverse and ping all devices
    const buildings = network.buildings || [];
    for (const building of buildings) {
      console.log(`Pinging devices in building: ${building.name}`);
      const routers = building.routers || [];
      for (const router of routers) {
        console.log(`Pinging router: ${router.routerName} (${router.routerIp})`);
        const isAlive = await ping.promise.probe(router.routerIp);
        statuses[router.routerIp] = isAlive.alive ? 'active' : 'inactive';
        global.io.emit('nodeStatus', { ip: router.routerIp, status: statuses[router.routerIp] });
        console.log(`Router status: ${router.routerIp} - ${statuses[router.routerIp]}`);

        const switches = router.switches || [];
        for (const sw of switches) {
          console.log(`Pinging switch: ${sw.switchName} (${sw.switchIp})`);
          const isAlive = await ping.promise.probe(sw.switchIp);
          statuses[sw.switchIp] = isAlive.alive ? 'active' : 'inactive';
          global.io.emit('nodeStatus', { ip: sw.switchIp, status: statuses[sw.switchIp] });
          console.log(`Switch status: ${sw.switchIp} - ${statuses[sw.switchIp]}`);

          const devices = sw.endDevices || [];
          for (const device of devices) {
            console.log(`Pinging device: ${device.deviceName} (${device.deviceIp})`);
            const isAlive = await ping.promise.probe(device.deviceIp);
            statuses[device.deviceIp] = isAlive.alive ? 'active' : 'inactive';
            global.io.emit('nodeStatus', { ip: device.deviceIp, status: statuses[device.deviceIp] });
            console.log(`Device status: ${device.deviceIp} - ${statuses[device.deviceIp]}`);
          }
        }
      }
    }

    console.log('Completed pinging network. Statuses:', statuses);
    return statuses;
  } catch (error) {
    console.error('Error pinging network:', error.message);
    throw error;
  }
}

module.exports = { fetchAndPingNetwork };
