const express = require("express");
const router = express.Router();
const { getRuns, createRun, deleteRun } = require("../controllers/runController");// importing the controller functions

router.get("/", getRuns);
router.post("/", createRun);
router.delete("/:id", deleteRun)
 

module.exports = router;