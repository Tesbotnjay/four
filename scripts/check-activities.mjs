import pg from 'pg'
const c = new pg.Client({host:'aws-0-ap-southeast-2.pooler.supabase.com',port:5432,database:'postgres',user:'postgres.waptqzihambwhsqgtuzl',password:'Jurnfourteen1!',ssl:{rejectUnauthorized:false}})
await c.connect()
const {rows}=await c.query("SELECT id, name, status, activity_date, start_time, end_time, confirm_end, requires_attendance FROM activities")
console.log(rows)
await c.end()
