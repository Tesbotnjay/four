import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://waptqzihambwhsqgtuzl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHRxemloYW1id2hzcWd0dXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2NDkyNiwiZXhwIjoyMTA1MTQwOTI2fQ.dUwHOVoqzFfiegvuzf8sR27lOo4u80n0gLj-1RFhM-k';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const newUser = {
  full_name: 'Qeysha Meyla Marghareta A.',
  username: 'marghareta',
  display_username: 'Marghareta',
  jabatan: 'Sekretaris',
  kelas: '11-5',
  nis: '0107002962',
  phone: '082252785491',
  joined_at: '2026-09-17',
  password: 'Margharetaf',
  role: 'super_admin'
};

async function run() {
  console.log(`Creating user: ${newUser.username}`);
  const email = `${newUser.username}@jurnfourteen.app`;
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: newUser.password,
    email_confirm: true
  });

  if (authError) {
    console.error(`Failed to create auth for ${newUser.username}:`, authError.message);
    return;
  }

  // Insert into members
  const { error: insertError } = await supabase.from('members').insert({
    user_id: authData.user.id,
    full_name: newUser.full_name,
    username: newUser.username,
    display_username: newUser.display_username,
    jabatan: newUser.jabatan,
    kelas: newUser.kelas,
    nis_nisn: newUser.nis,
    phone: newUser.phone,
    joined_at: newUser.joined_at,
    role: newUser.role,
    status: 'aktif'
  });

  if (insertError) {
    console.error(`Failed to insert member profile for ${newUser.username}:`, insertError.message);
  } else {
    console.log(`Successfully created member: ${newUser.full_name} as ${newUser.role}`);
  }
}

run();
