-- Create students table
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

-- Create wardens table
CREATE TABLE public.wardens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT,
  warden_type TEXT NOT NULL CHECK (warden_type IN ('boys', 'girls')),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hostel applications table
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

-- Create rooms table
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

-- Create gate passes table
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

-- Create electrical issues table
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

-- Create food issues table
CREATE TABLE public.food_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study materials table
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

-- Enable Row Level Security on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electrical_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Create public access policies (since this is an internal college system without auth)
CREATE POLICY "Allow public read access on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert on students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on students" ON public.students FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on wardens" ON public.wardens FOR SELECT USING (true);
CREATE POLICY "Allow public insert on wardens" ON public.wardens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on wardens" ON public.wardens FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on hostel_applications" ON public.hostel_applications FOR SELECT USING (true);
CREATE POLICY "Allow public insert on hostel_applications" ON public.hostel_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on hostel_applications" ON public.hostel_applications FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert on rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on rooms" ON public.rooms FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on gate_passes" ON public.gate_passes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on gate_passes" ON public.gate_passes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on gate_passes" ON public.gate_passes FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on electrical_issues" ON public.electrical_issues FOR SELECT USING (true);
CREATE POLICY "Allow public insert on electrical_issues" ON public.electrical_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on electrical_issues" ON public.electrical_issues FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on food_issues" ON public.food_issues FOR SELECT USING (true);
CREATE POLICY "Allow public insert on food_issues" ON public.food_issues FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on food_issues" ON public.food_issues FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on study_materials" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert on study_materials" ON public.study_materials FOR INSERT WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hostel_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gate_passes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.electrical_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_issues;

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for students table
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample rooms
INSERT INTO public.rooms (room_number, floor_number, room_type, ac_type, total_beds) VALUES
('101', '1', 'double', 'ac', 2),
('102', '1', 'double', 'ac', 2),
('103', '1', 'four', 'ac', 4),
('104', '1', 'four', 'normal', 4),
('105', '1', 'six', 'normal', 6),
('201', '2', 'single', 'ac', 1),
('202', '2', 'double', 'ac', 2),
('203', '2', 'three', 'normal', 3),
('204', '2', 'four', 'normal', 4),
('205', '2', 'six', 'normal', 6),
('301', '3', 'single', 'ac', 1),
('302', '3', 'double', 'normal', 2),
('303', '3', 'three', 'normal', 3),
('304', '3', 'four', 'ac', 4),
('305', '3', 'six', 'normal', 6);