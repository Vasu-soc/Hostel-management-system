-- ============================================================
-- COMBINED MIGRATIONS - HOSTEL iHUB
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================================

-- ===================== MIGRATION 1: Core Tables =====================
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  branch TEXT NOT NULL,
  year TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  hostel_room_number TEXT,
  floor_number TEXT,
  validity_from TEXT,
  validity_to TEXT,
  password TEXT,
  room_allotted BOOLEAN DEFAULT false,
  total_fee NUMERIC DEFAULT 84000,
  paid_fee NUMERIC DEFAULT 0,
  pending_fee NUMERIC DEFAULT 84000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.wardens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT,
  warden_type TEXT NOT NULL CHECK (warden_type IN ('boys', 'girls')),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.hostel_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  father_name TEXT,
  branch TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  parent_phone_number TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl')),
  room_type TEXT NOT NULL,
  ac_type TEXT NOT NULL CHECK (ac_type IN ('ac', 'normal')),
  months INTEGER DEFAULT 12,
  price NUMERIC NOT NULL,
  photo_url TEXT,
  signature_url TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT UNIQUE NOT NULL,
  floor_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  ac_type TEXT NOT NULL CHECK (ac_type IN ('ac', 'normal')),
  total_beds INTEGER NOT NULL,
  occupied_beds INTEGER DEFAULT 0,
  pending_beds INTEGER GENERATED ALWAYS AS (total_beds - occupied_beds) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.gate_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  branch TEXT NOT NULL,
  student_mobile TEXT,
  parent_mobile TEXT,
  out_date DATE NOT NULL,
  in_date DATE NOT NULL,
  out_time TIME,
  in_time TIME,
  purpose TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.electrical_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  room_number TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.food_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warden_id UUID REFERENCES public.wardens(id) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  year TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  file_url TEXT,
  drive_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrical_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert on students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on wardens" ON public.wardens FOR SELECT USING (true);
CREATE POLICY "Allow public insert on wardens" ON public.wardens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on hostel_applications" ON public.hostel_applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on hostel_applications" ON public.hostel_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rooms" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public read access on gate_passes" ON public.gate_passes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on gate_passes" ON public.gate_passes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on electrical_issues" ON public.electrical_issues FOR SELECT USING (true);
CREATE POLICY "Allow public insert on electrical_issues" ON public.electrical_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on food_issues" ON public.food_issues FOR SELECT USING (true);
CREATE POLICY "Allow public insert on food_issues" ON public.food_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read access on study_materials" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert on study_materials" ON public.study_materials FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hostel_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gate_passes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.electrical_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_issues;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.rooms (room_number, floor_number, room_type, ac_type, total_beds) VALUES
('101', '1', 'double', 'ac', 2),('102', '1', 'double', 'ac', 2),
('103', '1', 'four', 'ac', 4),('104', '1', 'four', 'normal', 4),
('105', '1', 'six', 'normal', 6),('201', '2', 'single', 'ac', 1),
('202', '2', 'double', 'ac', 2),('203', '2', 'three', 'normal', 3),
('204', '2', 'four', 'normal', 4),('205', '2', 'six', 'normal', 6),
('301', '3', 'single', 'ac', 1),('302', '3', 'double', 'normal', 2),
('303', '3', 'three', 'normal', 3),('304', '3', 'four', 'ac', 4),
('305', '3', 'six', 'normal', 6);

-- ===================== MIGRATION 2: Admins Table =====================
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  mobile_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Allow public insert on admins" ON public.admins FOR INSERT WITH CHECK (true);

-- ===================== MIGRATION 3: Parents Table =====================
CREATE TABLE public.parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  student_roll_number TEXT NOT NULL,
  password TEXT NOT NULL
);
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on parents" ON public.parents FOR SELECT USING (true);
CREATE POLICY "Allow public insert on parents" ON public.parents FOR INSERT WITH CHECK (true);

-- ===================== MIGRATION 4: Extra columns + Admin account =====================
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS closed_beds INTEGER DEFAULT 0;
INSERT INTO public.admins (name, username, password, mobile_number)
VALUES ('Admin', 'Admin@123', '200421', '0000000000') ON CONFLICT DO NOTHING;

-- ===================== MIGRATION 5: RLS Policies Fix =====================
CREATE POLICY "Students update own non-critical fields" ON students FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Wardens update own record" ON wardens FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Staff update applications" ON hostel_applications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Staff update gate passes" ON gate_passes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Staff update electrical issues" ON electrical_issues FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Staff update food issues" ON food_issues FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Staff update rooms" ON rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Staff update study materials" ON study_materials FOR UPDATE USING (true) WITH CHECK (true);

-- ===================== MIGRATION 6: Girls Hostel Rooms =====================
INSERT INTO rooms (room_number, floor_number, room_type, ac_type, total_beds, occupied_beds, closed_beds) VALUES
('GA101','1','double','ac',2,0,0),('GA102','1','double','ac',2,0,0),
('GA103','1','four','ac',4,0,0),('GA104','1','four','ac',4,0,0),
('GA105','1','six','ac',6,0,0),('GA106','1','six','ac',6,0,0),
('GA201','2','double','ac',2,0,0),('GA202','2','double','ac',2,0,0),
('GA203','2','four','ac',4,0,0),('GA204','2','four','ac',4,0,0),
('GA205','2','six','ac',6,0,0),('GA206','2','six','ac',6,0,0),
('GA301','3','double','ac',2,0,0),('GA302','3','double','ac',2,0,0),
('GA303','3','four','ac',4,0,0),('GA304','3','four','ac',4,0,0),
('GA305','3','six','ac',6,0,0),('GA306','3','six','ac',6,0,0),
('GN101','1','double','normal',2,0,0),('GN102','1','double','normal',2,0,0),
('GN103','1','four','normal',4,0,0),('GN104','1','four','normal',4,0,0),
('GN105','1','six','normal',6,0,0),('GN106','1','six','normal',6,0,0),
('GN201','2','double','normal',2,0,0),('GN202','2','double','normal',2,0,0),
('GN203','2','four','normal',4,0,0),('GN204','2','four','normal',4,0,0),
('GN205','2','six','normal',6,0,0),('GN206','2','six','normal',6,0,0),
('GN301','3','double','normal',2,0,0),('GN302','3','double','normal',2,0,0),
('GN303','3','four','normal',4,0,0),('GN304','3','four','normal',4,0,0),
('GN305','3','six','normal',6,0,0),('GN306','3','six','normal',6,0,0);
ALTER TABLE wardens ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- ===================== MIGRATION 7: Signatures Storage Bucket =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true);
CREATE POLICY "Anyone can view signatures" ON storage.objects FOR SELECT USING (bucket_id = 'signatures');
CREATE POLICY "Authenticated users can upload signatures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'signatures');
CREATE POLICY "Users can update signatures" ON storage.objects FOR UPDATE USING (bucket_id = 'signatures');
CREATE POLICY "Users can delete signatures" ON storage.objects FOR DELETE USING (bucket_id = 'signatures');

-- ===================== MIGRATION 8: Delete policies for hostel apps & gate passes =====================
CREATE POLICY "Allow delete hostel applications" ON hostel_applications FOR DELETE USING (true);
CREATE POLICY "Allow delete gate passes" ON gate_passes FOR DELETE USING (true);

-- ===================== MIGRATION 9: email column on hostel_applications =====================
ALTER TABLE public.hostel_applications ADD COLUMN IF NOT EXISTS email TEXT;

-- ===================== MIGRATION 10: email on students, password reset tokens =====================
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'warden', 'parent', 'admin')),
  user_identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert password reset tokens" ON public.password_reset_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read password reset tokens" ON public.password_reset_tokens FOR SELECT USING (true);
CREATE POLICY "Allow public update password reset tokens" ON public.password_reset_tokens FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete password reset tokens" ON public.password_reset_tokens FOR DELETE USING (true);

-- ===================== MIGRATION 11: student_email on gate_passes =====================
ALTER TABLE public.gate_passes ADD COLUMN IF NOT EXISTS student_email text;

-- ===================== MIGRATION 12: Realtime for rooms & study_materials =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_materials;

-- ===================== MIGRATION 13: Medicines Table =====================
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💊',
  warden_type TEXT NOT NULL CHECK (warden_type IN ('boys', 'girls')),
  is_available BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.wardens(id)
);
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on medicines" ON public.medicines FOR SELECT USING (true);
CREATE POLICY "Allow wardens to insert medicines" ON public.medicines FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow wardens to update medicines" ON public.medicines FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow wardens to delete medicines" ON public.medicines FOR DELETE USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicines;

-- ===================== MIGRATION 14: Student photos =====================
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Student photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Anyone can upload student photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "Anyone can update student photos" ON storage.objects FOR UPDATE USING (bucket_id = 'student-photos');
CREATE POLICY "Anyone can delete student photos" ON storage.objects FOR DELETE USING (bucket_id = 'student-photos');

-- ===================== MIGRATION 15: Warden Registration Tokens =====================
CREATE TABLE public.warden_registration_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    warden_type TEXT NOT NULL CHECK (warden_type IN ('boys', 'girls')),
    created_by UUID REFERENCES public.admins(id),
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.warden_registration_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read of registration tokens" ON public.warden_registration_tokens FOR SELECT USING (true);
CREATE POLICY "Allow insert of registration tokens" ON public.warden_registration_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update of registration tokens" ON public.warden_registration_tokens FOR UPDATE USING (true);

-- ===================== MIGRATION 16: Warden approval columns =====================
ALTER TABLE public.wardens ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE public.wardens ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.wardens ADD COLUMN IF NOT EXISTS rejected_reason text;

-- ===================== MIGRATION 17: Medical Alerts =====================
CREATE TABLE IF NOT EXISTS public.medical_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id),
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    room_number TEXT,
    issue_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'medical_alerts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_alerts;
    END IF;
END $$;
ALTER TABLE public.medical_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.medical_alerts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.medical_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.medical_alerts FOR UPDATE USING (true);

-- ===================== MIGRATION 18: Warden deletion fix =====================
ALTER TABLE public.medicines DROP CONSTRAINT IF EXISTS medicines_created_by_fkey;
ALTER TABLE public.medicines ADD CONSTRAINT medicines_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.wardens(id) ON DELETE CASCADE;
DROP POLICY IF EXISTS "No delete wardens" ON public.wardens;
DROP POLICY IF EXISTS "Allow public delete on wardens" ON public.wardens;
DROP POLICY IF EXISTS "Enable delete for anyone" ON public.wardens;
CREATE POLICY "Enable delete for anyone" ON public.wardens FOR DELETE USING (true);
ALTER TABLE public.wardens ENABLE ROW LEVEL SECURITY;

-- ===================== MIGRATION 19: Study Materials Storage =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('study_materials', 'study_materials', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'study_materials');
CREATE POLICY "Wardens can upload materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study_materials');
CREATE POLICY "Wardens can update materials" ON storage.objects FOR UPDATE USING (bucket_id = 'study_materials');
CREATE POLICY "Wardens can delete materials" ON storage.objects FOR DELETE USING (bucket_id = 'study_materials');

-- ===================== MIGRATION 20: Reset & Fix Rooms =====================
CREATE POLICY "Enable delete for anyone students" ON public.students FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone applications" ON public.hostel_applications FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone gate passes" ON public.gate_passes FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone electrical issues" ON public.electrical_issues FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone food issues" ON public.food_issues FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone parents" ON public.parents FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone medical alerts" ON public.medical_alerts FOR DELETE USING (true);
CREATE POLICY "Enable delete for anyone study materials" ON public.study_materials FOR DELETE USING (true);

INSERT INTO public.rooms (room_number, floor_number, room_type, ac_type, total_beds, occupied_beds, closed_beds)
VALUES
    ('A101', '1', 'double', 'ac', 2, 0, 0),
    ('A102', '1', 'double', 'ac', 2, 0, 0),
    ('A103', '1', 'four', 'ac', 4, 0, 0),
    ('N104', '1', 'four', 'normal', 4, 0, 0),
    ('N105', '1', 'six', 'normal', 6, 0, 0)
ON CONFLICT (room_number) DO UPDATE SET
    floor_number = EXCLUDED.floor_number, room_type = EXCLUDED.room_type,
    ac_type = EXCLUDED.ac_type, total_beds = EXCLUDED.total_beds,
    occupied_beds = 0, closed_beds = 0;

UPDATE public.rooms SET occupied_beds = 0;

CREATE OR REPLACE FUNCTION decrement_occupied_beds(room_no TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.rooms SET occupied_beds = GREATEST(0, occupied_beds - 1) WHERE room_number = room_no;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================== MIGRATION 21: Fix Student Delete RLS =====================
CREATE OR REPLACE FUNCTION public.delete_student_complete(p_student_id UUID, p_roll_number TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_roll TEXT;
  v_deleted_count INTEGER;
  v_room_number TEXT;
BEGIN
  v_roll := UPPER(TRIM(p_roll_number));
  SELECT hostel_room_number INTO v_room_number FROM public.students WHERE id = p_student_id;
  DELETE FROM public.gate_passes WHERE roll_number = v_roll OR student_id = p_student_id;
  DELETE FROM public.electrical_issues WHERE roll_number = v_roll OR student_id = p_student_id;
  DELETE FROM public.food_issues WHERE roll_number = v_roll OR student_id = p_student_id;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_alerts' AND table_schema = 'public') THEN
    EXECUTE 'DELETE FROM public.medical_alerts WHERE roll_number = $1 OR student_id = $2' USING v_roll, p_student_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parents' AND table_schema = 'public') THEN
    EXECUTE 'DELETE FROM public.parents WHERE student_roll_number = $1' USING v_roll;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens' AND table_schema = 'public') THEN
    EXECUTE 'DELETE FROM public.password_reset_tokens WHERE user_identifier = $1' USING v_roll;
  END IF;
  DELETE FROM public.students WHERE id = p_student_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count > 0 AND v_room_number IS NOT NULL THEN
    UPDATE public.rooms SET occupied_beds = (SELECT COUNT(*) FROM public.students WHERE hostel_room_number = v_room_number AND room_allotted = true) WHERE room_number = v_room_number;
  END IF;
  IF v_deleted_count > 0 THEN
    RETURN jsonb_build_object('success', true, 'message', 'Student deleted successfully');
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Student not found or already deleted');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_student_complete(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_student_complete(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_student_complete(UUID, TEXT) TO service_role;

-- Fee Transactions Table
CREATE TABLE IF NOT EXISTS public.fee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    academic_year TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    remarks TEXT
);

ALTER TABLE public.fee_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.fee_transactions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.fee_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.fee_transactions
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.fee_transactions
    FOR DELETE USING (true);

-- Enable Realtime for fee_transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fee_transactions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_transactions;
    END IF;
END $$;
