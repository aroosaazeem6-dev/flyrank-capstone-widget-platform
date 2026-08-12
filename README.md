# Embeddable Widget & Lead-Capture Platform

A backend-focused embeddable widget and lead-capture platform built as part of the FlyRank Backend Internship Capstone.

The platform allows a customer to create a widget, generate an embeddable script, place it on a website from a different origin, and safely receive lead submissions through a hardened public API.

The system is designed around public-internet backend concerns including authentication, tenant isolation, CORS, validation, rate limiting, spam protection, caching, geo-enrichment, fallback handling, and safe side effects.

---

# Project Status

| Stage |
|---|---|
| Stage 0 — Design 
| Stage 1 — Project Foundation & Widget Management 
| Stage 2 — Hardened Submission Path 
| Stage 3 — Delivery, Dashboard & Testing 
| Stage 4 — Demo Preparation 

---

# Technology Stack

- Node.js
- Express.js
- SQLite
- better-sqlite3
- JavaScript
- Git
- GitHub
- CORS
- dotenv


# Stage 0 — Design

## 0.1 Objective

Stage 0 focused on designing the architecture and defining the core system before implementation.

The design follows the capstone requirements for:

- Widget model
- Submission model
- Multi-tenancy
- Database indexes
- Embed flow
- API contracts
- CORS
- Validation
- Abuse protection
- Geo-enrichment
- Safe side effects
- Explicit non-goals

The official capstone defines Phase 1 around the widget/submission model, tenancy and indexes, the snippet → config → render → submit flow, API contracts, and one explicit non-goal.

---

## 0.2 Problem

The platform provides embeddable lead-capture widgets that customers can place on websites they own.

A widget is loaded through a JavaScript embed snippet. Website visitors can submit lead information through the widget.

The backend must safely handle requests coming from external origins while protecting the public API against malformed requests, excessive traffic, and spam.

The system will also enrich submissions with approximate location information and use a fallback provider if the primary provider fails.

Non-critical operations such as email or webhook notifications must not cause a valid lead submission to fail.

---

## 0.3 Goals

The system is designed to:

- Allow an authenticated widget owner to create and manage widgets.
- Keep widget and submission data isolated by tenant.
- Generate an embed snippet for each widget.
- Serve widget configuration through a public endpoint.
- Serve a versioned widget JavaScript bundle.
- Allow widgets to render on websites from different origins.
- Accept cross-origin lead submissions.
- Validate incoming submission data.
- Reject malformed and oversized requests.
- Apply rate limiting.
- Apply spam protection.
- Enrich submissions with IP-based location data.
- Use a fallback geolocation provider.
- Store submissions even when geo-enrichment fails.
- Ensure non-critical side effects do not block successful submissions.
- Provide dashboard APIs.
- Provide automated tests for security and failure scenarios.

---

## 0.4 Non-Goals

The following are outside the required scope:

- Building a complete website builder.
- Production hosting.
- A real CDN.
- A custom production domain.
- A complex frontend dashboard.
- Multiple advanced widget systems.

The customer website will be a simple local HTML page served from a different origin.

---

## 0.5 Multi-Tenant Model

The system uses a multi-tenant architecture.

Each customer organization is represented by a tenant.

Each widget belongs to exactly one tenant.

Each submission belongs to a widget and tenant.

Tenant isolation is enforced in backend queries.

Example:

Tenant A
- Widget A1
  - Submission A1
- Widget A2
  - Submission A2

Tenant B
- Widget B1
  - Submission B1

Tenant A must never be able to access Tenant B's widgets or submissions.

---

## 0.6 Database Design

### Tenants

Stores customer organizations.

Fields:

- id
- name
- api_key
- created_at

### Widgets

Stores widget configuration and ownership.

Fields:

- id
- tenant_id
- name
- type
- status
- version
- created_at
- updated_at

### Submissions

Stores lead submissions.

Fields:

- id
- tenant_id
- widget_id
- name
- email
- message
- ip_address
- country
- city
- created_at

Indexes were planned for:

- widget tenant ownership
- submission tenant ownership
- submission widget ownership
- submission creation time

---

## 0.7 Embed Flow

The planned widget flow is:

Customer Website
        |
        v
Embed Script
        |
        v
Widget JavaScript
        |
        v
Widget Configuration API
        |
        v
Render Widget
        |
        v
Visitor submits lead
        |
        v
Public Submission API
        |
        v
Validation / Security
        |
        v
Geo Enrichment
        |
        v
Database
        |
        v
Optional Email / Webhook

---

## 0.8 API Contracts

### Widget Management

POST   /api/widgets
GET    /api/widgets
GET    /api/widgets/:id
PUT    /api/widgets/:id
DELETE /api/widgets/:id

These endpoints require authentication.

### Public Widget Configuration

GET /api/widgets/:id/config

This endpoint will provide only the public configuration required by the widget.

### Public Submission

POST /api/submissions

This endpoint will accept cross-origin lead submissions.

### Dashboard

GET /api/submissions
GET /api/submissions/stats

These endpoints will be authenticated and tenant-isolated.

---

## 0.9 Security Design

The design includes:

- API-key authentication
- Tenant isolation
- CORS
- Input validation
- Rate limiting
- Honeypot spam protection
- Payload-size limits
- Safe error responses
- Geo fallback
- Non-blocking side effects

---

# Stage 1 — Project Foundation & Widget Management

## 1.1 Objective

Stage 1 converted the Stage 0 design into a working backend foundation.

The following were implemented:

- Node.js project
- Express server
- SQLite database
- Database schema
- Demo tenant
- Demo widget
- API-key authentication
- Protected API endpoint
- Widget CRUD
- Tenant isolation
- Delete verification

The official capstone requires an authenticated widget management API with tenant-isolated CRUD and honest status codes.

---

## 1.2 Project Setup

The project was initialized with:

- Node.js
- Express
- CORS
- dotenv
- better-sqlite3
- Nodemon

Package scripts:

npm start
npm run dev

The development server runs on:

http://localhost:3000

Health endpoint:

GET /health

Expected response:

{
  "status": "ok"
}

---

## 1.3 SQLite Database

SQLite was selected for the initial implementation.

Database file:

database.sqlite

The database is excluded from Git through .gitignore.

The database contains:

tenants
widgets
submissions

Foreign keys are enabled.

The required tenant/widget/submission indexes were created.

---

## 1.4 Authentication

A simple API-key authentication mechanism was implemented.

Protected requests use:

Authorization: Bearer <API_KEY>

Example demo API key:

demo-tenant-api-key-12345

The authentication middleware:

1. Reads the Authorization header.
2. Verifies the Bearer format.
3. Extracts the API key.
4. Finds the corresponding tenant.
5. Attaches the tenant to the request.
6. Rejects invalid credentials with HTTP 401.

---

## 1.5 Authentication Test

The protected endpoint is:

GET /api/me

Without an API key:

401 Unauthorized

Expected response:

{
  "error": "Authentication required"
}

With a valid API key:

{
  "message": "Authentication successful",
  "tenant": {
    "id": 1,
    "name": "Demo Tenant"
  }
}

<img width="659" height="149" alt="CAP Authentiction sussfull" src="https://github.com/user-attachments/assets/61a5685a-11a0-4ef8-bb1c-6bd3d0284992" />



## 1.6 Widget Management API

Authenticated widget management was implemented.

Available endpoints:

POST   /api/widgets
GET    /api/widgets
GET    /api/widgets/:id
PUT    /api/widgets/:id
DELETE /api/widgets/:id

Every query uses the authenticated tenant ID.

This prevents one tenant from accessing another tenant's widgets.

---

## 1.7 Create Widget

A widget can be created using:

POST /api/widgets

Example request:

{
  "name": "Contact Widget",
  "type": "lead-form"
}

The backend automatically associates the widget with the authenticated tenant.

<img width="758" height="242" alt="CAP creation widgets" src="https://github.com/user-attachments/assets/f44f0948-9c53-4639-aaa9-6edbcb401c7a" />


---

## 1.8 List Widgets

Widgets can be retrieved using:

GET /api/widgets

Only widgets belonging to the authenticated tenant are returned.

<img width="741" height="367" alt="CAP Listing widjets" src="https://github.com/user-attachments/assets/1e06767b-e1e8-46a1-8e6f-60bcce8ccce3" />


---

## 1.9 Get Widget

A specific widget can be retrieved using:

GET /api/widgets/:id

The backend checks both:

widget_id
tenant_id

Therefore, a tenant cannot retrieve another tenant's widget.

<img width="561" height="185" alt="CAP get widget test" src="https://github.com/user-attachments/assets/9d46a36b-8b69-45fe-a0ea-1dd00dd6c659" />


---

## 1.10 Update Widget

A widget can be updated using:

PUT /api/widgets/:id

Example request:

{
  "name": "Updated Lead Widget",
  "type": "lead-form",
  "status": "active"
}

The widget version is incremented when updated.

<img width="576" height="204" alt="CAP Update widget test" src="https://github.com/user-attachments/assets/5685d76b-3df8-4165-b89d-a06653618697" />


---

## 1.11 Tenant Isolation

A second tenant was created to verify tenant isolation.

Tenant A:

API Key:
demo-tenant-api-key-12345

Tenant B:

API Key:
tenant-b-api-key-67890

Tenant B owns its own widget.

Tenant B can successfully retrieve its own widget.

Tenant A attempting to retrieve Tenant B's widget receives:

404 Widget not found

This demonstrates that the backend does not expose another tenant's widget.

The important implementation pattern is:

WHERE id = ?
AND tenant_id = ?

Tenant isolation is enforced at the database-query level rather than relying only on the UI.

---

## 1.12 Tenant B — Own Widget Access

Tenant B successfully accessed its own widget.

<img width="561" height="170" alt="CAP Tenant B accesses its own widget" src="https://github.com/user-attachments/assets/b072722f-2801-415c-9ca5-f227ea17ec0c" />

---

## 1.13 Tenant A — Blocked Access to Tenant B

Tenant A attempted to access Tenant B's widget.

Result:

{
  "error": "Widget not found"
}

HTTP status:

404 Not Found

This proves tenant isolation.

<img width="563" height="168" alt="CAP Tenant A tries to access b" src="https://github.com/user-attachments/assets/66d92ef1-4055-4635-b9ea-96d771ec3f67" />

---

## 1.14 Delete Widget

A widget can be deleted using:

DELETE /api/widgets/:id

The delete operation is also tenant-isolated.

A tenant can delete only its own widget.

After deletion, requesting the same widget returns:

{
  "error": "Widget not found"
}

<img width="558" height="161" alt="CAP Verificatio of delition" src="https://github.com/user-attachments/assets/098ca015-dd55-4356-a9e9-8d340f637a4e" />


---


# License

This project was created as part of the FlyRank Backend Internship Capstone.
