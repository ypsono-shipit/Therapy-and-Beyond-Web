import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export async function readFunctionError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error && (error as { context: unknown }).context instanceof Response) {
    try {
      return await ((error as { context: Response }).context).text();
    } catch {
      // fall through
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
