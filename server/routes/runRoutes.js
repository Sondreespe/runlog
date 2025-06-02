const express = require("express");
const router = express.Router();
const { getRuns, createRun } = require("../controllers/runController");

console.log("✅ runRoutes loaded");

router.get("/", getRuns);
router.post("/", createRun);

module.exports = router;