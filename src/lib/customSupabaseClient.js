import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://igvmfhpnjcdbamtijjzo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlndm1maHBuamNkYmFtdGlqanpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NjYwNzQsImV4cCI6MjA4MTM0MjA3NH0.I-uG-rwGKtwEdxhO3xPHS9TGCzTTXPgOUTht0JvS8q8';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
