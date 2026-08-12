const db = require("../db/database");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const apiKey = authHeader.substring(7).trim();

  if (!apiKey) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const tenant = db
    .prepare(`
      SELECT id, name
      FROM tenants
      WHERE api_key = ?
    `)
    .get(apiKey);

  if (!tenant) {
    return res.status(401).json({
      error: "Invalid API key"
    });
  }

  // Attach authenticated tenant to the request
  req.tenant = tenant;

  next();
}

module.exports = authenticate;