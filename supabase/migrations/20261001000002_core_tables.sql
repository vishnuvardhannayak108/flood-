-- FERRCS: Migration 02 - Core Tables and Spatial Indexes

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'citizen',
    verification_status verification_status NOT NULL DEFAULT 'verified',
    preferred_language TEXT NOT NULL DEFAULT 'en',
    home_location geography(Point, 4326),
    emergency_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON public.profiles(verification_status);

-- 2. Rescue Teams Table
CREATE TABLE IF NOT EXISTS public.rescue_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    capacity INT NOT NULL DEFAULT 4,
    vehicle_type TEXT NOT NULL DEFAULT 'Inflatable Boat',
    status team_status NOT NULL DEFAULT 'available',
    current_location geography(Point, 4326),
    last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rescue_teams_status ON public.rescue_teams(status);
CREATE INDEX IF NOT EXISTS idx_rescue_teams_location ON public.rescue_teams USING GIST(current_location);

-- 3. Rescue Team Members
CREATE TABLE IF NOT EXISTS public.rescue_team_members (
    team_id UUID NOT NULL REFERENCES public.rescue_teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_leader BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (team_id, user_id)
);

-- 4. Volunteers Table
CREATE TABLE IF NOT EXISTS public.volunteers (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    skills TEXT[] NOT NULL DEFAULT '{}'::text[],
    availability BOOLEAN NOT NULL DEFAULT true,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    current_location geography(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_volunteers_location ON public.volunteers USING GIST(current_location);

-- 5. Flood Incidents Table
CREATE TABLE IF NOT EXISTS public.flood_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity urgency_level NOT NULL DEFAULT 'medium',
    location geography(Point, 4326) NOT NULL,
    water_level_cm NUMERIC,
    media_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_flood_incidents_location ON public.flood_incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_flood_incidents_status ON public.flood_incidents(verification_status);

-- 6. Emergency Requests Table
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code TEXT UNIQUE NOT NULL,
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES public.flood_incidents(id) ON DELETE SET NULL,
    type incident_type NOT NULL DEFAULT 'trapped',
    description TEXT,
    people_count INT NOT NULL DEFAULT 1 CHECK (people_count > 0),
    has_vulnerable_persons BOOLEAN NOT NULL DEFAULT false,
    declared_urgency urgency_level NOT NULL DEFAULT 'high',
    priority_score NUMERIC NOT NULL DEFAULT 50,
    status request_status NOT NULL DEFAULT 'submitted',
    location geography(Point, 4326) NOT NULL,
    location_accuracy_m NUMERIC,
    address_text TEXT,
    contact_phone TEXT NOT NULL,
    media_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
    duplicate_of UUID REFERENCES public.emergency_requests(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_request_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON public.emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_priority ON public.emergency_requests(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_location ON public.emergency_requests USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_citizen ON public.emergency_requests(citizen_id);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_client_id ON public.emergency_requests(client_request_id);

-- 7. Rescue Operations Table
CREATE TABLE IF NOT EXISTS public.rescue_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.rescue_teams(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status operation_status NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMPTZ,
    en_route_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    people_rescued INT DEFAULT 0,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_rescue_ops_request ON public.rescue_operations(request_id);
CREATE INDEX IF NOT EXISTS idx_rescue_ops_team ON public.rescue_operations(team_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_op_per_request 
    ON public.rescue_operations(request_id) 
    WHERE status NOT IN ('completed', 'aborted');

-- 8. Request Status History Table
CREATE TABLE IF NOT EXISTS public.request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    old_status request_status,
    new_status request_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_status_history_request ON public.request_status_history(request_id);

-- 9. Shelters Table
CREATE TABLE IF NOT EXISTS public.shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    location geography(Point, 4326) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    current_occupancy INT NOT NULL DEFAULT 0,
    contact_phone TEXT NOT NULL,
    facilities TEXT[] NOT NULL DEFAULT '{}'::text[],
    is_open BOOLEAN NOT NULL DEFAULT true,
    managed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT check_occupancy CHECK (current_occupancy >= 0 AND current_occupancy <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_shelters_location ON public.shelters USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_shelters_is_open ON public.shelters(is_open);

-- 10. Weather Alerts Table
CREATE TABLE IF NOT EXISTS public.weather_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL DEFAULT 'Open-Meteo',
    severity alert_severity NOT NULL DEFAULT 'warning',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    center geography(Point, 4326) NOT NULL,
    radius_m NUMERIC NOT NULL DEFAULT 5000,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_simulated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_center ON public.weather_alerts USING GIST(center);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active ON public.weather_alerts(starts_at, expires_at);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    related_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    related_alert_id UUID REFERENCES public.weather_alerts(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);

-- 12. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Volunteer Tasks Table
CREATE TABLE IF NOT EXISTS public.volunteer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.emergency_requests(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    location geography(Point, 4326),
    status task_status NOT NULL DEFAULT 'open',
    volunteer_id UUID REFERENCES public.volunteers(user_id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_status ON public.volunteer_tasks(status);

-- 14. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed default app settings
INSERT INTO public.app_settings (key, value) VALUES
    ('priority_weights', '{"urgency_critical": 40, "urgency_high": 25, "urgency_medium": 15, "urgency_low": 5, "people_multiplier": 3, "vulnerable_bonus": 15, "wait_per_min": 0.5}'::jsonb),
    ('duplicate_thresholds', '{"radius_meters": 150, "time_window_minutes": 60}'::jsonb),
    ('escalation_thresholds', '{"unassigned_critical_minutes": 10, "unassigned_high_minutes": 25}'::jsonb),
    ('emergency_contacts', '{"national": "112", "ndrf": "011-24363260", "state_disaster": "1070"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 15. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
