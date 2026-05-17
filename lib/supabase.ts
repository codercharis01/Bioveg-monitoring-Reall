import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gafpxmmpldxnyocdnrcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB4bW1wbGR4bnlvY2RucmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTQzNjUsImV4cCI6MjA5NDUzMDM2NX0.vqHpzcSkRlLXFd-XyX4mFcbWnRCZBohqXGxKijpbOek';

export const supabase = createClient(supabaseUrl, supabaseKey);
