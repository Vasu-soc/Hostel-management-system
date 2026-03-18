-- Run this script in the Supabase SQL Editor

-- 1. Create leave_extensions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.leave_extensions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    roll_number TEXT NOT NULL,
    gate_pass_id UUID NOT NULL,
    reason TEXT NOT NULL,
    number_of_days INTEGER NOT NULL,
    extension_from DATE,
    extension_to DATE,
    proof_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns AND the Foreign Key relationship if they don't exist
DO $$ 
    BEGIN 
        -- Add columns if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_extensions' AND column_name='extension_from') THEN
            ALTER TABLE public.leave_extensions ADD COLUMN extension_from DATE; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leave_extensions' AND column_name='extension_to') THEN
            ALTER TABLE public.leave_extensions ADD COLUMN extension_to DATE; 
        END IF;

        -- Add Foreign Key constraint if missing (essential for joins in Supabase)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'leave_extensions_student_id_fkey' 
            AND table_name = 'leave_extensions'
        ) THEN
            ALTER TABLE public.leave_extensions 
            ADD CONSTRAINT leave_extensions_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES public.students(id);
        END IF;
    END; 
$$;

-- 2. Create Row Level Security Policies safely
ALTER TABLE public.leave_extensions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users' AND tablename = 'leave_extensions') THEN
        CREATE POLICY "Enable read access for all users" ON public.leave_extensions FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for all users' AND tablename = 'leave_extensions') THEN
        CREATE POLICY "Enable insert for all users" ON public.leave_extensions FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for all users' AND tablename = 'leave_extensions') THEN
        CREATE POLICY "Enable update for all users" ON public.leave_extensions FOR UPDATE USING (true);
    END IF;
END $$;

-- 3. Create Storage bucket for leave-proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('leave-proofs', 'leave-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies (using DO blocks to avoid "already exists" errors)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for leave-proofs' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access for leave-proofs" ON storage.objects FOR SELECT USING ( bucket_id = 'leave-proofs' );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Uploads for leave-proofs' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Allow Uploads for leave-proofs" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'leave-proofs' );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Deletes for leave-proofs' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Allow Deletes for leave-proofs" ON storage.objects FOR DELETE USING ( bucket_id = 'leave-proofs' );
    END IF;
END $$;
