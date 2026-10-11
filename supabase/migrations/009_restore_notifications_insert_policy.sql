-- ============================================
-- 009_restore_notifications_insert_policy.sql
-- Root cause notifikasi 2 HP: policy INSERT hilang dari tabel notifications.
-- Trigger notify_koordinators_on_drive_link (SECURITY DEFINER) butuh policy ini
-- agar bisa insert notifikasi. Tanpa policy, trigger gagal diam-diam.
-- ============================================

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);
