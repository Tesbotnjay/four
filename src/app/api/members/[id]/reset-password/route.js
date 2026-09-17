import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params
    const body = await request.json()
    const { new_password } = body

    if (!new_password || new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password baru minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Get member's auth user_id
    const { data: member } = await supabase
      .from('members')
      .select('user_id, full_name')
      .eq('id', id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Anggota tidak ditemukan' },
        { status: 404 }
      )
    }

    // Reset password via admin API
    const { error } = await supabase.auth.admin.updateUserById(member.user_id, {
      password: new_password,
    })

    if (error) throw error

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Reset password',
      details: `Reset password untuk ${member.full_name}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ message: 'Password berhasil direset' })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Gagal mereset password' },
      { status: 500 }
    )
  }
}
