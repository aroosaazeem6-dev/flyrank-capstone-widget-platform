const db = require("./db/database");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const protectedRoutes = require("./routes/protected");
const widgetRoutes = require("./routes/widgets");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/widgets", widgetRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "FlyRank Embeddable Widget & Lead-Capture Platform API",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.use("/api", protectedRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});