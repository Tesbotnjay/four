import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-southeast-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.waptqzihambwhsqgtuzl',
  password: 'Jurnfourteen1!',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  await client.connect();
  console.log('Connected to database.');

  const tables = [
    'announcements', 'broadcasts', 'activities', 'attendance',
    'members', 'notifications', 'leave_requests', 'activity_logs',
    'settings', 'telegram_logs'
  ];

  try {
    for (const table of tables) {
      // Get all policies for the table
      const res = await client.query(`
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = $1 
          AND schemaname = 'public';
      `, [table]);
      
      for (const row of res.rows) {
        console.log(`Dropping policy "${row.policyname}" on ${table}`);
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON public."${table}"`);
      }
      
      // Ensure RLS is enabled
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
    }

    console.log('Creating new policies...');

    // members
    await client.query(`
      CREATE POLICY "Members are viewable by authenticated users" ON public.members FOR SELECT TO authenticated USING (true);
      CREATE POLICY "Members update own profile" ON public.members FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    `);

    // activities
    await client.query(`
      CREATE POLICY "Activities are viewable by authenticated users" ON public.activities FOR SELECT TO authenticated USING (true);
    `);

    // attendance
    await client.query(`
      CREATE POLICY "Attendance viewable by authenticated users" ON public.attendance FOR SELECT TO authenticated USING (true);
      CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
      );
    `);

    // broadcasts
    await client.query(`
      CREATE POLICY "Broadcasts viewable by authenticated users" ON public.broadcasts FOR SELECT TO authenticated USING (true);
    `);

    // announcements
    await client.query(`
      CREATE POLICY "Announcements viewable by authenticated users" ON public.announcements FOR SELECT TO authenticated USING (true);
    `);

    // notifications
    await client.query(`
      CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
      CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
    `);

    // leave_requests
    await client.query(`
      CREATE POLICY "Leave requests viewable by authenticated users" ON public.leave_requests FOR SELECT TO authenticated USING (true);
      CREATE POLICY "Users can insert own leave requests" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (
        member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
      );
    `);

    // activity_logs
    await client.query(`
      CREATE POLICY "Activity logs viewable by authenticated users" ON public.activity_logs FOR SELECT TO authenticated USING (true);
    `);

    // settings
    await client.query(`
      CREATE POLICY "Settings viewable by authenticated users" ON public.settings FOR SELECT TO authenticated USING (true);
    `);

    // telegram_logs
    await client.query(`
      CREATE POLICY "Telegram logs viewable by authenticated users" ON public.telegram_logs FOR SELECT TO authenticated USING (true);
    `);

    console.log('All policies applied successfully.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

run();
