import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Test Telegram connection
export async function POST(request) {
  try {
    const supabase = await createServiceClient()
    const body = await request.json()

    const { bot_token, chat_id } = body

    if (!bot_token || !chat_id) {
      return NextResponse.json(
        { error: 'Bot token dan Chat ID wajib diisi' },
        { status: 400 }
      )
    }

    const message = `JURNFOURTEEN — TEST NOTIFIKASI\n\nTelegram JurnFourteen berhasil terhubung.\nWaktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })} WITA`

    const response = await fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: message,
      }),
    })

    const result = await response.json()

    // Log the attempt
    await supabase.from('telegram_logs').insert({
      event_type: 'test',
      payload: JSON.stringify({ chat_id }),
      status: result.ok ? 'success' : 'failed',
      error_message: result.ok ? null : JSON.stringify(result),
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: `Telegram API error: ${result.description || 'Unknown error'}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Test berhasil! Pesan terkirim ke Telegram.' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
