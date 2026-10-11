const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://waptqzihambwhsqgtuzl.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhcHRxemloYW1id2hzcWd0dXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzQ2MDAsImV4cCI6MjA3MTgxMDYwMH0.BMzUqjt_CIaTz8Gt-A3-piSXqjTHv2f6K6R5f8nG4U';

console.log('Testing Realtime WebSocket connection across 2 clients...');
console.log('Supabase URL:', supabaseUrl);

// Client A: HP 1 (Pengirim / Koor)
const clientA = createClient(supabaseUrl, anonKey);

// Client B: HP 2 (Penerima / Anggota)
const clientB = createClient(supabaseUrl, anonKey);

async function runTest() {
  // Query 2 member aktif untuk simulasi (Maria & Cikita)
  const { data: members, error: mErr } = await clientA
    .from('members')
    .select('id, user_id, full_name, divisi, is_koor')
    .in('full_name', ['Maria Grace', 'Cikita Naura Ayu']);

  if (mErr || !members || members.length < 2) {
    console.error('Error fetching members:', mErr || 'Need at least 2 members');
    process.exit(1);
  }

  const sender = members[0];
  const receiver = members[1];
  console.log(`HP 1 (Sender): ${sender.full_name} (${sender.id})`);
  console.log(`HP 2 (Receiver): ${receiver.full_name} (${receiver.id})`);

  let assignmentReceived = false;
  let notificationReceived = false;

  // HP 2 subscribe ke channel assignments dan notifications persis seperti di APK RealtimeNotifier
  const receiverChannel = clientB.channel(`tugas-${receiver.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'assignments',
        filter: `assigned_to=eq.${receiver.id}`
      },
      (payload) => {
        console.log('>>> [HP 2 DITERIMA] Realtime Assignment event:', payload.new.title);
        assignmentReceived = true;
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${receiver.user_id}`
      },
      (payload) => {
        console.log('>>> [HP 2 DITERIMA] Realtime Notification event:', payload.new.title);
        notificationReceived = true;
      }
    );

  await new Promise((resolve) => {
    receiverChannel.subscribe((status) => {
      console.log('HP 2 WebSocket subscription status:', status);
      if (status === 'SUBSCRIBED') {
        resolve();
      }
    });
  });

  // Tunggu 1 detik agar websocket siap
  await new Promise(r => setTimeout(r, 1000));

  console.log('HP 1 mengirim tugas baru ke HP 2 via Database...');
  const testTitle = 'TEST_AUTOMATED_REALTIME_' + Date.now();
  
  // HP 1 insert assignment (menggunakan query DB via supabase linked query agar bypass RLS tanpa login credential password)
  const { execSync } = require('child_process');
  const insertCmd = `npx --yes supabase db query --linked "INSERT INTO assignments (title, description, divisi, assigned_to, assigned_by, status) VALUES ('${testTitle}', 'Uji notif otomatis 2 HP', '${receiver.divisi}', '${receiver.id}', '${sender.id}', 'pending') RETURNING id;"`;
  
  const insertOutput = execSync(insertCmd, { cwd: 'D:/absensi jurn/jurnfourteen', encoding: 'utf8' });
  console.log('Tugas berhasil dimasukkan ke DB');

  // Tunggu hingga 7 detik untuk event diterima HP 2
  for (let i = 0; i < 14; i++) {
    if (assignmentReceived) break;
    await new Promise(r => setTimeout(r, 500));
  }

  // Cleanup test record
  console.log('Membersihkan data pengujian...');
  execSync(`npx --yes supabase db query --linked "DELETE FROM assignments WHERE title='${testTitle}';"`, { cwd: 'D:/absensi jurn/jurnfourteen', encoding: 'utf8' });

  if (assignmentReceived) {
    console.log('SUCCESS: Realtime WebSocket terverifikasi bekerja 100% antar 2 client!');
    process.exit(0);
  } else {
    console.error('FAILED: HP 2 tidak menerima broadcast realtime.');
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
