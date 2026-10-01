-- FERRCS: Comprehensive Seed Dataset
-- Hyderabad Musi River Crisis Scenario Demo Data

-- 1. Profiles for Seed Demo Users
-- (Assumes corresponding auth.users exist or script inserts mock profiles)
INSERT INTO public.profiles (id, full_name, phone, role, verification_status, is_active, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Chief Operations Director', '+919440000001', 'admin', 'verified', TRUE, now()),
  ('00000000-0000-0000-0000-000000000002', 'Commander Vikram Rao', '+919440000002', 'rescue_team', 'verified', TRUE, now()),
  ('00000000-0000-0000-0000-000000000003', 'Ramesh Sharma', '+919440000003', 'citizen', 'verified', TRUE, now()),
  ('00000000-0000-0000-0000-000000000004', 'Anita Desai', '+919440000004', 'volunteer', 'verified', TRUE, now())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  verification_status = EXCLUDED.verification_status;

-- 2. Relief Shelters across Hyderabad
INSERT INTO public.shelters (id, name, address, location, max_capacity, current_occupancy, status, facilities, contact_phone, contact_person)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'GHMC Amberpet Indoor Stadium Relief Camp',
    'Near 6 No. Junction, Amberpet, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.5180, 17.3895), 4326)::public.geography,
    500,
    285,
    'open',
    '["Medical Post", "Hot Meals", "Power Backup", "Dry Clothing", "Sanitation"]'::jsonb,
    '+919440155667',
    'Dr. K. Srinivas'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Govt High School Relief Center Malakpet',
    'Beside Old Police Station, Malakpet, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.4980, 17.3670), 4326)::public.geography,
    350,
    310,
    'open',
    '["First Aid", "Drinking Water", "Baby Food", "Sleeping Mats"]'::jsonb,
    '+919440188990',
    'M. Anitha'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Chaderghat Community Hall Emergency Shelter',
    'Chaderghat Main Road, Near Fire Station, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.4890, 17.3780), 4326)::public.geography,
    250,
    250,
    'full',
    '["Emergency First Aid", "Community Kitchen"]'::jsonb,
    '+919848034567',
    'V. Raghunath'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Dilsukhnagar Public School Relief Hub',
    'Opp. Fruit Market, Dilsukhnagar, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.5280, 17.3650), 4326)::public.geography,
    600,
    195,
    'open',
    '["Full Medical Clinic", "Hot Meals", "Generator Backup", "Baby Care", "Pet Safe"]'::jsonb,
    '+919849911223',
    'Capt. Arvind Joshi'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Kacheguda Railway Community Center',
    'Station Road, Kacheguda, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.4960, 17.3920), 4326)::public.geography,
    400,
    120,
    'open',
    '["Medical Officer", "Clean Drinking Water", "Charging Stations"]'::jsonb,
    '+919700044556',
    'S. Murthy'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Osmania Medical College Ground Pavilion',
    'Koti, Sultan Bazar, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.4820, 17.3820), 4326)::public.geography,
    700,
    210,
    'open',
    '["Advanced Trauma Unit", "Surgical Support", "Ambulance Hub"]'::jsonb,
    '+919848122334',
    'Dr. Farooq Ali'
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    'Charminar Community Center',
    'Near Gulzar Houz, Charminar, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.4740, 17.3610), 4326)::public.geography,
    300,
    290,
    'open',
    '["Dry Rations", "Drinking Water", "First Aid"]'::jsonb,
    '+919848555666',
    'Mirza Baig'
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    'Saroornagar Indoor Sports Complex',
    'Near Saroornagar Lake, LB Nagar, Hyderabad',
    public.ST_SetSRID(public.ST_MakePoint(78.5350, 17.3550), 4326)::public.geography,
    800,
    180,
    'open',
    '["Large Evacuation Hall", "Hot Meals", "Blankets", "Child Care"]'::jsonb,
    '+919848777888',
    'P. Srinivas Rao'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Rescue Teams & Fleet
INSERT INTO public.rescue_teams (id, name, callsign, base_station, vessel_type, capacity, sector, status, current_location, last_seen_at)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'Team Alpha 01',
    'ECHO-1',
    'Chaderghat Fire Station',
    'Motorized Zodiac Inflatable (40 HP)',
    6,
    'Sector Central - Musi River',
    'busy',
    public.ST_SetSRID(public.ST_MakePoint(78.4910, 17.3730), 4326)::public.geography,
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Team Bravo 02',
    'ECHO-2',
    'Malakpet Police Ground',
    'Heavy Rescue Flood Raft',
    10,
    'Sector East - Moosarambagh',
    'busy',
    public.ST_SetSRID(public.ST_MakePoint(78.5080, 17.3690), 4326)::public.geography,
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'Team Charlie 03',
    'ECHO-3',
    'Amberpet SDRF Regional Hub',
    'Swift Water Rescue Boat',
    6,
    'Sector North - Amberpet',
    'available',
    public.ST_SetSRID(public.ST_MakePoint(78.4790, 17.3820), 4326)::public.geography,
    now()
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    'Team Delta 04',
    'ECHO-4',
    'Dilsukhnagar Civil Defence Depot',
    'Flat-bottom Aluminum Jon Boat',
    8,
    'Sector South - Dilsukhnagar',
    'available',
    public.ST_SetSRID(public.ST_MakePoint(78.5200, 17.3600), 4326)::public.geography,
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Team Members
INSERT INTO public.rescue_team_members (team_id, user_id, role_in_team, is_lead)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Commander', TRUE)
ON CONFLICT DO NOTHING;

-- 5. Emergency Requests (Covering the entire state machine)
INSERT INTO public.emergency_requests (
  id, short_code, citizen_id, location, contact_phone, people_count, has_vulnerable,
  declared_urgency, incident_type, priority_score, status, address_text, description, created_at
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    'FR-9823',
    '00000000-0000-0000-0000-000000000003',
    public.ST_SetSRID(public.ST_MakePoint(78.4878, 17.3753), 4326)::public.geography,
    '+919849012345',
    5,
    TRUE,
    'critical',
    'medical',
    94,
    'en_route',
    'Plot 42, Riverfront Colony, Chaderghat, Musi River Bank',
    'Water reached 1st floor ceiling. Elderly grandmother on oxygen support and two small children. Immediate boat evacuation required.',
    now() - interval '20 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'FR-4821',
    NULL,
    public.ST_SetSRID(public.ST_MakePoint(78.5022, 17.3705), 4326)::public.geography,
    '+919988765432',
    3,
    TRUE,
    'critical',
    'medical',
    88,
    'on_site',
    'Moosarambagh Bridge East, Beside Community Hall',
    'Pregnant woman experiencing active labor contractions. Building cut off by 5ft water.',
    now() - interval '40 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'FR-3109',
    NULL,
    public.ST_SetSRID(public.ST_MakePoint(78.5142, 17.3888), 4326)::public.geography,
    '+919440122334',
    4,
    FALSE,
    'high',
    'flood',
    72,
    'prioritized',
    'Block B, Sri Sai Residency, Amberpet Low-Lying Area',
    'Ground floor completely submerged. 4 adults stuck on upper balcony.',
    now() - interval '30 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    'FR-3112',
    NULL,
    public.ST_SetSRID(public.ST_MakePoint(78.5144, 17.3889), 4326)::public.geography,
    '+919440199888',
    4,
    FALSE,
    'high',
    'flood',
    68,
    'duplicate',
    'Block B, Sri Sai Residency, Amberpet (Neighbor reporting)',
    'Same building as FR-3109. Neighbor reported duplicate.',
    now() - interval '25 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    'FR-1102',
    NULL,
    public.ST_SetSRID(public.ST_MakePoint(78.5150, 17.3870), 4326)::public.geography,
    '+919848088776',
    6,
    TRUE,
    'critical',
    'flood',
    92,
    'completed',
    'Near Golnaka Bridge, Amberpet',
    'Terrace evacuation. Successfully extracted 6 individuals and transferred to Amberpet Indoor Stadium.',
    now() - interval '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 6. Community Flood Incidents
INSERT INTO public.flood_incidents (
  id, title, description, severity, location, water_level_cm, verification_status, verified_at, created_at
)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    'Moosarambagh Cause-way Submerged Under 4ft Water',
    'Water flowing with high velocity over causeway. Road completely closed.',
    'critical',
    public.ST_SetSRID(public.ST_MakePoint(78.5022, 17.3705), 4326)::public.geography,
    140,
    'verified',
    now() - interval '1 hour',
    now() - interval '1 hour'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'Chaderghat Nala Inflow Backsurge',
    'Drainage water backing up into street. 2.5ft standing water.',
    'high',
    public.ST_SetSRID(public.ST_MakePoint(78.4890, 17.3760), 4326)::public.geography,
    75,
    'pending',
    NULL,
    now() - interval '30 minutes'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'Amberpet Ramanthapur Underpass Inundated',
    'Underpass water level over 6ft. Traffic barricaded.',
    'critical',
    public.ST_SetSRID(public.ST_MakePoint(78.5210, 17.3910), 4326)::public.geography,
    180,
    'verified',
    now() - interval '2 hours',
    now() - interval '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Weather Alerts
INSERT INTO public.weather_alerts (
  id, severity, title, description, source, issued_at, expires_at
)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    'critical',
    'Flash Flood Emergency: Musi River Basin Crest (+4.5m)',
    'Himayat Sagar and Osman Sagar flood gates opened at 8 gates each (12,000 cusecs outflow). Immediate evacuation of low-lying riverside colonies.',
    'GHMC Disaster Management Authority / IMD',
    now() - interval '1 hour',
    now() + interval '12 hours'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'warning',
    'Severe Waterlogging & Causeway Closure',
    'Moosarambagh causeway and Chaderghat bridge submerged. Vehicular transit strictly prohibited.',
    'Hyderabad City Police & SDRF',
    now() - interval '2 hours',
    now() + interval '8 hours'
  )
ON CONFLICT (id) DO NOTHING;
