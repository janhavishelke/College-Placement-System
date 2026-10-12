# 🎓 PlacementHub - Modern College Placement Management System

PlacementHub is a comprehensive, full-stack campus placement management platform connecting students, recruiting companies, and the college placement cell.

---

## 🌟 Key Features

* **Student Portal:**
  * Application tracking across 8 stages (*Applied*, *Under Review*, *Shortlisted*, *Interview Scheduled*, *Selected*, *Not Selected*, *Offer Accepted*, *Offer Declined*).
  * Milestone timeline audit log & notifications.
  * Placement Readiness score & checklist.
  * AI-powered career recommendations & skill-gap analyzer.
  * Aptitude and coding practice sandbox.
  * Offer comparison tool.

* **Recruiter / Company Portal:**
  * Post campus placement drives with cutoff CGPA, backlogs, and branch eligibility.
  * Candidate applications roster with real-time stage updates.
  * Instant status synchronization with student dashboards.

* **Placement Cell Administrator:**
  * Real-time recruitment analytics and conversion funnels.
  * Department-wise placement rate charts and salary statistics.
  * Centralized management of visiting drives and alumni interview experiences.

---

## 🛠️ Technology Stack

* **Frontend:** HTML5, CSS3 (Modern Lavender & Royal Purple Design System, Dark/Light mode), Vanilla JavaScript (ES6+), Chart.js.
* **Backend:** Node.js, Express.js (v5 REST API).
* **Database:** SQLite3 with relational constraints and automatic schema migrations.
* **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing.

---

## 🚀 Getting Started

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* [npm](https://www.npmjs.com/)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/YOUR_USERNAME/college-placement-system.git
cd college-placement-system
npm install
```

### 3. Start the Server
```bash
npm start
```
The server will start at:
* **Web Portal:** `http://localhost:5000`
* **API Health:** `http://localhost:5000/api/health`

---

## 👥 Seeded Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student (Rahul)** | `rahul@student.edu` | `Student@123` |
| **Student (Priya)** | `priya@student.edu` | `Student@123` |
| **Recruiter (TCS)** | `tcs@placement.edu` | `Company@123` |
| **Recruiter (Infosys)** | `infosys@placement.edu` | `Company@123` |
| **Admin** | `admin@placement.edu` | `Admin@123` |

---

## 📂 Project Structure

```
college-placement-system/
├── index.html                  # Landing Homepage
├── student-dashboard.html      # Student Dashboard & Applications Tracking
├── company.html                # Recruiter Dashboard & Candidate Roster
├── admin-dashboard.html        # Placement Cell Administrator Portal
├── jobs.html                   # Active Placement Drives
├── login.html                  # Unified Portal Login
├── register.html               # Candidate Registration
├── profile.html                # Student Profile Management
├── style.css                   # Global Modern CSS Theme & Tokens
├── common.js                   # Shared Utilities, Dark Mode, Toasts, Status Badges
├── student.js                  # Student Dashboard Business Logic
├── company.js                  # Recruiter Dashboard Logic
├── admin.js                    # Admin Analytics & Dashboard Logic
├── jobs.js                     # Drives Browser & Application Logic
├── login.js                    # Authentication Script
├── register.js                 # Registration Script
├── profile.js                  # Student Profile Script
├── package.json                # Project Dependencies & Scripts
├── .gitignore                  # Git Ignore Rules
└── server/                     # Backend Source Code
    ├── server.js               # Express Server Entry Point
    ├── config/
    │   └── db.js               # SQLite Database Schema & Migrations
    ├── middleware/
    │   └── auth.js             # JWT Verification & RBAC Middleware
    ├── routes/                 # Express API Routes
    └── controllers/            # Controller Business Logic
```
