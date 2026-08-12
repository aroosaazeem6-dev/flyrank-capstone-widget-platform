const path = require("path");
const db = require("./db/database");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const protectedRoutes = require("./routes/protected");
const widgetRoutes = require("./routes/widgets");
const submissionRoutes = require("./routes/submissions");
const publicRoutes = require("./routes/public");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10kb" }));
app.use("/api", publicRoutes);
app.use("/api/dashboard", dashboardRoutes);

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
app.use("/api/widgets", widgetRoutes);
app.use("/api/submissions", submissionRoutes);

// JSON error handler
app.use((err, req, res, next) => {
  console.error(err);

  // Payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Payload too large"
    });
  }

  // Invalid JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON payload"
    });
  }

  // Generic server error
  res.status(500).json({
    error: "Internal server error"
  });
});


app.get("/widget.js", (req, res) => {
  const version = req.query.v || "1";

  if (version !== "1") {
    return res.status(404).json({
      error: "Widget version not found"
    });
  }

  res.set(
    "Cache-Control",
    "public, max-age=31536000, immutable"
  );

  res.type("application/javascript");

  res.sendFile(
    path.join(__dirname, "../widget/widget-client.js")
  );
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});