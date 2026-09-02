# HireLoop (Joventra) — Backend API

Modern, scalable, and secure REST API backend for the **HireLoop** job hunting portal built with Node.js, Express.js, and MongoDB.

---

## 🚀 Features

- **JWT Authentication & RBAC**: Access & Refresh token rotation with role-based authorization for **Seeker**, **Recruiter**, and **Admin**.
- **Job Management**: Full CRUD, text search, multi-faceted filtering, automatic slug generation, and active job limits per plan.
- **Company Verification Workflow**: Recruiter registration, admin moderation (approve/reject), and public directory.
- **Application Tracking System (ATS)**: One-click application, monthly quota enforcement, recruiter applicant review with email notifications.
- **Saved Jobs & Bookmarks**: Fast saving/unsaving with plan-aware bookmark limits.
- **Stripe Subscriptions & Billing**: Subscriptions for Seekers (Free, Pro, Premium) and Recruiters (Free, Growth, Enterprise) with webhook fulfillment.
- **Nodemailer Notification Engine**: Automatic emails for welcome, application receipt, status changes, and company approval.
- **Admin & Analytics Dashboards**: Platform metrics, 30-day user growth timelines, category distribution charts, and user/company/job moderation.
- **Production Hardened**: Rate limiting, Helmet security headers, Multer file validations, and centralized error handling.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Validation**: Zod
- **Payments**: Stripe SDK
- **File Upload**: Multer (resumes & images)
- **Email**: Nodemailer

---

## 📦 Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/joventra
   CLIENT_URL=http://localhost:5173
   JWT_ACCESS_SECRET=hireloop_access_secret_2026
   JWT_REFRESH_SECRET=hireloop_refresh_secret_2026
   STRIPE_SECRET_KEY=sk_test_xxx
   ```

3. **Seed Database with Sample Data**:
   ```bash
   npm run seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 🔑 Preloaded Test Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@hireloop.com` | `admin123` |
| **Recruiter (TechCorp)** | `sarah@techcorp.io` | `password123` |
| **Recruiter (FinFlow)** | `marcus@finflow.co` | `password123` |
| **Seeker (Full Stack)** | `alex@example.com` | `password123` |
| **Seeker (Designer)** | `sophia@example.com` | `password123` |

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Register seeker or recruiter
- `POST /api/auth/login` — Login & receive JWT tokens
- `POST /api/auth/logout` — Logout & invalidate token
- `POST /api/auth/refresh-token` — Rotate refresh token
- `GET  /api/auth/me` — Current user profile & subscription

### Jobs
- `GET    /api/jobs` — Browse active jobs with filters & pagination
- `GET    /api/jobs/featured` — Featured jobs for homepage
- `GET    /api/jobs/:id` — Single job details
- `GET    /api/jobs/similar/:id` — Related job listings
- `POST   /api/jobs` — Recruiter post new job (enforces plan limit)
- `GET    /api/jobs/recruiter/my-jobs` — Recruiter's job posts
- `PUT    /api/jobs/:id` — Recruiter edit job
- `PATCH  /api/jobs/:id/toggle-status` — Close or reopen job
- `DELETE /api/jobs/:id` — Delete job

### Companies
- `GET  /api/companies` — Approved companies directory
- `GET  /api/companies/:id` — Single company with active jobs
- `POST /api/companies` — Recruiter register company
- `GET  /api/companies/my/profile` — Recruiter's registered company
- `PUT  /api/companies/my/profile` — Update company profile
- `POST /api/companies/my/logo` — Upload company logo

### Applications
- `POST  /api/applications/apply/:jobId` — Seeker apply (enforces monthly limits)
- `GET   /api/applications/my-applications` — Seeker submitted applications
- `GET   /api/applications/stats` — Seeker application status counts (for charts)
- `GET   /api/applications/job/:jobId/applicants` — Recruiter applicant list
- `PATCH /api/applications/:id/status` — Recruiter update applicant status

### Saved Jobs
- `GET    /api/saved-jobs` — Seeker saved bookmarks
- `GET    /api/saved-jobs/check/:jobId` — Check if job is saved
- `POST   /api/saved-jobs/save/:jobId` — Bookmark job (enforces free limit)
- `DELETE /api/saved-jobs/unsave/:jobId` — Remove bookmark

### Payments & Billing
- `POST /api/payments/create-checkout` — Create Stripe session
- `POST /api/payments/activate-plan` — Direct plan activation
- `GET  /api/payments/history` — User payment history
- `GET  /api/payments/subscription` — User active plan details
- `GET  /api/payments/admin/all` — Admin view of all transactions

### Seeker & Recruiter Dashboards
- `GET /api/seeker/stats` — Seeker dashboard summary cards
- `GET /api/seeker/recent-activity` — Seeker notifications & timeline
- `GET /api/seeker/plan-usage` — Seeker applications & bookmarks usage
- `GET /api/recruiter/stats` — Recruiter dashboard summary cards
- `GET /api/recruiter/analytics/applicants` — Applicants per job chart data
- `GET /api/recruiter/recent-applications` — Recent applicants list
- `GET /api/recruiter/plan-usage` — Recruiter active job usage vs quota

### Admin Management
- `GET    /api/admin/stats` — Platform overall statistics
- `GET    /api/admin/analytics/users` — 30-day user growth timeline
- `GET    /api/admin/analytics/jobs` — Category breakdown distribution
- `GET    /api/admin/analytics/payments` — Latest payments overview
- `GET    /api/admin/users` — Manage users with search & role filter
- `PATCH  /api/admin/users/:id/role` — Switch user between Seeker & Recruiter
- `PATCH  /api/admin/users/:id/status` — Suspend / Activate user
- `GET    /api/admin/companies` — Moderate company registrations
- `PATCH  /api/admin/companies/:id/approve` — Approve company
- `PATCH  /api/admin/companies/:id/reject` — Reject company
- `GET    /api/admin/jobs` — Search & moderate all jobs
- `DELETE /api/admin/jobs/:id` — Remove job post
