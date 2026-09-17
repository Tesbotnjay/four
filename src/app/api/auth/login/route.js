import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, username } = body;

    if (!user_id || !username) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Log login activity
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id,
          action: 'MEMBER_LOGIN',
          description: `Login berhasil: ${username}`,
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Login Log API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
