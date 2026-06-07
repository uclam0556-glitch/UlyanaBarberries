import { createClient } from '@supabase/supabase-js';

const isProd = import.meta.env.PROD;
// В продакшене используем локальный Node.js прокси (на Timeweb App Platform)
const proxyUrl = typeof window !== 'undefined' ? window.location.origin + '/api/supabase' : '/api/supabase';

const supabaseUrl = isProd ? proxyUrl : (import.meta.env.VITE_SUPABASE_URL || '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export async function uploadImage(file: File | Blob, filename: string): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured');
  
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(data.path);

  return publicUrl;
}
