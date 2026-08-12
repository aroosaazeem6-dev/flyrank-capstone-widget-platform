const express = require("express");
const db = require("../db/database");

const router = express.Router();

// ----------------------------------------
// GET public widget configuration
// ----------------------------------------
router.get("/widgets/:id/config", (req, res) => {
  const widgetId = Number(req.params.id);

  // Validate widget ID
  if (!Number.isInteger(widgetId) || widgetId <= 0) {
    return res.status(400).json({
      error: "Widget ID must be a positive integer"
    });
  }

  // Get only public widget information
  const widget = db
    .prepare(`
      SELECT
        id,
        name,
        type,
        status,
        version
      FROM widgets
      WHERE id = ?
    `)
    .get(widgetId);

  // Widget does not exist
  if (!widget) {
    return res.status(404).json({
      error: "Widget not found"
    });
  }

  // Only active widgets can be publicly loaded
  if (widget.status !== "active") {
    return res.status(404).json({
      error: "Widget not found"
    });
  }

  // Public configuration
res.set(
  "Cache-Control",
  "public, max-age=60, stale-while-revalidate=300"
);

res.json({
  id: widget.id,
  name: widget.name,
  type: widget.type,
  version: widget.version
});
});

module.exports = router;