const express  = require("express");
const router = express.Router();
const { getRun, createRun } = require("../controller/runController");

// gets all runs
router.get("/", getRun);
// creates a new run
router.post("/", createRun);

module.exports = router;