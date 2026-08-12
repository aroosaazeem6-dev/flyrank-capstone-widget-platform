# Embeddable Widget & Lead-Capture Platform
## Stage 0 — Design Document

## 1. Problem

The system provides embeddable lead-capture widgets that customers can place on websites they own.

A widget is loaded from the backend through a small JavaScript embed snippet. Website visitors can submit lead information through the widget.

The backend must safely handle submissions coming from external origins while protecting the public API against malformed requests, excessive traffic, and spam.

The system must also enrich submissions with approximate location information using a geolocation provider fallback chain.

Non-critical operations such as email or webhook notifications must not cause an otherwise valid lead submission to fail.

---

## 2. Goals

The system will:

- Allow an authenticated widget owner to create and manage widgets.
- Keep widget and submission data isolated by tenant.
- Generate an embed snippet for each widget.
- Serve widget configuration through a public cached endpoint.
- Serve a versioned widget JavaScript bundle.
- Allow widgets to render on websites from different origins.
- Accept cross-origin lead submissions.
- Validate incoming submission data.
- Reject malformed and oversized requests with appropriate 4xx responses.
- Apply rate limiting to the public submission endpoint.
- Apply at least one spam-prevention mechanism.
- Enrich submissions with IP-based location data.
- Use a fallback geolocation provider if the primary provider fails.
- Store submissions even when all geolocation providers are unavailable.
- Ensure email/webhook side effects do not block successful submission storage.
- Provide authenticated dashboard APIs for submissions and basic statistics.
- Provide automated tests for the required failure and security scenarios.

---

## 3. Non-Goals

The following are explicitly outside the required scope:

- Building a full website builder or form-builder platform.
- Production hosting or deployment.
- A real CDN.
- A custom domain.
- A complex frontend dashboard.
- Multiple advanced widget types.

The customer site will be a simple local HTML page used to demonstrate that the widget works from a different origin.

---

## 4. Actors and Request Paths

The system has three main request paths.

### 4.1 Widget Owner

The authenticated widget owner manages widgets and views submissions.

Widget Owner
     |
     v
Authenticated API
     |
     v
Widget Management
     |
     v
Database

### 4.2 Customer Website

A customer website loads the widget using an embed script.

Customer Website
     |
     v
<script src=".../widget.js?id=123">
     |
     v
GET /api/widgets/:id/config
     |
     v
Render Widget

The configuration endpoint is public, cached, and supports CORS.

### 4.3 Website Visitor

A visitor submits a lead through the widget.

Website Visitor
     |
     v
POST /api/submissions
     |
     v
Validation
     |
     v
CORS / Rate Limit / Spam Check
     |
     v
Geo Enrichment
     |
     v
Store Submission
     |
     v
Email / Webhook Side Effect

A failure in a non-critical side effect must not cause the stored submission to fail.

---

## 5. Multi-Tenant Model

The platform is designed as a multi-tenant system.

A tenant represents a customer or organization using the platform.

Every widget belongs to one tenant.

Every submission belongs to one widget and therefore belongs to one tenant.

Tenant isolation must be enforced in backend queries and not only in the UI.

Example:

Tenant A
  |
  +-- Widget A1
  |      |
  |      +-- Submission A1
  |
  +-- Widget A2
         |
         +-- Submission A2


Tenant B
  |
  +-- Widget B1
         |
         +-- Submission B1

Tenant A must never be able to access Tenant B's widgets or submissions.

---

## 6. Database Model

### 6.1 Tenants

Stores customer organizations.

Fields:

- id
- name
- created_at

### 6.2 Widgets

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

Relationship:

Tenant 1 ---- * Widgets

Indexes:

- Primary key on id
- Index on tenant_id

### 6.3 Submissions

Stores lead submissions received through widgets.

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

Relationships:

Tenant 1 ---- * Submissions

Widget 1 ---- * Submissions

Indexes:

- Primary key on id
- Index on tenant_id
- Index on widget_id
- Index on created_at

Every submission must be linked to the correct tenant and widget.

---

## 7. Embed Flow

The widget is loaded through a one-line script.

Example:

<script src="http://localhost:3000/widget.js?id=123"></script>

The flow is:

1. Customer adds embed script.
2. widget.js loads.
3. Widget ID is read.
4. GET /api/widgets/:id/config is requested.
5. Widget configuration is returned.
6. Widget form is rendered.
7. Visitor submits a lead.
8. POST /api/submissions is sent.
9. Backend validates and protects the request.
10. Geo enrichment is attempted.
11. Submission is stored.
12. Optional email/webhook side effect runs.

The widget JavaScript will be versioned so that updated versions can be delivered using a new URL or cache-busting strategy.

---

## 8. API Contracts

### 8.1 Widget Management API

These endpoints are authenticated.

#### Create Widget

POST /api/widgets

Request:

{
  "name": "Contact Widget",
  "type": "lead-form"
}

Response:

{
  "id": 1,
  "name": "Contact Widget",
  "type": "lead-form"
}

#### List Widgets

GET /api/widgets

Returns widgets belonging only to the authenticated tenant.

#### Get Widget

GET /api/widgets/:id

Returns a widget only if it belongs to the authenticated tenant.

#### Update Widget

PUT /api/widgets/:id

Updates widget configuration belonging to the authenticated tenant.

#### Delete Widget

DELETE /api/widgets/:id

Deletes or disables a widget belonging to the authenticated tenant.

### 8.2 Public Widget Configuration

GET /api/widgets/:id/config

This endpoint is public.

It returns the small configuration required by the widget.

Requirements:

- CORS enabled
- Appropriate cache headers
- No sensitive tenant information
- Only public widget configuration returned

Example:

{
  "id": 1,
  "name": "Contact Widget",
  "type": "lead-form",
  "version": "1"
}

### 8.3 Public Submission API

POST /api/submissions

This endpoint is public and accepts cross-origin requests.

Example request:

{
  "widget_id": 1,
  "name": "Aroosa",
  "email": "user@example.com",
  "message": "I am interested in your service.",
  "website": ""
}

The website field may be used as a honeypot field.

Processing order:

Request
  |
  v
CORS
  |
  v
Payload size check
  |
  v
Input validation
  |
  v
Rate limiting
  |
  v
Spam check
  |
  v
Geo enrichment
  |
  v
Store submission
  |
  v
Non-critical side effects

Invalid requests must return appropriate 4xx responses rather than causing a 500 error.

Rate-limited requests return:

429 Too Many Requests

Successful submissions return a success response after the submission has been safely stored.

### 8.4 Dashboard API

The authenticated widget owner can view submissions and basic statistics.

#### List Submissions

GET /api/submissions

Returns submissions belonging only to the authenticated tenant.

#### Submission Statistics

GET /api/submissions/stats

Returns basic statistics such as:

- Total submissions
- Submissions per widget
- Submissions over time
- Geographic breakdown

---

## 9. CORS Design

The widget is expected to run on a website with a different origin from the backend.

Example:

Backend:
http://localhost:3000

Customer Website:
http://localhost:5500

The backend must explicitly allow the required cross-origin requests.

The submission endpoint must correctly handle browser preflight requests:

OPTIONS /api/submissions

Disallowed origins must not be given unrestricted access.

---

## 10. Validation Design

All public input will be validated before business logic processes it.

Validation will cover:

- Required fields
- Valid email format
- Supported widget ID
- String length limits
- Payload size
- Unexpected or invalid values

Invalid input will return a clear JSON error with a suitable 4xx status.

The server will never assume that data from the customer website is trustworthy.

---

## 11. Abuse Protection

The public submission endpoint will include:

### Rate Limiting

Requests will be limited per IP and/or widget.

When the threshold is exceeded:

429 Too Many Requests

The server must continue serving legitimate traffic.

### Spam Protection

A honeypot field will be used.

Example:

website

Normal users will leave this field empty.

If the field is populated, the request will be treated as spam and rejected.

---

## 12. Geo Enrichment

The system will enrich submissions using the visitor's IP address.

The provider strategy is:

Provider A
    |
    | failure
    v
Provider B
    |
    | failure
    v
Store submission without geo information

The important requirement is graceful degradation.

If the primary provider fails, the fallback provider is attempted.

If all providers fail, the submission is still stored successfully.

Geo enrichment must never become a single point of failure for lead capture.

---

## 13. Safe Side Effects

After the submission is stored, the system may perform a secondary action such as:

- Confirmation email
- Webhook
- Notification

The side effect is non-critical.

Therefore:

Submission Storage = Main Operation
Email/Webhook = Secondary Operation

If the email or webhook fails:

Submission remains successful.

The failure should be logged for troubleshooting.

For development, email may be represented by a console log or a local mail catcher.

---

## 14. Caching and Versioned Assets

The widget JavaScript will be served as a versioned asset.

Example:

/widget.v1.js
/widget.v2.js

When the widget changes, a new version can be served.

The public widget configuration endpoint will use appropriate cache headers.

The purpose is to avoid serving stale widget code while keeping widget delivery lightweight.

---

## 15. Architecture

                         ┌─────────────────────┐
                         │    Widget Owner     │
                         │    Authenticated    │
                         └──────────┬──────────┘
                                    |
                                    v
                         ┌─────────────────────┐
                         │ Widget Management   │
                         │       API           │
                         └──────────┬──────────┘
                                    |
                                    v
                         ┌─────────────────────┐
                         │     Database        │
                         │                     │
                         │ Tenants             │
                         │ Widgets             │
                         │ Submissions         │
                         └─────────────────────┘


┌─────────────────────┐
│ Customer Website    │
│ Different Origin    │
└──────────┬──────────┘
           |
           | <script src="widget.js?id=123">
           v
┌─────────────────────┐
│ Public Widget API   │
│ GET /widgets/:id/   │
│ config              │
└──────────┬──────────┘
           |
           v
     Render Widget
           |
           v
┌─────────────────────┐
│ Website Visitor     │
│ Submits Lead        │
└──────────┬──────────┘
           |
           v
┌─────────────────────┐
│ POST /submissions   │
└──────────┬──────────┘
           |
           v
┌─────────────────────┐
│ Validation          │
│ CORS                │
│ Rate Limiting       │
│ Spam Protection     │
└──────────┬──────────┘
           |
           v
┌─────────────────────┐
│ Geo Enrichment      │
│ Provider A → B      │
└──────────┬──────────┘
           |
           v
┌─────────────────────┐
│ Store Submission    │
└──────────┬──────────┘
           |
           v
┌─────────────────────┐
│ Email / Webhook     │
│ Non-critical        │
└─────────────────────┘

---

## 16. Stage 0 Gate

Stage 0 is complete when the following design decisions are documented:

- Widget model defined
- Submission model defined
- Tenant isolation defined
- Database indexes identified
- Embed flow documented
- Widget management API defined
- Public configuration API defined
- Public submission API defined
- Dashboard API defined
- CORS behavior defined
- Validation behavior defined
- Rate limiting strategy defined
- Spam prevention strategy defined
- Geo fallback strategy defined
- Safe side-effect behavior defined
- One explicit non-goal documented

Stage 0 will be considered ready for the next phase when the design document is complete and reviewed.