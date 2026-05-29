# Nexus CRM — Enterprise CRM + HRMS + Project Management

A production-ready monorepo SaaS platform built with Node.js, React, PostgreSQL, and Prisma. Phase 1 includes authentication, RBAC, full database schema, and role-based dashboards.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript, Prisma |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Redux Toolkit |
| Database | PostgreSQL |
| Auth | JWT + Refresh Tokens |
| Real-time | Socket.io |
| DevOps | Docker, Docker Compose, Nginx, PM2 |

## Project Structure

```
CRM/
├── apps/
│   ├── api/          # Express REST API
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared types, roles, permissions
├── infra/nginx/      # Reverse proxy config
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)

### 1. Start infrastructure

```bash
cp .env.example .env
docker compose up -d postgres redis
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run development servers

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **API:** http://localhost:4000
- **Swagger:** http://localhost:4000/api/docs

## Demo Accounts

Password for all: `Password@123`

| Email | Role |
|-------|------|
| admin@acme.com | Super Admin |
| hr@acme.com | HR |
| manager@acme.com | Manager |
| employee@acme.com | Employee |

## API Examples

### Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"Password@123"}'
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@acme.com",
      "firstName": "Alex",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "permissions": ["users:read", "..."],
      "companyId": "..."
    },
    "accessToken": "eyJ...",
    "refreshToken": "..."
  }
}
```

### Dashboard Stats (authenticated)

```bash
curl http://localhost:4000/api/v1/dashboard/stats \
  -H "Authorization: Bearer <accessToken>"
```

### Register Company

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@startup.com",
    "password": "SecurePass1",
    "firstName": "Jane",
    "lastName": "Doe",
    "companyName": "Startup Inc"
  }'
```

## RBAC Roles

| Role | Access |
|------|--------|
| SUPER_ADMIN | Full system, analytics, user/role management |
| HR | Employees, attendance, leaves, payroll |
| MANAGER | Team, projects, tasks, approvals |
| EMPLOYEE | Self-service attendance, leaves, tasks |

## Implementation Phases

- **Phase 1 (Complete):** Setup, Auth, RBAC, Schema, Dashboard
- **Phase 2 (Complete):** Employee, Attendance, Leave modules
- **Phase 3 (Complete):** Payroll, Projects, Tasks
- **Phase 4 (Complete):** Reports, Notifications, Settings
- **Phase 5 (Complete):** Admin users, roles, SaaS subscriptions, AI insights

## Docker Production

```bash
docker compose up --build
```

## Environment Variables

See `.env.example` for all configuration options including JWT secrets, SMTP, AWS S3, and Redis.

## License

Proprietary — Enterprise CRM Project
