const mongoose = require('mongoose');

// Device Schema
const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  deviceName: { type: String, required: true },
  deviceType: { type: String, required: true }, // Added deviceType field
  deviceIp: { type: String, required: true },
  status: { type: String, default: 'active' },
  port: { type: Number, required: true },
});


// Switch Schema
const switchSchema = new mongoose.Schema({
  switchId: { type: String, required: true },
  switchName: { type: String, required: true },
  switchIp: { type: String, required: true },
  status: { type: String, default: 'active' },
  port: { type: Number, required: true },
  endDevices: [deviceSchema],
});

// Router Schema
const routerSchema = new mongoose.Schema({
  routerId: { type: String, required: true },
  routerName: { type: String, required: true },
  routerIp: { type: String, required: true },
  status: { type: String, default: 'active' },
  port: { type: Number, required: true },
  switches: [switchSchema],
});

// Network Schema
const networkSchema = new mongoose.Schema({
  parentNode: { type: String, required: true },
  buildings: [
    {
      name: { type: String, required: true },
      routers: [routerSchema],
    },
  ],
});

// Define and Export the Model
const Network = mongoose.model('Network', networkSchema);
module.exports = Network;
