const Run = require("../models/run");

// GET /api/runs
const getRuns = async (req, res) => {
  try {
    const runs = await Run.find().sort({ date: -1 });
    console.log("✅ Fetched runs:", runs);
    res.status(200).json(runs);
  } catch (err) {
    console.error("❌ Error fetching runs:", err);
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
    console.log("✅ Saved run:", savedRun);
    res.status(201).json(savedRun);
  } catch (err) {
    console.error("❌ Error saving run:", err);
    res.status(500).json({ error: "Failed to save run" });
  }
};

module.exports = {
  getRuns,
  createRun,
};