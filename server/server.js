const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const runRoutes = require("./routes/runRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/runs", runRoutes);

// Start server + DB
const PORT = process.env.PORT || 2000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("RunTracker API is live!");
});

// Global 404 fallback
app.use((req, res) => {
  console.log("🔴 Global fallback – no route matched");
  res.status(404).json({ error: "Not found" });
});