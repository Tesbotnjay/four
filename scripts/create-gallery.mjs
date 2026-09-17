import pg from 'pg';
const c = new pg.Client({
  host:'aws-0-ap-southeast-2.pooler.supabase.com',
  port:5432,
  database:'postgres',
  user:'postgres.waptqzihambwhsqgtuzl',
  password:'Jurnfourteen1!',
  ssl:{rejectUnauthorized:false}
});
await c.connect();
try {
  // Create gallery table
  await c.query(`
    CREATE TABLE IF NOT EXISTS gallery (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      image_url TEXT NOT NULL,
      caption TEXT,
      date DATE,
      created_by UUID REFERENCES members(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
  `);
  console.log("Created gallery table");
  
  // Create bucket for gallery
  await c.query(`
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('gallery', 'gallery', true) 
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log("Created bucket");

  // Create RLS for gallery bucket
  await c.query(`
    CREATE POLICY "Gallery Images are publicly accessible." 
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'gallery' );
    
    CREATE POLICY "Anyone can upload to gallery." 
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'gallery' );
    
    CREATE POLICY "Anyone can delete from gallery." 
    ON storage.objects FOR DELETE 
    USING ( bucket_id = 'gallery' );
  `);
  console.log("Created bucket policies");
} catch (e) {
  console.log(e);
}
await c.end();
