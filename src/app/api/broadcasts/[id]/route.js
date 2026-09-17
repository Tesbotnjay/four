import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request, { params }) {
  try {
    const supabaseClient = await createClient()
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify role (admin or super_admin only for broadcast deletion)
    const { data: member } = await supabaseClient
      .from('members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!member || !['super_admin', 'admin', 'sekretaris', 'pembina'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = await createServiceClient()
    
    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
