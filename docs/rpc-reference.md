# FERRCS Database RPC Technical Reference

This document provides a technical specification of the PostgreSQL Remote Procedure Calls (RPCs) implemented in FERRCS. All critical crisis mutations execute through `SECURITY DEFINER` stored procedures with explicit concurrency locks and role checks.

---

## 1. Core Functions & State Transitions

### `submit_sos`
- **Purpose:** Idempotent distress request submission with automatic deduplication, geofencing, priority score computation, and short code assignment.
- **Security:** `SECURITY DEFINER` (Invoked by authenticated users or anonymous distress callers).
- **Parameters:**
  - `p_client_request_id` (UUID, optional): For idempotency retry deduplication.
  - `p_lat` (DOUBLE PRECISION, required): Latitude.
  - `p_lng` (DOUBLE PRECISION, required): Longitude.
  - `p_contact_phone` (TEXT, optional): Caller callback phone number.
  - `p_people_count` (INT, default 1): Number of individuals at risk.
  - `p_has_vulnerable` (BOOLEAN, default false): Presence of infants, pregnant women, or elderly.
  - `p_declared_urgency` (urgency_level): `low`, `medium`, `high`, `critical`.
  - `p_address_text` (TEXT, optional): Human-readable landmark/address.
- **Returns:** JSONB `{ id, short_code, status, priority_score, duplicate_of, is_existing }`.

---

### `assign_request`
- **Purpose:** Concurrency-safe assignment of an emergency request to an SDRF/NDRF rescue boat team.
- **Concurrency Control:** Utilizes `SELECT ... FOR UPDATE` row locking to guarantee two rescue teams or dispatchers cannot double-assign the same request simultaneously.
- **Security:** Accessible only by roles `admin` and `rescue_team`.
- **Parameters:**
  - `p_request_id` (UUID, required)
  - `p_team_id` (UUID, required)
- **Returns:** JSONB with operation ID, team details, and status.

---

### `update_request_status`
- **Purpose:** Advances request status through the strict operational state machine:
  `submitted → verified → prioritized → assigned → accepted → en_route → on_site → completed`.
- **Validation:** Enforces state machine rules; rejects illegal transitions or modifications to terminal states (`completed`, `cancelled`, `duplicate`).
- **Audit & Notification:** Automatically inserts records into `request_status_history` and triggers notifications to citizen and assigned crews.
- **Parameters:**
  - `p_request_id` (UUID)
  - `p_new_status` (request_status)
  - `p_note` (TEXT, optional)
  - `p_people_rescued` (INT, default 0)
- **Returns:** `BOOLEAN`.

---

### `update_team_telemetry`
- **Purpose:** Broadcasts rescue boat coordinates and team availability status.
- **Parameters:**
  - `p_team_id` (UUID)
  - `p_lat` (DOUBLE PRECISION)
  - `p_lng` (DOUBLE PRECISION)
  - `p_status` (team_status, optional)
- **Returns:** `BOOLEAN`.

---

## 2. Priority Scoring & Deduplication

### `compute_priority_score`
- **Formula:**
  $$\text{Score} = \text{BaseUrgency} + \min(25, \text{People} \times 4) + \text{VulnerableBonus} + \min(20, \lfloor\text{WaitTime}/10\rfloor \times 2) + \text{WaterLevelBonus}$$
- **Range:** Constrained strictly between `0` and `100`.

### `find_duplicate_request`
- **Parameters:** `p_lat`, `p_lng`, `p_citizen_id`, `p_phone`, `p_radius_m` (default 150m), `p_window_minutes` (default 60m).
- **PostGIS Expression:** `ST_DWithin(location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_m)`
- **Returns:** UUID of duplicate request if found within temporal and spatial window, or `NULL`.

---

## 3. Shelters & Weather Alerts

### `nearby_shelters`
- **Parameters:** `p_lat`, `p_lng`, `p_radius_m` (default 25km), `p_only_open` (default false).
- **Output:** Table of shelters ordered ascending by `ST_Distance(location, user_pt)`.

### `update_shelter_occupancy`
- **Parameters:** `p_shelter_id` (UUID), `p_new_occupancy` (INT).
- **Behavior:** Updates headcount, flips shelter status to `full` if occupancy $\ge$ max capacity, logs to `audit_logs`.

### `broadcast_weather_alert`
- **Parameters:** `p_severity`, `p_title`, `p_description`, `p_source`, `p_expires_in_hours`.
- **Fanout:** Automatically creates notification records for all active users in the system.

### `simulate_flood_scenario`
- **Purpose:** Admin command to inject a demo flash flood emergency scenario (reservoirs spilling, alerts broadcasting, water levels rising).
