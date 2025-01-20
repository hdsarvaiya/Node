const express = require("express");
const Network = require("../models/Network");

module.exports = (ioInstance) => {
  const router = express.Router();

  // Add a Node
  router.post("/nodes", async (req, res) => {
    try {
      const { type, parentId, details } = req.body;
      const network = await Network.findOne();

      if (!network) return res.status(404).json({ error: "Network not found" });

      switch (type) {
        case "router":
          network.routers = network.routers || []; // Ensure routers array exists
          network.routers.push({
            id: details.id,
            ip: details.ip,
            status: details.status,
            switches: [],
          });
          break;
        case "switch": {
          const parentRouter = (network.routers || []).find(
            (router) => router.id === parentId
          );
          if (!parentRouter)
            return res.status(404).json({ error: "Parent router not found" });
          parentRouter.switches = parentRouter.switches || []; // Ensure switches array exists
          parentRouter.switches.push({
            id: details.id,
            ip: details.ip,
            status: details.status,
            endDevices: [],
          });
          break;
        }
        case "device": {
          const parentSwitch = (network.routers || [])
            .flatMap((router) => router.switches || [])
            .find((switchNode) => switchNode.id === parentId);
          if (!parentSwitch)
            return res.status(404).json({ error: "Parent switch not found" });
          parentSwitch.endDevices = parentSwitch.endDevices || []; // Ensure endDevices array exists
          parentSwitch.endDevices.push({
            id: details.id,
            ip: details.ip,
            status: details.status,
          });
          break;
        }
        default:
          return res.status(400).json({ error: "Invalid node type" });
      }

      await network.save();
      ioInstance.emit("node-added", { type, parentId, details });
      res.status(201).json({ message: "Node added successfully", network });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/nodes/:nodeId", async (req, res) => {
    try {
      const { nodeId } = req.params;
      console.log(`Delete request for nodeId: ${nodeId}`);

      // Fetch the network document
      const network = await Network.findOne();

      if (!network) {
        console.error("Network not found");
        return res.status(404).json({ error: "Network not found" });
      }

      if (!Array.isArray(network.buildings)) {
        console.error("Buildings array is missing or not an array");
        return res
          .status(500)
          .json({ error: "Invalid network structure: buildings not found" });
      }

      let nodeDeleted = false;

      // Traverse buildings, routers, switches, and endDevices
      network.buildings.forEach((building) => {
        building.routers = (building.routers || []).filter((router) => {
          if (router.routerId === nodeId) {
            nodeDeleted = true; // Router found and deleted
            return false;
          }

          router.switches = (router.switches || []).filter((switchNode) => {
            if (switchNode.switchId === nodeId) {
              nodeDeleted = true; // Switch found and deleted
              return false;
            }

            switchNode.endDevices = (switchNode.endDevices || []).filter(
              (device) => {
                if (device.deviceId === nodeId) {
                  nodeDeleted = true; // End device found and deleted
                  return false;
                }
                return true; // Keep this end device
              }
            );

            return true; // Keep this switch
          });

          return true; // Keep this router
        });
      });

      // Check if the node was actually deleted
      if (!nodeDeleted) {
        console.error("Node not found in the network");
        return res.status(404).json({ error: "Node not found in the network" });
      }

      // Save the updated network to the database
      await network.save();

      console.log("Node deleted successfully");

      // Emit the deletion event to connected clients
      ioInstance.emit("node-deleted", { nodeId });

      // Respond with success
      res.json({ message: "Node deleted successfully", network });
    } catch (error) {
      console.error("Error deleting node:", error.message);
      res.status(500).json({ error: error.message });
    }
  });
  // In /parent-nodes route
  router.get("/parent-nodes", async (req, res) => {
    try {
      const { type } = req.query;
      console.log(`Fetching parent nodes of type: ${type}`);
      const network = await Network.findOne();
      console.log("Network fetched:", network);

      if (!network)
        return res.status(404).json({ message: "Network not found" });

      let parentNodes = [];
      switch (type) {
        case "router":
          parentNodes = network.routers || [];
          break;
        case "switch":
          parentNodes =
            network.routers?.flatMap((router) => router.switches) || [];
          break;
        case "device":
          parentNodes =
            network.routers?.flatMap((router) =>
              router.switches?.flatMap((switchNode) => switchNode.endDevices)
            ) || [];
          break;
        default:
          return res.status(400).json({ message: "Invalid type specified" });
      }

      console.log(`Parent nodes of type ${type}:`, parentNodes);
      res.json(parentNodes);
    } catch (error) {
      console.error("Error fetching parent nodes:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // In / route
  router.get("/", async (req, res) => {
    try {
      const network = await Network.findOne();
      console.log("Network:", network); // Check if network is fetched
      if (!network) return res.status(404).json({ error: "Network not found" });
      res.json(network);
    } catch (error) {
      console.error("Error fetching network:", error.message); // Log the error
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
