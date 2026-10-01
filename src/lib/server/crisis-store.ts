import fs from "fs";
import path from "path";
import { UrgencyLevel, RequestStatus } from "@/lib/status";
import { calculatePriorityScore } from "@/lib/priority";

export interface EmergencyRequestEntity {
  id: string;
  shortCode: string;
  citizenName: string;
  phone: string;
  urgency: UrgencyLevel;
  type: string;
  peopleCount: number;
  hasVulnerable: boolean;
  priorityScore: number;
  distanceKm: number;
  status: RequestStatus;
  createdAt: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  assignedTeam?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  notes?: string;
  history: Array<{ status: RequestStatus; time: string; note: string }>;
}

export interface ShelterEntity {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  maxCapacity: number;
  currentOccupancy: number;
  status: "open" | "full" | "closed";
  facilities: string[];
  contactPhone: string;
  contactPerson: string;
}

export interface WeatherAlertEntity {
  id: string;
  severity: "critical" | "warning" | "watch" | "advisory" | "info";
  title: string;
  description: string;
  source: string;
  issuedAt: string;
  expiresAt: string;
  suggestedAction?: string;
}

export interface FloodIncidentEntity {
  id: string;
  title: string;
  description: string;
  waterLevelCm: number;
  locationName: string;
  lat: number;
  lng: number;
  reporterName: string;
  reportedAt: string;
  status: "pending" | "verified" | "rejected";
}

export interface RescueTeamEntity {
  id: string;
  name: string;
  callsign: string;
  baseStation: string;
  boatType: string;
  capacity: number;
  sector: string;
  status: "available" | "busy" | "offline";
  responderCount: number;
  leadName: string;
  leadPhone: string;
  lat: number;
  lng: number;
}

export interface VolunteerTaskEntity {
  id: string;
  title: string;
  category: "food" | "medical" | "shelter" | "sandbags";
  location: string;
  lat: number;
  lng: number;
  timeSlot: string;
  needed: number;
  joined: number;
  urgency: "urgent" | "normal";
  description: string;
  status: "open" | "joined" | "completed";
}

export interface AuditLogEntity {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
  diff: Record<string, unknown>;
}

export interface UserProfileEntity {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "citizen" | "rescue_team" | "volunteer" | "admin";
  verificationStatus: "verified" | "pending" | "rejected";
  isActive: boolean;
  createdAt: string;
}

interface CrisisDataState {
  requests: EmergencyRequestEntity[];
  shelters: ShelterEntity[];
  alerts: WeatherAlertEntity[];
  incidents: FloodIncidentEntity[];
  teams: RescueTeamEntity[];
  volunteerTasks: VolunteerTaskEntity[];
  auditLogs: AuditLogEntity[];
  users: UserProfileEntity[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "crisis-store.json");

// Default initial state for a fresh system (real shelters and teams, empty request queue until submitted)
function getInitialState(): CrisisDataState {
  return {
    requests: [],
    shelters: [
      {
        id: "sh-1",
        name: "GHMC Amberpet Indoor Stadium Relief Camp",
        address: "Near 6 No. Junction, Amberpet, Hyderabad",
        lat: 17.3895,
        lng: 78.518,
        maxCapacity: 500,
        currentOccupancy: 0,
        status: "open",
        facilities: ["Medical Post", "Hot Meals", "Power Backup", "Dry Clothing", "Sanitation"],
        contactPhone: "+91 94401 55667",
        contactPerson: "Dr. K. Srinivas",
      },
      {
        id: "sh-2",
        name: "Govt High School Relief Center Malakpet",
        address: "Beside Old Police Station, Malakpet, Hyderabad",
        lat: 17.367,
        lng: 78.498,
        maxCapacity: 350,
        currentOccupancy: 0,
        status: "open",
        facilities: ["First Aid", "Drinking Water", "Baby Food", "Sleeping Mats"],
        contactPhone: "+91 94401 88990",
        contactPerson: "M. Anitha",
      },
      {
        id: "sh-3",
        name: "Chaderghat Community Hall Emergency Shelter",
        address: "Chaderghat Main Road, Near Fire Station, Hyderabad",
        lat: 17.378,
        lng: 78.489,
        maxCapacity: 250,
        currentOccupancy: 0,
        status: "open",
        facilities: ["Emergency First Aid", "Community Kitchen"],
        contactPhone: "+91 98480 34567",
        contactPerson: "V. Raghunath",
      },
      {
        id: "sh-4",
        name: "Begumpet High-Ground Relief Camp",
        address: "Old Airport Road, Near Flyover, Begumpet, Hyderabad",
        lat: 17.4447,
        lng: 78.4664,
        maxCapacity: 400,
        currentOccupancy: 0,
        status: "open",
        facilities: ["Medical Doctors", "Food Distribution", "Emergency Power", "Blankets"],
        contactPhone: "+91 94401 77881",
        contactPerson: "Capt. A. Joseph",
      },
    ],
    alerts: [],
    incidents: [],
    teams: [
      {
        id: "team-1",
        name: "Team Alpha 01",
        callsign: "ECHO-1",
        baseStation: "Chaderghat Fire Station",
        boatType: "Motorized Zodiac Inflatable (40 HP)",
        capacity: 6,
        sector: "Sector Central - Musi River",
        status: "available",
        responderCount: 4,
        leadName: "Commander Vikram Rao",
        leadPhone: "+91 98480 11111",
        lat: 17.3753,
        lng: 78.4878,
      },
      {
        id: "team-2",
        name: "Team Bravo 02",
        callsign: "ECHO-2",
        baseStation: "Malakpet Police Ground",
        boatType: "Heavy Rescue Flood Raft",
        capacity: 10,
        sector: "Sector East - Moosarambagh",
        status: "available",
        responderCount: 6,
        leadName: "Capt. Rajesh Verma",
        leadPhone: "+91 98480 22222",
        lat: 17.3705,
        lng: 78.5022,
      },
      {
        id: "team-3",
        name: "Team Charlie 03",
        callsign: "ECHO-3",
        baseStation: "Begumpet SDRF Base",
        boatType: "Rigid Hull Rescue Boat",
        capacity: 8,
        sector: "Sector North - Hussain Sagar Corridor",
        status: "available",
        responderCount: 5,
        leadName: "Sub-Inspector P. Naresh",
        leadPhone: "+91 98480 33333",
        lat: 17.4447,
        lng: 78.4664,
      },
      {
        id: "team-4",
        name: "Team Delta 04",
        callsign: "ECHO-4",
        baseStation: "Amberpet GHMC Depot",
        boatType: "Amphibious Evacuation Craft",
        capacity: 12,
        sector: "Sector East - Amberpet Floodplain",
        status: "available",
        responderCount: 6,
        leadName: "Officer S. Venkat",
        leadPhone: "+91 98480 44444",
        lat: 17.3895,
        lng: 78.518,
      },
    ],
    volunteerTasks: [
      {
        id: "vt-1",
        title: "Clean Drinking Water & Meal Rations Distribution",
        category: "food",
        location: "Amberpet Indoor Stadium (Gate 2)",
        lat: 17.3895,
        lng: 78.518,
        timeSlot: "11:00 AM - 02:00 PM",
        needed: 6,
        joined: 0,
        urgency: "urgent",
        description: "Distribute hot meals, bottled water, and ORS packets to incoming evacuees.",
        status: "open",
      },
      {
        id: "vt-2",
        title: "Survivor Intake & Health Registration",
        category: "shelter",
        location: "Malakpet Govt High School Relief Center",
        lat: 17.367,
        lng: 78.498,
        timeSlot: "01:00 PM - 05:00 PM",
        needed: 4,
        joined: 0,
        urgency: "normal",
        description: "Assist shelter in-charge with victim intake and blanket distribution.",
        status: "open",
      },
      {
        id: "vt-3",
        title: "Sandbag Barrier Reinforcement",
        category: "sandbags",
        location: "Chaderghat River Bank Bund",
        lat: 17.378,
        lng: 78.489,
        timeSlot: "02:00 PM - 06:00 PM",
        needed: 10,
        joined: 0,
        urgency: "urgent",
        description: "Stack sandbags along vulnerable breach points to prevent low-lying colony inundation.",
        status: "open",
      },
      {
        id: "vt-4",
        title: "Emergency Medical Kit Staging & First-Aid Support",
        category: "medical",
        location: "Begumpet SDRF High-Ground Camp",
        lat: 17.4447,
        lng: 78.4664,
        timeSlot: "03:00 PM - 07:00 PM",
        needed: 5,
        joined: 0,
        urgency: "normal",
        description: "Organize triage tents, sort anti-venom and antibiotic supplies with medical officers.",
        status: "open",
      },
    ],
    auditLogs: [],
    users: getDefaultUsers(),
  };
}

function getDefaultUsers(): UserProfileEntity[] {
  return [
    {
      id: "usr-1",
      fullName: "Chief Operations Director",
      email: "admin@ferrcs.gov.in",
      phone: "+91 94400 00001",
      role: "admin",
      verificationStatus: "verified",
      isActive: true,
      createdAt: "01 Oct 2026",
    },
    {
      id: "usr-2",
      fullName: "Commander Vikram Rao",
      email: "rescue@ferrcs.gov.in",
      phone: "+91 94400 00002",
      role: "rescue_team",
      verificationStatus: "verified",
      isActive: true,
      createdAt: "01 Oct 2026",
    },
    {
      id: "usr-3",
      fullName: "Ramesh Sharma",
      email: "citizen@ferrcs.gov.in",
      phone: "+91 94400 00003",
      role: "citizen",
      verificationStatus: "verified",
      isActive: true,
      createdAt: "01 Oct 2026",
    },
    {
      id: "usr-4",
      fullName: "Anita Desai (Relief Volunteer)",
      email: "volunteer@ferrcs.gov.in",
      phone: "+91 94400 00004",
      role: "volunteer",
      verificationStatus: "verified",
      isActive: true,
      createdAt: "01 Oct 2026",
    },
    {
      id: "usr-5",
      fullName: "K. Satish (SDRF Diver Applicant)",
      email: "satish.diver@telangana.gov.in",
      phone: "+91 98480 77665",
      role: "rescue_team",
      verificationStatus: "pending",
      isActive: true,
      createdAt: "Today at 07:45 AM",
    },
    {
      id: "usr-6",
      fullName: "Sunil Reddy (Red Cross Volunteer)",
      email: "sunil.rc@gmail.com",
      phone: "+91 99887 11223",
      role: "volunteer",
      verificationStatus: "pending",
      isActive: true,
      createdAt: "Today at 08:30 AM",
    },
  ];
}

let inMemoryState: CrisisDataState | null = null;

function loadState(): CrisisDataState {
  if (inMemoryState) return inMemoryState;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      inMemoryState = JSON.parse(raw);
      if (!inMemoryState!.users || !Array.isArray(inMemoryState!.users)) {
        inMemoryState!.users = getDefaultUsers();
        saveState(inMemoryState!);
      }
      return inMemoryState!;
    }
  } catch (err) {
    console.warn("Could not read persistent crisis-store.json:", err);
  }

  inMemoryState = getInitialState();
  saveState(inMemoryState);
  return inMemoryState;
}

function saveState(state: CrisisDataState) {
  inMemoryState = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write persistent crisis-store.json:", err);
  }
}

export const CrisisStore = {
  // Requests
  getRequests(filter?: { status?: string; urgency?: string }): EmergencyRequestEntity[] {
    const state = loadState();
    let res = state.requests;
    if (filter?.status && filter.status !== "all") {
      res = res.filter((r) => r.status === filter.status);
    }
    if (filter?.urgency && filter.urgency !== "all") {
      res = res.filter((r) => r.urgency === filter.urgency);
    }
    // Sort by priorityScore descending
    return [...res].sort((a, b) => b.priorityScore - a.priorityScore);
  },

  getRequestById(idOrCode: string): EmergencyRequestEntity | null {
    const state = loadState();
    return (
      state.requests.find(
        (r) =>
          r.id === idOrCode ||
          r.shortCode.toLowerCase() === idOrCode.toLowerCase() ||
          `fr-${r.shortCode.toLowerCase()}` === idOrCode.toLowerCase()
      ) || null
    );
  },

  createRequest(data: {
    lat: number;
    lng: number;
    phone?: string;
    citizenName?: string;
    peopleCount: number;
    hasVulnerable: boolean;
    urgency: UrgencyLevel;
    type: string;
    description: string;
    address?: string;
  }): EmergencyRequestEntity {
    const state = loadState();

    // Generate random short code
    const shortNum = Math.floor(1000 + Math.random() * 9000);
    const shortCode = `FR-${shortNum}`;
    const id = `req-${Date.now()}`;

    // Compute priority score using the multi-factor algorithm
    const priorityScore = calculatePriorityScore({
      urgency: data.urgency,
      peopleCount: data.peopleCount,
      hasVulnerable: data.hasVulnerable,
      waitingMinutes: 0,
    });

    const newReq: EmergencyRequestEntity = {
      id,
      shortCode,
      citizenName: data.citizenName || "Emergency Caller",
      phone: data.phone || "+91 94400 00000",
      urgency: data.urgency,
      type: data.type || "Trapped / Flood Evacuation",
      peopleCount: data.peopleCount || 1,
      hasVulnerable: !!data.hasVulnerable,
      priorityScore,
      distanceKm: 1.5,
      status: "prioritized",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      address: data.address || `Near ${data.lat.toFixed(4)}° N, ${data.lng.toFixed(4)}° E`,
      lat: data.lat,
      lng: data.lng,
      description: data.description,
      history: [
        {
          status: "submitted",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          note: "Distress SOS submitted via mobile emergency portal",
        },
        {
          status: "prioritized",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          note: `Priority score evaluated at ${priorityScore} pts`,
        },
      ],
    };

    state.requests.unshift(newReq);

    // Audit log
    state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: "SUBMIT_SOS",
      tableName: "emergency_requests",
      recordId: newReq.shortCode,
      actorName: newReq.citizenName,
      actorRole: "citizen",
      createdAt: "Just now",
      diff: { urgency: newReq.urgency, people: newReq.peopleCount, score: newReq.priorityScore },
    });

    saveState(state);
    return newReq;
  },

  updateRequestStatus(
    id: string,
    newStatus: RequestStatus,
    note?: string,
    actorName = "Rescue Team",
    actorRole = "rescue_team",
    assignedTeam?: string
  ): EmergencyRequestEntity | null {
    const state = loadState();
    const req = state.requests.find((r) => r.id === id || r.shortCode === id);
    if (!req) return null;

    const oldStatus = req.status;
    req.status = newStatus;
    if (assignedTeam) {
      req.assignedTeam = assignedTeam;
    }
    if (note) {
      req.notes = note;
    }

    req.history.push({
      status: newStatus,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      note: note || `Status transitioned from ${oldStatus} to ${newStatus}`,
    });

    state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: "UPDATE_STATUS",
      tableName: "emergency_requests",
      recordId: req.shortCode,
      actorName,
      actorRole,
      createdAt: "Just now",
      diff: { oldStatus, newStatus, note, assignedTeam },
    });

    saveState(state);
    return req;
  },

  // Shelters
  getShelters(): ShelterEntity[] {
    return loadState().shelters;
  },

  updateShelterOccupancy(id: string, newOccupancy?: number, status?: "open" | "full" | "closed", actorName?: string, actorRole?: string): ShelterEntity | null {
    const state = loadState();
    const s = state.shelters.find((item) => item.id === id);
    if (!s) return null;

    if (newOccupancy !== undefined) {
      s.currentOccupancy = Math.max(0, newOccupancy);
    }
    if (status) {
      s.status = status;
    } else {
      s.status = s.currentOccupancy >= s.maxCapacity ? "full" : "open";
    }

    state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: "UPDATE_OCCUPANCY",
      tableName: "shelters",
      recordId: s.name,
      actorName: actorName || "Shelter Coordinator",
      actorRole: actorRole || "admin",
      createdAt: "Just now",
      diff: { occupancy: s.currentOccupancy, capacity: s.maxCapacity, status: s.status },
    });

    saveState(state);
    return s;
  },

  createShelter(data: Omit<ShelterEntity, "id">): ShelterEntity {
    const state = loadState();
    const newShelter: ShelterEntity = {
      ...data,
      id: `sh-${Date.now()}`,
    };
    state.shelters.push(newShelter);
    saveState(state);
    return newShelter;
  },

  // Alerts
  getAlerts(): WeatherAlertEntity[] {
    return loadState().alerts;
  },

  createAlert(data: Omit<WeatherAlertEntity, "id">): WeatherAlertEntity {
    const state = loadState();
    const newAlert: WeatherAlertEntity = {
      ...data,
      id: `alert-${Date.now()}`,
    };
    state.alerts.unshift(newAlert);

    state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: "BROADCAST_ALERT",
      tableName: "weather_alerts",
      recordId: newAlert.title,
      actorName: "Chief Operations Director",
      actorRole: "admin",
      createdAt: "Just now",
      diff: { severity: newAlert.severity, title: newAlert.title },
    });

    saveState(state);
    return newAlert;
  },

  deleteAlert(id: string) {
    const state = loadState();
    state.alerts = state.alerts.filter((a) => a.id !== id);
    saveState(state);
  },

  // Incidents
  getIncidents(): FloodIncidentEntity[] {
    return loadState().incidents;
  },

  createIncident(data: Omit<FloodIncidentEntity, "id" | "status" | "reportedAt">): FloodIncidentEntity {
    const state = loadState();
    const newInc: FloodIncidentEntity = {
      ...data,
      id: `inc-${Date.now()}`,
      status: "pending",
      reportedAt: "Just now",
    };
    state.incidents.unshift(newInc);
    saveState(state);
    return newInc;
  },

  updateIncidentStatus(id: string, status: "verified" | "rejected" | "pending"): FloodIncidentEntity | null {
    const state = loadState();
    const inc = state.incidents.find((i) => i.id === id);
    if (!inc) return null;
    inc.status = status;
    saveState(state);
    return inc;
  },

  // Teams
  getTeams(): RescueTeamEntity[] {
    return loadState().teams;
  },

  updateTeamStatus(id: string, status: "available" | "busy" | "offline"): RescueTeamEntity | null {
    const state = loadState();
    const team = state.teams.find((t) => t.id === id);
    if (!team) return null;
    team.status = status;
    saveState(state);
    return team;
  },

  createTeam(data: Omit<RescueTeamEntity, "id">): RescueTeamEntity {
    const state = loadState();
    const newTeam: RescueTeamEntity = {
      ...data,
      id: `team-${Date.now()}`,
    };
    state.teams.push(newTeam);
    saveState(state);
    return newTeam;
  },

  // Volunteer Tasks
  getVolunteerTasks(): VolunteerTaskEntity[] {
    return loadState().volunteerTasks;
  },

  toggleVolunteerTask(id: string): VolunteerTaskEntity | null {
    const state = loadState();
    const t = state.volunteerTasks.find((item) => item.id === id);
    if (!t) return null;
    if (t.status === "joined") {
      t.status = "open";
      t.joined = Math.max(0, t.joined - 1);
    } else {
      t.status = "joined";
      t.joined += 1;
    }
    saveState(state);
    return t;
  },

  completeVolunteerTask(id: string): VolunteerTaskEntity | null {
    const state = loadState();
    const t = state.volunteerTasks.find((item) => item.id === id);
    if (!t) return null;
    t.status = "completed";
    saveState(state);
    return t;
  },

  // Audit Logs
  getAuditLogs(): AuditLogEntity[] {
    return loadState().auditLogs;
  },

  // Users
  getUsers(): UserProfileEntity[] {
    return loadState().users;
  },

  updateUser(id: string, updates: Partial<UserProfileEntity>): UserProfileEntity | null {
    const state = loadState();
    const u = state.users.find((user) => user.id === id);
    if (!u) return null;

    Object.assign(u, updates);
    state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: "UPDATE_USER_ROLE",
      tableName: "profiles",
      recordId: u.fullName,
      actorName: "System Admin",
      actorRole: "admin",
      createdAt: "Just now",
      diff: updates,
    });
    saveState(state);
    return u;
  },

  // Simulation Trigger
  simulateFloodCrisis(): { alert: WeatherAlertEntity; incident: FloodIncidentEntity; request: EmergencyRequestEntity } {
    const alert = this.createAlert({
      severity: "critical",
      title: "FLASH FLOOD EMERGENCY: Himayat Sagar Gate Spill (+5.2m)",
      description:
        "Severe cloudburst over catchment area. 12 reservoir gates opened at 24,000 cusecs. Immediate evacuation ordered for all settlements within 300m of Musi river banks.",
      source: "Hydrology Rapid Warning Radar",
      issuedAt: "Just now (Simulation)",
      expiresAt: "In 12 hours",
      suggestedAction: "Evacuate immediately to Amberpet or Malakpet High Ground Relief Centers.",
    });

    const incident = this.createIncident({
      title: "Moosarambagh Cause-way Submerged Under 4.5ft Water",
      description: "Water flowing with high velocity over causeway. Road completely closed for all vehicles.",
      waterLevelCm: 140,
      locationName: "Moosarambagh Old Causeway",
      lat: 17.3705,
      lng: 78.5022,
      reporterName: "Traffic Control Center",
    });

    const request = this.createRequest({
      lat: 17.3753,
      lng: 78.4878,
      phone: "+91 98490 12345",
      citizenName: "Ramesh Sharma",
      peopleCount: 5,
      hasVulnerable: true,
      urgency: "critical",
      type: "Trapped on Rooftop",
      description: "Water reached 1st floor ceiling. Elderly grandmother on oxygen cylinder and two infants.",
      address: "Riverfront Colony, Chaderghat, Musi River Bank",
    });

    return { alert, incident, request };
  },

  // Reset to Pristine Clean State
  reset(): CrisisDataState {
    const fresh = getInitialState();
    saveState(fresh);
    return fresh;
  },
};
