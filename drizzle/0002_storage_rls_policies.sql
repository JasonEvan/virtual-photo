-- Allow all operations on the Picture bucket for all roles
-- The sb_publishable_ key maps to the "public" PostgreSQL role
CREATE POLICY "Allow all Picture operations"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'Picture')
WITH CHECK (bucket_id = 'Picture');
