import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params

    const { data: activity, error } = await supabase
      .from('activities')
      .select('*, creator:created_by(full_name)')
      .eq('id', id)
      .single()

    if (error || !activity) {
      return NextResponse.json({ error: 'Kegiatan tidak ditemukan' }, { status: 404 })
    }

    // Get attendance summary
    const { data: attendances } = await supabase
      .from('attendance')
      .select('*, member:member_id(full_name, kelas, avatar_url)')
      .eq('activity_id', id)
      .order('submitted_at', { ascending: true })

    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aktif')

    const stats = {
      total_anggota: totalMembers || 0,
      sudah_mengisi: attendances?.length || 0,
      belum_mengisi: (totalMembers || 0) - (attendances?.length || 0),
      menunggu_verifikasi: 0,
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
      ditolak: 0,
    }

    if (attendances) {
      attendances.forEach((a) => {
        if (a.final_status === 'pending') stats.menunggu_verifikasi++
        else if (a.final_status === 'hadir') stats.hadir++
        else if (a.final_status === 'izin') stats.izin++
        else if (a.final_status === 'sakit') stats.sakit++
        else if (a.final_status === 'alfa') stats.alfa++
        else if (a.final_status === 'rejected') stats.ditolak++
      })
    }

    if (stats.total_anggota > 0) {
      stats.persentase = Math.round((stats.hadir / stats.total_anggota) * 100)
    } else {
      stats.persentase = 0
    }

    return NextResponse.json({ data: { ...activity, attendances, stats } })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      'name', 'description', 'activity_date', 'start_time', 'end_time',
      'location', 'status', 'requires_attendance', 'confirm_start', 'confirm_end',
    ]

    const updateData = {}
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) updateData[field] = body[field]
    })

    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await supabase.from('activity_logs').insert({
      action: 'Mengedit kegiatan',
      details: `Mengedit kegiatan: ${data.name}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params

    const { data: activity } = await supabase
      .from('activities')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) throw error

    await supabase.from('activity_logs').insert({
      action: 'Menghapus kegiatan',
      details: `Menghapus kegiatan: ${activity?.name || id}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ message: 'Kegiatan berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
