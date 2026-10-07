# Ann Htike Restaurant Management

Ann Htike is a full-stack restaurant management MVP for a single restaurant. It combines staff access control, a central product catalog, dine-in and takeaway ordering, expense tracking, private file attachments, and financial reporting in one responsive web application.

The project is an npm monorepo built with NestJS, React, PostgreSQL, Prisma, and AWS S3.

## MVP features

### Authentication and staff access

- Email and password login with JWT access tokens.
- Rotating refresh tokens stored in an HTTP-only cookie.
- Logout and automatic session recovery when an access token expires.
- Active-session validation when the Overview page loads.
- Profile editing for the signed-in user's name and password.
- Hierarchical roles: `SUPERADMIN`, `ADMIN`, `OWNER`, `MANAGER`, `CASHIER`, `CHEF`, and `WAITER`.
- Managers may manage only users below their own role.
- User accounts are deactivated rather than physically deleted.

### User management

Managers can create, view, update, filter, and deactivate staff accounts. The user list supports:

- Name or email search
- Role filtering
- Status filtering
- Pagination

Credential hashes and refresh-token data are never included in user responses.

### Central product catalog

The restaurant uses one catalog and one price set across the business.

- Product categories
- Products with optional codes, descriptions, status, and display order
- User-defined variants such as Regular, Small, Medium, or Large
- A separate price for every variant
- Reusable add-ons shared by multiple products
- Product-specific add-on quantity limits and display order
- Optional private product image stored in S3
- Soft deactivation for catalog records

Every active product must have at least one active variant. Catalog updates are saved as aggregate operations so product details, variants, and add-on assignments remain consistent.

### Restaurant tables

- Create and manage dining tables with an optional capacity.
- View tables as available, occupied, or inactive.
- Prevent more than one open order from occupying the same table.
- Prevent an occupied table from being deactivated.
- Allow all staff to view table availability; management actions are manager-only.

### Orders and POS workflow

Orders support both restaurant service modes:

- `DINE_IN` orders require an active, available table.
- `TAKEAWAY` orders do not use a table.

The POS workflow includes:

- Product and variant selection from the active menu
- Add-on selection with quantity limits
- Item quantity editing and cart management
- Fixed-amount or percentage order discounts
- Configurable tax percentage, defaulting to 0%
- Server-calculated subtotal, discount, tax, and total
- Open, completed, and cancelled order states
- Table transfer and conversion between dine-in and takeaway while an order is open
- Product, variant, add-on, and price snapshots for historical accuracy

Completed and cancelled orders are immutable. Order numbers are displayed with at least five digits, for example `#00042`.

### Expense tracking

- Record a title, description, category, amount, and expense date.
- Search and filter by category, status, date range, and other supported fields.
- Attach up to five private images or PDF documents.
- Void an expense with an audit reason instead of deleting financial history.
- Preserve creator, updater, and voiding audit information.

### Private file storage

The browser uploads file bytes directly to a private S3 bucket using short-lived, backend-issued presigned POST data. Clients never choose arbitrary object keys or submit permanent public URLs.

Objects use identifiable environment-aware keys such as:

```text
development/expenses/{fileId}/receipt.pdf
development/products/{fileId}/product-image.webp
production/expenses/{fileId}/invoice.jpg
```

Downloads use short-lived signed URLs. Upload ownership, purpose, size, MIME type, extension, metadata, and file signature are verified before a file can be attached.

### Financial reports

Managers can view a financial report for a restaurant-local date range. It includes:

- Gross sales
- Discounts
- Net sales, excluding collected tax
- Collected tax and final collected total
- Active expenses
- Profit or loss and profit margin
- Completed-order count and average order value
- Daily sales, expense, profit, and order trends
- Expense totals by category
- Dine-in versus takeaway performance
- Top-selling products by quantity and gross item sales

Only completed orders contribute to income, and voided expenses are excluded. The current profit calculation is:

```text
profit = completed-order net sales - active expenses
```

This is an operational MVP report, not a complete accounting statement. It does not yet include inventory consumption or cost of goods sold.

### Restaurant timezone

The API uses one configured IANA timezone for business-day boundaries and reporting. Timestamp values are stored as PostgreSQL `TIMESTAMPTZ` instants and returned as ISO-8601 UTC strings. Calendar-only expense dates remain PostgreSQL `DATE` values and do not shift with the browser timezone.

The public `GET /api/config` endpoint exposes the configured timezone so the frontend can format timestamps consistently.

## Permissions

| Capability | Managers | Cashier / Waiter | Chef |
| --- | --- | --- | --- |
| Manage users | Yes, subject to role hierarchy | No | No |
| Manage catalog and add-ons | Yes | No | No |
| View the active menu | Yes | Yes | Yes |
| Manage expenses and reports | Yes | No | No |
| Manage dining tables | Yes | No | No |
| View tables | Yes | Yes | Yes |
| Create and change open orders | Yes | Yes | No |
| Complete or cancel orders | Yes | Yes | No |
| View orders | Yes | Yes | Yes |
| Edit own profile | Yes | Yes | Yes |

“Managers” means `SUPERADMIN`, `ADMIN`, `OWNER`, and `MANAGER`. Frontend route visibility is only a convenience; authorization is also enforced by the API.

## Technology

### Backend

- NestJS 12
- Prisma 7 with PostgreSQL
- JWT and bcrypt authentication
- Zod request and environment validation
- AWS SDK for private S3 storage
- `date-fns` and `date-fns-tz` for business-time calculations

### Frontend

- React 19 and Vite
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- React Hook Form and Zod
- Recharts

### Workspace

```text
apps/
  api/       NestJS API, Prisma schema, migrations, and seed
  web/       React application
packages/
  shared/    Shared API contracts and domain types
```

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`
- npm `11.18.0`
- PostgreSQL
- A private AWS S3 bucket

## Local setup

Install all workspace dependencies from the repository root:

```bash
npm ci
```

This also generates the ignored Prisma client through the API workspace's post-install step.

Create local environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Configure the API environment, then apply the committed database migration:

```bash
cd apps/api
npx prisma migrate dev --config prisma7.config.ts
cd ../..
```

Seed the initial superadmin:

```bash
npm run seed
```

The seed creates or updates a superadmin only when `SUPERADMIN_NAME`, `SUPERADMIN_EMAIL`, and `SUPERADMIN_PASSWORD` are configured.

Start both applications from the repository root:

```bash
npm run dev
```

- Web application: [http://localhost:3000](http://localhost:3000)
- API base URL: [http://localhost:3001/api](http://localhost:3001/api)

## Environment configuration

Use the checked-in `.env.example` files as the source of truth. The main API variables are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL |
| `PORT` | API port; defaults to `3001` |
| `FRONTEND_URL` | Allowed frontend CORS origin |
| `RESTAURANT_TIME_ZONE` | Required IANA timezone, such as `Asia/Yangon` |
| `JWT_SECRET` | JWT signing secret |
| `JWT_TOKEN_AUDIENCE` | Expected JWT audience |
| `JWT_TOKEN_ISSUER` | Expected JWT issuer |
| `JWT_ACCESS_TOKEN_TTL` | Access-token lifetime in seconds |
| `JWT_REFRESH_TOKEN_TTL` | Refresh-token lifetime in seconds |
| `JWT_ADMIN_REFRESH_TOKEN_TTL` | Manager refresh-token lifetime in seconds |
| `AWS_REGION` | S3 bucket region |
| `AWS_S3_BUCKET` | Private S3 bucket name |
| `AWS_ACCESS_KEY_ID` | Optional explicit AWS credential |
| `AWS_SECRET_ACCESS_KEY` | Optional explicit AWS credential |
| `SUPERADMIN_NAME` | Seeded superadmin name |
| `SUPERADMIN_EMAIL` | Seeded superadmin email |
| `SUPERADMIN_PASSWORD` | Seeded superadmin password |

AWS access key and secret must either both be supplied or both be omitted. When omitted, the AWS SDK default credential chain is used, which supports workload roles in hosted environments.

The web application requires:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API origin, normally `http://localhost:3001` |
| `VITE_ENCRYPTION_KEY` | Local client persistence key |

## S3 CORS for local development

Direct browser uploads require the bucket to allow the frontend origin. A minimal development configuration is:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Use the deployed frontend's exact HTTPS origin in production. Keep the bucket private and grant the API only the S3 permissions it needs.

## Useful commands

Run these commands from the repository root unless noted otherwise:

```bash
npm run dev          # Start API and web development servers
npm run dev:api      # Start only the NestJS API
npm run dev:web      # Start only the React application
npm run build        # Build all workspaces
npm run lint         # Lint API and web workspaces
npm test             # Run workspace tests
npm run seed         # Seed the initial superadmin
```

Prisma validation and deployment commands run from `apps/api`:

```bash
npx prisma validate --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
```

Use `migrate dev` for local schema development and `migrate deploy` to apply committed migrations in a deployment environment.

## API conventions

- API routes are prefixed with `/api`.
- Successful responses use the standard envelope `{ "success": true, "data": ... }`.
- Validation and application errors use a consistent error envelope.
- Money values cross the API boundary as decimal strings to avoid floating-point loss.
- Authentication uses a bearer access token and a credentialed HTTP-only refresh cookie.
- Financial and historical records use lifecycle transitions rather than physical deletion.

Key route groups include:

```text
/api/auth
/api/users
/api/product-categories
/api/products
/api/addons
/api/tables
/api/orders
/api/expenses
/api/reports
/api/config
```

## Current MVP scope

This release intentionally focuses on day-to-day operation for one restaurant. It does not yet include:

- Multiple restaurants, branches, or tenant isolation
- Payments, refunds, split bills, receipts, or cash-register reconciliation
- Customers, reservations, delivery management, or floor plans
- Inventory, recipes, ingredient consumption, or cost of goods sold
- Kitchen ticket states beyond read-only order access for chefs
- Tax filing or formal accounting workflows
- Report export, prior-period comparisons, or staff-performance reporting
- Malware scanning, OCR, image transformation, or CDN delivery

Catalog and user records are generally deactivated, expenses are voided with an audit trail, and terminal orders remain immutable so operational history is preserved.
