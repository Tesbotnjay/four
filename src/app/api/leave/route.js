import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('leave_requests')
      .select('*, member:member_id(full_name, kelas, avatar_url), activity:activity_id(name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const { member_id, activity_id, type, reason, proof_file_url } = body

    if (!member_id || !type || !reason) {
      return NextResponse.json(
        { error: 'member_id, type, dan alasan wajib diisi' },
        { status: 400 }
      )
    }

    if (!['izin', 'sakit'].includes(type)) {
      return NextResponse.json(
        { error: 'Type harus izin atau sakit' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        member_id,
        activity_id: activity_id || null,
        type,
        reason,
        proof_file_url: proof_file_url || null,
        status: 'pending',
      })
      .select('*, member:member_id(full_name, kelas, user_id), activity:activity_id(name)')
      .single()

    if (error) throw error

    // Also update attendance if linked to activity
    if (activity_id) {
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('member_id', member_id)
        .eq('activity_id', activity_id)
        .single()

      if (existingAttendance) {
        await supabase
          .from('attendance')
          .update({ response: type, submitted_at: new Date().toISOString() })
          .eq('id', existingAttendance.id)
      } else {
        await supabase.from('attendance').insert({
          member_id,
          activity_id,
          response: type,
          final_status: 'pending',
          submitted_at: new Date().toISOString(),
        })
      }
    }

    // Notify admins
    const { data: admins } = await supabase
      .from('members')
      .select('user_id')
      .in('role', ['super_admin', 'admin', 'sekretaris'])

    if (admins) {
      const typeLabel = type === 'izin' ? 'Izin' : 'Sakit'
      const notifications = admins.map((a) => ({
        user_id: a.user_id,
        title: `Pengajuan ${typeLabel} Baru`,
        message: `${data.member?.full_name || 'Anggota'} mengajukan ${typeLabel.toLowerCase()}${data.activity?.name ? ` untuk ${data.activity.name}` : ''}`,
        type: 'leave',
        reference_id: data.id,
        reference_type: 'leave_request',
      }))

      await supabase.from('notifications').insert(notifications)
    }

    // Send Telegram notification
    try {
      const { data: settings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['telegram_bot_token', 'telegram_group_chat_id', `notify_${type === 'izin' ? 'leave' : 'sick'}`])

      const botToken = settings?.find((s) => s.key === 'telegram_bot_token')?.value
      const chatId = settings?.find((s) => s.key === 'telegram_group_chat_id')?.value
      const notifyEnabled = settings?.find((s) => s.key === `notify_${type === 'izin' ? 'leave' : 'sick'}`)?.value !== 'false'

      if (botToken && chatId && notifyEnabled) {
        const typeLabel = type === 'izin' ? 'PENGAJUAN IZIN BARU' : 'PENGAJUAN SAKIT BARU'
        const msg = `JURNFOURTEEN — ${typeLabel}\n\nNama: ${data.member?.full_name || '-'}\nKelas: ${data.member?.kelas || '-'}${data.activity?.name ? `\nKegiatan: ${data.activity.name}` : ''}\nAlasan: ${reason}\n\nStatus: MENUNGGU VERIFIKASI`

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg }),
        })
      }
    } catch (tgErr) {
      // Telegram failure doesn't block the main operation
      await supabase.from('telegram_logs').insert({
        event_type: `leave_${type}`,
        status: 'failed',
        error_message: tgErr.message,
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      action: `Pengajuan ${type}`,
      details: `${data.member?.full_name || 'Anggota'} mengajukan ${type}${data.activity?.name ? ` untuk ${data.activity.name}` : ''}: ${reason}`,
      member_name: data.member?.full_name || 'Anggota',
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
