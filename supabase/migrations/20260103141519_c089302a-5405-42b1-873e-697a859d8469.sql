-- Insert Girls Hostel Rooms (G prefix)
-- AC Block for Girls (GA)
INSERT INTO rooms (room_number, floor_number, room_type, ac_type, total_beds, occupied_beds, closed_beds)
VALUES
-- 1st Floor
('GA101', '1', 'double', 'ac', 2, 0, 0),
('GA102', '1', 'double', 'ac', 2, 0, 0),
('GA103', '1', 'four', 'ac', 4, 0, 0),
('GA104', '1', 'four', 'ac', 4, 0, 0),
('GA105', '1', 'six', 'ac', 6, 0, 0),
('GA106', '1', 'six', 'ac', 6, 0, 0),
-- 2nd Floor
('GA201', '2', 'double', 'ac', 2, 0, 0),
('GA202', '2', 'double', 'ac', 2, 0, 0),
('GA203', '2', 'four', 'ac', 4, 0, 0),
('GA204', '2', 'four', 'ac', 4, 0, 0),
('GA205', '2', 'six', 'ac', 6, 0, 0),
('GA206', '2', 'six', 'ac', 6, 0, 0),
-- 3rd Floor
('GA301', '3', 'double', 'ac', 2, 0, 0),
('GA302', '3', 'double', 'ac', 2, 0, 0),
('GA303', '3', 'four', 'ac', 4, 0, 0),
('GA304', '3', 'four', 'ac', 4, 0, 0),
('GA305', '3', 'six', 'ac', 6, 0, 0),
('GA306', '3', 'six', 'ac', 6, 0, 0);

-- Non-AC Block for Girls (GN)
INSERT INTO rooms (room_number, floor_number, room_type, ac_type, total_beds, occupied_beds, closed_beds)
VALUES
-- 1st Floor
('GN101', '1', 'double', 'normal', 2, 0, 0),
('GN102', '1', 'double', 'normal', 2, 0, 0),
('GN103', '1', 'four', 'normal', 4, 0, 0),
('GN104', '1', 'four', 'normal', 4, 0, 0),
('GN105', '1', 'six', 'normal', 6, 0, 0),
('GN106', '1', 'six', 'normal', 6, 0, 0),
-- 2nd Floor
('GN201', '2', 'double', 'normal', 2, 0, 0),
('GN202', '2', 'double', 'normal', 2, 0, 0),
('GN203', '2', 'four', 'normal', 4, 0, 0),
('GN204', '2', 'four', 'normal', 4, 0, 0),
('GN205', '2', 'six', 'normal', 6, 0, 0),
('GN206', '2', 'six', 'normal', 6, 0, 0),
-- 3rd Floor
('GN301', '3', 'double', 'normal', 2, 0, 0),
('GN302', '3', 'double', 'normal', 2, 0, 0),
('GN303', '3', 'four', 'normal', 4, 0, 0),
('GN304', '3', 'four', 'normal', 4, 0, 0),
('GN305', '3', 'six', 'normal', 6, 0, 0),
('GN306', '3', 'six', 'normal', 6, 0, 0);

-- Add warden_signature_url column to wardens table for gate pass signature
ALTER TABLE wardens ADD COLUMN IF NOT EXISTS signature_url TEXT;