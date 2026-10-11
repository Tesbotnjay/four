import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const divisi = searchParams.get('divisi') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('drive_links')
      .select('*, created_by:created_by(id, full_name, username)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (divisi) {
      query = query.eq('divisi_owner', divisi)
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

    const { title, drive_url, divisi_owner, activity_id, description, created_by } = body

    if (!title || !drive_url || !divisi_owner || !created_by) {
      return NextResponse.json(
        { error: 'Title, drive_url, divisi_owner, dan created_by wajib diisi' },
        { status: 400 }
      )
    }

    // Validate URL is a Google Drive link
    if (!drive_url.includes('drive.google.com')) {
      return NextResponse.json(
        { error: 'URL harus berupa link Google Drive' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('drive_links')
      .insert({
        title,
        drive_url,
        divisi_owner,
        activity_id: activity_id || null,
        description: description || null,
        created_by,
      })
      .select('*, created_by:created_by(id, full_name, username)')
      .single()

    if (error) throw error

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Menambah link Drive',
      details: `Menambah link Drive: ${title} untuk divisi ${divisi_owner}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID link Drive wajib disertakan' }, { status: 400 })
    }

    const { error } = await supabase.from('drive_links').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'Link Drive berhasil dihapus' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
