import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
 
import { env } from './env';
 
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: typeof localStorage === 'undefined' ? undefined : localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: Platform.OS === 'web' ? 'pkce' : 'implicit',
  },
});

// Las lecturas son públicas y deben mostrar los mismos datos con o sin sesión.
export const supabasePublico = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storageKey: 'poliperrodex-lectura-publica',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
 
export function urlPublica(ruta: string): string {
  return supabase.storage.from(env.bucket).getPublicUrl(ruta).data.publicUrl;
}
 
export async function subirImagen(ruta: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await supabase.storage
    .from(env.bucket)
    .upload(ruta, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
}
