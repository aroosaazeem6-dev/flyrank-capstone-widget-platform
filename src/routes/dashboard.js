const express = require("express");
const authenticate = require("../middleware/auth");
const db = require("../db/database");

const router = express.Router();

// ----------------------------------------
// Get submissions for authenticated tenant
// ----------------------------------------

router.get("/submissions", authenticate, (req, res) => {
  const page = Math.max(
    Number.parseInt(req.query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(req.query.limit, 10) || 20,
      1
    ),
    100
  );

  const offset = (page - 1) * limit;

  const totalResult = db
    .prepare(`
      SELECT COUNT(*) AS total
      FROM submissions s
      INNER JOIN widgets w
        ON s.widget_id = w.id
      WHERE w.tenant_id = ?
    `)
    .get(req.tenant.id);

  const total = totalResult.total;

  const submissions = db
    .prepare(`
      SELECT
        s.id,
        s.widget_id,
        w.name AS widget_name,
        s.name,
        s.email,
        s.message,
        s.ip_address,
        s.country,
        s.city,
        s.created_at
      FROM submissions s
      INNER JOIN widgets w
        ON s.widget_id = w.id
      WHERE w.tenant_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `)
    .all(
      req.tenant.id,
      limit,
      offset
    );

  res.json({
    data: submissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// ----------------------------------------
// Dashboard statistics
// ----------------------------------------

router.get("/stats", authenticate, (req, res) => {

  // ----------------------------------------
  // Total submissions
  // ----------------------------------------

  const totalResult = db
    .prepare(`
      SELECT COUNT(*) AS total
      FROM submissions s
      INNER JOIN widgets w
        ON s.widget_id = w.id
      WHERE w.tenant_id = ?
    `)
    .get(req.tenant.id);

  // ----------------------------------------
  // Submissions per widget
  // ----------------------------------------

  const byWidget = db
    .prepare(`
      SELECT
        w.id AS widget_id,
        w.name AS widget_name,
        COUNT(s.id) AS submission_count
      FROM widgets w
      LEFT JOIN submissions s
        ON s.widget_id = w.id
      WHERE w.tenant_id = ?
      GROUP BY w.id, w.name
      ORDER BY submission_count DESC
    `)
    .all(req.tenant.id);

  // ----------------------------------------
  // Submissions by country
  // ----------------------------------------

  const byCountry = db
    .prepare(`
      SELECT
        COALESCE(s.country, 'Unknown') AS country,
        COUNT(s.id) AS submission_count
      FROM submissions s
      INNER JOIN widgets w
        ON s.widget_id = w.id
      WHERE w.tenant_id = ?
      GROUP BY s.country
      ORDER BY submission_count DESC
    `)
    .all(req.tenant.id);

  // ----------------------------------------
  // Submissions by date
  // ----------------------------------------

  const overTime = db
    .prepare(`
      SELECT
        DATE(s.created_at) AS date,
        COUNT(s.id) AS submission_count
      FROM submissions s
      INNER JOIN widgets w
        ON s.widget_id = w.id
      WHERE w.tenant_id = ?
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `)
    .all(req.tenant.id);

  // ----------------------------------------
  // Return statistics
  // ----------------------------------------

  res.json({
    totalSubmissions: totalResult.total,

    byWidget,

    byCountry,

    overTime
  });
});

module.exports = router;