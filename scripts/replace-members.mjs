import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://waptqzihambwhsqgtuzl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHRxemloYW1id2hzcWd0dXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU2NDkyNiwiZXhwIjoyMTA1MTQwOTI2fQ.dUwHOVoqzFfiegvuzf8sR27lOo4u80n0gLj-1RFhM-k';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const newMembers = [
  { full_name: 'Atiqah Fauziah', username: 'Atiqah123', display_username: 'Atiqah123', jabatan: 'Anggota', kelas: 'x2', nis: '0109063893', phone: '82357532670', joined_at: '2026-08-15', password: 'Atiqah1234' },
  { full_name: 'Najla zhafarina aniesyaputri', username: 'Sunsetpq_', display_username: 'Sunsetpq_', jabatan: 'Anggota', kelas: '11-5', nis: '0106367409', phone: '083812560145', joined_at: '2026-08-03', password: 'Snattlearin' },
  { full_name: 'Narsya Anna Rhmadani', username: 'annaness22', display_username: 'annaness22', jabatan: 'Media', kelas: '11-5', nis: '3494/0096633960', phone: '082254362720', joined_at: '2026-07-08', password: 'bungamawar2' },
  { full_name: 'Desty Julianti', username: 'destyjulianti90', display_username: 'destyjulianti90', jabatan: 'Dokumentasi', kelas: '11-1', nis: '3665/0084683632', phone: '085752228521', joined_at: '2026-07-08', password: 'hali9999' },
  { full_name: 'Adelina nafisa', username: 'nafisa', display_username: 'nafisa', jabatan: 'Dokumen', kelas: '11.5', nis: '0092738026.3622', phone: '0895412540933', joined_at: '2026-08-19', password: 'nafisa399' },
  { full_name: 'Tsimal Zurarah Al Huda', username: 'choezuu', display_username: 'choezuu', jabatan: 'Divisi Berita', kelas: 'XI-1', nis: '3692/0091842027', phone: '+6285195914409', joined_at: '2026-07-16', password: 'zura120709' },
  { full_name: 'Nabila Arifani', username: 'fanikk04', display_username: 'fanikk04', jabatan: 'Koordinator dokumentasi foto', kelas: 'X-6', nis: '0112545879', phone: '082250820512', joined_at: '2026-08-09', password: 'fanikk1997' },
  { full_name: "Indah Asma'ul Husnah", username: 'Unana', display_username: 'Unana', jabatan: 'Anggota', kelas: 'XI-5', nis: '0105539562', phone: '083852876489', joined_at: '2026-08-13', password: 'Unanaaa' },
  { full_name: 'Tristan Elvis Pratama Putra', username: 'Elv03', display_username: 'Elv03', jabatan: 'Anggota Koresponden', kelas: 'XI-5', nis: '-', phone: '0821-8994-8164', joined_at: '2026-07-25', password: 'Chr_is3010' },
  { full_name: 'Rasta Arifqi', username: 'Kasas20', display_username: 'Kasas20#', jabatan: 'Bendahara', kelas: '12-4', nis: '0099708474', phone: '085348692802', joined_at: '2024-07-27', password: 'Family7783' },
  { full_name: 'Rizqullah Ahmada Wenas', username: 'KokoRisko', display_username: 'Koko/Risko', jabatan: 'Anggota', kelas: 'XI-3', nis: '3091746291', phone: '081574072427', joined_at: null, password: 'riskowenas' },
];

async function run() {
  console.log('1. Fetching all anggota to delete...');
  const { data: membersToDelete, error: errFetch } = await supabase.from('members').select('user_id').eq('role', 'anggota');
  if (errFetch) throw errFetch;

  console.log(`Found ${membersToDelete.length} anggota to delete.`);

  for (const m of membersToDelete) {
    if (m.user_id) {
      const { error: errDel } = await supabase.auth.admin.deleteUser(m.user_id);
      if (errDel) console.error(`Error deleting user ${m.user_id}:`, errDel.message);
      else console.log(`Deleted user ${m.user_id}`);
    }
  }

  console.log('2. Inserting new members...');
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
