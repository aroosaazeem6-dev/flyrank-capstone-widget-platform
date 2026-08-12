const db = require("./database");

try {
  db.prepare(`
    ALTER TABLE tenants
    ADD COLUMN api_key TEXT
  `).run();

  console.log("Added api_key column to tenants table.");
} catch (error) {
  if (error.message.includes("duplicate column name")) {
    console.log("api_key column already exists.");
  } else {
    throw error;
  }
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_api_key
  ON tenants(api_key);
`);

console.log("Tenant API key migration completed.");