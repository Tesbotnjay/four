import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  try {
    const supabaseClient = await createClient()
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify role
    const { data: member } = await supabaseClient
      .from('members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!member || !['super_admin', 'admin', 'pembina'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { edisi, liputan } = await request.json()
    const supabase = await createServiceClient()
    
    await supabase.from('settings').upsert({ key: 'edisi_terbit', value: edisi?.toString() || '0' })
    await supabase.from('settings').upsert({ key: 'jumlah_liputan', value: liputan?.toString() || '0' })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
