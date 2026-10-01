-- FERRCS: All Migrations Combined

-- ==========================================
-- Migration: 20261001000001_extensions_and_enums.sql
-- ==========================================

-- FERRCS: Migration 01 - Extensions and Enums
-- Enable spatial and crypto extensions

CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('citizen', 'rescue_team', 'volunteer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'submitted',
        'verified',
        'prioritized',
        'assigned',
        'accepted',
        'en_route',
        'on_site',
        'completed',
        'cancelled',
        'rejected',
        'duplicate'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_type AS ENUM (
        'flooding',
        'trapped',
        'medical',
        'structural_damage',
        'missing_person',
        'supplies_needed',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('info', 'advisory', 'warning', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('open', 'accepted', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE team_status AS ENUM ('available', 'busy', 'offline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE operation_status AS ENUM (
        'assigned',
        'accepted',
        'en_route',
        'on_site',
        'completed',
        'aborted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ==========================================
-- Migration: 20261001000002_core_tables.sql
-- ==========================================

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


-- ==========================================
-- Migration: 20261001000003_rls_policies.sql
-- ==========================================

-- FERRCS: Migration 03 - Row Level Security (RLS) Policies

-- Helper: Get current user's role securely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

-- Helper: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = (SELECT auth.uid())), false);
$$;

-- Helper: Get current user's rescue team ID
CREATE OR REPLACE FUNCTION public.get_my_rescue_team_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT team_id FROM public.rescue_team_members WHERE user_id = (SELECT auth.uid()) LIMIT 1;
$$;

-- Guard trigger: Prevent non-admins from changing role or verification_status on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_role_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Only administrators can modify user role or verification status.';
        END IF;
    END IF;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_role_fields();

-- Enable RLS on ALL public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()) OR public.is_admin())
    WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());

-- Rescue team can view citizen name and phone for assigned operations
CREATE POLICY "profiles_select_assigned_for_rescue" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        public.get_my_role() = 'rescue_team' AND
        id IN (
            SELECT er.citizen_id 
            FROM public.emergency_requests er
            JOIN public.rescue_operations ro ON er.id = ro.request_id
            WHERE ro.team_id = public.get_my_rescue_team_id()
              AND ro.status NOT IN ('completed', 'aborted')
        )
    );

-- 2. Rescue Teams Policies
CREATE POLICY "rescue_teams_select_all" ON public.rescue_teams
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "rescue_teams_admin_all" ON public.rescue_teams
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "rescue_teams_update_own" ON public.rescue_teams
    FOR UPDATE TO authenticated
    USING (id = public.get_my_rescue_team_id())
    WITH CHECK (id = public.get_my_rescue_team_id());

-- 3. Rescue Team Members Policies
CREATE POLICY "rescue_members_select" ON public.rescue_team_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "rescue_members_admin_all" ON public.rescue_team_members
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Volunteers Policies
CREATE POLICY "volunteers_select" ON public.volunteers
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "volunteers_update_own" ON public.volunteers
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "volunteers_admin_all" ON public.volunteers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Flood Incidents Policies
CREATE POLICY "incidents_select" ON public.flood_incidents
    FOR SELECT TO authenticated
    USING (
        verification_status = 'verified' OR 
        reported_by = (SELECT auth.uid()) OR 
        public.is_admin() OR
        public.get_my_role() = 'rescue_team'
    );

CREATE POLICY "incidents_insert" ON public.flood_incidents
    FOR INSERT TO authenticated
    WITH CHECK (reported_by = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "incidents_admin_all" ON public.flood_incidents
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Emergency Requests Policies
CREATE POLICY "requests_select_citizen" ON public.emergency_requests
    FOR SELECT TO authenticated
    USING (citizen_id = (SELECT auth.uid()));

CREATE POLICY "requests_select_rescue" ON public.emergency_requests
    FOR SELECT TO authenticated
    USING (
        public.get_my_role() = 'rescue_team' AND
        (status IN ('verified', 'prioritized', 'assigned', 'accepted', 'en_route', 'on_site') OR
         id IN (SELECT request_id FROM public.rescue_operations WHERE team_id = public.get_my_rescue_team_id()))
    );

CREATE POLICY "requests_admin_all" ON public.emergency_requests
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Rescue Operations Policies
CREATE POLICY "operations_select_citizen" ON public.rescue_operations
    FOR SELECT TO authenticated
    USING (
        request_id IN (SELECT id FROM public.emergency_requests WHERE citizen_id = (SELECT auth.uid()))
    );

CREATE POLICY "operations_select_rescue" ON public.rescue_operations
    FOR SELECT TO authenticated
    USING (
        team_id = public.get_my_rescue_team_id() OR public.is_admin()
    );

CREATE POLICY "operations_admin_all" ON public.rescue_operations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. Request Status History Policies
CREATE POLICY "history_select_citizen" ON public.request_status_history
    FOR SELECT TO authenticated
    USING (
        request_id IN (SELECT id FROM public.emergency_requests WHERE citizen_id = (SELECT auth.uid()))
    );

CREATE POLICY "history_select_rescue" ON public.request_status_history
    FOR SELECT TO authenticated
    USING (
        public.get_my_role() = 'rescue_team' AND
        request_id IN (SELECT request_id FROM public.rescue_operations WHERE team_id = public.get_my_rescue_team_id())
    );

CREATE POLICY "history_admin_all" ON public.request_status_history
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. Shelters Policies
CREATE POLICY "shelters_select_open" ON public.shelters
    FOR SELECT TO authenticated
    USING (is_open = true OR public.is_admin() OR public.get_my_role() = 'rescue_team');

CREATE POLICY "shelters_admin_all" ON public.shelters
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. Weather Alerts Policies
CREATE POLICY "alerts_select" ON public.weather_alerts
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "alerts_admin_all" ON public.weather_alerts
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 11. Notifications Policies
CREATE POLICY "notifications_own" ON public.notifications
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- 12. Push Subscriptions Policies
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- 13. Volunteer Tasks Policies
CREATE POLICY "volunteer_tasks_select" ON public.volunteer_tasks
    FOR SELECT TO authenticated
    USING (
        status = 'open' OR 
        volunteer_id = (SELECT auth.uid()) OR 
        public.is_admin() OR 
        public.get_my_role() = 'rescue_team'
    );

CREATE POLICY "volunteer_tasks_admin_all" ON public.volunteer_tasks
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 14. App Settings Policies
CREATE POLICY "settings_select" ON public.app_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "settings_admin_all" ON public.app_settings
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 15. Audit Logs Policies
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin());


-- ==========================================
-- Migration: 20261001000004_rpcs_and_state_machine.sql
-- ==========================================

-- FERRCS: Migration 04 - Core Auth Triggers, Audited Admin RPCs, and Public Aggregates

-- 1. Automatic User Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    requested_role public.user_role := 'citizen';
    role_text text;
    v_status public.verification_status := 'verified';
    user_name text;
    user_phone text;
BEGIN
    -- Extract optional raw user metadata
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'FERRCS User');
    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');
    role_text := NEW.raw_user_meta_data->>'role';

    -- Determine requested role (disallow self-assigning admin)
    IF role_text = 'rescue_team' THEN
        requested_role := 'rescue_team';
        v_status := 'pending';
    ELSIF role_text = 'volunteer' THEN
        requested_role := 'volunteer';
        v_status := 'pending';
    ELSE
        requested_role := 'citizen';
        v_status := 'verified';
    END IF;

    -- Insert into public.profiles
    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role,
        verification_status,
        preferred_language,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_name,
        user_phone,
        requested_role,
        v_status,
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 2. Human-friendly Short Code Generator
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    result TEXT := 'FR-';
    i INT;
    candidate TEXT;
BEGIN
    LOOP
        result := 'FR-';
        FOR i IN 1..4 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        -- Check if exists
        PERFORM 1 FROM public.emergency_requests WHERE short_code = result;
        IF NOT FOUND THEN
            RETURN result;
        END IF;
    END LOOP;
END;
$$;

-- 3. Admin: Change User Role (Audited)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
    p_user_id UUID,
    p_new_role public.user_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := (SELECT auth.uid());
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    UPDATE public.profiles
    SET role = p_new_role,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (
        caller_id,
        'CHANGE_ROLE',
        'profiles',
        p_user_id,
        jsonb_build_object('new_role', p_new_role)
    );

    RETURN TRUE;
END;
$$;

-- 4. Admin: Verify or Suspend User (Audited)
CREATE OR REPLACE FUNCTION public.admin_verify_user(
    p_user_id UUID,
    p_new_status public.verification_status
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_id UUID := (SELECT auth.uid());
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    UPDATE public.profiles
    SET verification_status = p_new_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Also update volunteer/rescue status if exists
    UPDATE public.volunteers
    SET verification_status = p_new_status
    WHERE user_id = p_user_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, metadata)
    VALUES (
        caller_id,
        'VERIFY_USER',
        'profiles',
        p_user_id,
        jsonb_build_object('verification_status', p_new_status)
    );

    RETURN TRUE;
END;
$$;

-- 5. Public Aggregate Stats (No PII, cached/live)
CREATE OR REPLACE FUNCTION public.public_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_active_rescues INT;
    v_open_shelters INT;
    v_total_completed INT;
    v_available_teams INT;
BEGIN
    SELECT COUNT(*) INTO v_active_rescues
    FROM public.emergency_requests
    WHERE status IN ('assigned', 'accepted', 'en_route', 'on_site');

    SELECT COUNT(*) INTO v_open_shelters
    FROM public.shelters
    WHERE is_open = true;

    SELECT COUNT(*) INTO v_total_completed
    FROM public.emergency_requests
    WHERE status = 'completed';

    SELECT COUNT(*) INTO v_available_teams
    FROM public.rescue_teams
    WHERE status = 'available';

    RETURN jsonb_build_object(
        'active_rescues', v_active_rescues,
        'open_shelters', v_open_shelters,
        'total_completed', v_total_completed,
        'available_teams', v_available_teams
    );
END;
$$;

-- Grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.public_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_short_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_user(UUID, public.verification_status) TO authenticated;


-- ==========================================
-- Migration: 20261001000005_emergency_reporting_rpcs.sql
-- ==========================================

-- FERRCS: Migration 05 - Emergency Reporting, Scoring, and Duplicate Detection RPCs

-- 1. Compute Priority Score Function
CREATE OR REPLACE FUNCTION public.compute_priority_score(
    p_urgency public.urgency_level,
    p_people_count INT,
    p_has_vulnerable BOOLEAN,
    p_created_at TIMESTAMPTZ,
    p_location geography(Point, 4326)
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
    v_score NUMERIC := 0;
    v_urgency_pts NUMERIC := 15;
    v_people_mult NUMERIC := 3;
    v_vulnerable_pts NUMERIC := 15;
    v_wait_pts_per_min NUMERIC := 0.5;
    v_minutes_waited NUMERIC := 0;
    v_nearby_incident_bonus NUMERIC := 0;
BEGIN
    -- Read weights from app_settings
    SELECT 
        COALESCE((value->>'people_multiplier')::numeric, 3),
        COALESCE((value->>'vulnerable_bonus')::numeric, 15),
        COALESCE((value->>'wait_per_min')::numeric, 0.5)
    INTO v_people_mult, v_vulnerable_pts, v_wait_pts_per_min
    FROM public.app_settings
    WHERE key = 'priority_weights';

    -- Urgency Base Points
    IF p_urgency = 'critical' THEN
        v_urgency_pts := 40;
    ELSIF p_urgency = 'high' THEN
        v_urgency_pts := 25;
    ELSIF p_urgency = 'medium' THEN
        v_urgency_pts := 15;
    ELSE
        v_urgency_pts := 5;
    END IF;

    -- Calculate Waiting Escalation
    IF p_created_at IS NOT NULL THEN
        v_minutes_waited := GREATEST(0, EXTRACT(EPOCH FROM (timezone('utc'::text, now()) - p_created_at)) / 60);
    END IF;

    -- Proximity to verified severe flood incident (within 500m adds 10 bonus points)
    IF p_location IS NOT NULL THEN
        SELECT CASE WHEN EXISTS (
            SELECT 1 
            FROM public.flood_incidents 
            WHERE verification_status = 'verified' 
              AND severity IN ('high', 'critical')
              AND public.ST_DWithin(location, p_location, 500)
        ) THEN 10 ELSE 0 END INTO v_nearby_incident_bonus;
    END IF;

    -- Calculate Final Weighted Score (Capped between 1 and 100)
    v_score := v_urgency_pts 
        + (LEAST(GREATEST(p_people_count, 1), 20) * v_people_mult)
        + (CASE WHEN p_has_vulnerable THEN v_vulnerable_pts ELSE 0 END)
        + (LEAST(v_minutes_waited * v_wait_pts_per_min, 25))
        + v_nearby_incident_bonus;

    RETURN LEAST(ROUND(v_score, 1), 100.0);
END;
$$;

-- 2. Flag Duplicates Helper
CREATE OR REPLACE FUNCTION public.find_duplicate_request(
    p_location geography(Point, 4326),
    p_phone TEXT,
    p_citizen_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
    v_dup_id UUID := NULL;
    v_radius_m NUMERIC := 150;
    v_window_mins NUMERIC := 60;
BEGIN
    SELECT 
        COALESCE((value->>'radius_meters')::numeric, 150),
        COALESCE((value->>'time_window_minutes')::numeric, 60)
    INTO v_radius_m, v_window_mins
    FROM public.app_settings
    WHERE key = 'duplicate_thresholds';

    -- Search for existing active request within spatial radius & time window
    SELECT id INTO v_dup_id
    FROM public.emergency_requests
    WHERE status NOT IN ('completed', 'cancelled', 'rejected', 'duplicate')
      AND created_at >= (timezone('utc'::text, now()) - (v_window_mins || ' minutes')::interval)
      AND (
          (p_location IS NOT NULL AND location IS NOT NULL AND public.ST_DWithin(location, p_location, v_radius_m))
          OR (p_phone IS NOT NULL AND contact_phone = p_phone)
          OR (p_citizen_id IS NOT NULL AND citizen_id = p_citizen_id)
      )
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN v_dup_id;
END;
$$;

-- 3. Idempotent SOS Submission RPC
CREATE OR REPLACE FUNCTION public.submit_sos(
    p_client_request_id TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_accuracy NUMERIC DEFAULT NULL,
    p_contact_phone TEXT DEFAULT NULL,
    p_people_count INT DEFAULT 1,
    p_has_vulnerable BOOLEAN DEFAULT false,
    p_declared_urgency public.urgency_level DEFAULT 'critical',
    p_type public.incident_type DEFAULT 'trapped',
    p_description TEXT DEFAULT 'Immediate SOS requested via FERRCS button',
    p_address_text TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_existing_id UUID;
    v_short_code TEXT;
    v_location geography(Point, 4326);
    v_dup_of UUID;
    v_priority NUMERIC;
    v_phone TEXT := p_contact_phone;
    v_req_record public.emergency_requests%ROWTYPE;
BEGIN
    -- Idempotency check: Return existing record if already submitted
    IF p_client_request_id IS NOT NULL THEN
        SELECT * INTO v_req_record
        FROM public.emergency_requests
        WHERE client_request_id = p_client_request_id;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'id', v_req_record.id,
                'short_code', v_req_record.short_code,
                'status', v_req_record.status,
                'is_existing', true
            );
        END IF;
    END IF;

    -- Validate phone
    IF v_phone IS NULL OR trim(v_phone) = '' THEN
        SELECT phone INTO v_phone FROM public.profiles WHERE id = v_caller_id;
        IF v_phone IS NULL OR trim(v_phone) = '' THEN
            v_phone := 'Emergency Caller';
        END IF;
    END IF;

    -- Create PostGIS Point
    v_location := public.ST_SetSRID(public.ST_MakePoint(p_lng, p_lat), 4326);

    -- Generate Short Code
    v_short_code := public.generate_short_code();

    -- Check for duplicate
    v_dup_of := public.find_duplicate_request(v_location, v_phone, v_caller_id);

    -- Compute dynamic priority score
    v_priority := public.compute_priority_score(
        p_declared_urgency,
        p_people_count,
        p_has_vulnerable,
        timezone('utc'::text, now()),
        v_location
    );

    -- Insert into emergency_requests
    INSERT INTO public.emergency_requests (
        short_code,
        citizen_id,
        type,
        description,
        people_count,
        has_vulnerable_persons,
        declared_urgency,
        priority_score,
        status,
        location,
        location_accuracy_m,
        address_text,
        contact_phone,
        duplicate_of,
        client_request_id,
        created_at,
        updated_at
    ) VALUES (
        v_short_code,
        v_caller_id,
        p_type,
        p_description,
        GREATEST(p_people_count, 1),
        p_has_vulnerable,
        p_declared_urgency,
        v_priority,
        'submitted',
        v_location,
        p_accuracy,
        p_address_text,
        v_phone,
        v_dup_of,
        p_client_request_id,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) RETURNING * INTO v_req_record;

    -- Insert into request_status_history
    INSERT INTO public.request_status_history (
        request_id,
        old_status,
        new_status,
        changed_by,
        note,
        created_at
    ) VALUES (
        v_req_record.id,
        NULL,
        'submitted',
        v_caller_id,
        CASE WHEN v_dup_of IS NOT NULL THEN 'SOS submitted (flagged potential duplicate of ' || v_dup_of || ')' ELSE 'SOS emergency request initiated' END,
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'id', v_req_record.id,
        'short_code', v_req_record.short_code,
        'status', v_req_record.status,
        'priority_score', v_req_record.priority_score,
        'duplicate_of', v_dup_of,
        'is_existing', false
    );
END;
$$;

-- 4. Update SOS Additional Details RPC
CREATE OR REPLACE FUNCTION public.update_sos_details(
    p_request_id UUID,
    p_people_count INT DEFAULT NULL,
    p_has_vulnerable BOOLEAN DEFAULT NULL,
    p_declared_urgency public.urgency_level DEFAULT NULL,
    p_type public.incident_type DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_media_urls TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_req public.emergency_requests%ROWTYPE;
    v_new_priority NUMERIC;
BEGIN
    SELECT * INTO v_req
    FROM public.emergency_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;

    -- Verify ownership (caller must be citizen owner or admin)
    IF v_req.citizen_id IS NOT NULL AND v_req.citizen_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. You can only update your own emergency requests.';
    END IF;

    -- Allowed only before completion/assignment
    IF v_req.status IN ('completed', 'cancelled', 'rejected') THEN
        RAISE EXCEPTION 'Cannot update details of a % request.', v_req.status;
    END IF;

    -- Recalculate priority score
    v_new_priority := public.compute_priority_score(
        COALESCE(p_declared_urgency, v_req.declared_urgency),
        COALESCE(p_people_count, v_req.people_count),
        COALESCE(p_has_vulnerable, v_req.has_vulnerable_persons),
        v_req.created_at,
        v_req.location
    );

    UPDATE public.emergency_requests
    SET 
        people_count = COALESCE(p_people_count, people_count),
        has_vulnerable_persons = COALESCE(p_has_vulnerable, has_vulnerable_persons),
        declared_urgency = COALESCE(p_declared_urgency, declared_urgency),
        type = COALESCE(p_type, type),
        description = COALESCE(p_description, description),
        media_urls = CASE WHEN p_media_urls IS NOT NULL THEN media_urls || p_media_urls ELSE media_urls END,
        priority_score = v_new_priority,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    RETURN TRUE;
END;
$$;

-- 5. Citizen Cancel Request RPC
CREATE OR REPLACE FUNCTION public.cancel_request(
    p_request_id UUID,
    p_reason TEXT DEFAULT 'Cancelled by citizen'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_req public.emergency_requests%ROWTYPE;
BEGIN
    SELECT * INTO v_req
    FROM public.emergency_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Emergency request not found.';
    END IF;

    IF v_req.citizen_id IS NOT NULL AND v_req.citizen_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Only the request creator can cancel this request.';
    END IF;

    IF v_req.status = 'completed' THEN
        RAISE EXCEPTION 'Cannot cancel an already completed rescue operation.';
    END IF;

    UPDATE public.emergency_requests
    SET status = 'cancelled',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    -- Record status history
    INSERT INTO public.request_status_history (
        request_id,
        old_status,
        new_status,
        changed_by,
        note,
        created_at
    ) VALUES (
        p_request_id,
        v_req.status,
        'cancelled',
        v_caller_id,
        p_reason,
        timezone('utc'::text, now())
    );

    RETURN TRUE;
END;
$$;

-- 6. Report Flood Incident RPC
CREATE OR REPLACE FUNCTION public.report_flood_incident(
    p_title TEXT,
    p_description TEXT,
    p_severity public.urgency_level,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_water_level_cm NUMERIC DEFAULT NULL,
    p_media_urls TEXT[] DEFAULT '{}'::text[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_incident_id UUID;
    v_location geography(Point, 4326);
BEGIN
    v_location := public.ST_SetSRID(public.ST_MakePoint(p_lng, p_lat), 4326);

    INSERT INTO public.flood_incidents (
        reported_by,
        title,
        description,
        severity,
        location,
        water_level_cm,
        media_urls,
        verification_status,
        created_at
    ) VALUES (
        v_caller_id,
        p_title,
        p_description,
        p_severity,
        v_location,
        p_water_level_cm,
        p_media_urls,
        'pending',
        timezone('utc'::text, now())
    ) RETURNING id INTO v_incident_id;

    RETURN v_incident_id;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.compute_priority_score(public.urgency_level, INT, BOOLEAN, TIMESTAMPTZ, geography) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_sos(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, TEXT, INT, BOOLEAN, public.urgency_level, public.incident_type, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_sos_details(UUID, INT, BOOLEAN, public.urgency_level, public.incident_type, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_flood_incident(TEXT, TEXT, public.urgency_level, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, TEXT[]) TO authenticated;


-- ==========================================
-- Migration: 20261001000006_rescue_coordination_rpcs.sql
-- ==========================================

-- FERRCS: Migration 06 - Rescue Coordination, State Machine, and Concurrency-Safe Assignment

-- 1. Concurrency-Safe Request Assignment RPC
CREATE OR REPLACE FUNCTION public.assign_request(
    p_request_id UUID,
    p_team_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_req public.emergency_requests%ROWTYPE;
    v_team public.rescue_teams%ROWTYPE;
    v_op_id UUID;
    v_member_record RECORD;
BEGIN
    -- Only rescue teams and admins can assign requests
    IF public.get_my_role() NOT IN ('rescue_team', 'admin') THEN
        RAISE EXCEPTION 'Access denied. Only rescue responders or administrators can assign requests.';
    END IF;

    -- Pessimistic Lock with FOR UPDATE to prevent race conditions (double assignment)
    SELECT * INTO v_req
    FROM public.emergency_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Emergency request not found.';
    END IF;

    -- Check if request is already claimed/in-progress
    IF v_req.status IN ('accepted', 'en_route', 'on_site', 'completed') THEN
        RAISE EXCEPTION 'Request #% is already in progress or completed by another team.', v_req.short_code;
    END IF;

    -- Verify target rescue team exists
    SELECT * INTO v_team
    FROM public.rescue_teams
    WHERE id = p_team_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target rescue team not found.';
    END IF;

    -- Update emergency_requests status
    UPDATE public.emergency_requests
    SET status = 'assigned',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    -- Insert or update active rescue_operations record
    INSERT INTO public.rescue_operations (
        request_id,
        team_id,
        assigned_by,
        status,
        assigned_at
    ) VALUES (
        p_request_id,
        p_team_id,
        v_caller_id,
        'assigned',
        timezone('utc'::text, now())
    ) ON CONFLICT (request_id) WHERE status NOT IN ('completed', 'aborted')
    DO UPDATE SET
        team_id = EXCLUDED.team_id,
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = timezone('utc'::text, now())
    RETURNING id INTO v_op_id;

    -- Record in request_status_history
    INSERT INTO public.request_status_history (
        request_id,
        old_status,
        new_status,
        changed_by,
        note,
        created_at
    ) VALUES (
        p_request_id,
        v_req.status,
        'assigned',
        v_caller_id,
        'Assigned to rescue team: ' || v_team.name,
        timezone('utc'::text, now())
    );

    -- Notify Citizen (if account exists)
    IF v_req.citizen_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_request_id,
            created_at
        ) VALUES (
            v_req.citizen_id,
            'STATUS_ASSIGNED',
            'Rescue Team Assigned: ' || v_team.name,
            'A rescue boat team has been assigned to request #' || v_req.short_code || '. Tap to view details and contact info.',
            p_request_id,
            timezone('utc'::text, now())
        );
    END IF;

    -- Notify Team Members
    FOR v_member_record IN 
        SELECT user_id FROM public.rescue_team_members WHERE team_id = p_team_id
    LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_request_id,
            created_at
        ) VALUES (
            v_member_record.user_id,
            'NEW_MISSION',
            'New Mission Assigned: #' || v_req.short_code,
            'Urgency: ' || v_req.declared_urgency || ' • People: ' || v_req.people_count,
            p_request_id,
            timezone('utc'::text, now())
        );
    END LOOP;

    RETURN jsonb_build_object(
        'operation_id', v_op_id,
        'request_id', p_request_id,
        'team_name', v_team.name,
        'status', 'assigned'
    );
END;
$$;

-- 2. State Machine Status Transition RPC
CREATE OR REPLACE FUNCTION public.update_request_status(
    p_request_id UUID,
    p_new_status public.request_status,
    p_note TEXT DEFAULT NULL,
    p_people_rescued INT DEFAULT 0
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_caller_role public.user_role := public.get_my_role();
    v_caller_team UUID := public.get_my_rescue_team_id();
    v_req public.emergency_requests%ROWTYPE;
    v_op public.rescue_operations%ROWTYPE;
BEGIN
    SELECT * INTO v_req
    FROM public.emergency_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found.';
    END IF;

    -- Validate state transition according to state machine
    IF v_req.status = 'submitted' AND p_new_status NOT IN ('verified', 'prioritized', 'cancelled', 'rejected', 'duplicate') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'verified' AND p_new_status NOT IN ('prioritized', 'assigned', 'cancelled', 'duplicate') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'prioritized' AND p_new_status NOT IN ('assigned', 'cancelled', 'duplicate') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'assigned' AND p_new_status NOT IN ('accepted', 'rejected', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'accepted' AND p_new_status NOT IN ('en_route', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'en_route' AND p_new_status NOT IN ('on_site', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status = 'on_site' AND p_new_status NOT IN ('completed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid transition from % to %.', v_req.status, p_new_status;
    ELSIF v_req.status IN ('completed', 'cancelled', 'duplicate') THEN
        RAISE EXCEPTION 'Cannot modify request in terminal status %.', v_req.status;
    END IF;

    -- Update emergency_requests
    UPDATE public.emergency_requests
    SET status = p_new_status,
        completed_at = CASE WHEN p_new_status = 'completed' THEN timezone('utc'::text, now()) ELSE completed_at END,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    -- Update rescue_operations timestamp progression
    UPDATE public.rescue_operations
    SET 
        status = CASE 
            WHEN p_new_status = 'accepted' THEN 'accepted'::public.operation_status
            WHEN p_new_status = 'en_route' THEN 'en_route'::public.operation_status
            WHEN p_new_status = 'on_site' THEN 'on_site'::public.operation_status
            WHEN p_new_status = 'completed' THEN 'completed'::public.operation_status
            WHEN p_new_status = 'rejected' THEN 'aborted'::public.operation_status
            ELSE status
        END,
        accepted_at = CASE WHEN p_new_status = 'accepted' AND accepted_at IS NULL THEN timezone('utc'::text, now()) ELSE accepted_at END,
        en_route_at = CASE WHEN p_new_status = 'en_route' AND en_route_at IS NULL THEN timezone('utc'::text, now()) ELSE en_route_at END,
        arrived_at = CASE WHEN p_new_status = 'on_site' AND arrived_at IS NULL THEN timezone('utc'::text, now()) ELSE arrived_at END,
        completed_at = CASE WHEN p_new_status = 'completed' AND completed_at IS NULL THEN timezone('utc'::text, now()) ELSE completed_at END,
        people_rescued = CASE WHEN p_new_status = 'completed' THEN GREATEST(p_people_rescued, v_req.people_count) ELSE people_rescued END,
        notes = COALESCE(p_note, notes)
    WHERE request_id = p_request_id AND status NOT IN ('completed', 'aborted');

    -- Record in request_status_history
    INSERT INTO public.request_status_history (
        request_id,
        old_status,
        new_status,
        changed_by,
        note,
        created_at
    ) VALUES (
        p_request_id,
        v_req.status,
        p_new_status,
        v_caller_id,
        p_note,
        timezone('utc'::text, now())
    );

    -- Notify Citizen on state change
    IF v_req.citizen_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            related_request_id,
            created_at
        ) VALUES (
            v_req.citizen_id,
            'STATUS_CHANGE',
            'Request Status: ' || upper(p_new_status::text),
            'Your emergency request #' || v_req.short_code || ' is now ' || p_new_status::text || '.' || COALESCE(' Note: ' || p_note, ''),
            p_request_id,
            timezone('utc'::text, now())
        );
    END IF;

    RETURN TRUE;
END;
$$;

-- 3. Update Team Location & Status (Throttled)
CREATE OR REPLACE FUNCTION public.update_team_telemetry(
    p_team_id UUID,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_status public.team_status DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_team UUID := public.get_my_rescue_team_id();
BEGIN
    IF v_caller_team <> p_team_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. You can only update telemetry for your own team.';
    END IF;

    UPDATE public.rescue_teams
    SET 
        current_location = public.ST_SetSRID(public.ST_MakePoint(p_lng, p_lat), 4326),
        status = COALESCE(p_status, status),
        last_seen_at = timezone('utc'::text, now())
    WHERE id = p_team_id;

    RETURN TRUE;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.assign_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_request_status(UUID, public.request_status, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_team_telemetry(UUID, DOUBLE PRECISION, DOUBLE PRECISION, public.team_status) TO authenticated;


-- ==========================================
-- Migration: 20261001000007_shelters_and_alerts_rpcs.sql
-- ==========================================

-- FERRCS: Migration 07 - Shelters, Weather Alerts, and Crisis Simulation Engine

-- 1. Nearby Shelters RPC (PostGIS Distance calculation)
CREATE OR REPLACE FUNCTION public.nearby_shelters(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_m INT DEFAULT 25000,
    p_only_open BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    distance_km NUMERIC,
    max_capacity INT,
    current_occupancy INT,
    occupancy_pct NUMERIC,
    status public.shelter_status,
    facilities JSONB,
    contact_phone TEXT,
    contact_person TEXT,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_pt public.geography;
BEGIN
    v_user_pt := public.ST_SetSRID(public.ST_MakePoint(p_lng, p_lat), 4326)::public.geography;

    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.address,
        public.ST_Y(s.location::public.geometry) AS lat,
        public.ST_X(s.location::public.geometry) AS lng,
        public.ST_Distance(s.location, v_user_pt) AS distance_meters,
        ROUND((public.ST_Distance(s.location, v_user_pt) / 1000.0)::NUMERIC, 2) AS distance_km,
        s.max_capacity,
        s.current_occupancy,
        ROUND((s.current_occupancy::NUMERIC / NULLIF(s.max_capacity, 0)::NUMERIC) * 100.0, 1) AS occupancy_pct,
        s.status,
        s.facilities,
        s.contact_phone,
        s.contact_person,
        s.updated_at
    FROM public.shelters s
    WHERE 
        (NOT p_only_open OR s.status = 'open')
        AND public.ST_DWithin(s.location, v_user_pt, p_radius_m)
    ORDER BY distance_meters ASC;
END;
$$;

-- 2. Concurrency-Safe Shelter Occupancy Update RPC
CREATE OR REPLACE FUNCTION public.update_shelter_occupancy(
    p_shelter_id UUID,
    p_new_occupancy INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_role public.user_role := public.get_my_role();
    v_shelter public.shelters%ROWTYPE;
    v_new_status public.shelter_status;
BEGIN
    -- Only volunteers, rescue responders, and admins can update shelter occupancy
    IF v_caller_role NOT IN ('admin', 'rescue_team', 'volunteer') THEN
        RAISE EXCEPTION 'Access denied. You lack permissions to update shelter occupancy.';
    END IF;

    IF p_new_occupancy < 0 THEN
        RAISE EXCEPTION 'Occupancy count cannot be negative.';
    END IF;

    SELECT * INTO v_shelter
    FROM public.shelters
    WHERE id = p_shelter_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Shelter not found.';
    END IF;

    -- Calculate new status based on capacity
    IF p_new_occupancy >= v_shelter.max_capacity THEN
        v_new_status := 'full';
    ELSIF v_shelter.status = 'full' AND p_new_occupancy < v_shelter.max_capacity THEN
        v_new_status := 'open';
    ELSE
        v_new_status := v_shelter.status;
    END IF;

    UPDATE public.shelters
    SET 
        current_occupancy = p_new_occupancy,
        status = v_new_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_shelter_id;

    -- Record in audit logs
    INSERT INTO public.audit_logs (
        action,
        table_name,
        record_id,
        user_id,
        diff,
        created_at
    ) VALUES (
        'UPDATE_OCCUPANCY',
        'shelters',
        p_shelter_id,
        auth.uid(),
        jsonb_build_object(
            'old_occupancy', v_shelter.current_occupancy,
            'new_occupancy', p_new_occupancy,
            'max_capacity', v_shelter.max_capacity,
            'status', v_new_status
        ),
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'shelter_id', p_shelter_id,
        'current_occupancy', p_new_occupancy,
        'max_capacity', v_shelter.max_capacity,
        'status', v_new_status
    );
END;
$$;

-- 3. Broadcast Weather & Flood Alert RPC
CREATE OR REPLACE FUNCTION public.broadcast_weather_alert(
    p_severity public.alert_severity,
    p_title TEXT,
    p_description TEXT,
    p_source TEXT DEFAULT 'IMD Hyderabad / GHMC Flood Control',
    p_expires_in_hours INT DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_alert_id UUID;
    v_caller_role public.user_role := public.get_my_role();
    v_user RECORD;
BEGIN
    IF v_caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Access denied. Only administrators can broadcast weather alerts.';
    END IF;

    INSERT INTO public.weather_alerts (
        severity,
        title,
        description,
        source,
        issued_at,
        expires_at
    ) VALUES (
        p_severity,
        p_title,
        p_description,
        COALESCE(p_source, 'IMD Weather Bureau'),
        timezone('utc'::text, now()),
        timezone('utc'::text, now()) + (p_expires_in_hours || ' hours')::INTERVAL
    )
    RETURNING id INTO v_alert_id;

    -- Fan out notification to all registered users
    FOR v_user IN SELECT id FROM public.profiles WHERE is_active = TRUE LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            created_at
        ) VALUES (
            v_user.id,
            'WEATHER_ALERT',
            '⚠️ ' || UPPER(p_severity::text) || ' ALERT: ' || p_title,
            p_description,
            timezone('utc'::text, now())
        );
    END LOOP;

    RETURN v_alert_id;
END;
$$;

-- 4. Simulated Flood Scenario Engine (For Admin Demo & Testing)
CREATE OR REPLACE FUNCTION public.simulate_flood_scenario()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_alert_id UUID;
    v_incident_id UUID;
BEGIN
    -- 1. Create High-Severity Weather Alert
    v_alert_id := public.broadcast_weather_alert(
        'critical'::public.alert_severity,
        'Musi River Crest Level Exceeded (+4.5m Flood Warning)',
        'Himayat Sagar and Osman Sagar flood gates opened at 8 gates each (12,000 cusecs). Low-lying riverside colonies in Chaderghat, Moosarambagh, and Amberpet must immediately evacuate to designated relief shelters.',
        'GHMC Disaster Management Unit',
        12
    );

    -- 2. Inject Community Incident Report
    INSERT INTO public.flood_incidents (
        title,
        description,
        severity,
        location,
        water_level_cm,
        verification_status,
        verified_by,
        verified_at,
        created_at
    ) VALUES (
        'Moosarambagh Cause-way Submerged',
        'Water flowing 4 feet over bridge causeway. Road closed for all vehicular and pedestrian traffic. SDRF deployed on standby.',
        'critical',
        public.ST_SetSRID(public.ST_MakePoint(78.5022, 17.3705), 4326)::public.geography,
        140,
        'verified',
        auth.uid(),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_incident_id;

    -- 3. Return summary of generated scenario
    RETURN jsonb_build_object(
        'scenario', 'Hyderabad Musi River Flash Flood Scenario',
        'alert_id', v_alert_id,
        'incident_id', v_incident_id,
        'timestamp', timezone('utc'::text, now())
    );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.nearby_shelters(DOUBLE PRECISION, DOUBLE PRECISION, INT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_shelter_occupancy(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_weather_alert(public.alert_severity, TEXT, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.simulate_flood_scenario() TO authenticated;


