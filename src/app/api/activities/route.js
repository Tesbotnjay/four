import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('activities')
      .select('*, creator:created_by(full_name)', { count: 'exact' })
      .order('activity_date', { ascending: false })
      .order('start_time', { ascending: false })

    if (status) {
      query = query.eq('status', status)
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

    const { name, description, activity_date, start_time, end_time, location, requires_attendance, confirm_start, confirm_end, created_by } = body

    if (!name || !activity_date || !start_time) {
      return NextResponse.json(
        { error: 'Nama kegiatan, tanggal, dan jam mulai wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        name,
        description: description || null,
        activity_date,
        start_time,
        end_time: end_time || null,
        location: location || null,
        status: 'akan_datang',
        requires_attendance: requires_attendance !== false,
        confirm_start: confirm_start || null,
        confirm_end: confirm_end || null,
        created_by: created_by || null,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Membuat kegiatan',
      details: `Membuat kegiatan: ${name} pada ${activity_date}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
