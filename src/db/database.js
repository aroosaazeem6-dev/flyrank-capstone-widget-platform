const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../../database.sqlite");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
      REFERENCES tenants(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL,
    widget_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT,
    ip_address TEXT,
    country TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id)
      REFERENCES tenants(id)
      ON DELETE CASCADE,

    FOREIGN KEY (widget_id)
      REFERENCES widgets(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_widgets_tenant_id
    ON widgets(tenant_id);

  CREATE INDEX IF NOT EXISTS idx_submissions_tenant_id
    ON submissions(tenant_id);

  CREATE INDEX IF NOT EXISTS idx_submissions_widget_id
    ON submissions(widget_id);

  CREATE INDEX IF NOT EXISTS idx_submissions_created_at
    ON submissions(created_at);
`);

module.exports = db;