const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const runRoutes = require("./routes/runRoutes");
const app = express();

require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use("/api/runs", runRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("RunTracker API is live!");
});