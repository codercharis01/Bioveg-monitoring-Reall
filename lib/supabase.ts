import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfudnvkshgvxygssszwi.supabase.co';
// Normalize URL to remove trailing slashes and /rest/v1 suffix which causes "Invalid path" errors
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/auth\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmdWRudmtzaGd2eHlnc3NzendpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODkyNzgsImV4cCI6MjA5NDY2NTI3OH0.iXR-K45SxhsVjgDEgd0kxgBkBAGHni6io1i287HypsI';

export const supabase = createClient(supabaseUrl, supabaseKey);
