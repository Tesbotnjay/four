import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    
    const { activity_id, member_ids, verified_by } = body

    if (!activity_id || !member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json({ error: 'activity_id dan member_ids (array) wajib diisi' }, { status: 400 })
    }

    // Get real member.id of the verifier
    let realVerifierId = null
    if (verified_by) {
      const { data: vMember } = await supabase.from('members').select('id').eq('user_id', verified_by).single()
      if (vMember) realVerifierId = vMember.id
    }

    // Prepare data for bulk insert
    const insertData = member_ids.map(m_id => ({
      activity_id,
      member_id: m_id,
      response: null,
      final_status: 'alfa',
      verified_by: realVerifierId,
      verified_at: new Date().toISOString()
    }))

    // Use upsert in case they somehow clicked it twice or a row exists
    const { data, error } = await supabase
      .from('attendance')
      .upsert(insertData, { onConflict: 'member_id, activity_id' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: `${data.length} anggota berhasil di-alfa-kan.`, data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
