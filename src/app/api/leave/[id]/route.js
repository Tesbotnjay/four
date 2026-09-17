import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params
    const body = await request.json()

    const { action, admin_note, verified_by } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action harus approve atau reject' }, { status: 400 })
    }

    const { data: leaveReq } = await supabase
      .from('leave_requests')
      .select('*, member:member_id(full_name, user_id), activity:activity_id(name)')
      .eq('id', id)
      .single()

    if (!leaveReq) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: newStatus,
        admin_note: admin_note || null,
        verified_by: verified_by || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update linked attendance record
    if (leaveReq.activity_id) {
      const finalStatus = action === 'approve' ? leaveReq.type : 'rejected'

      await supabase
        .from('attendance')
        .update({
          final_status: finalStatus,
          verified_at: new Date().toISOString(),
          verified_by: verified_by || null,
          note: admin_note || null,
        })
        .eq('member_id', leaveReq.member_id)
        .eq('activity_id', leaveReq.activity_id)
    }

    // Notify member
    if (leaveReq.member?.user_id) {
      const typeLabel = leaveReq.type === 'izin' ? 'Izin' : 'Sakit'
      const statusLabel = action === 'approve' ? 'Disetujui' : 'Ditolak'

      await supabase.from('notifications').insert({
        user_id: leaveReq.member.user_id,
        title: `${typeLabel} ${statusLabel}`,
        message: `Pengajuan ${typeLabel.toLowerCase()} Anda${leaveReq.activity?.name ? ` untuk ${leaveReq.activity.name}` : ''} telah ${statusLabel.toLowerCase()}.${admin_note ? ` Catatan: ${admin_note}` : ''}`,
        type: 'leave',
        reference_id: id,
        reference_type: 'leave_request',
      })
    }

    // Log
    let verifierName = 'Pengurus'
    if (verified_by) {
      const { data: verifier } = await supabase.from('members').select('full_name').eq('id', verified_by).single()
      if (verifier) verifierName = verifier.full_name
    }

    await supabase.from('activity_logs').insert({
      action: action === 'approve' ? `Menyetujui ${leaveReq.type}` : `Menolak ${leaveReq.type}`,
      details: `${verifierName} ${action === 'approve' ? 'menyetujui' : 'menolak'} pengajuan ${leaveReq.type} dari ${leaveReq.member?.full_name || 'anggota'}`,
      member_name: verifierName,
    })

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
