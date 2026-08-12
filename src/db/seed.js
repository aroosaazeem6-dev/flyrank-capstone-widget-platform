const db = require("./database");

// Check whether a demo tenant already exists
const existingTenant = db
  .prepare("SELECT id FROM tenants WHERE name = ?")
  .get("Demo Tenant");

let tenantId;

if (existingTenant) {
  tenantId = existingTenant.id;
  console.log(`Demo tenant already exists with ID: ${tenantId}`);
} else {
  const tenantResult = db
    .prepare("INSERT INTO tenants (name) VALUES (?)")
    .run("Demo Tenant");

  tenantId = tenantResult.lastInsertRowid;

  console.log(`Created Demo Tenant with ID: ${tenantId}`);
}

// Check whether a demo widget already exists
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