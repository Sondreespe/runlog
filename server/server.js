const express = require("express"); // importing required modules
const mongoose = require("mongoose");// to communicate with MongoDB(database)
const cors = require("cors");// middleware such that frontend can access backend at diff ports 
require("dotenv").config();

const app = express();
const runRoutes = require("./routes/runRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/runs", runRoutes); // all requests from api/runs directed to runRoutes( where actions are defined)

// Start server + DB
const PORT = process.env.PORT || 2000;

// connects mongodb to mongo URI, logs success or error
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));



// Global 404 fallback, since ive had some issues with 404 in the start.
app.use((req, res) => {
  console.log("Global fallback – no route matched");
  res.status(404).json({ error: "Not found" });
});