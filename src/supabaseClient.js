import { createClient } from '@supabase/supabase-js';

// Replace these with the actual keys you saved from Supabase earlier
const supabaseUrl = 'https://bjstxamhuhepjtxywkmc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3R4YW1odWhlcGp0eHl3a21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTIzNTcsImV4cCI6MjA5NTk4ODM1N30.DzbfZ-FnBKXN7crHU5ve2Wb40kaV3k3ewv97RDkDJbc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

