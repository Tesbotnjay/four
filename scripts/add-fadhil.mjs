import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) envVars[match[1].trim()] = match[2].trim()
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

async function addFadhil() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const loginUsername = 'muhammadfadhil'
  const displayUsername = 'Ubee'
  const password = 'ambroxol2batang.'
  const email = `${loginUsername}@jurnfourteen.com`

  console.log('Creating auth user...')
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  })

  if (authError) {
    console.error('Error creating auth user:', authError.message)
    return
  }

  const userId = authData.user.id
  console.log('Auth user created:', userId)

  console.log('Inserting into members table...')
  const { error: dbError } = await supabase.from('members').insert({
    user_id: userId,
    full_name: 'Muhammad Fadhil',
    username: loginUsername,
    display_username: displayUsername,
    nis_nisn: '3097789947',
    kelas: 'XII-2',
    phone: '082250349980',
    jabatan: 'Pembimbing Media',
    role: 'anggota',
    joined_at: '2024-10-02',
    status: 'aktif'
  })

  if (dbError) {
    console.error('Error inserting into members:', dbError.message)
    // Rollback auth
    await supabase.auth.admin.deleteUser(userId)
  } else {
    console.log('Successfully added Muhammad Fadhil!')
  }
}

addFadhil()
