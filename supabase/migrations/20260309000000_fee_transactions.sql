CREATE TABLE IF NOT EXISTS public.fee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
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
