-- ============================================
-- 007_fix_drive_link_notify_rls.sql
-- Root cause: trigger notify_koordinators_on_drive_link jalan sebagai
-- user yang insert (SECURITY INVOKER). Tabel notifications punya RLS
-- aktif tanpa policy INSERT, sehingga INSERT notifikasi gagal dan
-- seluruh insert drive_links ikut dibatalkan (SIMPAN gagal).
-- Fix: jadikan fungsi SECURITY DEFINER dengan search_path tetap.
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_koordinators_on_drive_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;
