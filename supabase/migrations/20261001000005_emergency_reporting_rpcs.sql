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
