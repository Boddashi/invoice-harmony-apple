
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://sjwqxbjxjlsdngbldhcq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqd3F4Ymp4amxzZG5nYmxkaGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NTI1MDIsImV4cCI6MjA1NzEyODUwMn0.BJfPE23S8bosqxF5ZK16FqKzVtwJZc5ZE0XicAU7Wjk";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
