import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/data/services/supabase-service';

type EstadoAuth = {
  usuario: User | null;
  listo: boolean;
  ocupado: boolean;
  error: string | null;
  iniciarSesion: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const AuthContext = createContext<EstadoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [listo, setListo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (vigente) setUsuario(sesion?.user ?? null);
    });
    supabase.auth.getSession().then(({ data, error: problema }) => {
      if (!vigente) return;
      if (problema) setError(`No se pudo recuperar la sesión: ${problema.message}`);
      else setUsuario(data.session?.user ?? null);
      setListo(true);
    }).catch((problema: unknown) => {
      if (!vigente) return;
      setError(problema instanceof Error ? problema.message : 'No se pudo recuperar la sesión');
      setListo(true);
    });
    return () => {
      vigente = false;
      subscription.unsubscribe();
    };
  }, []);

  async function iniciarSesion() {
    setOcupado(true);
    setError(null);
    try {
      const redirectTo = Linking.createURL('');
      const { data, error: problema } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' },
      });
      if (problema) throw problema;
      if (Platform.OS === 'web') return;
      if (!data.url) throw new Error('No se pudo abrir el inicio de sesión');
      const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (resultado.type !== 'success') return;
      const partes = resultado.url.split('#');
      const parametros = new URLSearchParams(partes[1] ?? '');
      const consulta = new URLSearchParams(partes[0].split('?')[1] ?? '');
      const errorOAuth = parametros.get('error_description') ?? parametros.get('error') ??
        consulta.get('error_description') ?? consulta.get('error');
      if (errorOAuth) throw new Error(errorOAuth);
      const accessToken = parametros.get('access_token');
      const refreshToken = parametros.get('refresh_token');
      if (!accessToken || !refreshToken) {
        throw new Error('Google no devolvió una sesión válida');
      }
      const { error: errorSesion } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (errorSesion) throw errorSesion;
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo iniciar sesión');
    } finally {
      setOcupado(false);
    }
  }

  async function cerrarSesion() {
    setOcupado(true);
    setError(null);
    try {
      const { error: problema } = await supabase.auth.signOut();
      if (problema) throw problema;
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo cerrar sesión');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, listo, ocupado, error, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): EstadoAuth {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return valor;
}
