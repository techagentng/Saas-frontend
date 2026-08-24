# FRONTEND EPIC 01

## Foundation & Tenant Experience

### Agent-Ready Master Context Specification

---

# 1. Purpose

This document is the authoritative context-preservation specification for the frontend of the multi-tenant booking SaaS.

It covers:

> **Frontend Epic 01 — Foundation & Tenant Experience**

This document should be provided to any planning or implementation agent working on the Next.js frontend.

The actual frontend repository remains authoritative for implementation details.

Agents must inspect the existing application before making changes.

Do not blindly restructure existing working pages.

---

# 2. Product Architecture

The platform has three major user experiences.

```text
                         Go Backend API
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼

        Tenant Admin      Customer Web     Platform Admin
          Next.js           Next.js          Next.js
              │               │               │
      BUSINESS_OWNER       CUSTOMER       SUPER_ADMIN
           STAFF
```

A future React Native application may provide an enhanced customer mobile experience.

The customer web experience remains important because customers should be able to book without installing an app.

---

# 3. Frontend Technology

Current frontend stack:

```text
Next.js
React
TypeScript
```

The implementation agent must inspect the repository to determine:

* exact Next.js version
* App Router vs Pages Router
* package manager
* styling solution
* existing component library
* linting configuration
* testing tools
* existing landing page structure
* existing listing page structure
* current TypeScript configuration

Do not assume dependencies that are not installed.

---

# 4. Existing Frontend Work

The application already contains:

```text
Main Product Landing Page
Existing Listing Page
```

These pages are considered existing work.

Agents must inspect and preserve their:

* visual language
* route behavior
* reusable components
* design tokens
* typography
* spacing
* responsive patterns

Do not rewrite them merely to make the new architecture look more consistent.

Where useful, extract reusable primitives without changing the visual result unnecessarily.

---

# 5. Backend Foundation Already Available

The frontend can rely on completed backend capabilities from:

```text
Epic 01 — Identity & Access
Epic 02 F1 — Tenant Core Model & Persistence
Epic 02 F2 — Tenant Creation & Owner Provisioning
Epic 02 F3 — Tenant Retrieval & Listing
Epic 02 F4 — Tenant Profile Management
Epic 02 F5 — Tenant Slug & Public Identity
```

The frontend must consume backend contracts rather than duplicate their business rules.

---

# 6. Available Tenant Backend Flows

Current backend capabilities include approximately:

```text
POST  /api/v1/tenants

GET   /api/v1/tenants

GET   /api/v1/tenants/{tenantID}

PATCH /api/v1/tenants/{tenantID}

GET   /api/v1/public/tenants/{slug}
```

Inspect the actual backend API contract before wiring frontend calls.

Do not invent endpoints.

---

# 7. Tenant Creation

An authenticated user may create a tenant.

Conceptually:

```text
Authenticated User
        ↓
Create Tenant
        ↓
Tenant
+
ACTIVE Membership
+
BUSINESS_OWNER
```

The frontend does not assign the owner or role.

Backend owns those decisions.

---

# 8. Tenant Listing

The backend supports listing tenants accessible to the authenticated user.

This enables frontend behavior:

```text
0 tenants
→ onboarding

1 tenant
→ possible automatic selection

2+ tenants
→ tenant selector
```

Frontend tenant selection is UX state.

It is NOT authorization.

The backend remains authoritative for every tenant-scoped request.

---

# 9. Tenant Profile

Authorized users can update approved business-profile fields.

Current profile fields include:

```text
Name
Description
Contact Email
Contact Phone
Timezone
```

Protected fields include:

```text
Tenant ID
Slug
Status
CreatedAt
UpdatedAt
Roles
Permissions
Owner
```

The frontend must not present protected fields as ordinary profile-edit controls.

---

# 10. Public Tenant Identity

The backend supports public tenant resolution by canonical slug.

Public tenant response exposes only approved public fields such as:

```text
slug
name
description
timezone
```

The public endpoint does not expose:

```text
Tenant UUID
roles
permissions
private contact details
status
timestamps
billing
settings
```

Frontend public pages must respect this boundary.

---

# 11. Slug Contract

Tenant slugs are canonical public identifiers.

Current backend contract:

```text
^[a-z0-9]+(-[a-z0-9]+)*$
```

with approximately:

```text
minimum length: 3
maximum length: 63
```

Backend rejects non-canonical slug input rather than silently normalizing it.

Therefore the frontend may help the user generate a canonical slug, but backend validation remains authoritative.

Example UX:

```text
Business Name:
Acme Beauty Studio

Suggested Slug:
acme-beauty-studio
```

---

# 12. Frontend Security Principle

Frontend guards are primarily:

> **UX controls**

They are not the security boundary.

The backend remains responsible for:

```text
Authentication
Tenant Membership
Tenant Isolation
Permissions
Authorization
```

Never assume hiding a button protects an API operation.

---

# 13. Authentication vs Tenant Context vs Permission

Keep these separate.

## Authentication

Question:

> Is the user logged in?

Example:

```text
/dashboard/*
→ authentication required
```

---

## Tenant Context

Question:

> Which business workspace is currently selected?

Example:

```text
currentTenant
```

This controls which tenant data the frontend requests.

---

## Permission

Question:

> Can this user perform this action?

Example:

```text
tenant.update
```

Do not collapse all three concepts into a single giant guard.

---

# 14. Avoid Role-Based UI Logic

Avoid widespread logic such as:

```ts
if (role === "BUSINESS_OWNER") {
  ...
}
```

Prefer capability-based UI:

```text
tenant.read
tenant.update
user.read
user.create
role.read
...
```

according to actual backend permissions.

The role determines backend capabilities.

Frontend components should primarily ask:

```text
Can the current user perform X?
```

---

# 15. Frontend Module Architecture

Organize frontend business functionality by domain.

Preferred conceptual structure:

```text
src/
│
├── app/
│
├── modules/
│   ├── auth/
│   ├── tenant/
│   ├── booking/
│   ├── staff/
│   ├── services/
│   ├── customers/
│   └── ...
│
├── components/
│   └── ui/
│
├── providers/
│
├── hooks/
│
├── lib/
│
├── config/
│
└── types/
```

Adapt to the existing repository.

Do not reorganize working code without a concrete benefit.

---

# 16. Feature vs Shared Code

Domain-specific components belong with their feature.

Example:

```text
modules/tenant/components/tenant-selector.tsx
```

Generic reusable UI belongs in:

```text
components/ui/
```

Avoid turning `components/` into an unstructured dumping ground.

---

# 17. State Management Principle

Separate:

```text
Server State
```

from:

```text
Client/UI State
```

Server state should generally be handled through TanStack React Query when introduced.

Examples:

```text
tenant list
tenant profile
public tenant
```

Client state may include:

```text
sidebar open state
current tenant selection
local UI preferences
```

Do not put API data into a global client store unnecessarily.

---

# 18. React Query

Frontend Epic 01 will establish TanStack React Query.

Use it for:

```text
queries
mutations
cache invalidation
loading states
server errors
```

Do not manually maintain duplicated API caches in contexts.

---

# 19. API Errors

Backend failures use stable machine-readable error codes.

Frontend logic must use:

```text
error.code
```

not:

```text
error.message.includes(...)
```

Examples include:

```text
INVALID_CREDENTIALS
VALIDATION_FAILED
PERMISSION_DENIED
TENANT_ACCESS_DENIED
TENANT_SLUG_INVALID
TENANT_SLUG_TAKEN
TENANT_NOT_FOUND
INTERNAL_ERROR
```

Do not hard-code every possible future code into one enormous switch.

---

# 20. Route Architecture

The frontend should eventually support distinct application areas approximately like:

```text
(public)
(auth)
(dashboard)
(platform)
(booking)
```

Possible conceptual routes:

```text
/
 /login
 /register

 /dashboard
 /dashboard/settings/profile

 /admin

 /book/[tenantSlug]
```

Use actual Next.js routing conventions found in the repository.

---

# 21. Dashboard Architecture

The dashboard should be modular.

Conceptually:

```text
Dashboard Shell
├── Sidebar
├── Header
├── Tenant Selector
├── User Menu
└── Main Content
```

Individual feature pages live inside this shell.

Do not duplicate dashboard navigation/layout on every page.

---

# 22. TenantProvider

Frontend Epic 01 will introduce tenant workspace state conceptually like:

```text
TenantProvider
├── tenants
├── currentTenant
├── setCurrentTenant
├── loading
└── clearTenant
```

Tenant data should ultimately come from backend queries.

Do not hard-code production tenants.

---

# 23. Permission Capability Layer

Frontend Epic 01 will introduce capability helpers conceptually like:

```ts
can("tenant.update")
```

and/or:

```tsx
<Can permission="tenant.update">
  ...
</Can>
```

These are UX helpers only.

The backend must still authorize requests.

---

# 24. Navigation

Dashboard navigation should be configuration-driven.

Conceptually:

```ts
{
  label: "Settings",
  href: "/dashboard/settings",
  permission: "tenant.update"
}
```

Avoid dozens of inline permission checks scattered across sidebar JSX.

---

# 25. Customer Web Strategy

Customer-facing booking should not be mobile-app-only.

The web experience allows customers to:

```text
Open booking URL
↓
View business
↓
Select services
↓
Choose appointment
↓
Book
```

without installing an app.

A React Native application can come later for richer repeat-customer functionality.

---

# 26. Public Tenant Page

Feature 5 backend supports a future route conceptually like:

```text
/book/[tenantSlug]
```

This page can resolve:

```text
GET /api/v1/public/tenants/{slug}
```

Before booking APIs exist, do not fabricate permanent booking data.

---

# 27. Platform Admin

SUPER_ADMIN UI should use a separate application shell.

Conceptually:

```text
/admin
```

instead of mixing platform administration directly with tenant-owner navigation.

Both may remain inside the same Next.js application.

---

# 28. Frontend Epic 01 Features

Frontend Epic 01 is divided into:

```text
F1  Frontend Application Foundation

F2  API Client & Structured Error Infrastructure

F3  React Query Infrastructure

F4  Authentication UI & Session State

F5  Authenticated Route Protection

F6  Tenant Data Module

F7  TenantProvider & Active Tenant Context

F8  Tenant Onboarding Flow

F9  Dashboard Shell

F10 Sidebar & Navigation Architecture

F11 Permission & Capability System

F12 Tenant Selector

F13 Tenant Dashboard Overview

F14 Tenant Profile Management UI

F15 Public Tenant Page

F16 Public Not-Found / Unavailable Experience

F17 Super Admin Shell

F18 Frontend Security & Error UX Hardening
```

---

# 29. F1 — Frontend Application Foundation

Establish:

```text
App Router/layout architecture
Folder/module conventions
Shared provider composition point
Reusable UI boundaries
Environment configuration
Global loading/error boundaries
Base responsive application structure
```

No business API integration.

---

# 30. F2 — API Client & Structured Errors

Establish:

```text
central API client
backend base URL
credentials handling
JSON serialization
typed responses
AbortSignal support
ApiError representation
structured error-code parsing
```

---

# 31. F3 — React Query Infrastructure

Establish:

```text
QueryClient
Query provider
query-key conventions
retry defaults
cache conventions
mutation conventions
```

---

# 32. F4 — Authentication UI & Session State

Implement:

```text
Login
Logout
Authenticated user state
Auth loading
Session revalidation
Auth errors
```

Use the actual backend authentication contract.

---

# 33. F5 — Authenticated Route Protection

Protect dashboard routes.

Expected:

```text
Unauthenticated
→ login

Authenticated
→ dashboard
```

Do not mix tenant selection into this guard.

---

# 34. F6 — Tenant Data Module

Implement frontend access to:

```text
List tenants
Get tenant
Create tenant
Update tenant profile
```

using backend contracts.

---

# 35. F7 — TenantProvider

Implement active tenant workspace state.

---

# 36. F8 — Tenant Onboarding

Implement:

```text
No tenant
↓
Create business
↓
Refresh tenant list
↓
Select tenant
↓
Dashboard
```

---

# 37. F9 — Dashboard Shell

Implement reusable responsive dashboard layout.

---

# 38. F10 — Sidebar & Navigation

Implement configuration-driven navigation.

---

# 39. F11 — Permissions

Implement permission/capability UX.

---

# 40. F12 — Tenant Selector

Implement switching between accessible tenant workspaces.

---

# 41. F13 — Dashboard Overview

Implement the first tenant dashboard home.

Do not fabricate metrics whose backend APIs do not exist.

---

# 42. F14 — Tenant Profile UI

Implement tenant business-profile editing using backend Feature 4.

---

# 43. F15 — Public Tenant Page

Implement the first customer-facing business page using public slug lookup.

---

# 44. F16 — Public Error Experience

Handle:

```text
invalid slug
missing tenant
disabled tenant
```

without leaking internal tenant state.

---

# 45. F17 — Super Admin Shell

Establish platform administration layout/access boundary.

Do not invent missing backend platform features.

---

# 46. F18 — Frontend Hardening

Consolidate:

```text
401 handling
403 UX
404 UX
409 UX
500 UX
retry states
stale tenant handling
global errors
loading states
```

---

# 47. Development Workflow

Each frontend feature follows:

```text
1. Provide this master MD

2. Agent inspects current frontend repository

3. Agent plans current feature

4. Plan is reviewed

5. Agent implements only approved feature

6. Run lint/tests/build

7. Review implementation

8. Accept feature

9. Move to next feature
```

If a strong model already has good repository context, planning and implementation may be combined with explicit boundaries.

---

# 48. Testing Expectations

Every feature should use the testing tools already established in the frontend repository.

Potential testing levels:

```text
unit
component
integration
route/navigation
API mocking
end-to-end
```

Do not introduce five testing frameworks unnecessarily.

Test behavior and security-sensitive UX, not implementation trivia.

---

# 49. Quality Requirements

Frontend code should favor:

```text
strict TypeScript
clear module boundaries
accessible controls
responsive layouts
minimal unnecessary client components
reusable UI primitives
predictable loading/error states
```

Avoid:

```text
any everywhere
giant contexts
giant page components
role checks everywhere
duplicated fetch wrappers
business logic in UI primitives
```

---

# 50. Existing Pages Must Be Protected

Do not unnecessarily rewrite:

```text
Landing Page
Existing Listing Page
```

Changes to them must be justified by the current feature.

---

# 51. Backend Is Authoritative

The frontend must not duplicate security/business guarantees such as:

```text
tenant membership
role assignment
slug uniqueness
cross-tenant isolation
tenant.update authorization
```

Frontend validation improves UX.

Backend validation/security remains final.

---

# 52. Strict Epic Non-Goals

Frontend Epic 01 does NOT automatically implement:

```text
Bookings management
Services management
Staff scheduling
Customer management
Payments
Subscriptions
Billing
Advanced reports
Notifications
Custom domains
Full tenant branding
React Native app
```

Those become later frontend epics/features as backend capabilities exist.

---

# 53. Definition of Done

Frontend Epic 01 is complete when a business user can move through:

```text
Landing Page
↓
Login
↓
Authenticated Application
↓
Tenant Discovery
↓
Tenant Creation if needed
↓
Tenant Selection
↓
Dashboard
↓
Profile Management
```

and a public visitor can reach:

```text
/book/[tenantSlug]
↓
Public Tenant Identity
```

while permissions, errors, tenancy, and protected routes remain cleanly separated.

---

# 54. Context Restoration

If this document is used after context loss:

1. Inspect the frontend repository.
2. Preserve existing landing/listing pages.
3. Determine which Frontend Epic 01 features are complete.
4. Do not reimplement completed features.
5. Continue from the next incomplete feature.
6. Backend contracts remain authoritative.
7. Do not invent missing backend APIs.
8. Maintain module boundaries.
9. Maintain Auth vs Tenant vs Permission separation.

---

# FINAL PRINCIPLE

The frontend architecture should make this progression natural:

```text
Authentication
↓
Tenant Discovery
↓
Tenant Selection
↓
Permission-Aware Dashboard
↓
Business Features
```

without turning the application into a collection of role-specific pages or one giant global state container.
