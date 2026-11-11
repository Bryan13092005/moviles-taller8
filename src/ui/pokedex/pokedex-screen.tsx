import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
 
import { useApodo } from '@/ui/core/apodo-view-model';
import { useAuth } from '@/ui/core/auth-view-model';
import { Estado } from '@/ui/core/estado';
import { FormularioApodo } from '@/ui/core/formulario-apodo';
import { FormularioLogin } from '@/ui/core/formulario-login';
import { colores, espacio } from '@/ui/core/tema';
import { Texto } from '@/ui/core/texto';
 
import { TarjetaPerro } from './tarjeta-perro';
import { usePokedexViewModel } from './use-pokedex-view-model';
 
export function PokedexScreen() {
  const { apodo, listo } = useApodo();
  const auth = useAuth();
 
  if (!listo || !auth.listo) return <Estado cargando />;
  if (!auth.usuario) return <FormularioLogin />;
  if (!apodo) return <FormularioApodo />;
  return <ListaPokedex apodo={apodo} usuarioId={auth.usuario.id} />;
}
 
function ListaPokedex({ apodo, usuarioId }: { apodo: string; usuarioId: string }) {
  const { olvidarApodo } = useApodo();
  const { cerrarSesion, ocupado, error } = useAuth();
  const vm = usePokedexViewModel(usuarioId);
 
  if (vm.cargando || (vm.error && vm.perros.length === 0)) {
    return (
      <Estado cargando={vm.cargando} error={vm.error} onReintentar={vm.recargar} />
    );
  }
 
  return (
    <FlatList
      data={vm.perros}
      keyExtractor={(perro) => perro.id}
      contentContainerStyle={estilos.lista}
      ItemSeparatorComponent={() => <View style={{ height: espacio.s }} />}
      ListHeaderComponent={
        <View style={estilos.cabecera}>
          <Texto variante="nota">Entrenador: {apodo}</Texto>
          <Texto variante="subtitulo">{vm.resumen}</Texto>
          <Pressable onPress={olvidarApodo} hitSlop={8}>
            <Texto variante="nota" style={estilos.enlace}>
              Cambiar apodo
            </Texto>
          </Pressable>
          <Pressable onPress={cerrarSesion} disabled={ocupado} hitSlop={8}>
            <Texto variante="nota" style={estilos.enlace}>Cerrar sesión</Texto>
          </Pressable>
          {error && <Texto style={{ color: colores.alerta }}>{error}</Texto>}
        </View>
      }
      renderItem={({ item }) => (
        <TarjetaPerro
          perro={item}
          capturado={vm.estaCapturado(item.id)}
          onPress={() =>
            router.push({ pathname: '/perro/[id]', params: { id: item.id } })
          }
        />
      )}
    />
  );
}
 
const estilos = StyleSheet.create({
  lista: { padding: espacio.m },
  cabecera: { gap: espacio.xs, marginBottom: espacio.m },
  enlace: { color: colores.terracota, textDecorationLine: 'underline' },
});
