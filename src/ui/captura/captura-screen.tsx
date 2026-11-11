import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
 
import { useApodo } from '@/ui/core/apodo-view-model';
import { useAuth } from '@/ui/core/auth-view-model';
import { Boton } from '@/ui/core/boton';
import { Estado } from '@/ui/core/estado';
import { FormularioApodo } from '@/ui/core/formulario-apodo';
import { FormularioLogin } from '@/ui/core/formulario-login';
import { colores, espacio, fuentes, radio } from '@/ui/core/tema';
import { Texto } from '@/ui/core/texto';
 
import { useCapturaViewModel, type PasoCaptura } from './use-captura-view-model';
 
const TEXTO_PASO: Record<PasoCaptura, string> = {
  listo: 'Capturar',
  fotografiando: 'Fotografiando…',
  confirmando: 'Confirmar foto',
  ubicando: 'Buscando tu ubicación…',
  guardando: 'Guardando…',
};
 
export function CapturaScreen() {
  const { apodo, listo } = useApodo();
  const auth = useAuth();
 
  if (!listo || !auth.listo) return <Estado cargando />;
  if (!auth.usuario) return <FormularioLogin />;
  // Sin apodo no hay a nombre de quién guardar la captura.
  if (!apodo) return <FormularioApodo />;
  return <Camara apodo={apodo} usuarioId={auth.usuario.id} key={auth.usuario.id} />;
}
 
// La vista solo dibuja lo que el ViewModel le entrega y le avisa de los
// toques. Las únicas decisiones que toma son de interfaz: el permiso de
// la cámara y a qué pantalla ir cuando la captura termina bien.
function Camara({ apodo, usuarioId }: { apodo: string; usuarioId: string }) {
  const camara = useRef<CameraView>(null);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const insets = useSafeAreaInsets();
 
  // Las pestañas siguen montadas aunque no se vean. Con esto, la cámara y
  // el acelerómetro se apagan cuando estás en otra pestaña.
  const enPantalla = useIsFocused();
  const vm = useCapturaViewModel({ apodo, usuarioId, activo: enPantalla });
 
  async function alCapturar() {
    await vm.capturar(async () => {
      const foto = await camara.current?.takePictureAsync({
        quality: 0.6,
        shutterSound: false,
      });
      return foto?.uri;
    });
  }

  async function alConfirmar() {
    const guardado = await vm.confirmarFoto();
    if (guardado && vm.perroId) {
      router.push({ pathname: '/perro/[id]', params: { id: vm.perroId } });
    }
  }
 
  if (!permiso) return <Estado cargando />;
 
  if (!permiso.granted) {
    return (
      <View style={estilos.centro}>
        <Texto style={{ textAlign: 'center' }}>
          Para capturar perros necesitamos la cámara. Solo se usa en esta pestaña.
        </Texto>
        <Boton titulo="Dar permiso" onPress={pedirPermiso} />
      </View>
    );
  }
 
  return (
    <View style={estilos.contenedor}>
      {enPantalla && !vm.fotoUri && (
        <CameraView ref={camara} style={StyleSheet.absoluteFill} facing="back" pointerEvents="none" />
      )}
      {vm.fotoUri && (
        <Image source={{ uri: vm.fotoUri }} style={StyleSheet.absoluteFill} contentFit="contain" pointerEvents="none" />
      )}
 
      <View style={[estilos.arriba, { paddingTop: insets.top + espacio.m }]}>
        <Texto style={estilos.ayuda}>¿A quién tienes enfrente?</Texto>
        {vm.cargandoPerros ? (
          <Texto style={estilos.ayuda}>Cargando poliperros…</Texto>
        ) : vm.errorPerros ? (
          <View style={estilos.errorPerros}>
            <Texto style={estilos.ayuda}>{vm.errorPerros}</Texto>
            <Boton titulo="Reintentar" onPress={vm.recargarPerros} />
          </View>
        ) : vm.perros.length === 0 ? (
          <Texto style={estilos.ayuda}>No hay poliperros disponibles.</Texto>
        ) : (
          <ScrollView
            horizontal
            style={estilos.listaPerros}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.chips}>
            {vm.perros.map((perro) => {
              const activo = perro.id === vm.perroId;
              return (
                <Pressable
                  key={perro.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo, disabled: vm.paso !== 'listo' }}
                  disabled={vm.paso !== 'listo'}
                  onPress={() => vm.seleccionarPerro(perro.id)}
                  style={[estilos.chip, activo && estilos.chipActivo]}>
                  <Texto style={estilos.chipTexto}>{perro.nombre}</Texto>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
 
      <View style={estilos.abajo}>
        {vm.error && <Texto style={estilos.error}>{vm.error}</Texto>}
        {vm.paso === 'confirmando' ? (
          <>
            <Boton titulo="Confirmar foto" onPress={alConfirmar} />
            <Boton titulo="Tomar otra foto" onPress={vm.repetirFoto} />
          </>
        ) : (
          <Boton
            titulo={vm.perroId ? TEXTO_PASO[vm.paso] : 'Elige un perro primero'}
            onPress={alCapturar}
            deshabilitado={!vm.puedeCapturar}
          />
        )}
      </View>
 
      {/* Tapa el botón mientras está visible: no se puede disparar otra
          foto hasta que el usuario confirme que recogió el teléfono. */}
      {vm.seCayo && (
        <View style={estilos.fondoAviso}>
          <View style={estilos.aviso}>
            <Texto style={estilos.avisoTitulo}>¡Se te cayó de la emoción!</Texto>
            <Texto>No se guardó nada. Recoge el teléfono e inténtalo otra vez.</Texto>
            <Boton titulo="Ya lo recogí" onPress={vm.cerrarAvisoCaida} />
          </View>
        </View>
      )}
    </View>
  );
}
 
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.tinta },
  centro: { flex: 1, justifyContent: 'center', padding: espacio.l, gap: espacio.m },
  arriba: { gap: espacio.s, paddingBottom: espacio.m, backgroundColor: 'rgba(42, 37, 32, 0.88)' },
  ayuda: { color: colores.blanco, paddingHorizontal: espacio.m, fontWeight: '600' },
  listaPerros: { flexGrow: 0, height: 48 },
  chips: { gap: espacio.s, paddingHorizontal: espacio.m, alignItems: 'center' },
  errorPerros: { paddingHorizontal: espacio.m, gap: espacio.s },
  chip: {
    paddingHorizontal: espacio.m,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radio,
    borderWidth: 1.5,
    borderColor: colores.blanco,
    backgroundColor: colores.tinta,
  },
  chipActivo: { backgroundColor: colores.terracota, borderColor: colores.terracota },
  chipTexto: { color: colores.blanco, fontWeight: '600' },
  abajo: { marginTop: 'auto', padding: espacio.m, gap: espacio.s },
  error: { color: colores.blanco, backgroundColor: colores.alerta, padding: espacio.s },
  fondoAviso: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(42, 37, 32, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacio.l,
  },
  aviso: { backgroundColor: colores.papel, padding: espacio.l, gap: espacio.m },
  avisoTitulo: {
    fontFamily: fuentes.titulo,
    fontSize: 24,
    fontWeight: '700',
    color: colores.alerta,
  },
});
