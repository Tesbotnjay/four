import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)

    const visibility = searchParams.get('visibility') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('broadcasts')
      .select('*, creator:created_by(full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (visibility) {
      query = query.eq('visibility', visibility)
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

    const {
      title, content, broadcast_date, broadcast_time, location,
      priority, visibility, target_type, target_value,
      requires_confirmation, send_telegram, attachment_url,
      activity_id, created_by,
    } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Judul dan isi broadcast wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('broadcasts')
      .insert({
        title,
        content,
        broadcast_date: broadcast_date || new Date().toISOString().split('T')[0],
        broadcast_time: broadcast_time || null,
        location: location || null,
        priority: priority || 'normal',
        visibility: visibility || 'internal',
        target_type: target_type || 'semua',
        target_value: target_value || null,
        requires_confirmation: requires_confirmation || false,
        send_telegram: send_telegram || false,
        attachment_url: attachment_url || null,
        activity_id: activity_id || null,
        created_by: created_by || null,
      })
      .select()
      .single()

    if (error) throw error

    // Create notifications for target members
    if (visibility === 'internal') {
      let targetQuery = supabase.from('members').select('user_id').eq('status', 'aktif')

      if (target_type === 'kelas' && target_value) {
        const classes = JSON.parse(target_value)
        targetQuery = targetQuery.in('kelas', classes)
      } else if (target_type === 'pengurus') {
        targetQuery = targetQuery.in('role', ['super_admin', 'admin', 'sekretaris'])
      } else if (target_type === 'tertentu' && target_value) {
        const memberIds = JSON.parse(target_value)
        targetQuery = supabase.from('members').select('user_id').in('id', memberIds)
      }

      const { data: targets } = await targetQuery

      if (targets) {
        const notifications = targets.map((t) => ({
          user_id: t.user_id,
          title: 'Broadcast Baru',
          message: title,
          type: 'broadcast',
          reference_id: data.id,
          reference_type: 'broadcast',
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }

    // Send to Telegram if requested
    if (send_telegram) {
      try {
        const { data: settings } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['telegram_bot_token', 'telegram_group_chat_id'])

        const botToken = settings?.find((s) => s.key === 'telegram_bot_token')?.value
        const chatId = settings?.find((s) => s.key === 'telegram_group_chat_id')?.value

        if (botToken && chatId) {
          const telegramMsg = `JURNFOURTEEN — BROADCAST\n\n${title}\n\n${content}${location ? `\n\nTempat: ${location}` : ''}${broadcast_date ? `\nTanggal: ${broadcast_date}` : ''}${broadcast_time ? `\nWaktu: ${broadcast_time} WITA` : ''}`

          const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: telegramMsg, parse_mode: 'HTML' }),
          })

          const result = await resp.json()

          await supabase.from('telegram_logs').insert({
            event_type: 'broadcast',
            payload: JSON.stringify({ title, chat_id: chatId }),
            status: result.ok ? 'success' : 'failed',
            error_message: result.ok ? null : JSON.stringify(result),
          })
        }
      } catch (tgError) {
        await supabase.from('telegram_logs').insert({
          event_type: 'broadcast',
          payload: JSON.stringify({ title }),
          status: 'failed',
          error_message: tgError.message,
        })
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'Membuat broadcast',
      details: `Membuat broadcast: ${title} (${visibility})`,
      member_name: 'Admin',
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
