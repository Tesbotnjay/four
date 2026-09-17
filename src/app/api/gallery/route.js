import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('gallery')
      .insert({
        image_url: body.image_url,
        caption: body.caption || null,
        date: body.date || null,
        created_by: body.created_by || null
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
