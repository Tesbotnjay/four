import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PUT/POST - Bulk verify attendance
export async function PUT(request) {
  return handleBulkVerify(request)
}
export async function POST(request) {
  return handleBulkVerify(request)
}

async function handleBulkVerify(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const attendance_ids = body.attendance_ids || body.ids
    const action = body.action || (body.status === 'diterima' ? 'approve' : body.status === 'ditolak' ? 'reject' : null)
    const verified_by = body.verified_by

    if (!attendance_ids || !Array.isArray(attendance_ids) || attendance_ids.length === 0) {
      return NextResponse.json(
        { error: 'attendance_ids/ids harus berupa array yang tidak kosong' },
        { status: 400 }
      )
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action harus approve/reject atau status harus diterima/ditolak' },
        { status: 400 }
      )
    }

    // Get all attendance records
    const { data: records } = await supabase
      .from('attendance')
      .select('*, member:member_id(full_name, user_id), activity:activity_id(name)')
      .in('id', attendance_ids)
      .eq('final_status', 'pending')

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang perlu diverifikasi' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const results = []

    for (const record of records) {
      const finalStatus = action === 'approve' ? record.response : 'rejected'

      const { data, error } = await supabase
        .from('attendance')
        .update({
          final_status: finalStatus,
          verified_at: now,
          verified_by: verified_by || null,
        })
        .eq('id', record.id)
        .select()
        .single()

      if (!error) {
        results.push(data)

        // Notify member
        if (record.member?.user_id) {
          await supabase.from('notifications').insert({
            user_id: record.member.user_id,
            title: action === 'approve' ? 'Kehadiran Diverifikasi' : 'Kehadiran Ditolak',
            message: `Status kehadiran Anda untuk ${record.activity?.name || 'kegiatan'}: ${finalStatus.toUpperCase()}`,
            type: 'verification',
            reference_id: record.id,
            reference_type: 'attendance',
          })
        }
      }
    }

    // Log activity
    let verifierName = 'Pengurus'
    if (verified_by) {
      const { data: verifier } = await supabase
        .from('members')
        .select('full_name')
        .eq('id', verified_by)
        .single()
      if (verifier) verifierName = verifier.full_name
    }

    await supabase.from('activity_logs').insert({
      action: 'Verifikasi massal',
      details: `${verifierName} memverifikasi ${results.length} kehadiran sekaligus (${action})`,
      member_name: verifierName,
    })

    return NextResponse.json({
      data: results,
      message: `${results.length} kehadiran berhasil diverifikasi`,
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
