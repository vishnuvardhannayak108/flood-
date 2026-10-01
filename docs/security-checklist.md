# FERRCS Security & Data Governance Checklist

This document details the security posture, authentication guards, Row-Level Security (RLS) enforcement, and privacy protections implemented across FERRCS.

---

## 1. Authentication & Route Protection

- **SSR Cookie Validation:** Handled via `@supabase/ssr` middleware in `src/middleware.ts`.
- **Role Verification:** Queries the `profiles` table to read canonical user roles (`admin`, `rescue_team`, `citizen`, `volunteer`).
- **Route Authorization Guard Table:**

| Path Pattern | Allowed Roles | Redirect If Unauthorized |
| :--- | :--- | :--- |
| `/admin/*` | `admin` | `/login` (or `/pending-approval` if unverified) |
| `/rescue/*` | `rescue_team`, `admin` | `/login` (or `/pending-approval` if unverified) |
| `/volunteer/*` | `volunteer`, `admin` | `/login` (or `/pending-approval` if unverified) |
| `/citizen/*` | `citizen`, `rescue_team`, `admin`, `volunteer` | `/login` |

---

## 2. Row Level Security (RLS) Policies

All 15 database tables have Row-Level Security explicitly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Default behavior is **DENY ALL**.

1. **`profiles`:**
   - Users can read all active profiles (for dispatch and team identification).
   - Users can update only their own profile row.
   - Profile `role` column cannot be changed by ordinary users (enforced by `BEFORE UPDATE` trigger `prevent_self_role_escalation`).
2. **`emergency_requests`:**
   - Anonymous and authenticated users can insert distress requests (`submit_sos`).
   - Citizens can view their own requests.
   - Responders (`rescue_team`) and Admins can view and query all active requests.
3. **`rescue_operations` & `request_status_history`:**
   - Read-only for assigned team members, citizen owner, and admins.
   - Insertions/updates restricted to stored procedure execution.
4. **`audit_logs`:**
   - Read access granted exclusively to users with `is_admin() = TRUE`.
   - Immutable: `UPDATE` and `DELETE` queries are prohibited for all roles.

---

## 3. Concurrency Safety & Race Condition Prevention

- **Double-Assignment Prevention:** `assign_request` utilizes PostgreSQL `FOR UPDATE` pessimistic locking on target `emergency_requests` row.
- **State Machine Integrity:** Transitions validate the current status in an atomic transaction; duplicate or out-of-order transition requests throw explicit SQL exceptions.
- **Deduplication Window:** Re-submissions with matching client request IDs or within 150m and 60 minutes return existing request identifiers instead of generating orphaned duplicate rows.

---

## 4. Privacy & PII Protection

- **Citizen Phone Masking:** Unclaimed distress requests mask citizen contact numbers (`+91 ••••• •••••`). Direct contact details are revealed only to rescue crews who have claimed the mission.
- **Geolocation Precision:** Public flood maps cluster and aggregate incident reports, preserving residential unit privacy while broadcasting critical inundation depths.
