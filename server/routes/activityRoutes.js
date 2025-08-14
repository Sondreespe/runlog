// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const { getActivities, createActivity, deleteActivity } = require('../controllers/activityController');

router.get('/', getActivities);
router.post('/', createActivity);
router.delete('/:id', deleteActivity);

module.exports = router;
