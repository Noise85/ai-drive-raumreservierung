-- Raumreservierung: Full Database Schema
-- Phase 1: All tables for the complete application

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Buildings
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Zurich',
  timezone TEXT NOT NULL DEFAULT 'Europe/Zurich',
  carbon_intensity_factor DECIMAL(6,3) NOT NULL DEFAULT 0.420,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor_number INT NOT NULL,
  map_svg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  capacity INT NOT NULL DEFAULT 4,
  equipment JSONB NOT NULL DEFAULT '[]',
  image_url TEXT,
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard','premium','executive')),
  base_hourly_rate DECIMAL(8,2) NOT NULL DEFAULT 25.00,
  energy_kwh_per_hour DECIMAL(6,3) NOT NULL DEFAULT 2.5,
  occupancy_status TEXT NOT NULL DEFAULT 'unknown' CHECK (occupancy_status IN ('occupied','empty','unknown','offline')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  budget_monthly DECIMAL(10,2) NOT NULL DEFAULT 10000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','facility_manager','admin','finance','sustainability')),
  department TEXT,
  cost_center_id UUID REFERENCES cost_centers(id),
  preferred_locale TEXT NOT NULL DEFAULT 'en',
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','auto_released','completed')),
  attendee_count INT NOT NULL DEFAULT 1,
  visitor_emails TEXT[] DEFAULT '{}',
  cost_center_id UUID REFERENCES cost_centers(id),
  estimated_cost DECIMAL(8,2),
  actual_cost DECIMAL(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sensors
CREATE TABLE IF NOT EXISTS sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'pir',
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online','offline')),
  last_signal_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Occupancy Events
CREATE TABLE IF NOT EXISTS occupancy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sensor_id UUID REFERENCES sensors(id),
  status TEXT NOT NULL CHECK (status IN ('occupied','empty')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ghost Booking Log
CREATE TABLE IF NOT EXISTS ghost_booking_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  owner_responded BOOLEAN DEFAULT false
);

-- Waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  desired_start TIMESTAMPTZ NOT NULL,
  desired_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','notified','claimed','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing Schedules
CREATE TABLE IF NOT EXISTS pricing_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  end_hour INT NOT NULL CHECK (end_hour BETWEEN 1 AND 24),
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visitors
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  token_expires_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','checked_in','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scoring Weights
CREATE TABLE IF NOT EXISTS scoring_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  proximity_weight DECIMAL(4,2) NOT NULL DEFAULT 0.25,
  equipment_weight DECIMAL(4,2) NOT NULL DEFAULT 0.30,
  capacity_weight DECIMAL(4,2) NOT NULL DEFAULT 0.20,
  utilization_weight DECIMAL(4,2) NOT NULL DEFAULT 0.25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carbon Intensity History
CREATE TABLE IF NOT EXISTS carbon_intensity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  factor DECIMAL(6,3) NOT NULL,
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings(room_id, start_time, end_time) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_occupancy_room ON occupancy_events(room_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_visitors_token ON visitors(qr_token);
CREATE INDEX IF NOT EXISTS idx_waitlist_room ON waitlist(room_id, status) WHERE status = 'waiting';
