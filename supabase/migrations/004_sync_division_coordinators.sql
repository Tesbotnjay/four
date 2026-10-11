-- Sync existing member profiles with division-task fields.
-- Preserve any division assigned manually in the dashboard.

UPDATE members
SET divisi = CASE
  WHEN jabatan ILIKE '%dokument%' OR jabatan ILIKE '%dokumen%' THEN 'Dokumentasi'
  WHEN jabatan ILIKE '%media%' THEN 'Media'
  WHEN jabatan ILIKE '%berita%' THEN 'Berita'
  WHEN jabatan ILIKE '%koresponden%' THEN 'Korespondensi'
  ELSE divisi
END
WHERE divisi IS NULL;

UPDATE members
SET is_koor = TRUE
WHERE is_koor = FALSE
  AND (jabatan ILIKE '%koor%' OR jabatan ILIKE '%koordinator%');
