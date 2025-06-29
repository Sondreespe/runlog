const Run = require("../models/run");// importing the Run model

// GET /api/runs
// returns all runs
const getRuns = async (req, res) => {
  try {
    const runs = await Run.find().sort({ date: -1 }); // sorted by  date
    res.status(200).json(runs);// returns all runs in JSON format
  } catch (err) {
    console.error(" Error getting run:", err);
    res.status(500).json({ error: "Failed to fetch runs" });
  }
};

// POST /api/runs
const createRun = async (req, res) => {
  const { distance, duration, date } = req.body;

  if (!distance || !duration || distance <0 || duration <0) {// Checks for invalid input
    return res.status(400).json({ error: "Distance and duration are required" });
  }
  // creates a new run with the given date
  try {
    const newRun = new Run({
      distance,
      duration,
      date: date || new Date(),
    });

    const savedRun = await newRun.save();
    res.status(201).json(savedRun);
  } catch (err) {
    console.error(" Error creating run:", err);
    res.status(500).json({ error: "Failed to save run" });
  }
};

// DELETE /api/runs/:id
const deleteRun = async (req, res) => {
  try {
    const deleted = await Run.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Run not found" });
    }
    res.status(200).json({ message: "Run deleted" });
  } catch (err) {
    console.error(" Error deleting run:", err);
    res.status(500).json({ error: "Failed to delete run" });
  }
};
// exports the action
module.exports = {
  getRuns,
  createRun,
  deleteRun
};