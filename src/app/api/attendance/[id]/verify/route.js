import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params
    const body = await request.json()

    // Accept both formats: {action:'approve'} or {status:'diterima'}
    const action = body.action || (body.status === 'diterima' ? 'approve' : body.status === 'ditolak' ? 'reject' : null)
    const note = body.note || body.verification_notes || null

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action harus approve/reject atau status harus diterima/ditolak' }, { status: 400 })
    }

    const { data: attendance } = await supabase
      .from('attendance')
      .select('*, member:member_id(full_name, user_id), activity:activity_id(name)')
      .eq('id', id)
      .single()

    if (!attendance) {
      return NextResponse.json({ error: 'Data kehadiran tidak ditemukan' }, { status: 404 })
    }

    const finalStatus = action === 'approve' ? attendance.response : 'rejected'

    const { data, error } = await supabase
      .from('attendance')
      .update({
        final_status: finalStatus,
        note: note,
        verified_at: new Date().toISOString(),
        verified_by: body.verified_by || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Notify member
    if (attendance.member?.user_id) {
      await supabase.from('notifications').insert({
        user_id: attendance.member.user_id,
        title: action === 'approve' ? 'Kehadiran Diverifikasi' : 'Kehadiran Ditolak',
        message: `Kehadiran Anda untuk "${attendance.activity?.name}" telah ${action === 'approve' ? 'diverifikasi' : 'ditolak'}${note ? ': ' + note : ''}`,
        type: 'verification',
        reference_id: id,
        reference_type: 'attendance',
      })
    }

    await supabase.from('activity_logs').insert({
      action: action === 'approve' ? 'Verifikasi kehadiran' : 'Tolak kehadiran',
      details: `${attendance.member?.full_name}: ${finalStatus} untuk ${attendance.activity?.name}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
