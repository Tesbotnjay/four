import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('settings')
      .select('key, value')

    if (error) throw error

    const settings = {}
    data?.forEach((s) => {
      settings[s.key] = s.value
    })

    // Mask telegram token
    if (settings.telegram_bot_token) {
      const token = settings.telegram_bot_token
      settings.telegram_bot_token_masked = token.length > 10
        ? token.substring(0, 5) + '...' + token.substring(token.length - 5)
        : '***'
    }

    return NextResponse.json({ data: settings })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }))

    for (const update of updates) {
      await supabase
        .from('settings')
        .upsert(update, { onConflict: 'key' })
    }

    // Log
    await supabase.from('activity_logs').insert({
      action: 'Mengubah pengaturan',
      details: `Mengubah pengaturan: ${Object.keys(body).join(', ')}`,
      member_name: 'Admin',
    })

    return NextResponse.json({ message: 'Pengaturan berhasil disimpan' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
