-- ============================================
-- 010_allow_koor_delete_drive_links.sql
-- Izinkan koordinator dan admin menghapus drive link
-- agar tidak menumpuk setelah penugasan selesai.
-- ============================================

DROP POLICY IF EXISTS "Koor and Admin delete drive links" ON drive_links;

CREATE POLICY "Koor and Admin delete drive links" ON drive_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.user_id = auth.uid() 
      AND (m.role IN ('super_admin', 'admin') OR m.is_koor = TRUE)
    )
  );
