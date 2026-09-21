# Job Portal Backend API

Backend API for a Job Portal application built with Node.js, Express, TypeScript, PostgreSQL, Prisma, Redis, BullMQ, AWS S3, and Amazon SES.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ and ioredis
- AWS S3 and Amazon SES
- Zod
- bcrypt
- JSON Web Token (JWT)
- OpenAPI / Swagger UI

## Features

### Authentication and Authorization

- User registration and login
- JWT access tokens and refresh-token rotation
- Refresh-token reuse detection, logout, and token revocation
- Role-based access control for `RECRUITER` and `CANDIDATE`
- Resource ownership authorization

### Job Management

- Recruiters can create, update, close, and view their own jobs
- Candidates can view active jobs
- Jobs support `FULL_TIME`, `PART_TIME`, `CONTRACT`, and `INTERNSHIP` types
- Jobs support multiple normalized skills
- Active job listings support pagination, filtering, and case-insensitive search
- Database indexes support common job listing and lookup queries

### Applications

- Candidates can apply to active jobs
- Duplicate applications are prevented by a database-level unique constraint
- Closed jobs cannot receive new applications
- Recruiters can update the status of applications submitted to their own jobs
- Application status transitions follow controlled workflow rules
- Conditional atomic updates prevent stale concurrent status changes
- Resume metadata can be linked to an application with candidate ownership validation

Application status transitions:

```text
APPLIED
├── SHORTLISTED
│   ├── HIRED
│   └── REJECTED
└── REJECTED

HIRED and REJECTED are terminal states.
```

New applications start with `APPLIED` status. Recruiter status-update requests accept `SHORTLISTED`, `REJECTED`, or `HIRED`. Invalid transitions return HTTP `409 Conflict`.

### Resume Uploads

- Candidates can request temporary pre-signed S3 upload URLs
- PDF files are uploaded directly from the client to a private S3 bucket
- Upload URLs expire after 5 minutes
- Resume objects use server-generated S3 keys
- Resume metadata is stored in PostgreSQL and linked to applications
- Resume metadata validation includes PDF content type and a maximum declared file size of 5 MB
- S3 upload permissions are restricted to the required resume prefix

### Email Notifications

- Amazon SES sends application confirmation and status-update emails
- API controllers enqueue email jobs using BullMQ and Redis
- A separate worker processes email jobs asynchronously
- Jobs use up to 3 processing attempts with exponential backoff
- Jobs can remain queued while the worker is temporarily offline
- Email processing does not roll back an already-successful application or status update

### Caching

- Redis cache-aside caching for the default active job listing
- TTL-based cache expiration
- Cache invalidation after job creation, update, or close
- Consistent API response format for cache hits and misses

### Error Handling and API Documentation

- Centralized Express error-handling middleware
- Zod request validation
- Standardized success and error responses
- Appropriate HTTP responses for authentication, authorization, validation, and database errors
- OpenAPI 3.0 documentation with interactive Swagger UI
- JWT Bearer authorization support in Swagger UI

## API Endpoints

Interactive API documentation is available at:

http://localhost:3000/api-docs

Use the **Authorize** button in Swagger UI to provide a valid JWT access token when testing protected endpoints.

### Authentication

| Method | Endpoint         | Description                       |
| ------ | ---------------- | --------------------------------- |
| POST   | `/auth/register` | Register a user                   |
| POST   | `/auth/login`    | Login                             |
| POST   | `/auth/refresh`  | Refresh access and refresh tokens |
| POST   | `/auth/logout`   | Logout and revoke refresh token   |

### Jobs

| Method | Endpoint             | Access            | Description           |
| ------ | -------------------- | ----------------- | --------------------- |
| GET    | `/jobs`              | Candidate         | View active jobs      |
| GET    | `/jobs/my-jobs`      | Recruiter         | View recruiter's jobs |
| POST   | `/jobs`              | Recruiter         | Create a job          |
| PATCH  | `/jobs/:jobId`       | Recruiter / Owner | Update a job          |
| PATCH  | `/jobs/:jobId/close` | Recruiter / Owner | Close a job           |

`GET /jobs` supports pagination, filtering, and search using `page`, `limit`, `location`, `experience`, `skills`, `jobType`, and `search`.

Example:

```http
GET /jobs?search=node&location=Pune&jobType=FULL_TIME&page=1&limit=10
```

### Applications

| Method | Endpoint                              | Access            | Description                    |
| ------ | ------------------------------------- | ----------------- | ------------------------------ |
| POST   | `/applications/:jobId`                | Candidate         | Apply to a job                 |
| POST   | `/applications/:applicationId/resume` | Candidate         | Store and link resume metadata |
| PATCH  | `/applications/:applicationId/status` | Recruiter / Owner | Update application status      |

### Uploads

| Method | Endpoint              | Access    | Description                                |
| ------ | --------------------- | --------- | ------------------------------------------ |
| POST   | `/uploads/resume-url` | Candidate | Generate a pre-signed S3 resume upload URL |

The client uses the returned `uploadUrl` to upload a PDF directly to S3 with a `PUT` request and the `Content-Type: application/pdf` header.

## Setup

### Local Development

Copy `.env.example` to `.env` and configure the required environment variables. Do not commit `.env`.

Install dependencies:

```bash
npm install
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Configure the local PostgreSQL and Redis connections in `.env`.

Start Redis with Docker for the first time:

```bash
docker run --name job-portal-redis -p 6379:6379 -d redis:7-alpine
```

If the Redis container already exists but is stopped:

```bash
docker start job-portal-redis
```

Start the development server:

```bash
npm run dev
```

Run the BullMQ email worker in a separate PowerShell terminal:

```powershell
$env:AWS_PROFILE="job-portal-dev"
npm run worker
```

For local AWS functionality, configure the `job-portal-dev` AWS profile with the required S3 and SES permissions. When Amazon SES is in sandbox mode, test recipients must also be verified SES identities.

### Docker Compose (Local Development)

Docker Compose runs the API, PostgreSQL, Redis, Prisma migrations, and BullMQ email worker as separate services.

**Prerequisites**

- Install and start Docker Desktop.
- Configure `.env` using `.env.example`. Keep actual credentials out of Git.
- Set `DB_PASSWORD_URLENCODED` to the URL-encoded version of `DB_PASSWORD`.
- For local AWS testing on Windows, configure the `job-portal-dev` AWS profile. The API and worker mount the host's `.aws` directory read-only. This setup is intended for trusted local development, not production.

**Build and start all services**

From the project root, run:

```bash
docker compose up -d --build
```

Check service status:

```bash
docker compose ps -a
```

Swagger UI: http://localhost:3000/api-docs

**Common commands**

```bash
# Start existing services
docker compose up -d

# Rebuild after application code or dependency changes
docker compose up -d --build

# Follow API and worker logs
docker compose logs -f --tail=20 api worker

# Stop services
docker compose stop

# Inspect Docker PostgreSQL
docker compose exec postgres psql -U postgres -d job_portal
```

**Data and networking**

The API connects to PostgreSQL at `postgres:5432` and Redis at `redis:6379` using Compose service names.

Docker PostgreSQL is separate from PostgreSQL installed directly on Windows. Its port is not published to Windows by default; database inspection is available through `docker compose exec`.

PostgreSQL and Redis use named volumes to retain data across normal container restarts and recreation. **Do not run `docker compose down -v` unless you intend to delete the project's volume data.**

The migration service applies existing Prisma migrations during startup. `Exited (0)` indicates successful completion.

### AWS EC2 Deployment

The Job Portal is deployed to an Amazon EC2 instance using Docker Compose.

### EC2 Architecture

The EC2 deployment uses:

- Amazon Linux 2023
- Docker Engine
- Docker Compose
- Git
- PostgreSQL 17 container
- Redis 7 container
- API container
- BullMQ worker container
- Prisma migration container
- IAM instance role for AWS access

The EC2 instance uses an IAM role instead of local AWS access keys or the local `job-portal-dev` AWS profile.

### EC2-Specific Compose Configuration

Local development uses `compose.yaml`.

EC2 deployment uses: `compose.ec2.yaml`:

```bash
docker compose -f compose.ec2.yaml up -d --build
```

The EC2 API is bound to the host loopback interface:

ports:

- "127.0.0.1:3000:3000"

For development testing, an SSH tunnel can forward the EC2 loopback-bound API to the local machine:

Example(.pem file is in Downloads):

ssh -i "$env:USERPROFILE\Downloads\job-portal-ec2-key.pem" -L 4000:127.0.0.1:3000 ec2-user@<EC2_PUBLIC_DNS>

The API can then be accessed from the local machine through:

http://localhost:4000

### Architecture

                    ┌─────────────────────┐
                    │      Client         │
                    │ Postman / Browser   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express API       │
                    │      :3000          │
                    └─────┬──────┬────┬───┘
                          │      │    │
             ┌────────────┘      │    └──────────────┐
             ▼                   ▼                   ▼
      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
      │ PostgreSQL  │     │    Redis    │     │     S3      │
      │   Prisma    │     │   Cache     │     │   Resumes   │
      └─────────────┘     └─────────────┘     └─────────────┘
                               │
                               ▼
                         ┌─────────────┐
                         │   BullMQ    │
                         │    Queue    │
                         └──────┬──────┘
                                │
                                ▼
                         ┌─────────────┐
                         │ Email Worker │
                         │    + SES     │
                         └─────────────┘

And in AWS:

                        AWS
                         │
                 ┌───────▼────────┐
                 │      EC2       │
                 │                │
                 │ API container  │
                 │ Worker         │
                 │ PostgreSQL     │
                 │ Redis          │
                 └───────┬────────┘
                         │
                IAM Instance Role
                    ┌────┴─────┐
                    ▼          ▼
                   S3         SES
