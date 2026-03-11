-- Fix fee_transactions table to include academic_year and enable realtime
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fee_transactions' AND column_name = 'academic_year') THEN
        ALTER TABLE public.fee_transactions ADD COLUMN academic_year TEXT;
    END IF;
END $$;

-- Enable Realtime for fee_transactions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fee_transactions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fee_transactions;
    END IF;
END $$;
