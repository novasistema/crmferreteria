// Cliente del navegador para la función /api/arca (la firma y la clave quedan en el servidor)
export interface ArcaApiResponse {
  ok: boolean;
  error?: string;
  code?: string;
  [key: string]: any;
}

export const callArca = async (action: string, payload: Record<string, unknown> = {}): Promise<ArcaApiResponse> => {
  let res: Response;
  try {
    res = await fetch('/api/arca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
  } catch {
    return { ok: false, code: 'network', error: 'No hay conexión con el servidor del sistema.' };
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      code: 'no_api',
      error:
        res.status === 404
          ? 'El servidor de facturación no está disponible en esta instalación (la app tiene que estar publicada en Vercel).'
          : `Respuesta inesperada del servidor (${res.status}).`
    };
  }
};

export const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
