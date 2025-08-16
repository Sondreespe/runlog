const express = require("express"); // importerer express for routing
const mongoose = require("mongoose");// for database
const cors = require("cors");// så frontend kan kommunisere med backend
require("dotenv").config();

const app = express();
const runRoutes = require("./routes/activityRoutes");


app.use(cors());
app.use(express.json());

// Ruter
app.use("/api/activities", require('./routes/activityRoutes')); // all requests from api/runs directed to runRoutes( where actions are defined)

// Start server + DB
const PORT = process.env.PORT || 2000;

// kobler til MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));



// Global 404 
app.use((req, res) => {
  console.log("Global fallback – no route matched");
  res.status(404).json({ error: "Not found" });
});