-- ============================================
-- TRIGGER: Notify other koordinators when a drive link is created
-- ============================================

CREATE OR REPLACE FUNCTION notify_koordinators_on_drive_link()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
  SELECT 
    m.user_id,
    'Link Drive Baru',
    NEW.title || ' telah ditambahkan untuk divisi ' || NEW.divisi_owner,
    'drive_link',
    NEW.id,
    'drive_link'
  FROM members m
  WHERE m.is_koor = true
    AND m.status = 'aktif'
    AND m.user_id IS NOT NULL
    AND m.id != NEW.created_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_drive_link ON drive_links;
CREATE TRIGGER trigger_notify_drive_link
  AFTER INSERT ON drive_links
  FOR EACH ROW
  EXECUTE FUNCTION notify_koordinators_on_drive_link();
