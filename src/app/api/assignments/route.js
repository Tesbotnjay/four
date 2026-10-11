import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const divisi = searchParams.get('divisi') || ''
    const memberId = searchParams.get('member_id') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('assignments')
      .select('*, assigned_to:assigned_to(id, full_name, username), assigned_by:assigned_by(id, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (divisi) {
      query = query.eq('divisi', divisi)
    }

    if (memberId) {
      query = query.eq('assigned_to', memberId)
    }

    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const { title, description, divisi, assigned_to, assigned_by, activity_id, due_date } = body

    if (!title || !description || !divisi || !assigned_to || !assigned_by) {
      return NextResponse.json(
        { error: 'Title, description, divisi, assigned_to, dan assigned_by wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        title,
        description,
        divisi,
        assigned_to,
        assigned_by,
        activity_id: activity_id || null,
        due_date: due_date || null,
        status: 'pending',
      })
      .select('*, assigned_to:assigned_to(id, full_name, username), assigned_by:assigned_by(id, full_name)')
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Membuat penugasan',
      details: `Membuat penugasan: ${title} untuk divisi ${divisi}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
