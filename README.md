# Job Portal Backend API

A backend API for a Job Portal application built with Node.js, Express, TypeScript, PostgreSQL, and Prisma.

The project follows a modular backend architecture and currently includes secure user authentication with JWT access tokens, refresh-token rotation, logout, and refresh-token reuse detection.

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
Route → Controller → Service → Repository / Prisma → PostgreSQL
```

## Authentication

The authentication system currently supports:

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

### Access Token

Access tokens are JWTs containing user authentication information such as:

```json
{
  "userId": 1,
  "role": "CANDIDATE"
}
```

Access tokens expire after **15 minutes**.

### Refresh Token

Refresh tokens are generated using cryptographically secure random bytes.

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

The old token record is preserved and marked as revoked instead of being deleted.

The revocation and creation of the new refresh token are performed inside a Prisma transaction so both database operations succeed or fail together.

## Refresh Token Reuse Detection

Refresh tokens created from the same login session share a common `familyId`.

```text
Token A ─┐
Token B ─┼── familyId
Token C ─┘
```

When a token is successfully rotated, it is stored with:

```text
revokedReason = ROTATED
```

If an already-rotated token is presented again, the backend treats it as possible token reuse and revokes any active refresh tokens belonging to the same token family.

Revocation reasons currently include:

```text
ROTATED
LOGOUT
REUSE_DETECTED
```

This allows the backend to distinguish normal token rotation from logout and suspicious token reuse.

## Database Models

The Prisma schema currently contains the following main models:

- `User`
- `Job`
- `Application`
- `RefreshToken`

A user can have multiple refresh-token records, allowing separate login sessions to be tracked independently.

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

Authenticates the user and returns:

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

```json
{
  "refreshToken": "..."
}
```

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
- Access tokens are short-lived.
- Refresh tokens can be revoked server-side.
- Refresh tokens are rotated after successful use.
- Token-family tracking enables refresh-token reuse detection.
- Sensitive configuration is stored using environment variables.
