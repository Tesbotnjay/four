import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { usernameToEmail } from '@/lib/constants';

export async function POST(request) {
  try {
    const body = await request.json();
    const { full_name, username, password, nis_nisn, kelas, phone, join_reason } = body;

    // Validate required fields
    if (!full_name || !username || !password || !nis_nisn || !kelas || !phone) {
      return NextResponse.json({ error: 'Harap lengkapi semua field yang wajib' }, { status: 400 });
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username hanya boleh berisi huruf, angka, garis bawah, dan antara 3-30 karakter' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if username exists in members table
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('username')
      .eq('username', username)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is not found, which is what we want
      console.error('Error checking existing member:', checkError);
      return NextResponse.json({ error: 'Terjadi kesalahan saat validasi' }, { status: 500 });
    }

    // Create auth user using admin API
    const email = usernameToEmail(username);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth Error:', authError);
      return NextResponse.json({ error: 'Gagal membuat akun otentikasi: ' + authError.message }, { status: 500 });
    }

    const authUser = authData.user;

    // Insert into members table
    const { error: insertError } = await supabase
      .from('members')
      .insert([
        {
          user_id: authUser.id,
          username,
          full_name,
          nis_nisn,
          kelas,
          phone,
          join_reason,
          status: 'menunggu_verifikasi',
          role: 'anggota',
          jabatan: 'Anggota',
          created_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      console.error('Insert Member Error:', insertError);
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authUser.id);
      return NextResponse.json({ error: 'Gagal menyimpan data anggota' }, { status: 500 });
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: authUser.id,
          action: 'MEMBER_REGISTER',
          description: `Pendaftaran anggota baru: ${username}`,
          created_at: new Date().toISOString()
        }
      ]);

    return NextResponse.json({ success: true, message: 'Pendaftaran berhasil. Menunggu verifikasi.' }, { status: 201 });

  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
