# API Documentation

This frontend integrates with a CRM API using JSON endpoints under `/api`.

## Base Configuration

- `VITE_CRM_API_URL` sets the API base URL
- `X-Tenant-Key` can be sent on public/bootstrap requests to select an initial company context
- login can authenticate users from any tenant by email/password
- Authenticated requests send `Authorization: Bearer <token>`
- authenticated requests are scoped by the tenant attached to the logged-in user/session

## Tenant / Company Security

Tenant equals company. Each company using the CRM should have its own tenant key, for example:

```text
sdc-main
company-b-main
company-c-main
```

After login, the backend returns the user's `tenant_key`. The frontend stores that tenant and uses it for requests. More importantly, the backend also stores the tenant in the session token, so authenticated requests are scoped by the logged-in user's tenant.

That means changing `X-Tenant-Key` manually in the browser is not enough to access another company's data. Once a bearer token is present, the backend uses the tenant from the session.

The same frontend can be used by users from different tenants. A user from `sdc-main` and a user from `company-b-main` can log in through the same frontend URL; after login, the session tenant determines which company data is visible.

`VITE_CRM_TENANT_KEY` is only the default initial tenant context before authentication, for example for public/bootstrap screens:

```bash
VITE_CRM_TENANT_KEY=sdc-main
```

Users created under that tenant should have:

```json
{
  "tenant_key": "sdc-main"
}
```

## Authentication

### `POST /api/auth/login`

Body:

```json
{ "email": "user@example.com", "password": "demo" }
```

Response:

```json
{ "token": "...", "user": { "...": "..." } }
```

## Bootstrap and Sync

### `GET /api/bootstrap`

Returns the initial CRM dataset:

- partners
- contacts
- tasks
- quotes
- operations
- interactions
- notifications
- history
- sales_events
- automations
- pipeline
- apiConnections

### `GET /api/users`

Returns the user list for the authenticated session.

### `GET /api/audit`

Returns audit trail entries.

### `GET /api/analytics/operations`

Returns operations analytics used by the bookings panel.

### `POST /api/automations/run`

## API Handoff for ABM / Management System Integration

The client can test synchronization after the database dump is restored and the backend is running.

Recommended test sequence:

1. Restore `salescrm.dump`.
2. Start the backend.
3. Log in through `POST /api/auth/login`.
4. Use the returned bearer token for API calls.
5. Create or update a Business Partner through `PUT /api/partners/{id}`.
6. Create or update a Quote through `PUT /api/quotes/{id}`.
7. Open the CRM frontend and confirm the records appear.

Tenant behavior:

- login identifies the user's tenant
- authenticated API writes are stored under that tenant
- the same frontend and API can be used by users from multiple tenant companies
- ABM synchronization should use a user/service account belonging to the target tenant

For field mapping, the external system sends CRM field names in the JSON payload. Example:

```json
{
  "company_name": "Example Company S.A.",
  "tax_id": "RUT-123456",
  "country": "Uruguay",
  "roles": ["customer"],
  "status": "active",
  "salesperson": "Maria Lopez"
}
```

In this example, the ABM field `RUT` maps to the CRM field `tax_id`.

Runs the automation engine and returns a summary of created records.

### `POST /api/integration/:connectionId/sync`

Runs a synchronization for a single integration connection.

### `GET /api/admin/export`

Exports CRM data for backup.

### `POST /api/admin/import`

Imports a CRM backup payload.

### `GET /api/pipeline`

Returns pipeline configuration and stages.

## External System Integration Quickstart

The CRM is ready to receive companies and quotes from the client's management system through the API.

The recommended matching strategy is:

- use the external system's stable company ID as the CRM partner `id`
- store the external tax/RUT value in `tax_id`
- create quotes with a stable external quote ID as the CRM quote `id`
- link each quote to the company through `partner_id`

Example field mapping:

| Client system field | CRM API field  |
| ------------------- | -------------- |
| Company ID          | `id`           |
| Company name        | `company_name` |
| RUT                 | `tax_id`       |
| Country             | `country`      |
| Salesperson         | `salesperson`  |
| Quote ID            | `id`           |
| Quote number        | `number`       |
| Quote company ID    | `partner_id`   |
| Quote amount        | `amount`       |
| Quote currency      | `currency`     |

### 1. Login and get a token

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@salescrm.app","password":"demo"}'
```

Use the returned `token` as `Authorization: Bearer <token>`.

### 2. Create or update a Company

Endpoint:

```text
PUT /api/partners/:id
```

Example:

```bash
curl -X PUT http://localhost:8000/api/partners/ext-company-1001 \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Key: uy-main" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ext-company-1001",
    "company_name": "Client Test Company S.A.",
    "roles": ["customer"],
    "status": "active",
    "salesperson": "Maria Lopez",
    "country": "Uruguay",
    "tax_id": "RUT-214567890012",
    "emails": ["billing@test-company.example"],
    "phones": ["+598 2400 0000"],
    "notes": "Created from external management system."
  }'
```

This will appear in the CRM under Business Partners. The `tax_id` field is displayed as Tax ID in the UI, so this is where the client's `RUT` should be sent.

### 3. Create or update a Quote linked to that Company

Endpoint:

```text
PUT /api/quotes/:id
```

Example:

```bash
curl -X PUT http://localhost:8000/api/quotes/ext-quote-9001 \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Key: uy-main" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ext-quote-9001",
    "number": "Q-EXT-9001",
    "partner_id": "ext-company-1001",
    "subject": "Ocean freight quotation",
    "status": "sent",
    "amount": 12500,
    "currency": "USD",
    "issue_date": "2026-06-04",
    "valid_until": "2026-06-30",
    "salesperson": "Maria Lopez",
    "notes": "Quote synchronized from external management system.",
    "lines": [
      {
        "description": "Montevideo to Miami ocean freight",
        "quantity": 1,
        "unit_price": 12500
      }
    ]
  }'
```

The quote will appear in the Quotes section and will be associated with the company through `partner_id`.

### 4. Verify the synchronized data

```bash
curl -H "Authorization: Bearer <token>" \
  -H "X-Tenant-Key: uy-main" \
  http://localhost:8000/api/bootstrap
```

Confirm:

- the company is present in `partners`
- the quote is present in `quotes`
- the quote `partner_id` matches the company `id`

## Resource Writes

The app saves records with RESTful resource calls:

- `PUT /api/partners/:id`
- `DELETE /api/partners/:id`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PUT /api/quotes/:id`
- `DELETE /api/quotes/:id`
- `PUT /api/operations/:id`
- `DELETE /api/operations/:id`
- `PUT /api/interactions/:id`
- `DELETE /api/interactions/:id`
- `PUT /api/notifications/:id`
- `DELETE /api/notifications/:id`
- `PUT /api/history/:id`
- `DELETE /api/history/:id`
- `PUT /api/sales_events/:id`
- `DELETE /api/sales_events/:id`
- `PUT /api/automations/:id`
- `DELETE /api/automations/:id`

## Notes

- All payloads are converted to snake_case before sending to the API.
- Empty optional fields are omitted from request bodies.
- The frontend falls back to local data when API reads fail.
