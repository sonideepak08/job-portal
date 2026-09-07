# Job Portal Backend API

Backend API for a Job Portal application built with Node.js, Express, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- Zod
- bcrypt
- JSON Web Token (JWT)

## Features

### Authentication

- User registration
- User login
- JWT access tokens
- Refresh-token rotation
- Refresh-token reuse detection
- Logout and token revocation

### Authorization

- JWT authentication middleware
- Role-based access control
- `RECRUITER` and `CANDIDATE` roles
- Resource ownership authorization

### Job Management

- Recruiters can create jobs
- Recruiters can update their own jobs
- Recruiters can close their own jobs
- Recruiters can view their jobs
- Candidates can view active jobs
- Jobs support `FULL_TIME`, `PART_TIME`, `CONTRACT`, and `INTERNSHIP` types
- Jobs support multiple normalized skills
- Active job listings support pagination
- Jobs can be filtered by location, experience, skills, and job type
- Active jobs can be searched by title, company, and skills
- Job search is case-insensitive
- Paginated responses include total records and total pages
- Database indexes support common recruiter, job listing, and skill lookup queries

### Caching

- Redis cache-aside caching for the default active job listing
- Cache hit/miss logging
- Cached job-list data uses TTL-based expiration
- Cached active-job listings are invalidated after job creation, update, or close
- Cache hits and misses return the same standardized API response format

### Error Handling & Responses

- Centralized Express error-handling middleware
- Custom `AppError` for application errors
- Standardized success and error response formats
- Zod validation errors include structured validation details
- Handles validation, authentication, authorization, not-found, conflict, and unexpected errors
- Prisma unique-constraint conflicts are mapped to HTTP `409`
- Unknown routes return a standardized `404` response
- Unexpected errors are logged with structured request information while internal details are hidden from clients

### Cache-Aside Flow

For the cached active-job listing:

```text
Request
  ↓
Check Redis
  ↓
Cache HIT
  → Parse cached data and metadata
  → Return standardized response

Cache MISS
  → Query PostgreSQL
  → Store data and metadata in Redis with TTL
  → Return standardized response
```

When a job is created, updated, or closed:

```text
Database mutation succeeds
  ↓
Invalidate active-job listing cache
  ↓
Next listing request becomes a cache MISS
  ↓
Fresh data is loaded from PostgreSQL and cached again
```

## API Endpoints

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

### Job Listing Query Parameters

`GET /jobs` supports:

- `page`
- `limit`
- `location`
- `experience`
- `skills`
- `jobType`
- `search`

Filter and paginate jobs:

```http
GET /jobs?page=1&limit=10&location=Pune&skills=Node.js,AWS&jobType=FULL_TIME
```

Search jobs by title, company, or skills:

```http
GET /jobs?search=node
```

Search combined with filters:

```http
GET /jobs?search=node&location=Pune&jobType=FULL_TIME&page=1&limit=10
```

## Setup

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

Start Redis with Docker for the first time:

```bash
docker run --name job-portal-redis -p 6379:6379 -d redis:7-alpine
```

For later runs, if the Redis container already exists but is stopped:

```bash
docker start job-portal-redis
```

Start the development server:

```bash
npm run dev
```
