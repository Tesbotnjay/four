import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Public endpoint - no auth required
export async function GET() {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('broadcasts')
      .select('id, title, content, broadcast_date, broadcast_time, location, priority, visibility')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return NextResponse.json({ data: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
