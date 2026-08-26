# Job Portal Backend API

Backend API for a Job Portal application built with Node.js, Express, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
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

Start the development server:

```bash
npm run dev
```
