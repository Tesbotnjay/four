import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST - Submit attendance response (HADIR/IZIN/SAKIT)
export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const { member_id, activity_id, response: responseField, status: statusField } = body
    const response = responseField || statusField

    if (!member_id || !activity_id || !response) {
      return NextResponse.json(
        { error: 'member_id, activity_id, dan response/status wajib diisi' },
        { status: 400 }
      )
    }

    if (!['hadir', 'izin', 'sakit'].includes(response)) {
      return NextResponse.json(
        { error: 'Response harus hadir, izin, atau sakit' },
        { status: 400 }
      )
    }

    // Check if activity exists and is accepting responses
    const { data: activity } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activity_id)
      .single()

    if (!activity) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    if (activity.status === 'dibatalkan') {
      return NextResponse.json({ error: 'Kegiatan telah dibatalkan' }, { status: 400 })
    }

    // Check time limits
    if (activity.confirm_end) {
      const now = new Date()
      const endTime = new Date(activity.confirm_end)
      if (now > endTime) {
        return NextResponse.json(
          { error: 'Batas waktu konfirmasi sudah berakhir' },
          { status: 400 }
        )
      }
    }

    // Check if already submitted
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, final_status')
      .eq('member_id', member_id)
      .eq('activity_id', activity_id)
      .single()

    if (existing) {
      // Allow update if still pending
      if (existing.final_status !== 'pending') {
        return NextResponse.json(
          { error: 'Status kehadiran sudah diverifikasi, tidak dapat diubah' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('attendance')
        .update({
          response,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ data, updated: true })
    }

    // Insert new attendance
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        member_id,
        activity_id,
        response,
        final_status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Get member name for logging
    const { data: member } = await supabase
      .from('members')
      .select('full_name')
      .eq('id', member_id)
      .single()

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Konfirmasi kehadiran',
      details: `${member?.full_name || 'Anggota'} memilih "${response}" untuk kegiatan ${activity.name}`,
      member_name: member?.full_name || 'Anggota',
    })

    // Create notification for sekretaris
    const { data: admins } = await supabase
      .from('members')
      .select('user_id')
      .in('role', ['super_admin', 'admin', 'sekretaris'])

    if (admins) {
      const notifications = admins.map((admin) => ({
        user_id: admin.user_id,
        title: 'Konfirmasi Kehadiran Baru',
        message: `${member?.full_name || 'Anggota'} memilih "${response}" untuk ${activity.name}`,
        type: 'attendance',
        reference_id: data.id,
        reference_type: 'attendance',
      }))

      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
