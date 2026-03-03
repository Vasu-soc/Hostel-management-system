-- Add remarks column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Add closed_beds column to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS closed_beds INTEGER DEFAULT 0;

-- Insert admin account with credentials Admin@123, 200421
INSERT INTO public.admins (name, username, password, mobile_number)
VALUES ('Admin', 'Admin@123', '200421', '0000000000')
ON CONFLICT DO NOTHING;