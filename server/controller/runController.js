const Run = require("../models/run");

// GET /api/runs
const getRun = async (req, res) => {
  try {
    const runs = await Run.find().sort({ date: -1 });
    res.json(runs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch runs" });
  }
};

// POST /api/runs
const createRun = async (req, res) => {
  const { distance, duration, date } = req.body;

  if (!distance || !duration) {
    return res.status(400).json({ error: "Distance and duration are required" });
  }

  try {
    const newRun = new Run({
      distance,
      duration,
      date: date || new Date(),
    });

    const savedRun = await newRun.save();
    res.status(201).json(savedRun);
  } catch (err) {
    res.status(500).json({ error: "Failed to create run" });
  }
};

module.exports = {
  getRun,
  createRun,
};