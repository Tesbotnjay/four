import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SEED_USERS = [
  { username: 'superadmin', password: 'SuperAdmin@2026', full_name: 'Super Administrator', jabatan: 'Ketua Umum', role: 'super_admin', kelas: null, nis_nisn: null, phone: '081234567890' },
  { username: 'admin', password: 'Admin@2026', full_name: 'Ahmad Rasyid', jabatan: 'Ketua Umum', role: 'admin', kelas: '12-1', nis_nisn: '2024001', phone: '081234567891' },
  { username: 'sekretaris', password: 'Sekretaris@2026', full_name: 'Siti Aisyah', jabatan: 'Sekretaris', role: 'sekretaris', kelas: '12-2', nis_nisn: '2024002', phone: '081234567892' },
  { username: 'pembina', password: 'Pembina@2026', full_name: 'Pak Budi Santoso', jabatan: 'Pembina', role: 'pembina', kelas: null, nis_nisn: null, phone: '081234567893' },
  { username: 'anggota01', password: 'Anggota@2026', full_name: 'M. Walid', jabatan: 'Anggota', role: 'anggota', kelas: '12-2', nis_nisn: '2024003', phone: '081234567894' },
  { username: 'anggota02', password: 'Anggota@2026', full_name: 'Aca Permata', jabatan: 'Koordinator Liputan', role: 'anggota', kelas: '11-1', nis_nisn: '2025001', phone: '081234567895' },
  { username: 'anggota03', password: 'Anggota@2026', full_name: 'Rian Pratama', jabatan: 'Koordinator Desain/Multimedia', role: 'anggota', kelas: '12-1', nis_nisn: '2024004', phone: '081234567896' },
  { username: 'anggota04', password: 'Anggota@2026', full_name: 'Sinta Dewi', jabatan: 'Bendahara', role: 'anggota', kelas: '11-2', nis_nisn: '2025002', phone: '081234567897' },
  { username: 'anggota05', password: 'Anggota@2026', full_name: 'Dimas Arya', jabatan: 'Anggota', role: 'anggota', kelas: '10-1', nis_nisn: '2026001', phone: '081234567898' },
]

const SEED_ACTIVITIES = [
  { name: 'Rapat JurnFourteen', description: 'Rapat koordinasi mingguan JurnFourteen membahas persiapan kegiatan.', activity_date: '2026-09-16', start_time: '15:30', end_time: '17:00', location: 'Ruang Jurnalistik', status: 'aktif', requires_attendance: true },
  { name: 'Dokumentasi Acara Sekolah', description: 'Meliput dan mendokumentasikan acara HUT sekolah.', activity_date: '2026-09-20', start_time: '08:00', end_time: '12:00', location: 'Aula Sekolah', status: 'akan_datang', requires_attendance: true },
  { name: 'Pelatihan Fotografi', description: 'Workshop fotografi dasar untuk anggota baru.', activity_date: '2026-09-12', start_time: '14:00', end_time: '16:00', location: 'Lab Komputer', status: 'selesai', requires_attendance: true },
]

export async function POST(request) {
  try {
    const supabase = await createServiceClient()

    // Check if already seeded
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    if (count > 0) {
      return NextResponse.json(
        { message: `Database sudah memiliki ${count} anggota. Seed dibatalkan untuk menghindari duplikasi.` },
        { status: 200 }
      )
    }

    const createdMembers = []

    // Create users and members
    for (const user of SEED_USERS) {
      const email = `${user.username}@jurnfourteen.app`

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: user.password,
        email_confirm: true,
      })

      if (authError) {
        console.error(`Failed to create auth user ${user.username}:`, authError.message)
        continue
      }

      // Create member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          user_id: authData.user.id,
          full_name: user.full_name,
          username: user.username,
          jabatan: user.jabatan,
          role: user.role,
          kelas: user.kelas,
          nis_nisn: user.nis_nisn,
          phone: user.phone,
          status: 'aktif',
          show_public: true,
          joined_at: '2026-01-15',
        })
        .select()
        .single()

      if (memberError) {
        console.error(`Failed to create member ${user.username}:`, memberError.message)
        continue
      }

      createdMembers.push(member)
    }

    // Create activities
    const adminMember = createdMembers.find((m) => m.role === 'admin')
    const createdActivities = []

    for (const activity of SEED_ACTIVITIES) {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...activity,
          created_by: adminMember?.id || null,
        })
        .select()
        .single()

      if (!error && data) createdActivities.push(data)
    }

    // Create a sample broadcast
    await supabase.from('broadcasts').insert({
      title: 'Rapat JurnFourteen Hari Ini',
      content: 'Hari ini akan dilaksanakan rapat koordinasi JurnFourteen. Diharapkan seluruh anggota hadir tepat waktu.',
      broadcast_date: '2026-09-16',
      broadcast_time: '15:30',
      location: 'Ruang Jurnalistik',
      priority: 'penting',
      visibility: 'internal',
      target_type: 'semua',
      requires_confirmation: true,
      activity_id: createdActivities[0]?.id || null,
      created_by: adminMember?.id || null,
    })

    // Create a sample announcement
    await supabase.from('announcements').insert({
      title: 'Selamat Datang di JurnFourteen!',
      content: 'Sistem administrasi JurnFourteen telah aktif. Gunakan website ini untuk mengatur kegiatan, absensi, dan informasi ekskul.',
      priority: 'penting',
      created_by: adminMember?.id || null,
    })

    // Log seed
    await supabase.from('activity_logs').insert({
      action: 'Seed database',
      details: `Database berhasil di-seed dengan ${createdMembers.length} anggota dan ${createdActivities.length} kegiatan`,
      member_name: 'System',
    })

    return NextResponse.json({
      message: 'Seed berhasil!',
      summary: {
        members: createdMembers.length,
        activities: createdActivities.length,
        credentials: SEED_USERS.map((u) => ({
          username: u.username,
          password: u.password,
          role: u.role,
          name: u.full_name,
        })),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
