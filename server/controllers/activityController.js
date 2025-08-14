const mongoose = require('mongoose');
const Activity = require('../models/activity');

const ALLOWED_SPORTS = new Set(['run', 'cycle', 'swim']);

const getActivities = async (req, res) => {
  try {
    const filter = {};
    const { sport } = req.query;
    if (sport && ALLOWED_SPORTS.has(String(sport).toLowerCase())) {
      filter.sport = String(sport).toLowerCase();
    }
    const activities = await Activity.find(filter).sort({ date: -1 }).lean();
    res.status(200).json(activities);
  } catch (err) {
    console.error('Error getting activities:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

const createActivity = async (req, res) => {
  try {
    const { distance, duration, date, sport, title, comment } = req.body;

    const distanceNum = Number(distance);
    const durationNum = Number(duration);
    if (!Number.isFinite(distanceNum) || distanceNum <= 0) {
      return res.status(400).json({ error: 'Distance must be a positive number (km)' });
    }
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number of seconds' });
    }

    const s = (sport || 'run').toLowerCase();
    if (!ALLOWED_SPORTS.has(s)) {
      return res.status(400).json({ error: "Invalid sport. Use 'run', 'cycle', or 'swim'." });
    }

    const when = date ? new Date(date) : new Date();

    const doc = await Activity.create({
      distance: distanceNum,
      duration: durationNum,
      date: when,
      sport: s,
      title: (title || '').trim() || undefined,
      comment: (comment || '').trim() || undefined,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Failed to save activity' });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid activity id' });
    }
    const deleted = await Activity.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Activity not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
};

module.exports = { getActivities, createActivity, deleteActivity };
