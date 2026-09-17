import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://waptqzihambwhsqgtuzl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHRxemloYW1id2hzcWd0dXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2NDkyNiwiZXhwIjoyMTA1MTQwOTI2fQ.dUwHOVoqzFfiegvuzf8sR27lOo4u80n0gLj-1RFhM-k';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Fetching members...');
  const { data: members, error } = await supabase.from('members').select('id, user_id, full_name, username').eq('role', 'anggota');
  if (error) throw error;

  for (const m of members) {
    // Generate valid login username from full_name
    let newLogin = m.full_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Ensure it's not longer than 30 chars
    if (newLogin.length > 30) {
      newLogin = newLogin.substring(0, 30);
    }
    
    const newEmail = `${newLogin}@jurnfourteen.app`;

    console.log(`Updating ${m.full_name}: ${m.username} -> ${newLogin}`);

    // Update auth user email
    const { error: authErr } = await supabase.auth.admin.updateUserById(m.user_id, {
      email: newEmail,
      email_confirm: true
    });

    if (authErr) {
      console.error(`Failed to update Auth for ${m.full_name}:`, authErr.message);
      continue;
    }

    // Update members table username
    const { error: memErr } = await supabase.from('members').update({ username: newLogin }).eq('id', m.id);
    if (memErr) {
      console.error(`Failed to update Member for ${m.full_name}:`, memErr.message);
    } else {
      console.log(`Success: ${m.full_name} can now login with ${newLogin}`);
    }
  }
}

run();
