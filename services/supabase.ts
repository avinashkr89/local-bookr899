import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rycuknfvibvkpdlignci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Y3VrbmZ2aWJ2a3BkbGlnbmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDA5OTksImV4cCI6MjA3ODcxNjk5OX0.HQoYrQIbJ4rwuKGh0xXukIVhO3-d7Uqff5sS2SGQmIw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
