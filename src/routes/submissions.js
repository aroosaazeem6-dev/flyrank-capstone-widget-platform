const { notifyNewSubmission } = require("../services/notificationService");
const { getGeoLocation } = require("../services/geoService");
const rateLimit = require("express-rate-limit");
const express = require("express");
const db = require("../db/database");

const router = express.Router();

const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many submission attempts. Please try again later."
  }
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Public submission endpoint
router.post("/", submissionLimiter, async (req, res) => {
  const {
    widget_id,
    name,
    email,
    message,
    website
  } = req.body;

  // -----------------------------
  // Honeypot spam protection
  // -----------------------------
  if (website) {
    return res.status(400).json({
      error: "Spam submission detected"
    });
  }

  // -----------------------------
  // Payload validation
  // -----------------------------

  if (
    widget_id === undefined ||
    widget_id === null ||
    !Number.isInteger(Number(widget_id)) ||
    Number(widget_id) <= 0
  ) {
    return res.status(400).json({
      error: "widget_id must be a positive integer"
    });
  }

  if (
    typeof name !== "string" ||
    name.trim().length === 0
  ) {
    return res.status(400).json({
      error: "name is required and must be a non-empty string"
    });
  }

  if (
    typeof email !== "string" ||
    email.trim().length === 0
  ) {
    return res.status(400).json({
      error: "email is required"
    });
  }

  if (!isValidEmail(email.trim())) {
    return res.status(400).json({
      error: "email must be valid"
    });
  }

  if (
    message !== undefined &&
    message !== null &&
    typeof message !== "string"
  ) {
    return res.status(400).json({
      error: "message must be a string"
    });
  }

  const widgetId = Number(widget_id);
  const cleanName = name.trim();
  const cleanEmail = email.trim();

  const cleanMessage =
    typeof message === "string"
      ? message.trim()
      : null;

  // -----------------------------
  // Widget validation
  // -----------------------------

  const widget = db
    .prepare(`
      SELECT id, tenant_id, status
      FROM widgets
      WHERE id = ?
    `)
    .get(widgetId);

  if (!widget) {
    return res.status(404).json({
      error: "Widget not found"
    });
  }

  if (widget.status !== "active") {
    return res.status(400).json({
      error: "Widget is not active"
    });
  }

  // -----------------------------
  // Store submission
  // -----------------------------

 const clientIp = req.ip || null;

// Geo-enrichment using Provider A
const geo = await getGeoLocation(clientIp);

const result = db
  .prepare(`
    INSERT INTO submissions (
      tenant_id,
      widget_id,
      name,
      email,
      message,
      ip_address,
      country,
      city
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  .run(
    widget.tenant_id,
    widget.id,
    cleanName,
    cleanEmail,
    cleanMessage,
    clientIp,
    geo ? geo.country : null,
    geo ? geo.city : null
  );

  const submission = db
    .prepare(`
      SELECT *
      FROM submissions
      WHERE id = ?
    `)
    .get(result.lastInsertRowid);

 try {
  await notifyNewSubmission(submission);
} catch (error) {
  console.error(
    "Non-critical notification failed:",
    error.message
  );
}

res.status(201).json({
  message: "Submission received successfully",
  submission
});
});

module.exports = router;