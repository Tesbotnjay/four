import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const kelas = searchParams.get('kelas') || ''
    const status = searchParams.get('status') || ''
    const role = searchParams.get('role') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,nis_nisn.ilike.%${search}%`)
    }
    if (kelas) {
      query = query.eq('kelas', kelas)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (role) {
      query = query.eq('role', role)
    }

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Gagal memuat data anggota' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const { full_name, username, password, nis_nisn, kelas, phone, jabatan, role, status } = body

    if (!full_name || !username || !password) {
      return NextResponse.json(
        { error: 'Nama lengkap, username, dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Check existing username
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      )
    }

    // Create auth user
    const email = `${username.toLowerCase()}@jurnfourteen.app`
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) throw authError

    // Create member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        user_id: authData.user.id,
        full_name,
        username: username.toLowerCase(),
        nis_nisn: nis_nisn || null,
        kelas: kelas || null,
        phone: phone || null,
        jabatan: jabatan || 'Anggota',
        role: role || 'anggota',
        status: status || 'aktif',
        joined_at: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (memberError) throw memberError

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Membuat akun anggota',
      details: `Membuat akun untuk ${full_name} (${username})`,
      member_name: 'System',
    })

    return NextResponse.json({ data: member }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Gagal membuat anggota' },
      { status: 500 }
    )
  }
}
