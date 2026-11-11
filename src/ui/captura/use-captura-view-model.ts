import { useCallback, useEffect, useRef, useState } from 'react';
 
import { avistamientosRepository } from '@/data/repositories/avistamientos-repository';
import { perrosRepository } from '@/data/repositories/perros-repository';
import { escucharCaidas } from '@/data/services/acelerometro-service';
import { obtenerUbicacionActual } from '@/data/services/ubicacion-service';
import type { Perro } from '@/domain/models/perro';
 
export type PasoCaptura = 'listo' | 'fotografiando' | 'confirmando' | 'ubicando' | 'guardando';
 
type Parametros = {
  apodo: string;
  usuarioId: string;
  // Solo escuchamos el acelerómetro mientras la pantalla está a la vista.
  activo: boolean;
};
 
export function useCapturaViewModel({ apodo, usuarioId, activo }: Parametros) {
  const [perros, setPerros] = useState<Perro[]>([]);
  const [cargandoPerros, setCargandoPerros] = useState(true);
  const [errorPerros, setErrorPerros] = useState<string | null>(null);
  const [perroId, setPerroId] = useState<string | null>(null);
  const [paso, setPaso] = useState<PasoCaptura>('listo');
  const [error, setError] = useState<string | null>(null);
  const [seCayo, setSeCayo] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
 
  // Un AbortController por captura. Va en una ref y no en un estado porque
  // la función async que ya está corriendo necesita ver el valor actual;
  // un estado quedaría "congelado" con el valor que tenía al empezar.
  const capturaEnCurso = useRef<AbortController | null>(null);
  const confirmacionEnCurso = useRef(false);
 
  useEffect(() => {
    perrosRepository
      .listar()
      .then(setPerros)
      .catch((e: Error) => setErrorPerros(e.message))
      .finally(() => setCargandoPerros(false));
  }, []);

  async function recargarPerros() {
    setCargandoPerros(true);
    setErrorPerros(null);
    try {
      setPerros(await perrosRepository.listar());
    } catch (e) {
      setErrorPerros(e instanceof Error ? e.message : 'No se pudieron cargar los perros');
    } finally {
      setCargandoPerros(false);
    }
  }
 
  useEffect(() => {
    if (!activo || seCayo) return;
    // escucharCaidas devuelve la función para soltar el sensor; React la
    // llama al salir de la pantalla, así no se gasta batería en segundo plano.
    return escucharCaidas(() => {
      capturaEnCurso.current?.abort();
      capturaEnCurso.current = null;
      setFotoUri(null);
      setPaso('listo');
      setSeCayo(true);
    });
  }, [activo, seCayo]);

  useEffect(() => {
    if (!activo) return;
    return () => {
      capturaEnCurso.current?.abort();
      capturaEnCurso.current = null;
      setFotoUri(null);
      setPaso('listo');
    };
  }, [activo]);
 
  // Un "comando", como lo llama la guía de Flutter: lo que la vista invoca.
  // La vista le pasa cómo tomar la foto porque la cámara es un componente de
  // interfaz; el ViewModel decide el orden de los pasos y qué hacer con cada uno.
  const capturar = useCallback(
    async (tomarFoto: () => Promise<string | undefined>): Promise<void> => {
      if (!perroId || capturaEnCurso.current) return;
 
      const controlador = new AbortController();
      capturaEnCurso.current = controlador;
      setError(null);
 
      try {
        setPaso('fotografiando');
        const fotoUri = await tomarFoto();
        if (!fotoUri) throw new Error('La cámara no devolvió ninguna foto');
        if (controlador.signal.aborted) return;
        setFotoUri(fotoUri);
        setPaso('confirmando');
      } catch (e) {
        if (!controlador.signal.aborted) {
          setError(e instanceof Error ? e.message : 'No se pudo completar la captura');
          capturaEnCurso.current = null;
          setPaso('listo');
        }
      }
    },
    [perroId],
  );

  const confirmarFoto = useCallback(async (): Promise<boolean> => {
    const controlador = capturaEnCurso.current;
    if (!controlador || !fotoUri || !perroId || paso !== 'confirmando' || confirmacionEnCurso.current) return false;
    confirmacionEnCurso.current = true;
    setPaso('ubicando');
    try {
      const { latitud, longitud } = await obtenerUbicacionActual();
      if (controlador.signal.aborted) return false;
      setPaso('guardando');
      await avistamientosRepository.registrarCaptura(
        { perroId, apodo, usuarioId, fotoUri, latitud, longitud },
        controlador.signal,
      );
      return !controlador.signal.aborted;
    } catch (e) {
      if (!controlador.signal.aborted) {
        setError(e instanceof Error ? e.message : 'No se pudo completar la captura');
      }
      return false;
    } finally {
      confirmacionEnCurso.current = false;
      if (capturaEnCurso.current === controlador) {
        capturaEnCurso.current = null;
        setFotoUri(null);
        setPaso('listo');
      }
    }
  }, [apodo, fotoUri, paso, perroId, usuarioId]);

  function repetirFoto() {
    capturaEnCurso.current?.abort();
    capturaEnCurso.current = null;
    setFotoUri(null);
    setPaso('listo');
  }
 
  return {
    perros,
    cargandoPerros,
    errorPerros,
    recargarPerros,
    perroId,
    paso,
    error,
    seCayo,
    fotoUri,
    puedeCapturar: perroId !== null && paso === 'listo' && !seCayo,
    seleccionarPerro: setPerroId,
    capturar,
    confirmarFoto,
    repetirFoto,
    cerrarAvisoCaida: () => setSeCayo(false),
  };
}
