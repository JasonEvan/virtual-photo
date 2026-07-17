-- Seed data for the packets table
INSERT INTO "packets" (
  "id", 
  "name", 
  "has_photo", 
  "has_notes", 
  "has_vn", 
  "has_filter", 
  "has_gif", 
  "created_at"
) VALUES 
  (
    '39ca6f9b-27f0-4c17-ad84-003b50ecd691', 
    'Paket 1: Foto, Ucapan', 
    true, 
    true, 
    false, 
    false, 
    false, 
    '2026-07-15 14:20:45.653'
  ),
  (
    'f9df0fa2-8894-4978-978d-79e7796806db', 
    'Paket 2: Foto, Ucapan, VN', 
    true, 
    true, 
    true, 
    false, 
    false, 
    '2026-07-15 14:20:45.653'
  ),
  (
    '1eaf967b-37ad-462c-b9f4-62da7923dec8', 
    'Paket 3: Foto, Ucapan, VN, Filter', 
    true, 
    true, 
    true, 
    true, 
    false, 
    '2026-07-15 14:20:45.653'
  ),
  (
    'e02c9316-7a87-40d3-bb91-544cdc0204e6', 
    'Paket 4: Foto, Ucapan, VN, Filter, GIF', 
    true, 
    true, 
    true, 
    true, 
    true, 
    '2026-07-15 14:20:45.653'
  )
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "has_photo" = EXCLUDED."has_photo",
  "has_notes" = EXCLUDED."has_notes",
  "has_vn" = EXCLUDED."has_vn",
  "has_filter" = EXCLUDED."has_filter",
  "has_gif" = EXCLUDED."has_gif";
