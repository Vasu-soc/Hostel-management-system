-- Enable Realtime for all management tables
DO $$
BEGIN
    -- List of tables to enable realtime for
    -- hostel_applications, gate_passes, students, rooms, electrical_issues, food_issues, room_issues, medical_alerts, study_materials, daily_attendance, fee_transactions, food_selections, payment_submissions

    -- Add hostel_applications if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hostel_applications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.hostel_applications;
    END IF;

    -- Add gate_passes if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'gate_passes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.gate_passes;
    END IF;

    -- Add students if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'students') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
    END IF;

    -- Add rooms if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
    END IF;

    -- Add electrical_issues if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'electrical_issues') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.electrical_issues;
    END IF;

    -- Add food_issues if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'food_issues') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.food_issues;
    END IF;

    -- Add room_issues if table exists and not added
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_issues' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_issues') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.room_issues;
        END IF;
    END IF;

    -- Add medical_alerts if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'medical_alerts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_alerts;
    END IF;

    -- Add study_materials if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_materials') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.study_materials;
    END IF;

    -- Add daily_attendance if table exists and not added
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_attendance' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'daily_attendance') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_attendance;
        END IF;
    END IF;

    -- Add fee_transactions if table exists and not added
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fee_transactions' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fee_transactions') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_transactions;
        END IF;
    END IF;

    -- Add payment_submissions if table exists and not added
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_submissions' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payment_submissions') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_submissions;
        END IF;
    END IF;

END $$;
