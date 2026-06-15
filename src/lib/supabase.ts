import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvslygkrqxpaytdkheqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c2x5Z2tycXhwYXl0ZGtoZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjM5NTIsImV4cCI6MjA5NjgzOTk1Mn0.xpGKqWOIp29S3r27XGu2X4I3KEzDL1Urm72NJE-Vdxg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);