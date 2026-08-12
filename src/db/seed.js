const db = require("./database");

const DEMO_API_KEY = "demo-tenant-api-key-12345";

const existingTenant = db
  .prepare("SELECT id FROM tenants WHERE name = ?")
  .get("Demo Tenant");

let tenantId;

if (existingTenant) {
  tenantId = existingTenant.id;

  db.prepare(`
    UPDATE tenants
    SET api_key = ?
    WHERE id = ?
  `).run(DEMO_API_KEY, tenantId);

  console.log(`Demo tenant already exists with ID: ${tenantId}`);
} else {
  const tenantResult = db
    .prepare(`
      INSERT INTO tenants (name, api_key)
      VALUES (?, ?)
    `)
    .run("Demo Tenant", DEMO_API_KEY);

  tenantId = tenantResult.lastInsertRowid;

  console.log(`Created Demo Tenant with ID: ${tenantId}`);
}

const existingWidget = db
  .prepare(
    "SELECT id FROM widgets WHERE tenant_id = ? AND name = ?"
  )
  .get(tenantId, "Demo Lead Widget");

if (existingWidget) {
  console.log(`Demo widget already exists with ID: ${existingWidget.id}`);
} else {
  const widgetResult = db
    .prepare(`
      INSERT INTO widgets
        (tenant_id, name, type, status, version)
      VALUES
        (?, ?, ?, ?, ?)
    `)
    .run(
      tenantId,
      "Demo Lead Widget",
      "lead-form",
      "active",
      1
    );

  console.log(
    `Created Demo Lead Widget with ID: ${widgetResult.lastInsertRowid}`
  );
}

console.log("Database seeding completed.");
console.log(`Demo API Key: ${DEMO_API_KEY}`);