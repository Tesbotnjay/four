import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params

    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !member) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get attendance stats
    const { data: attendance } = await supabase
      .from('attendance')
      .select('final_status')
      .eq('member_id', id)
      .in('final_status', ['hadir', 'izin', 'sakit', 'alfa'])

    const stats = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alfa: 0,
      total: attendance?.length || 0,
      persentase: 0,
    }

    if (attendance) {
      attendance.forEach((a) => {
        if (stats[a.final_status] !== undefined) {
          stats[a.final_status]++
        }
      })
      if (stats.total > 0) {
        stats.persentase = Math.round((stats.hadir / stats.total) * 100)
      }
    }

    return NextResponse.json({ data: { ...member, stats } })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat data anggota' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params
    const body = await request.json()

    const updateData = {}
    const allowedFields = [
      'full_name', 'nis_nisn', 'kelas', 'phone', 'jabatan',
      'role', 'status', 'bio', 'social_link', 'show_public', 'avatar_url', 'links', 'display_username'
    ]

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // If status changed to aktif, set joined_at
    if (body.status === 'aktif') {
      const { data: current } = await supabase
        .from('members')
        .select('status, joined_at')
        .eq('id', id)
        .single()
      if (current && current.status === 'menunggu_verifikasi' && !current.joined_at) {
        updateData.joined_at = new Date().toISOString().split('T')[0]
      }
    }

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Mengedit anggota',
      details: `Mengedit data ${data.full_name}: ${Object.keys(updateData).join(', ')}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate anggota' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params

    // Get member data first for logging
    const { data: member } = await supabase
      .from('members')
      .select('full_name, user_id')
      .eq('id', id)
      .single()

    // Soft delete - set status to nonaktif
    const { error } = await supabase
      .from('members')
      .update({ status: 'nonaktif' })
      .eq('id', id)

    if (error) throw error

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Menonaktifkan anggota',
      details: `Menonaktifkan akun ${member?.full_name || id}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ message: 'Anggota berhasil dinonaktifkan' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Gagal menonaktifkan anggota' },
      { status: 500 }
    )
  }
}
