-- ============================================
-- 006_allow_koor_delete_assignments.sql
-- Izinkan koordinator dan admin menghapus tugas
-- ============================================

DROP POLICY IF EXISTS "Koor and Admin delete assignments" ON assignments;

CREATE POLICY "Koor and Admin delete assignments" ON assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.user_id = auth.uid() 
      AND (m.role IN ('super_admin', 'admin') OR m.is_koor = TRUE)
    )
  );
