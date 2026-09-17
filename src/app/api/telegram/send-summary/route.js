import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    const { activity_id } = body

    if (!activity_id) {
      return NextResponse.json({ error: 'activity_id wajib diisi' }, { status: 400 })
    }

    // Get settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['telegram_bot_token', 'telegram_group_chat_id'])

    const botToken = settingsData?.find((s) => s.key === 'telegram_bot_token')?.value
    const chatId = settingsData?.find((s) => s.key === 'telegram_group_chat_id')?.value

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram belum dikonfigurasi. Silakan isi Bot Token dan Chat ID di Pengaturan.' },
        { status: 400 }
      )
    }

    // Get activity data
    const { data: activity } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activity_id)
      .single()

    if (!activity) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    // Get attendance stats
    const { data: attendances } = await supabase
      .from('attendance')
      .select('final_status')
      .eq('activity_id', activity_id)

    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif')

    const stats = { hadir: 0, izin: 0, sakit: 0, alfa: 0 }
    attendances?.forEach((a) => {
      if (['hadir', 'izin', 'sakit', 'alfa'].includes(a.final_status)) {
        stats[a.final_status]++
      }
    })

    const persentase = totalMembers > 0 ? Math.round((stats.hadir / totalMembers) * 100) : 0
    const dateFormatted = new Date(activity.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    const message = `JURNFOURTEEN — REKAP KEHADIRAN

Kegiatan: ${activity.name}
Tanggal: ${dateFormatted}
Waktu: ${activity.start_time} WITA
Tempat: ${activity.location || '-'}

Total: ${totalMembers || 0} anggota
Hadir: ${stats.hadir}
Izin: ${stats.izin}
Sakit: ${stats.sakit}
Alfa: ${stats.alfa}
Persentase: ${persentase}%

Rekap lengkap tersedia di dashboard JurnFourteen.`

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })

    const result = await response.json()

    await supabase.from('telegram_logs').insert({
      event_type: 'recap',
      payload: JSON.stringify({ activity_id, activity_name: activity.name }),
      status: result.ok ? 'success' : 'failed',
      error_message: result.ok ? null : JSON.stringify(result),
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: `Telegram gagal: ${result.description || 'Unknown error'}` },
        { status: 400 }
      )
    }

    await supabase.from('activity_logs').insert({
      action: 'Mengirim rekap ke Telegram',
      details: `Mengirim rekap kehadiran ${activity.name} ke Telegram`,
      member_name: 'Admin',
    })

    return NextResponse.json({ message: 'Rekap berhasil dikirim ke Telegram' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
