# Job Portal Backend API

A backend API for a Job Portal application built with Node.js, Express, TypeScript, PostgreSQL, and Prisma.

The project follows a modular backend architecture and currently includes secure JWT-based authentication, refresh-token rotation and reuse detection, role-based access control (RBAC), and resource-level authorization.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod
- bcrypt
- JSON Web Token (JWT)
- Node.js Crypto

## Project Structure

```text
src/
├── config/
├── controllers/
├── middleware/
├── repositories/
├── routes/
├── services/
├── types/
├── utils/
├── validators/
├── app.ts
└── server.ts

prisma/
├── migrations/
└── schema.prisma
```

The backend follows the general flow:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository / Prisma
  ↓
PostgreSQL
```

## Authentication and Authorization

The authentication and authorization system currently supports:

- User registration
- Request validation using Zod
- Password hashing using bcrypt
- User login
- Short-lived JWT access tokens
- Long-lived refresh tokens
- Secure refresh-token hash storage
- Refresh-token expiration
- Refresh-token rotation
- Logout and token revocation
- Refresh-token family tracking
- Refresh-token reuse detection
- JWT authentication middleware
- Role-based access control (RBAC)
- Recruiter and candidate route authorization
- Resource ownership authorization for recruiter-owned jobs

## Access Token

Access tokens are JWTs containing authenticated user information such as:

```json
{
  "userId": 1,
  "role": "CANDIDATE"
}
```

Access tokens expire after **15 minutes**.

The access token is sent to protected APIs using the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

The authentication middleware verifies the JWT and makes authenticated user information available through:

```ts
req.user = {
  userId,
  role,
};
```

## Refresh Token

Refresh tokens are generated using cryptographically secure random bytes:

```ts
crypto.randomBytes(32).toString("hex");
```

The raw refresh token is returned to the client, while only its SHA-256 hash is stored in PostgreSQL.

```text
Raw Refresh Token
        ↓
     SHA-256
        ↓
Stored Token Hash
```

Refresh tokens expire after **7 days**.

Storing only the refresh-token hash reduces the impact of a database leak because the raw long-lived token is not stored directly.

## Refresh Token Rotation

A refresh token is rotated whenever it is successfully used.

```text
Login
  ↓
Token A

Refresh using A
  ↓
A → revoked
B → active

Refresh using B
  ↓
B → revoked
C → active
```

The old refresh-token record is preserved and marked as revoked instead of being deleted.

The revocation of the old refresh token and creation of the new refresh token are performed inside a Prisma transaction so both database operations succeed or fail together.

## Refresh Token Reuse Detection

Refresh tokens created from the same login session share a common `familyId`.

```text
Token A ─┐
Token B ─┼── same familyId
Token C ─┘
```

When a refresh token is successfully rotated, the previous token is stored with:

```text
revokedReason = ROTATED
```

If an already-rotated token is presented again, the backend treats it as possible refresh-token reuse.

Active refresh tokens belonging to the same token family are then revoked.

Current revocation reasons include:

```text
ROTATED
LOGOUT
REUSE_DETECTED
```

This allows the backend to distinguish between:

- Normal refresh-token rotation
- User logout
- Suspicious refresh-token reuse

## Authentication Middleware

Protected routes use reusable authentication middleware.

The middleware performs the following checks:

```text
Incoming Request
      ↓
Read Authorization header
      ↓
Validate Bearer token format
      ↓
Extract JWT access token
      ↓
Verify JWT
      ↓
Validate userId and role
      ↓
Attach authenticated user to req.user
      ↓
next()
```

If authentication fails, the request receives:

```text
401 Unauthorized
```

The authenticated request context contains:

```ts
req.user = {
  userId: number,
  role: Role,
};
```

The Express `Request` type is extended using TypeScript declaration merging so `req.user` is recognized throughout the application.

## Role-Based Access Control

The application currently supports two roles:

```text
RECRUITER
CANDIDATE
```

Role-based access control determines whether an authenticated user's role is allowed to access a particular operation.

The general flow is:

```text
Request
   ↓
Authentication
   ↓
JWT verified
   ↓
req.user
   ↓
RBAC middleware
   ↓
Role allowed?
   ├── No  → 403 Forbidden
   └── Yes → Continue
```

Reusable RBAC middleware accepts one or more allowed roles.

Conceptually:

```ts
authorizeRoles(Role.RECRUITER);
```

or:

```ts
authorizeRoles(Role.RECRUITER, Role.CANDIDATE);
```

The middleware checks whether:

```ts
allowedRoles.includes(req.user.role);
```

An unauthenticated request receives:

```text
401 Unauthorized
```

An authenticated user whose role is not permitted receives:

```text
403 Forbidden
```

## Resource-Level Authorization

RBAC alone is not enough for resources owned by individual users.

For example, two users may both have the `RECRUITER` role, but one recruiter must not be able to modify another recruiter's job.

The `Job` model contains:

```prisma
recruiterId Int
```

which identifies the recruiter who owns the job.

For recruiter-owned jobs, the backend verifies:

```text
job.recruiterId === req.user.userId
```

Example:

```text
Job recruiterId = 5

Logged-in recruiter userId = 5
→ Authorized

Logged-in recruiter userId = 7
→ Forbidden
```

The full authorization flow for modifying a recruiter-owned job is:

```text
Request
   ↓
Authenticate user
   ↓
JWT valid?
   ├── No → 401
   └── Yes
         ↓
Check RECRUITER role
         ↓
Role allowed?
   ├── No → 403
   └── Yes
         ↓
Validate jobId
         ↓
Load Job from PostgreSQL
         ↓
Job exists?
   ├── No → 404
   └── Yes
         ↓
Compare job.recruiterId
with req.user.userId
         ↓
Owner?
   ├── No → 403
   └── Yes → Continue
```

This prevents recruiters from modifying jobs they do not own.

## HTTP Status Codes

The backend distinguishes different failure cases using appropriate HTTP status codes:

```text
400 Bad Request
→ Invalid request data or invalid resource ID

401 Unauthorized
→ Authentication is missing or invalid

403 Forbidden
→ User is authenticated but not allowed to perform the action

404 Not Found
→ Requested resource does not exist
```

## Database Models

The Prisma schema currently contains the following main models:

- `User`
- `Job`
- `Application`
- `RefreshToken`

A user can have multiple refresh-token records, allowing separate login sessions to be tracked independently.

A recruiter can own multiple jobs.

Refresh-token families are used to track token rotation chains for individual login sessions.

## Authentication Endpoints

### Register

```http
POST /register
```

Creates a new user after validating the request and hashing the password.

### Login

```http
POST /login
```

Authenticates the user and returns an access token and refresh token.

Example response:

```json
{
  "message": "Login successful",
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Refresh Token

```http
POST /refresh
```

Accepts a valid refresh token and returns a new access token and refresh token.

Example request:

```json
{
  "refreshToken": "..."
}
```

### Logout

```http
POST /logout
```

Revokes the supplied refresh token.

Example request:

```json
{
  "refreshToken": "..."
}
```

## Authorization Architecture

Authentication, role authorization, and resource authorization are handled as separate concerns.

```text
Authentication
"Who are you?"
      ↓
JWT verification


RBAC Authorization
"What is your role allowed to do?"
      ↓
RECRUITER / CANDIDATE


Resource Authorization
"Can you perform this operation
on this specific resource?"
      ↓
Ownership check
```

This separation keeps authorization logic reusable and easier to maintain.

## Environment Variables

Create a `.env` file in the project root.

Example configuration is available in `.env.example`.

```env
PORT=

DATABASE_URL=

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
```

Sensitive environment configuration should not be committed to source control.

## Setup

Install dependencies:

```bash
npm install
```

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

## Security Considerations

- Passwords are stored as bcrypt hashes.
- Refresh tokens are never stored in raw form in the database.
- Refresh-token hashes are generated using SHA-256.
- Access tokens are short-lived.
- Refresh tokens can be revoked server-side.
- Refresh tokens are rotated after successful use.
- Token-family tracking enables refresh-token reuse detection.
- Logout explicitly revokes the supplied refresh token.
- Protected routes require valid JWT authentication.
- JWT payloads are validated before authenticated user information is trusted.
- RBAC restricts functionality based on the authenticated user's role.
- Resource-level authorization prevents recruiters from modifying jobs they do not own.
- Authentication and authorization are handled as separate concerns.
- Sensitive configuration is stored using environment variables.
