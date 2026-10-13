# 🎓 PlacementHub - Enterprise College Placement Management System

[![Build & Tests](https://img.shields.io/badge/tests-24%20passed%20%7C%200%20failed-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/backend-Express%205%20%7C%20Node.js-blue.svg)]()
[![Database](https://img.shields.io/badge/database-SQLite3%20ACID-orange.svg)]()
[![Authentication](https://img.shields.io/badge/security-JWT%20%2B%20Bcrypt%20RBAC-purple.svg)]()
[![License](https://img.shields.io/badge/license-ISC-green.svg)]()

PlacementHub is a full-stack, enterprise-grade College Placement Management System. It unites students, departmental faculty coordinators, corporate recruiters, and the Training and Placement Officer (TPO / Placement Head) in a unified, automated, and secure digital ecosystem.

---

## 🏛️ System Architecture & Role Hierarchies

PlacementHub enforces a multi-tier **Role-Based Access Control (RBAC)** architecture:

```
                                 ┌──────────────────────────────┐
                                 │   👑 PLACEMENT HEAD (TPO)    │
                                 │  • Drive Approvals & Revisions│
                                 │  • Coordinator Management    │
                                 │  • CSV Exports & Audit Logs  │
                                 └──────────────┬───────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        ┌─────────────────────────────┐                   ┌─────────────────────────────┐
        │  🤝 PLACEMENT COORDINATOR   │                   │    🛡️ SYSTEM ADMINISTRATOR  │
        │ • Add / Manage Assigned Jobs │                   │ • Infrastructure & Security │
        │ • Round-by-Round Progression│                   │ • Institutional Analytics   │
        │ • Department Announcements  │                   │ • Alumni Moderation Queue   │
        └──────────────┬──────────────┘                   └─────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    👨‍🎓 STUDENT CANDIDATE     │ │    🏢 CORPORATE RECRUITER   │
│ • Eligibility Checks & Apply │ │ • Post Corporate Drives     │
│ • 8-Stage Pipeline Tracking │ │ • Review Candidate Profiles │
│ • AI Readiness & Sandboxes  │ │ • Extend Offers & Contracts │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## ✨ Comprehensive Features by Role

### 1. 👑 Placement Head / Training & Placement Officer (TPO)
* **Approval Queue:** Review recruitment drive proposals submitted by coordinators. 1-click **Approve & Publish** to students or **Reject with revision instructions**.
* **Coordinator Delegation:** Add departmental faculty coordinators, manage account status, and assign drive management responsibilities.
* **Institutional Reports & CSV Exports:**
  * 📥 Export complete student registry with CGPA, active backlogs, and branches (`/api/reports/export/students`).
  * 📥 Export visiting company registry with package breakdowns (`/api/reports/export/drives`).
  * 📥 Export verified selection offers and acceptance records (`/api/reports/export/selections`).
* **Campus-Wide Announcements:** Broadcast priority notices to students, coordinators, or campus-wide.
* **Audit Trail:** Immutable record of administrative operations, stage updates, and coordinator assignments.
* **Institutional Analytics:** Interactive charts for department placement distribution, salary benchmarks, and hiring funnels.

### 2. 🤝 Placement Coordinator
* **Dedicated Coordinator Portal (`coordinator-dashboard.html`):** Personal workload KPI tracking (assigned drives, active applicants, pending reviews, offers extended).
* **Drive Submission Workflow:** Save recruitment drives as **Draft** or submit as **Pending Approval** to the Placement Head.
* **Round Progression Management:** Transition candidates across 8 selection stages:
  * `Applied` ➔ `Under Review` ➔ `Shortlisted` ➔ `Interview Scheduled` ➔ `Selected` ➔ `Not Selected` ➔ `Offer Accepted` ➔ `Offer Declined`
* **Department Announcements & Update History:** Publish alerts for test venues, interview slots, and monitor logged actions.

### 3. 👨‍🎓 Student Candidate
* **Live Campus Drives & Eligibility Verification:** Real-time checking against CGPA cutoff, max active backlogs, eligible disciplines, and application deadlines.
* **8-Stage Pipeline Tracking:** Transparent feedback notes, interview dates, and real-time status transitions.
* **AI Career Acceleration Tools:**
  * Resume Keyword Analyzer & Match Score.
  * Placement Readiness Score & Checklist.
  * Curated Technical Roadmaps (DSA, Web Dev, System Design).
  * Interactive Aptitude & Coding Sandboxes.
  * Multi-Offer Compensation Comparison Calculator.
* **Alumni Mentorship & Interview Experiences:** Review verified alumni interview questions, difficulty ratings, and preparation advice.

### 4. 🏢 Corporate Recruiter
* Post recruitment drives, view applicant rosters, download profiles, and short-list qualified candidates.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Modern Lavender & Royal Purple Design System, Dark/Light Mode), Vanilla JavaScript (ES6+), Chart.js |
| **Backend** | Node.js, Express.js (v5 REST API), CORS & Chromium Private Network Access (PNA) |
| **Database** | SQLite3 with automatic schema migrations, foreign keys, and audit logging |
| **Security** | JSON Web Tokens (JWT), Bcrypt password hashing, Strict Role-Based Middleware |
| **Testing** | Automated End-to-End Test Suite (`test-e2e-workflow.js`) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/)

### 2. Installation
```bash
git clone https://github.com/YOUR_USERNAME/college-placement-system.git
cd college-placement-system
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

### 4. Run the Application
```bash
npm start
```

### 5. Access URLs
* **Campus Web Portal:** [http://localhost:5000](http://localhost:5000)
* **Placement Head Portal:** [http://localhost:5000/admin-dashboard.html](http://localhost:5000/admin-dashboard.html)
* **Coordinator Portal:** [http://localhost:5000/coordinator-dashboard.html](http://localhost:5000/coordinator-dashboard.html)
* **Student Dashboard:** [http://localhost:5000/student-dashboard.html](http://localhost:5000/student-dashboard.html)
* **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 👥 Seeded Authorized Demo Accounts

| Role | Email Address | Password | Portal View |
| :--- | :--- | :--- | :--- |
| **👑 Placement Head (TPO)** | `tpo@placement.edu` | `Head@123` | Placement Head Portal |
| **🤝 Placement Coordinator (CS)** | `coordinator@placement.edu` | `Coord@123` | Coordinator Dashboard |
| **🤝 Placement Coordinator (IT)** | `coord.it@placement.edu` | `Coord@123` | Coordinator Dashboard |
| **👨‍🎓 Student Candidate (Rahul)** | `rahul@student.edu` | `Student@123` | Student Dashboard |
| **👨‍🎓 Student Candidate (Priya)** | `priya@student.edu` | `Student@123` | Student Dashboard |
| **🏢 Corporate Recruiter (TCS)** | `tcs@placement.edu` | `Company@123` | Recruiter Dashboard |
| **🛡️ System Administrator** | `admin@placement.edu` | `Admin@123` | Administrative Console |

*(All login pages feature 1-Click Instant Demo Login buttons for rapid testing without typing).*

---

## 🧪 Automated Testing

Execute the automated end-to-end verification suite:
```bash
npm test
```
The test suite validates:
1. System Health & Environment Readiness.
2. Authentication for all 5 roles.
3. Coordinator workload KPIs.
4. Multi-stage drive creation, approval, and visibility filtering.
5. Student application and 8-stage round progression.
6. Coordinator roster management and drive delegation.
7. Campus announcements broadcast and retrieval.
8. Institutional report summaries and 3 CSV stream exports.
9. System audit trail logging.

---

## 🌐 Production Deployment Guide

### Deployment Options:
1. **Render / Railway / Fly.io:**
   * Set Environment Variable: `NODE_ENV=production`
   * Build Command: `npm install`
   * Start Command: `node server/server.js`
   * Persistent Volume: Mount `/server/data` to persist `placement.db`.
2. **Ubuntu VPS / AWS EC2 / DigitalOcean:**
   * Install Node.js & PM2:
     ```bash
     npm install -g pm2
     pm2 start server/server.js --name "placement-hub"
     pm2 save
     pm2 startup
     ```
   * Set up Nginx reverse proxy with SSL (Let's Encrypt Certbot).

---

## 📄 License
Licensed under the [ISC License](LICENSE).
