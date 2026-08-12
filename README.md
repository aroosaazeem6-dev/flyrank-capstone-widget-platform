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

<img width="559" height="105" alt="CAP delition of widget" src="https://github.com/user-attachments/assets/f5ad5544-4a14-4000-901d-a3ba9e42785d" />


<img width="558" height="161" alt="CAP Verificatio of delition" src="https://github.com/user-attachments/assets/098ca015-dd55-4356-a9e9-8d340f637a4e" />


---
# Stage 2 — Hardened Submission Path

## 2.1 Overview

Stage 2 implements the hardened public submission path for the FlyRank Embeddable Widget & Lead-Capture Platform.

The goal of this stage is to make the public submission API safe for requests coming from the internet and from customer websites hosted on different origins.

The implemented submission flow includes:

- Public lead submission
- Payload validation
- Payload-size protection
- CORS support
- Honest HTTP status codes
- Rate limiting
- Honeypot spam protection
- IP-based geo-enrichment
- Geo Provider A
- Geo Provider B fallback
- Graceful geo-enrichment failure
- Database persistence
- Safe non-critical side effects
- Failure handling and testing

The final hardened flow is:

Customer Website
        |
        v
POST /api/submissions
        |
        v
CORS
        |
        v
Payload Size Check
        |
        v
Payload Validation
        |
        v
Rate Limiting
        |
        v
Honeypot Spam Protection
        |
        v
Widget Validation
        |
        v
Geo Provider A
        |
        | Failure
        v
Geo Provider B
        |
        | Both Fail
        v
Continue Without Geo
        |
        v
Store Submission
        |
        v
Non-Critical Side Effect
        |
        v
Return 201 Created

---

## 2.2 Public Submission Endpoint

The public submission endpoint was implemented as:

POST /api/submissions

The endpoint accepts lead information from a public/customer-facing widget.

The basic submission fields are:

- widget_id
- name
- email
- message
- website

The `website` field is used as the honeypot spam-protection field.

A successful submission is stored in the database and returns HTTP 201.

Example successful response:

{
  "message": "Submission received successfully",
  "submission": {
    "id": 1,
    "tenant_id": 1,
    "widget_id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "message": "Stage 2 test submission"
  }
}

---

## 2.3 Payload Validation

The public endpoint validates incoming request data before storing a submission.

### widget_id validation

`widget_id` must:

- Exist in the request
- Be numeric
- Be a positive integer

Invalid widget IDs return:

HTTP 400 Bad Request

Example:

{
  "error": "widget_id must be a positive integer"
}

### name validation

`name` must:

- Be provided
- Be a string
- Not be empty

Invalid names return HTTP 400.

### email validation

`email` must:

- Be provided
- Be a string
- Not be empty
- Match the expected email format

Invalid email example:

{
  "error": "email must be valid"
}

### message validation

`message` is optional.

If provided, it must be a string.

Invalid message types return HTTP 400.

### Input cleaning

The implementation trims:

- Name
- Email
- Message

before storing the values.

---

<img width="563" height="168" alt="CAP2 invalid email test" src="https://github.com/user-attachments/assets/8e6116b1-dfe8-4fd6-a68f-034ae314121b" />

<img width="568" height="166" alt="CAP2 missing field test" src="https://github.com/user-attachments/assets/be5333cf-46bd-4df3-ab47-d817567edd96" />

---

## 2.4 Widget Validation

Before storing a submission, the API checks that the referenced widget exists.

The widget is retrieved using its ID.

If the widget does not exist, the API returns:

HTTP 404 Not Found

Example:

{
  "error": "Widget not found"
}

The API also checks the widget status.

Only active widgets can receive submissions.

If a widget is not active, the API returns:

HTTP 400 Bad Request

Example:

{
  "error": "Widget is not active"
}

---
<img width="563" height="168" alt="CAP Tenant A tries to access b" src="https://github.com/user-attachments/assets/cdf30ccb-7a9c-4666-abdd-146e0ce087fd" />



---

## 2.5 Payload Size Protection

The Express JSON parser was configured with a maximum request-body size of:

10 KB

Configuration:

app.use(express.json({ limit: "10kb" }));

This protects the public API against excessively large JSON payloads.

When a request exceeds the configured limit, the API returns:

HTTP 413 Payload Too Large

Example:

{
  "error": "Payload too large"
}

This prevents unnecessarily large request bodies from reaching the submission processing logic.

---

<img width="613" height="341" alt="CAP2 PAYLOAD TOO LARGE" src="https://github.com/user-attachments/assets/660222e1-e8dd-4bb3-9e1c-f782d557953c" />

---

## 2.6 CORS

Cross-Origin Resource Sharing (CORS) was configured because the embeddable widget will eventually run on customer websites that are different origins from the backend API.

The API supports:

- GET
- POST
- PUT
- DELETE
- OPTIONS

Allowed request headers include:

- Content-Type
- Authorization

The implementation also handles browser preflight requests.

Example test origin:

http://localhost:5500

A successful preflight request returned:

HTTP 204 No Content

with:

Access-Control-Allow-Origin: http://localhost:5500

---

<img width="633" height="290" alt="cap2 cors preflight" src="https://github.com/user-attachments/assets/584be876-0dca-4750-a576-b04576509671" />


---

## 2.7 Cross-Origin Submission

After configuring CORS, an actual POST request was tested with a different origin.

The test used:

Origin: http://localhost:5500

The API successfully accepted the cross-origin submission and returned:

HTTP 201 Created

This confirms that the public submission endpoint can receive requests originating from another website.

---

<img width="635" height="362" alt="CAP 2 CROSS ORIGIN SUBMISSION" src="https://github.com/user-attachments/assets/a7bd6ef1-fce9-4867-a351-d12c8450b9e2" />


## 2.8 Honest HTTP Status Codes

The public submission API uses status codes according to the outcome of the request.

| Status | Meaning |
|---|---|
| 201 | Submission successfully stored |
| 400 | Invalid request or validation failure |
| 404 | Widget not found |
| 413 | Request payload too large |
| 429 | Too many requests |
| 500 | Unexpected server error |

This makes the API behavior predictable for clients and the embeddable widget.

---

## 2.9 JSON Error Handling

A global Express error handler was added so that important API errors return JSON instead of Express's default HTML error pages.

### Payload too large

HTTP 413:

{
  "error": "Payload too large"
}

### Invalid JSON

HTTP 400:

{
  "error": "Invalid JSON payload"
}

### Unexpected server error

HTTP 500:

{
  "error": "Internal server error"
}

This keeps API responses consistent.

---

## 2.10 Rate Limiting

Rate limiting was implemented using:

express-rate-limit

The submission endpoint uses:

- Window: 60 seconds
- Maximum: 10 requests
- Key: client IP

Configuration:

windowMs: 60 * 1000
max: 10

Normal requests are accepted.

Once the limit is exceeded, the API returns:

HTTP 429 Too Many Requests

Example:

{
  "error": "Too many submission attempts. Please try again later."
}

This prevents a single client from sending an unlimited number of submissions.

---

<img width="618" height="318" alt="CAP 2 rate limit" src="https://github.com/user-attachments/assets/897e8f47-e32f-4048-af1f-a04442c0dd32" />

---

## 2.11 Honeypot Spam Protection

A honeypot field was added to the public submission payload:

website

The field is intended to remain empty for legitimate users.

If the field contains a value, the submission is treated as spam.

Example:

{
  "website": "https://spam.example.com"
}

The API responds with:

HTTP 400 Bad Request

{
  "error": "Spam submission detected"
}

The spam submission is not stored as a legitimate lead.

---

<img width="628" height="158" alt="CAP2 honeypot spam" src="https://github.com/user-attachments/assets/fd27300f-17e3-4193-b96b-52718c349f8a" />


## 2.12 Geo-Enrichment

The submission API performs IP-based geo-enrichment.

The purpose is to attach approximate geographic information to a submission.

The stored geo fields are:

- country
- city

The visitor IP address is also stored.

The system was designed so that geo-enrichment is not allowed to prevent a valid lead from being stored.

---

## 2.13 Geo Provider A

The primary geo-enrichment provider is:

IPWHOIS

The endpoint was tested using a public IP address.

Example test IP:

8.8.8.8

The provider successfully returned geographic information including country and city.

The application extracts:

- country
- city

and stores these values with the submission when available.
---
<img width="623" height="371" alt="CAP 2 geo provideor" src="https://github.com/user-attachments/assets/0a6f9ac2-d4ba-4e0f-b1a1-e4bea732395a" />

---



## 2.14 Geo Provider B

A second geo provider was implemented as a fallback.

Provider B is used only when Provider A fails.

The purpose of this design is to avoid depending on a single external geo-enrichment service.

The fallback flow is:

Provider A
    |
    | Success
    v
Return geo data

Provider A
    |
    | Failure
    v
Provider B
    |
    | Success
    v
Return geo data

Provider A
    |
    | Failure
    v
Provider B
    |
    | Failure
    v
Continue without geo data

---

<img width="618" height="227" alt="CAP2 geo providor" src="https://github.com/user-attachments/assets/31856d2b-1139-46e0-a51c-c8088a4440da" />


---

## 2.15 Provider A → Provider B Fallback

The fallback mechanism was explicitly tested by temporarily causing Provider A to fail.

The application then attempted Provider B.

The test demonstrated:

Provider A failed
        ↓
Provider B executed
        ↓
Geo data returned

This confirms that Provider B is a real fallback rather than simply another unused integration.

After testing, Provider A was restored to its correct production endpoint.

---
<img width="579" height="100" alt="CAP 2 Provider fallback" src="https://github.com/user-attachments/assets/5f547f91-0dff-48ed-8851-2f6edd0948ef" />


---

## 2.16 Graceful Geo Failure

If both geo providers fail, the submission must not fail.

Instead:

country = null
city = null

The lead is still stored in the database.

The expected behavior is:

Geo Provider A fails
        ↓
Geo Provider B fails
        ↓
Geo data unavailable
        ↓
Submission continues
        ↓
Lead stored successfully

This prevents an external geo service outage from causing lead loss.

---

## 2.17 Database Persistence

After validation and geo-enrichment, the submission is stored in the `submissions` table.

The stored information includes:

- tenant_id
- widget_id
- name
- email
- message
- ip_address
- country
- city
- created_at

The tenant ID is taken from the widget ownership information rather than trusted directly from the public request.

This ensures the submission remains associated with the correct tenant.

---

## 2.18 Safe Non-Critical Side Effect

A non-critical notification side effect was implemented.

For this capstone implementation, the side effect is represented by console logging rather than requiring an external email service.

After a successful database insertion, the system attempts to execute the notification.

Example:

New lead notification:
{
  submissionId: ...,
  widgetId: ...,
  name: "...",
  email: "..."
}

The side effect is intentionally non-critical.

---
<img width="517" height="103" alt="CAP 2 safe side effect failure2" src="https://github.com/user-attachments/assets/25383397-4bdc-40b6-9524-bf586071200c" />



---

## 2.19 Side-Effect Failure Handling

The side effect was deliberately forced to fail during testing.

The application produced an error similar to:

Non-critical notification failed:
Simulated notification service failure

However, the lead submission still returned:

HTTP 201 Created

The lead remained stored in the database.

Therefore:

Side effect failure
        ↓
Does NOT cancel submission
        ↓
Lead remains stored
        ↓
API returns 201

This demonstrates that a non-critical external operation cannot cause successful lead capture to fail.

---
<img width="608" height="235" alt="CAP2 safe side effect failure1" src="https://github.com/user-attachments/assets/6953dcfb-b909-4509-a9a1-b42ab1a74b94" />



---

## 2.20 Complete End-to-End Submission Flow

The complete hardened submission flow is now:

1. Customer website sends a submission.
2. CORS permits the cross-origin request.
3. Express checks the request-body size.
4. Rate limiting checks the client IP.
5. Honeypot protection checks for spam.
6. Payload validation verifies the request.
7. Widget existence and status are verified.
8. Visitor IP is obtained.
9. Geo Provider A is attempted.
10. Provider B is used if Provider A fails.
11. Geo failure does not prevent lead storage.
12. Submission is stored in SQLite.
13. Non-critical notification is attempted.
14. Notification failure does not invalidate the submission.
15. API returns the appropriate HTTP response.

---

## 2.21 Stage 2 Testing Summary

The following scenarios were tested during Stage 2:

| Test | Expected Result | Status |
|---|---|---|
| Valid submission | 201 Created | ✅ Passed |
| Invalid email | 400 Bad Request | ✅ Passed |
| Missing required field | 400 Bad Request | ✅ Passed |
| Unknown widget | 404 Not Found | ✅ Passed |
| Oversized payload | 413 Payload Too Large | ✅ Passed |
| CORS preflight | 204 No Content | ✅ Passed |
| Cross-origin submission | 201 Created | ✅ Passed |
| Rate limit exceeded | 429 Too Many Requests | ✅ Passed |
| Honeypot populated | 400 Spam response | ✅ Passed |
| Geo Provider A | Country/city returned | ✅ Passed |
| Geo Provider B | Country/city returned | ✅ Passed |
| Provider A failure → Provider B | Fallback successful | ✅ Passed |
| Geo providers unavailable | Submission continues | ✅ Implemented |
| Side effect success | Notification executed | ✅ Passed |
| Side effect failure | Submission still succeeds | ✅ Passed |

---

## 2.22 Stage 2 Completion

Stage 2 — Hardened Submission Path is complete.

Completed functionality:

- Public submission endpoint
- Payload validation
- Payload-size protection
- CORS
- Honest HTTP status codes
- JSON error handling
- Rate limiting
- Honeypot spam protection
- Geo Provider A
- Geo Provider B fallback
- Graceful geo failure
- Database persistence
- Safe non-critical side effect
- Side-effect failure handling
- End-to-end testing

The public submission path is now hardened against common malformed-request, abuse, cross-origin, spam, external-service, and non-critical side-effect failure scenarios.

---


# Stage 2 Result

Stage 2 establishes a hardened public lead-capture API that can safely accept submissions from external customer websites while applying validation, abuse protection, cross-origin support, geographic enrichment, graceful external-service failure handling, persistent storage, and safe non-critical side effects.

# License

This project was created as part of the FlyRank Backend Internship Capstone.
