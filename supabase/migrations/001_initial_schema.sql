-- ============================================
-- JURNFOURTEEN DATABASE SCHEMA
-- PostgreSQL / Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MEMBERS TABLE
-- Stores all member/user profile data
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  nis_nisn TEXT,
  kelas TEXT,
  phone TEXT,
  avatar_url TEXT,
  jabatan TEXT DEFAULT 'Anggota',
  role TEXT DEFAULT 'anggota' CHECK (role IN ('super_admin', 'admin', 'pembina', 'sekretaris', 'anggota')),
  status TEXT DEFAULT 'menunggu_verifikasi' CHECK (status IN ('aktif', 'nonaktif', 'menunggu_verifikasi')),
  bio TEXT,
  social_link TEXT,
  show_public BOOLEAN DEFAULT FALSE,
  join_reason TEXT,
  joined_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITIES TABLE
-- Stores kegiatan/events
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  activity_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  location TEXT,
  status TEXT DEFAULT 'akan_datang' CHECK (status IN ('akan_datang', 'aktif', 'selesai', 'dibatalkan')),
  requires_attendance BOOLEAN DEFAULT TRUE,
  confirm_start TIMESTAMPTZ,
  confirm_end TIMESTAMPTZ,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE TABLE
-- Tracks member responses and final status
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  response TEXT CHECK (response IN ('hadir', 'izin', 'sakit')),
  final_status TEXT DEFAULT 'pending' CHECK (final_status IN ('pending', 'hadir', 'izin', 'sakit', 'alfa', 'rejected')),
  note TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, activity_id)
);

-- ============================================
-- LEAVE REQUESTS TABLE
-- Stores izin and sakit submissions
-- ============================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('izin', 'sakit')),
  request_date DATE DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  proof_file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  verified_by UUID REFERENCES members(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BROADCASTS TABLE
-- Internal and public broadcasts
-- ============================================
CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  broadcast_date DATE,
  broadcast_time TIME,
  location TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'penting', 'urgent')),
  visibility TEXT DEFAULT 'internal' CHECK (visibility IN ('internal', 'publik')),
  target_type TEXT DEFAULT 'semua' CHECK (target_type IN ('semua', 'kelas', 'pengurus', 'tertentu')),
  target_value TEXT, -- JSON array of class names or member IDs
  requires_confirmation BOOLEAN DEFAULT FALSE,
  send_telegram BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANNOUNCEMENTS TABLE
-- General announcements
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_date DATE DEFAULT CURRENT_DATE,
  attachment_url TEXT,
  target_type TEXT DEFAULT 'semua',
  target_value TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'penting', 'urgent')),
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- In-app notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- 'broadcast', 'attendance', 'leave', 'verification', 'announcement', 'system'
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOGS TABLE
-- Audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_name TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TELEGRAM LOGS TABLE
-- Track Telegram API calls
-- ============================================
CREATE TABLE IF NOT EXISTS telegram_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- System-wide settings
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_username ON members(username);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_kelas ON members(kelas);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_activity_id ON attendance(activity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_final_status ON attendance(final_status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_member_id ON leave_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_activity_id ON leave_requests(activity_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_visibility ON broadcasts(visibility);
CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- MEMBERS POLICIES
CREATE POLICY "Members can view own profile" ON members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin', 'pembina', 'sekretaris')
    )
  );

CREATE POLICY "Public can view public members" ON members
  FOR SELECT USING (show_public = TRUE AND status = 'aktif');

CREATE POLICY "Admin can insert members" ON members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin')
    )
    OR NOT EXISTS (SELECT 1 FROM members) -- Allow first user (superadmin seed)
    OR auth.uid() = user_id -- Allow self-registration
  );

CREATE POLICY "Admin can update members" ON members
  FOR UPDATE USING (
    auth.uid() = user_id -- Own profile
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin')
    )
  );

-- ACTIVITIES POLICIES
CREATE POLICY "Authenticated users can view activities" ON activities
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin/Sekretaris can manage activities" ON activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin', 'sekretaris')
    )
  );

-- ATTENDANCE POLICIES
CREATE POLICY "Members can view own attendance" ON attendance
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can view all attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin', 'pembina', 'sekretaris')
    )
  );

CREATE POLICY "Members can insert own attendance" ON attendance
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can manage attendance" ON attendance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin', 'sekretaris')
    )
  );

-- LEAVE REQUESTS POLICIES
CREATE POLICY "Members can view own leave requests" ON leave_requests
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can view all leave requests" ON leave_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin', 'pembina', 'sekretaris')
    )
  );

CREATE POLICY "Members can insert own leave requests" ON leave_requests
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can manage leave requests" ON leave_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin', 'sekretaris')
    )
  );

-- BROADCASTS POLICIES
CREATE POLICY "Authenticated can view internal broadcasts" ON broadcasts
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    OR visibility = 'publik'
  );

CREATE POLICY "Admin can manage broadcasts" ON broadcasts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin')
    )
  );

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Authenticated can view announcements" ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin')
    )
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- ACTIVITY LOGS POLICIES
CREATE POLICY "Admin can view activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin', 'pembina')
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (TRUE);

-- TELEGRAM LOGS POLICIES
CREATE POLICY "Admin can view telegram logs" ON telegram_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can insert telegram logs" ON telegram_logs
  FOR INSERT WITH CHECK (TRUE);

-- SETTINGS POLICIES
CREATE POLICY "Admin can view settings" ON settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin')
    )
  );

CREATE POLICY "Admin can manage settings" ON settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
      AND m.role IN ('super_admin')
    )
  );

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for key tables
-- ============================================

-- Run these in Supabase Dashboard > Database > Replication
-- ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
-- ALTER PUBLICATION supabase_realtime ADD TABLE broadcasts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE leave_requests;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE activities;
-- ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- ============================================
-- DEFAULT SETTINGS
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('org_name', 'JurnFourteen'),
  ('org_full_name', 'Ekstrakurikuler Jurnalistik'),
  ('tagline', 'Jurnalistik sekolah dalam satu sistem.'),
  ('telegram_bot_token', ''),
  ('telegram_group_chat_id', ''),
  ('telegram_secretary_chat_id', ''),
  ('notify_new_member', 'true'),
  ('notify_attendance', 'true'),
  ('notify_leave', 'true'),
  ('notify_sick', 'true'),
  ('notify_verification', 'true'),
  ('notify_broadcast', 'true'),
  ('notify_recap', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broadcasts_updated_at
  BEFORE UPDATE ON broadcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
