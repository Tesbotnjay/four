import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://waptqzihambwhsqgtuzl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHRxemloYW1id2hzcWd0dXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2NDkyNiwiZXhwIjoyMTA1MTQwOTI2fQ.dUwHOVoqzFfiegvuzf8sR27lOo4u80n0gLj-1RFhM-k';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: member, error } = await supabase.from('members').select('id, user_id').eq('username', 'liakyknya').single();
  if (error || !member) {
    console.error('Member not found', error);
    return;
  }
  
  const newLogin = 'yuliaputri';
  const newEmail = `${newLogin}@jurnfourteen.app`;
  
  await supabase.auth.admin.updateUserById(member.user_id, { email: newEmail });
  await supabase.from('members').update({ username: newLogin }).eq('id', member.id);
  console.log('Fixed Yulia Putri login to yuliaputri');
}

run();
