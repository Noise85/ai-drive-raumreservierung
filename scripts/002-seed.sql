-- Raumreservierung: Seed Data
-- 2 buildings, 4 floors, 15 rooms, 4 demo users, bookings, sensors, visitors
-- All UUIDs use valid hex characters only

-- Buildings
INSERT INTO buildings (id, name, address, city, timezone, carbon_intensity_factor) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Hauptgebaeude Zurich', 'Bahnhofstrasse 42', 'Zurich', 'Europe/Zurich', 0.420),
  ('b0000000-0000-0000-0000-000000000002', 'Innovation Hub Bern', 'Bundesplatz 10', 'Bern', 'Europe/Zurich', 0.380)
ON CONFLICT DO NOTHING;

-- Floors
INSERT INTO floors (id, building_id, name, floor_number) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ground Floor', 0),
  ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'First Floor', 1),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Ground Floor', 0),
  ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'First Floor', 1)
ON CONFLICT DO NOTHING;

-- Rooms (15 total) -- using a1... prefix for rooms
INSERT INTO rooms (id, floor_id, name, description, capacity, equipment, tier, base_hourly_rate, energy_kwh_per_hour) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Matterhorn', 'Large boardroom with panoramic view', 16, '["projector","whiteboard","video_conferencing","microphone"]', 'executive', 75.00, 4.2),
  ('a1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Eiger', 'Medium meeting room', 8, '["whiteboard","video_conferencing"]', 'premium', 45.00, 3.0),
  ('a1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'Jungfrau', 'Cozy huddle space', 4, '["whiteboard"]', 'standard', 25.00, 1.8),
  ('a1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'Pilatus', 'Phone booth pod', 2, '["video_conferencing"]', 'standard', 15.00, 1.0),
  ('a1000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'Rigi', 'Training room with flexible seating', 20, '["projector","whiteboard","video_conferencing","microphone","recording"]', 'executive', 90.00, 5.5),
  ('a1000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 'Saentis', 'Collaboration space', 10, '["whiteboard","video_conferencing","standing_desk"]', 'premium', 50.00, 3.2),
  ('a1000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002', 'Titlis', 'Interview room', 4, '["video_conferencing"]', 'standard', 30.00, 2.0),
  ('a1000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000002', 'Uetliberg', 'Silent focus room', 1, '[]', 'standard', 10.00, 0.8),
  ('a1000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000003', 'Bundeshaus', 'Executive boardroom', 14, '["projector","whiteboard","video_conferencing","microphone"]', 'executive', 80.00, 4.5),
  ('a1000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000003', 'Zytglogge', 'Medium meeting room', 8, '["whiteboard","video_conferencing"]', 'premium', 40.00, 2.8),
  ('a1000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000003', 'Barengraben', 'Casual meeting room', 6, '["whiteboard"]', 'standard', 30.00, 2.2),
  ('a1000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000003', 'Rosengarten', 'Phone booth', 2, '["video_conferencing"]', 'standard', 15.00, 1.0),
  ('a1000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000004', 'Gurten', 'Workshop space', 18, '["projector","whiteboard","video_conferencing","microphone","recording"]', 'executive', 85.00, 5.0),
  ('a1000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000004', 'Nydegg', 'Team room', 8, '["whiteboard","video_conferencing","standing_desk"]', 'premium', 45.00, 3.0),
  ('a1000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000004', 'Kornhaus', 'Quiet focus room', 1, '[]', 'standard', 10.00, 0.8)
ON CONFLICT DO NOTHING;

-- Cost Centers (using c1... prefix)
INSERT INTO cost_centers (id, name, code, budget_monthly) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Engineering', 'ENG-001', 15000.00),
  ('c1000000-0000-0000-0000-000000000002', 'Marketing', 'MKT-001', 8000.00),
  ('c1000000-0000-0000-0000-000000000003', 'Finance', 'FIN-001', 6000.00),
  ('c1000000-0000-0000-0000-000000000004', 'Executive', 'EXE-001', 25000.00)
ON CONFLICT DO NOTHING;

-- Users (using 00a... prefix)
INSERT INTO users (id, email, name, role, department, cost_center_id, preferred_locale) VALUES
  ('00a00000-0000-0000-0000-000000000001', 'anna.mueller@example.com', 'Anna Mueller', 'employee', 'Engineering', 'c1000000-0000-0000-0000-000000000001', 'de'),
  ('00a00000-0000-0000-0000-000000000002', 'marc.bernard@example.com', 'Marc Bernard', 'facility_manager', 'Facility Management', 'c1000000-0000-0000-0000-000000000004', 'fr'),
  ('00a00000-0000-0000-0000-000000000003', 'sarah.weber@example.com', 'Sarah Weber', 'admin', 'IT Administration', 'c1000000-0000-0000-0000-000000000004', 'en'),
  ('00a00000-0000-0000-0000-000000000004', 'luca.rossi@example.com', 'Luca Rossi', 'finance', 'Finance', 'c1000000-0000-0000-0000-000000000003', 'en')
ON CONFLICT DO NOTHING;

-- Sensors (using 5e... prefix)
INSERT INTO sensors (id, room_id, type, status) VALUES
  ('5e000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'pir', 'online'),
  ('5e000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'pir', 'online'),
  ('5e000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'pir', 'online'),
  ('5e000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'pir', 'online'),
  ('5e000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'pir', 'online'),
  ('5e000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'pir', 'offline'),
  ('5e000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'pir', 'online'),
  ('5e000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'pir', 'online')
ON CONFLICT DO NOTHING;

-- Scoring Weights
INSERT INTO scoring_weights (building_id, proximity_weight, equipment_weight, capacity_weight, utilization_weight) VALUES
  ('b0000000-0000-0000-0000-000000000001', 0.25, 0.30, 0.20, 0.25),
  ('b0000000-0000-0000-0000-000000000002', 0.20, 0.35, 0.25, 0.20)
ON CONFLICT DO NOTHING;

-- Carbon Intensity History
INSERT INTO carbon_intensity_history (building_id, factor, effective_from) VALUES
  ('b0000000-0000-0000-0000-000000000001', 0.450, '2025-01-01'),
  ('b0000000-0000-0000-0000-000000000001', 0.430, '2025-06-01'),
  ('b0000000-0000-0000-0000-000000000001', 0.420, '2026-01-01'),
  ('b0000000-0000-0000-0000-000000000002', 0.400, '2025-01-01'),
  ('b0000000-0000-0000-0000-000000000002', 0.390, '2025-06-01'),
  ('b0000000-0000-0000-0000-000000000002', 0.380, '2026-01-01')
ON CONFLICT DO NOTHING;

-- Pricing Schedules (peak hours for Matterhorn)
INSERT INTO pricing_schedules (room_id, day_of_week, start_hour, end_hour, multiplier) VALUES
  ('a1000000-0000-0000-0000-000000000001', 1, 9, 12, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 1, 13, 17, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 2, 9, 12, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 2, 13, 17, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 3, 9, 12, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 3, 13, 17, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 4, 9, 12, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 4, 13, 17, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 5, 9, 12, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 5, 13, 17, 1.50),
  ('a1000000-0000-0000-0000-000000000001', 1, 7, 9, 0.80),
  ('a1000000-0000-0000-0000-000000000001', 1, 17, 20, 0.80)
ON CONFLICT DO NOTHING;

-- Sample Bookings (using d1... prefix)
INSERT INTO bookings (id, room_id, user_id, title, start_time, end_time, status, attendee_count, cost_center_id, estimated_cost) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '00a00000-0000-0000-0000-000000000001', 'Sprint Planning', now() + interval '1 day' + interval '9 hours', now() + interval '1 day' + interval '11 hours', 'confirmed', 12, 'c1000000-0000-0000-0000-000000000001', 225.00),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', '00a00000-0000-0000-0000-000000000001', 'Design Review', now() + interval '2 days' + interval '14 hours', now() + interval '2 days' + interval '15 hours', 'confirmed', 5, 'c1000000-0000-0000-0000-000000000001', 67.50),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', '00a00000-0000-0000-0000-000000000002', 'Training Session', now() + interval '3 days' + interval '10 hours', now() + interval '3 days' + interval '16 hours', 'confirmed', 18, 'c1000000-0000-0000-0000-000000000004', 810.00),
  ('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000009', '00a00000-0000-0000-0000-000000000003', 'Board Meeting', now() + interval '4 days' + interval '9 hours', now() + interval '4 days' + interval '12 hours', 'confirmed', 10, 'c1000000-0000-0000-0000-000000000004', 360.00),
  ('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', '00a00000-0000-0000-0000-000000000001', '1:1 Standup', now() + interval '1 day' + interval '15 hours', now() + interval '1 day' + interval '15 hours' + interval '30 minutes', 'confirmed', 2, 'c1000000-0000-0000-0000-000000000001', 12.50),
  ('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', '00a00000-0000-0000-0000-000000000001', 'Q4 Review', now() - interval '5 days' + interval '10 hours', now() - interval '5 days' + interval '12 hours', 'completed', 14, 'c1000000-0000-0000-0000-000000000001', 225.00),
  ('d1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000006', '00a00000-0000-0000-0000-000000000002', 'Team Workshop', now() - interval '3 days' + interval '9 hours', now() - interval '3 days' + interval '17 hours', 'completed', 8, 'c1000000-0000-0000-0000-000000000004', 600.00),
  ('d1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000010', '00a00000-0000-0000-0000-000000000004', 'Budget Review', now() - interval '7 days' + interval '14 hours', now() - interval '7 days' + interval '16 hours', 'completed', 6, 'c1000000-0000-0000-0000-000000000003', 120.00),
  ('d1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000002', '00a00000-0000-0000-0000-000000000001', 'Cancelled Standup', now() - interval '2 days' + interval '9 hours', now() - interval '2 days' + interval '9 hours' + interval '30 minutes', 'cancelled', 3, 'c1000000-0000-0000-0000-000000000001', 22.50)
ON CONFLICT DO NOTHING;

-- Sample Visitors
INSERT INTO visitors (booking_id, name, email, token_expires_at, status) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Dr. Thomas Keller', 'thomas.keller@partner.com', now() + interval '2 days', 'invited'),
  ('d1000000-0000-0000-0000-000000000001', 'Lisa Meier', 'lisa.meier@client.com', now() + interval '2 days', 'invited'),
  ('d1000000-0000-0000-0000-000000000004', 'James Wilson', 'james.wilson@board.com', now() + interval '5 days', 'invited')
ON CONFLICT DO NOTHING;

-- Occupancy Events
INSERT INTO occupancy_events (room_id, sensor_id, status, recorded_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000001', 'occupied', now() - interval '30 minutes'),
  ('a1000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000001', 'empty', now() - interval '5 minutes'),
  ('a1000000-0000-0000-0000-000000000002', '5e000000-0000-0000-0000-000000000002', 'occupied', now() - interval '15 minutes'),
  ('a1000000-0000-0000-0000-000000000003', '5e000000-0000-0000-0000-000000000003', 'empty', now() - interval '1 hour'),
  ('a1000000-0000-0000-0000-000000000004', '5e000000-0000-0000-0000-000000000004', 'empty', now() - interval '2 hours'),
  ('a1000000-0000-0000-0000-000000000005', '5e000000-0000-0000-0000-000000000005', 'occupied', now() - interval '10 minutes')
ON CONFLICT DO NOTHING;

-- Update room occupancy status
UPDATE rooms SET occupancy_status = 'empty' WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE rooms SET occupancy_status = 'occupied' WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE rooms SET occupancy_status = 'empty' WHERE id = 'a1000000-0000-0000-0000-000000000003';
UPDATE rooms SET occupancy_status = 'empty' WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE rooms SET occupancy_status = 'occupied' WHERE id = 'a1000000-0000-0000-0000-000000000005';

-- Audit Log entries
INSERT INTO audit_log (entity_type, entity_id, action, actor_id, details) VALUES
  ('booking', 'd1000000-0000-0000-0000-000000000001', 'created', '00a00000-0000-0000-0000-000000000001', '{"title":"Sprint Planning"}'),
  ('booking', 'd1000000-0000-0000-0000-000000000009', 'cancelled', '00a00000-0000-0000-0000-000000000001', '{"reason":"Rescheduled"}'),
  ('room', 'a1000000-0000-0000-0000-000000000001', 'status_update', null, '{"old":"unknown","new":"empty"}')
ON CONFLICT DO NOTHING;
