import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  try {
    const supabase = await createServiceClient()
    const { id } = await params
    
    // Get image_url first to delete from storage
    const { data: item } = await supabase.from('gallery').select('image_url').eq('id', id).single()

    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (item && item.image_url) {
      const urlParts = item.image_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      if (fileName) {
        await supabase.storage.from('gallery').remove([fileName])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
