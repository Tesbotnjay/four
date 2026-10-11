-- ============================================
-- 002_division_tasks_and_drive.sql
-- Division assignments & Drive links schema
-- Aman dijalankan berulang (idempotent)
-- ============================================

-- Extension untuk uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alter members table to support division
ALTER TABLE members ADD COLUMN IF NOT EXISTS divisi TEXT CHECK (divisi IN ('Dokumentasi', 'Media', 'Berita', 'Korespondensi', 'Umum'));
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_koor BOOLEAN DEFAULT FALSE;

-- ============================================
-- ASSIGNMENTS TABLE (Penugasan Anggota per Divisi)
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  divisi TEXT NOT NULL CHECK (divisi IN ('Dokumentasi', 'Media', 'Berita', 'Korespondensi', 'Umum')),
  assigned_to UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES members(id),
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DRIVE LINKS TABLE (Link Google Drive Lintas Divisi)
-- ============================================
CREATE TABLE IF NOT EXISTS drive_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  divisi_owner TEXT NOT NULL CHECK (divisi_owner IN ('Dokumentasi', 'Media', 'Berita', 'Korespondensi', 'Umum')),
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_divisi ON assignments(divisi);
CREATE INDEX IF NOT EXISTS idx_drive_links_activity ON drive_links(activity_id);
CREATE INDEX IF NOT EXISTS idx_drive_links_divisi ON drive_links(divisi_owner);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_links ENABLE ROW LEVEL SECURITY;

-- Policies for Assignments
DROP POLICY IF EXISTS "Members view assigned tasks" ON assignments;
DROP POLICY IF EXISTS "Koor and Admin create assignments" ON assignments;
DROP POLICY IF EXISTS "Members update status" ON assignments;

CREATE POLICY "Members view assigned tasks" ON assignments
  FOR SELECT USING (
    assigned_to IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR assigned_by IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM members m 
      WHERE m.user_id = auth.uid() 
      AND (m.role IN ('super_admin', 'admin') OR m.is_koor = TRUE)
    )
  );

CREATE POLICY "Koor and Admin create assignments" ON assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.user_id = auth.uid() 
      AND (m.role IN ('super_admin', 'admin') OR m.is_koor = TRUE)
    )
  );

CREATE POLICY "Members update status" ON assignments
  FOR UPDATE USING (
    assigned_to IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR assigned_by IN (SELECT id FROM members WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM members m 
      WHERE m.user_id = auth.uid() 
      AND (m.role IN ('super_admin', 'admin') OR m.is_koor = TRUE)
    )
  );

-- Policies for Drive Links
DROP POLICY IF EXISTS "Authenticated members view drive links" ON drive_links;
DROP POLICY IF EXISTS "Koor and Admin insert drive links" ON drive_links;

CREATE POLICY "Authenticated members view drive links" ON drive_links
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Koor and Admin insert drive links" ON drive_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m 
      WHERE m.user_id = auth.uid() 
      AND (m.role IN ('super_admin', 'admin') OR m.is_koor = TRUE)
    )
  );

-- Realtime publication (aman dijalankan ulang)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE assignments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE drive_links;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
