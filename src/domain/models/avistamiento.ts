export type Avistamiento = {
  id: string;
  perroId: string;
  nombrePerro: string;
  apodo: string;
  usuarioId: string | null;
  fotoUrl: string;
  latitud: number;
  longitud: number;
  creadoEn: string;
};
