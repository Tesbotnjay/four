import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://waptqzihambwhsqgtuzl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHRxemloYW1id2hzcWd0dXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2NDkyNiwiZXhwIjoyMTA1MTQwOTI2fQ.dUwHOVoqzFfiegvuzf8sR27lOo4u80n0gLj-1RFhM-k';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const newMembers = [
  { full_name: 'Rifiana', username: 'rifiana', display_username: 'Rifiana', jabatan: 'Anggota', kelas: 'XI-5', nis: '3500/0109415325', phone: '085138005756', joined_at: '2026-08-19', password: 'Rfn11*' },
  { full_name: 'Yulia Putri', username: 'liakyknya', display_username: 'liakyknya', jabatan: 'anggota biasa wehh', kelas: '10.5', nis: '0115729696', phone: '085824487796', joined_at: '2026-07-25', password: 'liaimutpacarjaehyun' }
];

async function run() {
  for (const nm of newMembers) {
    console.log(`Creating user: ${nm.username}`);
    const email = `${nm.username}@jurnfourteen.app`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: nm.password,
      email_confirm: true
    });

    if (authError) {
      console.error(`Failed to create auth for ${nm.username}:`, authError.message);
      continue;
    }

    const { error: insertError } = await supabase.from('members').insert({
      user_id: authData.user.id,
      full_name: nm.full_name,
      username: nm.username,
      display_username: nm.display_username,
      jabatan: nm.jabatan,
      kelas: nm.kelas,
      nis_nisn: nm.nis,
      phone: nm.phone,
      joined_at: nm.joined_at,
      role: 'anggota',
      status: 'aktif'
    });

    if (insertError) {
      console.error(`Failed to insert member profile for ${nm.username}:`, insertError.message);
    } else {
      console.log(`Successfully created member: ${nm.full_name}`);
    }
  }

  console.log('All done!');
}

run();
