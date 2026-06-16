# QUAN-LY-CHDV (Property Management System)

A comprehensive property management SaaS application for managing rental properties, tenants, contracts, invoices, and maintenance requests.

## 🏢 Overview

QUAN-LY-CHDV is a Vietnamese property management system designed for building owners and property managers to efficiently manage multiple buildings, rooms, tenant contracts, billing, and maintenance operations.

**Current Status:** MVP (localStorage-based) - Production rebuild in progress

## ✨ Features

### Core Functionality
- **Building & Room Management** - Manage multiple buildings with customizable floor layouts
- **Tenant Management** - Track tenant information, move-in/move-out dates, and contact details
- **Contract Management** - Create and track lease agreements with expiration monitoring
- **Invoice Generation** - Automated billing with utility meter readings (electricity, water)
- **Maintenance Tracking** - Kanban-style ticket system (Reported → In Progress → Resolved)
- **Financial Dashboard** - Real-time revenue, expenses, and profit analytics
- **VietQR Integration** - Generate QR codes for instant payment via banking apps

### User Roles
- **Manager** - Full access to all buildings, rooms, financial data, and settings
- **Tenant** - Portal access to view personal invoices and submit maintenance requests

## 🛠️ Technology Stack

### Frontend (Current)
- **React 19** - UI framework with latest concurrent features
- **Vite 8** - Lightning-fast bundler and dev server
- **React Router** - Client-side routing
- **Recharts** - Data visualization for financial analytics
- **Lucide React** - Modern icon library
- **React Hot Toast** - Elegant notifications
- **XLSX** - Excel export functionality

### Backend (Planned)
- **Node.js 20** + **Express 5** - REST API server
- **PostgreSQL 16** - Relational database with multi-tenancy
- **JWT + bcrypt** - Custom authentication system
- **Docker Compose** - Containerized deployment

### Data Storage (Current)
- **localStorage** - Browser-based persistence (temporary MVP solution)
- **Firebase Auth** - User authentication (to be replaced)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/quan-ly-chdv.git
cd quan-ly-chdv

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Development Commands

```bash
npm run dev      # Start Vite dev server
npm run preview  # Preview production bundle
npm run lint     # Run ESLint
```

### Demo Credentials

**Manager Account:**
- Email: `admin@example.com`
- Password: `admin123`

**Tenant Account:**
- Email: Any registered tenant email
- Password: `tenant123`

## 📁 Project Structure

```
quan-ly-chdv/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page-level components (10 routes)
│   ├── context/          # React Context (Auth + AppData)
│   ├── utils/            # Helper functions (Excel export, mock data)
│   ├── styles/           # Global styles
│   ├── App.jsx           # Main app component with routing
│   ├── main.jsx          # Entry point
│   └── firebase.js       # Firebase configuration
├── public/               # Static assets
├── docs/                 # Documentation (see below)
└── plans/                # Implementation plans
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Project Overview](docs/project-overview-pdr.md)** - Product vision, goals, and requirements
- **[System Architecture](docs/system-architecture.md)** - Current and planned architecture
- **[Project Roadmap](docs/project-roadmap.md)** - 5-phase production rebuild plan (10-12 weeks)
- **[Codebase Summary](docs/codebase-summary.md)** - Code structure and component overview
- **[Code Standards](docs/code-standards.md)** - Development conventions and patterns
- **[Deployment Guide](docs/deployment-guide.md)** - Docker deployment instructions

## 🔐 Security Notice

**⚠️ IMPORTANT:** This repository contains MVP code with known security issues:
- Firebase credentials in source code
- localStorage-only persistence (no backend)
- Client-side authentication only
- Hardcoded demo passwords

**These issues are addressed in the production rebuild plan.** Do not deploy this version to production.

## 🗺️ Roadmap

### Current Phase: Production Rebuild (10-12 weeks)

**Phase 1:** Backend Foundation (Weeks 1-3)
- Node.js + Express + PostgreSQL setup
- JWT authentication system
- Database schema with multi-tenancy

**Phase 2:** API Development (Weeks 4-6)
- REST API endpoints for all entities
- File upload (room images)
- Excel export endpoint

**Phase 3:** Frontend Migration (Weeks 7-8)
- Replace localStorage with API calls
- Auth flow integration
- Loading states and error handling

**Phase 4:** Security Hardening (Week 9)
- Fix all critical security issues
- Input validation and CSRF protection
- HTTPS and security headers

**Phase 5:** Testing & Deployment (Weeks 10-12)
- Unit and integration tests
- Docker Compose production setup
- CI/CD pipeline with GitHub Actions

See `docs/project-roadmap.md` for detailed milestones.

### Post-Launch (v1.1 - v2.0)
- Real-time notifications (WebSockets)
- Mobile app (React Native)
- Payment gateway integration (VNPay, Momo)
- White-label multi-tenancy
- Role-based permissions

## 🧪 Testing

```bash
# Run linter
npm run lint
```

*Unit and integration tests will be added in Phase 5 of the production rebuild.*

## 📦 Deployment

**Current:** Not production-ready (localStorage-based MVP)

**Planned:** Docker Compose deployment with Nginx reverse proxy. See `docs/deployment-guide.md` for instructions.

## 🤝 Contributing

This is a private project currently under active development. Contribution guidelines will be added after the production rebuild.

## 📄 License

Copyright © 2026. All rights reserved.

## 👥 Team

- **Development:** Property Management Team
- **Architecture:** Based on research in `plans/reports/`

## 📞 Support

For questions or issues, please contact the development team.

---

**Version:** 0.1.0-alpha (MVP)  
**Last Updated:** June 16, 2026  
**Status:** Active Development - Production Rebuild in Progress
