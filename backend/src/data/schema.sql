-- ============================================================================
-- MALNAD COLLEGE OF ENGINEERING (MCE), HASSAN
-- Intelligent Campus Navigation Platform - PostgreSQL & PostGIS Spatial Schema
-- Institutional Coordinates: SRID 4326 (WGS 84)
-- ============================================================================

-- 1. Enable Spatial Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerated Types
CREATE TYPE user_role_enum AS ENUM ('student', 'faculty', 'staff', 'campus_admin', 'super_admin');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE building_category_enum AS ENUM ('academic', 'administrative', 'hostel', 'amenity', 'sports', 'spiritual');
CREATE TYPE room_category_enum AS ENUM ('classroom', 'laboratory', 'office', 'seminar_hall', 'library', 'washroom', 'canteen', 'first_aid', 'security');
CREATE TYPE node_type_enum AS ENUM ('outdoor_gate', 'outdoor_junction', 'building_entrance', 'indoor_junction', 'indoor_staircase', 'indoor_elevator', 'room_entrance', 'emergency_point');
CREATE TYPE feedback_type_enum AS ENUM ('missing_place', 'incorrect_room', 'blocked_path', 'accessibility_issue', 'other');

-- 3. Campuses Table
CREATE TABLE Campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    area_acres NUMERIC(6, 2) NOT NULL DEFAULT 41.28,
    boundary_geom GEOMETRY(Polygon, 4326),
    center_geom GEOMETRY(Point, 4326),
    official_website VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Student Master Registry (Authoritative Whitelist)
CREATE TABLE StudentRegistry (
    usn VARCHAR(30) PRIMARY KEY, -- e.g. 4MC22CS045
    full_name VARCHAR(255) NOT NULL,
    official_email VARCHAR(255) UNIQUE NOT NULL,
    department_code VARCHAR(30) NOT NULL,
    admission_year INTEGER NOT NULL,
    current_semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_student_registry_email ON StudentRegistry(official_email);

-- 5. Staff Master Registry (Authoritative Whitelist)
CREATE TABLE StaffRegistry (
    employee_id VARCHAR(50) PRIMARY KEY, -- e.g. MCE-FAC-014
    full_name VARCHAR(255) NOT NULL,
    official_email VARCHAR(255) UNIQUE NOT NULL,
    department_code VARCHAR(30) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'faculty',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_staff_registry_email ON StaffRegistry(official_email);

-- 6. Users Table (Strictly linked to MCE identity)
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    institutional_id VARCHAR(50) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'student',
    verification_status verification_status_enum NOT NULL DEFAULT 'pending',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_institutional_linkage CHECK (institutional_id IS NOT NULL)
);
CREATE INDEX idx_users_institutional_id ON Users(institutional_id);
CREATE INDEX idx_users_email ON Users(email);

-- 7. Verification Requests Table
CREATE TABLE VerificationRequests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    institutional_id VARCHAR(50) NOT NULL,
    id_card_image_url TEXT,
    status verification_status_enum DEFAULT 'pending',
    reviewed_by UUID REFERENCES Users(id),
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 8. Campus Buildings Table
CREATE TABLE Buildings (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    category building_category_enum NOT NULL,
    description TEXT,
    floors_count INTEGER NOT NULL DEFAULT 1,
    has_wheelchair_ramp BOOLEAN DEFAULT TRUE,
    has_elevators BOOLEAN DEFAULT FALSE,
    has_tactile_paving BOOLEAN DEFAULT FALSE,
    has_accessible_washrooms BOOLEAN DEFAULT TRUE,
    location_point GEOMETRY(Point, 4326) NOT NULL,
    footprint_polygon GEOMETRY(Polygon, 4326),
    verification_status VARCHAR(30) DEFAULT 'verified',
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_buildings_geom ON Buildings USING GIST(location_point);

-- 9. Floors Table
CREATE TABLE Floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id VARCHAR(50) REFERENCES Buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    floor_name VARCHAR(100) NOT NULL,
    floor_plan_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, floor_number)
);

-- 10. Departments Table
CREATE TABLE Departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(20) NOT NULL,
    building_id VARCHAR(50) REFERENCES Buildings(id),
    floor INTEGER NOT NULL DEFAULT 0,
    hod_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL
);

-- 11. Rooms & Locations Table
CREATE TABLE Rooms (
    id VARCHAR(50) PRIMARY KEY,
    building_id VARCHAR(50) REFERENCES Buildings(id) ON DELETE CASCADE,
    floor INTEGER NOT NULL DEFAULT 0,
    room_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category room_category_enum NOT NULL,
    is_accessible BOOLEAN DEFAULT TRUE,
    location_point GEOMETRY(Point, 4326) NOT NULL,
    indoor_x NUMERIC(8, 2),
    indoor_y NUMERIC(8, 2),
    indoor_corridor VARCHAR(100),
    verification_status VARCHAR(30) DEFAULT 'verified'
);
CREATE INDEX idx_rooms_geom ON Rooms USING GIST(location_point);

-- 12. Navigation Graph Nodes Table
CREATE TABLE NavigationNodes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type node_type_enum NOT NULL,
    coordinates GEOMETRY(Point, 4326) NOT NULL,
    building_id VARCHAR(50) REFERENCES Buildings(id),
    floor INTEGER,
    is_accessible BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_nav_nodes_geom ON NavigationNodes USING GIST(coordinates);

-- 13. Navigation Graph Edges Table (Walking Network)
CREATE TABLE NavigationEdges (
    id VARCHAR(50) PRIMARY KEY,
    from_node_id VARCHAR(50) REFERENCES NavigationNodes(id) ON DELETE CASCADE,
    to_node_id VARCHAR(50) REFERENCES NavigationNodes(id) ON DELETE CASCADE,
    distance_meters NUMERIC(8, 2) NOT NULL,
    is_indoor BOOLEAN DEFAULT FALSE,
    is_accessible BOOLEAN DEFAULT TRUE,
    is_stairs BOOLEAN DEFAULT FALSE,
    is_elevator BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    path_geometry GEOMETRY(LineString, 4326)
);
CREATE INDEX idx_nav_edges_from ON NavigationEdges(from_node_id);
CREATE INDEX idx_nav_edges_to ON NavigationEdges(to_node_id);

-- 14. QR Checkpoints Table (Indoor Orientation)
CREATE TABLE QRCheckpoints (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    building_id VARCHAR(50) REFERENCES Buildings(id) ON DELETE CASCADE,
    floor INTEGER NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    description TEXT,
    node_id VARCHAR(50) REFERENCES NavigationNodes(id),
    coordinates GEOMETRY(Point, 4326) NOT NULL
);

-- 15. Timetables & Classes
CREATE TABLE Classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_code VARCHAR(30) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    faculty_name VARCHAR(255) NOT NULL,
    room_id VARCHAR(50) REFERENCES Rooms(id),
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL
);

-- 16. Location Sharing Sessions Table
CREATE TABLE LocationSharingSessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    user_name VARCHAR(255) NOT NULL,
    location_point GEOMETRY(Point, 4326) NOT NULL,
    location_description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. User Favorites & Search History
CREATE TABLE UserFavorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    location_id VARCHAR(50) NOT NULL,
    location_type VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, location_id)
);

CREATE TABLE SearchHistory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
    search_query VARCHAR(255) NOT NULL,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Campus Feedback & Blockage Reporting
CREATE TABLE Feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    type feedback_type_enum NOT NULL,
    location_id VARCHAR(50),
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'open',
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Audit Logs Table (Full institutional accountability)
CREATE TABLE AuditLogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_timestamp ON AuditLogs(timestamp DESC);

-- 20. Campus Map Versions Table
CREATE TABLE CampusMapVersions (
    version INTEGER PRIMARY KEY,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_by VARCHAR(255) NOT NULL,
    notes TEXT,
    nodes_count INTEGER NOT NULL,
    edges_count INTEGER NOT NULL
);
