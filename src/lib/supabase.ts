import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mclliuftzttwesubhfrl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbGxpdWZ0enR0d2VzdWJoZnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzY2MzAsImV4cCI6MjA4MzA1MjYzMH0.p35QCs68CtRJnEcs5klKa5zYvGWJGwGu1KDaFGkwra0';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials missing in .env. Using hardcoded fallbacks.');
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);
