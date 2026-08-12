const express = require("express");
const authenticate = require("../middleware/auth");
const db = require("../db/database");

const router = express.Router();

// ----------------------------------------
// Create a widget
// ----------------------------------------
router.post("/", authenticate, (req, res) => {
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      error: "name and type are required"
    });
  }

  const result = db
    .prepare(`
      INSERT INTO widgets
        (tenant_id, name, type)
      VALUES
        (?, ?, ?)
    `)
    .run(req.tenant.id, name, type);

  const widget = db
    .prepare(`
      SELECT *
      FROM widgets
      WHERE id = ?
        AND tenant_id = ?
    `)
    .get(result.lastInsertRowid, req.tenant.id);

  res.status(201).json(widget);
});

// ----------------------------------------
// List widgets for authenticated tenant
// ----------------------------------------
router.get("/", authenticate, (req, res) => {
  const widgets = db
    .prepare(`
      SELECT *
      FROM widgets
      WHERE tenant_id = ?
      ORDER BY id DESC
    `)
    .all(req.tenant.id);

  res.json(widgets);
});

// ----------------------------------------
// Get one widget
// ----------------------------------------
router.get("/:id", authenticate, (req, res) => {
  const widget = db
    .prepare(`
      SELECT *
      FROM widgets
      WHERE id = ?
        AND tenant_id = ?
    `)
    .get(req.params.id, req.tenant.id);

  if (!widget) {
    return res.status(404).json({
      error: "Widget not found"
    });
  }

  // ----------------------------------------
  // Generate embed snippet
  // ----------------------------------------

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const embedSnippet =
    `<script src="${baseUrl}/widget.js?id=${widget.id}&v=${widget.version}"></script>`;

  res.json({
    ...widget,
    embed: {
      script: embedSnippet
    }
  });
});

// ----------------------------------------
// Update a widget
// ----------------------------------------
router.put("/:id", authenticate, (req, res) => {
  const { name, type, status } = req.body;

  const existingWidget = db
    .prepare(`
      SELECT *
      FROM widgets
      WHERE id = ?
        AND tenant_id = ?
    `)
    .get(req.params.id, req.tenant.id);

  if (!existingWidget) {
    return res.status(404).json({
      error: "Widget not found"
    });
  }

  const updatedName = name || existingWidget.name;
  const updatedType = type || existingWidget.type;
  const updatedStatus = status || existingWidget.status;

  db.prepare(`
    UPDATE widgets
    SET
      name = ?,
      type = ?,
      status = ?,
      version = version + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND tenant_id = ?
  `).run(
    updatedName,
    updatedType,
    updatedStatus,
    req.params.id,
    req.tenant.id
  );

  const updatedWidget = db
    .prepare(`
      SELECT *
      FROM widgets
      WHERE id = ?
        AND tenant_id = ?
    `)
    .get(req.params.id, req.tenant.id);

  res.json(updatedWidget);
});

// ----------------------------------------
// Delete a widget
// ----------------------------------------
router.delete("/:id", authenticate, (req, res) => {
  const result = db
    .prepare(`
      DELETE FROM widgets
      WHERE id = ?
        AND tenant_id = ?
    `)
    .run(req.params.id, req.tenant.id);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Widget not found"
    });
  }

  res.json({
    message: "Widget deleted successfully"
  });
});

module.exports = router;