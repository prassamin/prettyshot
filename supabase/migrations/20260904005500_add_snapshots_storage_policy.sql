CREATE POLICY "Users can insert snapshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'prettyshot' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'snapshots' AND
        (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "Users can update snapshots" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'prettyshot' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'snapshots' AND
        (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "Users can delete snapshots" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'prettyshot' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = 'snapshots' AND
        (storage.foldername(name))[2] = auth.uid()::text
    );
