-- Enable realtime for rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Enable realtime for study_materials table
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_materials;