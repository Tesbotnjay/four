import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Public endpoint to get attendance statistics for all active members
export async function GET() {
  try {
    const supabase = await createServiceClient()
    
    // Get all attendance records (service client bypasses RLS)
    const { data: attendances } = await supabase
      .from('attendance')
      .select('member_id, final_status')

    const stats = {}
    if (attendances) {
      attendances.forEach(att => {
        if (!stats[att.member_id]) {
          stats[att.member_id] = { hadir: 0, izin: 0, sakit: 0, alfa: 0 }
        }
        if (['hadir', 'izin', 'sakit', 'alfa'].includes(att.final_status)) {
          stats[att.member_id][att.final_status]++
        }
      })
    }

    return NextResponse.json({ data: stats })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
