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
