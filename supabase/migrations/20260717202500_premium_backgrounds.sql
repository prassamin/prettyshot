-- Create backgrounds table
CREATE TABLE public.backgrounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('gradient', 'mesh')),
    name TEXT NOT NULL,
    thumbnail_url TEXT,
    storage_path TEXT,
    css_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.backgrounds ENABLE ROW LEVEL SECURITY;

-- Public read access so the frontend can display the catalog
CREATE POLICY "Public read access for backgrounds" ON public.backgrounds
    FOR SELECT USING (true);

-- Create a storage bucket for private premium assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('premium-assets', 'premium-assets', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- We intentionally DO NOT add public SELECT policies to storage.objects for 'premium-assets'.
-- The Next.js server will use the service role key to generate signed URLs for verified Pro users.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;