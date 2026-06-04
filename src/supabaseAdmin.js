import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjstxamhuhepjtxywkmc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3R4YW1odWhlcGp0eHl3a21jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMjM1NywiZXhwIjoyMDk1OTg4MzU3fQ.xeLjmJGHG8bZGLVNQ2PxrabBcjtuGQpLg8wkmAs7lVM'; // Paste the secret key here!

// This special client will not hijack the current logged-in session
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});