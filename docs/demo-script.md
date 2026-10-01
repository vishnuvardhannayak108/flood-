# FERRCS Demo Script & Evaluator Walkthrough Guide

This script guides evaluators through the complete emergency response lifecycle implemented in **FERRCS (Flood Emergency Response & Rescue Coordination System)**.

---

## 1. Demo Credentials & Quick Switch

The login page (`/login`) includes **1-Click Quick-Switch buttons** to instantly authenticate as any crisis actor without typing passwords:

| Role | Email | Password | Intended Screen |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@ferrcs.gov.in` | `Password123!` | `/citizen/sos`, `/citizen/requests` |
| **Rescue Responder** | `rescue@ferrcs.gov.in` | `Password123!` | `/rescue`, `/rescue/operations` |
| **Administrator** | `admin@ferrcs.gov.in` | `Password123!` | `/admin`, `/admin/requests` |
| **Volunteer** | `volunteer@ferrcs.gov.in` | `Password123!` | `/volunteer`, `/volunteer/tasks` |

---

## 2. Walkthrough Flow: The 6-Step Crisis Lifecycle

### Step 1: Citizen SOS Submission (`/citizen/sos`)
1. Open [http://localhost:3000/citizen/sos](http://localhost:3000/citizen/sos).
2. Note the **Offline Outbox Banner**: If offline, submissions are saved locally into IndexedDB and synced once reconnected.
3. Tap **"Trigger Emergency SOS"**:
   - Location is automatically acquired via High-Accuracy GPS (or falls back to Hyderabad center `17.3850° N, 78.4867° E`).
   - Fill in: **5 people**, check **"Infant / Elderly / Medical Patient"**, select **"Critical Urgency"**.
   - Input situation notes: *"Water reached 1st floor. Grandmother on oxygen."*
4. Click **"Confirm & Transmit SOS"**:
   - A unique short code is generated (e.g., `#FR-9823`).
   - The multi-factor priority algorithm instantly calculates a distress score (e.g., `94`).
   - The user is redirected to the live tracking screen (`/citizen/requests/[id]`).

### Step 2: Live Tracking & Safety Guidance (`/citizen/requests/[id]`)
1. Observe the vertical 7-stage operational state machine:
   `Submitted → Verified → Prioritized → Assigned → Accepted → En Route → On Site → Completed`.
2. Notice the emergency safety directives: *Move to highest elevation*, *Avoid electrical switchboards*, *Prepare white cloth signal*.

### Step 3: Rescue Team Priority Queue (`/rescue`)
1. Log in or switch to **Rescue Team** (`rescue@ferrcs.gov.in`).
2. Navigate to [http://localhost:3000/rescue](http://localhost:3000/rescue).
3. The requests are ordered by **Priority Score** (Distress weight + trapped count + vulnerable bonus + waiting escalation).
4. Tap **"View Details"** on `#FR-9823`:
   - Opens `/rescue/requests/req-1`.
   - Citizen phone number is unmasked upon accepting.
   - Click **"Launch GPS Navigation"** to view Google Maps turn-by-turn route.

### Step 4: Mission State Transitions (`/rescue/requests/[id]`)
1. On the detail screen, click **"Accept & Claim Rescue Mission"**:
   - Status transitions to `accepted`.
2. Click **"Depart Base & Mark En Route"**:
   - Status updates to `en_route`. Citizen receives live status update.
3. Click **"Confirm On Site (Boat Arrived)"**:
   - Status updates to `on_site`.
4. Click **"Complete Rescue Operation"**:
   - Prompts for confirmed evacuated headcount and shelter destination.
   - Click **"Confirm & Close Mission"**:
   - Status transitions to terminal `completed`.

### Step 5: Tactical Map & Fleet Overview (`/rescue/map`)
1. Navigate to `/rescue/map`.
2. Inspect the **Tactical Operations Map**:
   - Musi River flood water inundation corridor overlay.
   - Live rescue boat pins (Zodiacs, heavy flood rafts).
   - SOS pins color-coded by urgency.
   - Relief shelters with live occupancy bars.
   - Tap any pin to view details and launch navigation.

### Step 6: Shelter Operations & Admin Broadcast (`/admin/alerts` & `/admin/shelters`)
1. Switch to **Administrator** (`admin@ferrcs.gov.in`).
2. Go to `/admin/shelters`:
   - Use the **`+10` / `-10` headcount steppers** to simulate shelter admissions.
   - Notice the status automatically toggles to `FULL` when capacity is reached.
3. Go to `/admin/alerts`:
   - Click **"Simulate Flash Flood Scenario"**:
   - Immediately injects a critical weather warning, river gauge spike (+5.2m), and community waterlogging incidents into the live system.
4. Go to `/admin/reports`:
   - Review the response time SLA metrics.
   - Click **"Export CSV Dataset"** to download the complete crisis operations log.

---

## 3. Offline Resilience Verification
1. Disconnect Wi-Fi or toggle **Offline** in browser DevTools Network tab.
2. Submit an emergency report or update shelter headcount.
3. Notice the **Offline Warning Banner** indicates items queued in IndexedDB Outbox.
4. Toggle Network back to **Online**:
   - The background queue immediately replays pending operations and clears outbox.
