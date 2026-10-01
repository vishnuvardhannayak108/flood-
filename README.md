# FERRCS — Flood Emergency Response & Rescue Coordination System

[![Next.js 14+](https://img.shields.io/badge/Next.js-14%2B-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostGIS-green?style=flat&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passed-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)

**FERRCS** is a full-stack, mission-critical crisis coordination platform engineered for real-time flood emergency management. Built with Next.js 14+ (App Router), Supabase (PostgreSQL 15+ & PostGIS), and Tailwind CSS, FERRCS orchestrates the entire disaster response lifecycle:
$$\text{Report} \longrightarrow \text{Prioritize} \longrightarrow \text{Assign} \longrightarrow \text{Respond} \longrightarrow \text{Track} \longrightarrow \text{Complete}$$

---

## 🌟 Key Features Across Portals

### 1. Citizen Emergency Portal (`/citizen`)
- **1-Tap Distress SOS (`/citizen/sos`):** Automatic high-accuracy GPS capture, people count, vulnerable individual flags (infants, pregnant women, elderly), and immediate short code generation (e.g. `#FR-9823`).
- **Offline Outbox & Resilient Replay:** Submissions during network blackout are queued in IndexedDB and automatically replayed upon network reconnection.
- **Live Lifecycle Tracker (`/citizen/requests/[id]`):** Real-time vertical progression across the 7-stage state machine with emergency safety instructions and direct responder contact.
- **Relief Shelters Directory (`/citizen/shelters`):** Real-time distance sorting via Haversine calculation, live capacity progress bars, facility badges, and direct navigation links.
- **Weather & Flood Warnings (`/citizen/alerts`):** Chronological broadcast feed with hydrological gauge telemetry (Musi River, reservoir outflows).
- **Incident Reporting (`/citizen/report`):** Community crowdsourced flood water depth reports with photo attachment capabilities.

### 2. Rescue Responder Portal (`/rescue`)
- **Distress Priority Queue (`/rescue`):** Dynamically ranked by multi-factor algorithmic distress scores (0–100) combining urgency tier, trapped headcount, vulnerable individuals, and waiting time escalation.
- **Mission Execution Terminal (`/rescue/requests/[id]`):** PII phone unmasking on mission acceptance, state machine progression (`Accept` $\rightarrow$ `En Route` $\rightarrow$ `On Site` $\rightarrow$ `Complete`), and GPS turn-by-turn navigation deep-links.
- **Tactical Operations Map (`/rescue/map`):** Interactive map canvas with Musi River inundation hazard corridor, responder boat markers, emergency request pins, and relief shelters.
- **Fleet Roster & Readiness (`/rescue/team`):** Boat fuel/battery status, equipment safety checklists, and live GPS telemetry broadcast ping.
- **Mission History (`/rescue/history`):** Complete sortie logs with survivor counts and duration statistics.

### 3. Incident Commander & Admin Portal (`/admin`)
- **Executive Command Dashboard (`/admin`):** Live KPI counters, active operations strip, and rapid incident response metrics.
- **SOS Master Registry (`/admin/requests`):** Searchable table, duplicate incident review comparison drawer, and manual boat dispatch overrides.
- **Incident Moderation Queue (`/admin/incidents`):** Review and verify citizen flood depth reports before publishing to public routing engines.
- **Fleet Management (`/admin/teams`):** Rescue boat unit deployment, callsigns, equipment allocation, and sector zoning.
- **User Directory & Authorization (`/admin/users`):** Role switcher, verification approvals for volunteer and responder applicants, and access suspension.
- **Shelter Operations (`/admin/shelters`):** Real-time headcount steppers (`+10`, `-10`, `+1`, `-1`), capacity limit automation, and new camp provisioning.
- **Emergency Broadcaster & Simulator (`/admin/alerts`):** Draft multi-channel warnings, plus a **"Simulate Flash Flood Scenario"** trigger for instant live civil defense drills.
- **Operational Analytics & CSV Export (`/admin/reports`):** SLA compliance latency funnel and 1-click CSV download of crisis operational logs.
- **Tamper-Evident Audit Trail (`/admin/audit`):** Immutable log of every status transition and administrative command with expandable JSON diffs.
- **System Parameters (`/admin/settings`):** Customizable priority weights, spatial deduplication radius, and emergency hotlines.

### 4. Volunteer Community Task Force (`/volunteer`)
- **Relief Mission Board (`/volunteer/tasks`):** Open volunteer shifts for food packet distribution, medical camp support, shelter headcount registration, and sandbagging.
- **Volunteer Terminal (`/volunteer`):** Real-time shift check-in/out, claimed tasks management, and community service hours logging.

---

## 🔐 Demo Accounts & Quick Switch

The login page (`/login`) includes **1-Click Quick-Switch buttons** to test any role instantly:

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@ferrcs.gov.in` | `Password123!` | `/citizen/sos` |
| **Rescue Responder** | `rescue@ferrcs.gov.in` | `Password123!` | `/rescue` |
| **Administrator** | `admin@ferrcs.gov.in` | `Password123!` | `/admin` |
| **Volunteer** | `volunteer@ferrcs.gov.in` | `Password123!` | `/volunteer` |

---

## 🏗️ Architecture & Database Design

FERRCS is backed by 7 modular Supabase migrations in `supabase/migrations/`:
1. `20261001000001_extensions_and_enums.sql`: PostGIS extensions and enumerated types.
2. `20261001000002_core_tables.sql`: 15 relational tables with PostGIS geography columns, foreign keys, and indexes.
3. `20261001000003_rls_policies.sql`: Default-deny Row Level Security policies and role protection triggers.
4. `20261001000004_rpcs_and_state_machine.sql`: `handle_new_user`, role assignment, short code generation, and public statistics.
5. `20261001000005_emergency_reporting_rpcs.sql`: `submit_sos`, `compute_priority_score`, spatial deduplication (`find_duplicate_request`), and incident reporting.
6. `20261001000006_rescue_coordination_rpcs.sql`: Concurrency-safe `assign_request` (`FOR UPDATE` locking), `update_request_status`, and telemetry updates.
7. `20261001000007_shelters_and_alerts_rpcs.sql`: Spatial proximity query `nearby_shelters`, `update_shelter_occupancy`, `broadcast_weather_alert`, and `simulate_flood_scenario`.

---

## 🚀 Rapid Local Setup

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_DEFAULT_LAT=17.3850
NEXT_PUBLIC_DEFAULT_LNG=78.4867
```

### 3. Run Quality Verification
```bash
npm test              # Run Vitest test suite (19 tests)
npm run typecheck     # Strict TypeScript type check (tsc --noEmit)
npm run build         # Next.js production build verification
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Evaluator Documentation
- [Evaluator Demo Script & Walkthrough](docs/demo-script.md)
- [Database RPC Technical Reference](docs/rpc-reference.md)
- [Security & RLS Governance Checklist](docs/security-checklist.md)
- [System Architecture Specification](docs/architecture.md)
- [Entity-Relationship Diagram](docs/erd.mmd)
