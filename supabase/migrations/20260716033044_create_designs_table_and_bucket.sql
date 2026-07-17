-- Create "designs" table
CREATE TABLE public.designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on designs table
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Policies for designs table
CREATE POLICY "Users can view their own designs" ON public.designs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own designs" ON public.designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs" ON public.designs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs" ON public.designs
    FOR DELETE USING (auth.uid() = user_id);

-- Create a storage bucket for uploaded images and backgrounds
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('prettyshot', 'prettyshot', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the storage bucket objects
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'prettyshot');

CREATE POLICY "Users can upload to their own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'prettyshot' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'design-images' AND
        (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "Users can update their own folder" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'prettyshot' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'design-images' AND
        (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own folder" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'prettyshot' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'design-images' AND
        (storage.foldername(name))[2] = auth.uid()::text
    );
