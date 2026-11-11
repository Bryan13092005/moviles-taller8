import { StyleSheet, View } from 'react-native';

import { useAuth } from './auth-view-model';
import { Boton } from './boton';
import { colores, espacio } from './tema';
import { Texto } from './texto';

export function FormularioLogin() {
  const { iniciarSesion, ocupado, error } = useAuth();

  return (
    <View style={estilos.caja}>
      <Texto variante="subtitulo">Inicia sesión para capturar</Texto>
      <Texto variante="nota">Entra con Google para guardar tus avistamientos.</Texto>
      {error && <Texto style={estilos.error}>{error}</Texto>}
      <Boton titulo="Continuar con Google" onPress={iniciarSesion} cargando={ocupado} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { gap: espacio.m, padding: espacio.l },
  error: { color: colores.alerta },
});
