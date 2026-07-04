import { createClient } from '@supabase/supabase-js'
import { env } from '$env/dynamic/private'

export const supabaseAdmin = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false }
})

export const SUPABASE_BUCKET = env.SUPABASE_STORAGE_BUCKET || 'media'
