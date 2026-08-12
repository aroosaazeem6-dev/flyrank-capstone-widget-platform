const db = require("./database");

const TENANT_B_API_KEY = "tenant-b-api-key-67890";

// Create Tenant B
let tenantB = db
  .prepare("SELECT id FROM tenants WHERE name = ?")
  .get("Tenant B");

if (!tenantB) {
  const result = db
    .prepare(`
      INSERT INTO tenants (name, api_key)
      VALUES (?, ?)
    `)
    .run("Tenant B", TENANT_B_API_KEY);

  tenantB = {
    id: Number(result.lastInsertRowid)
  };

  console.log(`Created Tenant B with ID: ${tenantB.id}`);
} else {
  console.log(`Tenant B already exists with ID: ${tenantB.id}`);

  db.prepare(`
    UPDATE tenants
    SET api_key = ?
    WHERE id = ?
  `).run(TENANT_B_API_KEY, tenantB.id);
}

// Create Tenant B widget
const existingWidget = db
  .prepare(`
    SELECT id
    FROM widgets
    WHERE tenant_id = ?
      AND name = ?
  `)
  .get(tenantB.id, "Tenant B Widget");

if (!existingWidget) {
  const result = db
    .prepare(`
      INSERT INTO widgets
        (tenant_id, name, type, status, version)
      VALUES
        (?, ?, ?, ?, ?)
    `)
    .run(
      tenantB.id,
      "Tenant B Widget",
      "lead-form",
      "active",
      1
    );

  console.log(`Created Tenant B Widget with ID: ${result.lastInsertRowid}`);
} else {
  console.log(`Tenant B Widget already exists with ID: ${existingWidget.id}`);
}

console.log("Tenant isolation test data ready.");
console.log(`Tenant B API Key: ${TENANT_B_API_KEY}`);