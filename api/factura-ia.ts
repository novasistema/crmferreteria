/// <reference types="node" />
// Lectura de facturas de compra con IA (Gemini).
// Recibe la foto o el PDF de una factura de proveedor y devuelve cabecera + renglones en JSON.
// Corre solo en el servidor (Vercel Functions): la clave GEMINI_API_KEY nunca llega al navegador.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_BASE64 = 4_000_000; // ~3 MB de archivo (Vercel acepta cuerpos de hasta 4,5 MB)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

const PROMPT = `Sos un asistente de compras de una ferretería argentina.
Leé la factura (o remito) de proveedor adjunta y devolvé SOLO los datos que figuran en el comprobante.
Reglas:
- "tipo": la letra del comprobante (A, B, C, M, X) o "R" si es remito. Si no figura, "X".
- "puntoVenta" y "numero": solo dígitos, sin ceros de relleno obligatorios.
- Fechas en formato AAAA-MM-DD. Si no figura el vencimiento, dejalo vacío.
- En cada renglón, "precioUnitario" es el precio unitario antes de bonificaciones:
  en facturas A y M, el precio NETO SIN IVA (si el renglón lo muestra con IVA, dividilo por 1 + alícuota/100);
  en facturas B, C, X y remitos, el precio tal como figura, con el IVA incluido si lo tiene.
- "bonificacion1/2/3": porcentajes de descuento del renglón, en el orden en que aparecen (0 si no hay).
- "alicuotaIva": 21, 10.5, 27 o 0. Si no se ve, usá 21.
- "codigo": el código de artículo del proveedor tal cual figura (vacío si no hay).
- Montos como números con punto decimal (12345.67), sin símbolo $ ni separadores de miles.
- No inventes renglones ni montos. Si un dato no se lee, dejalo vacío o en 0.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    proveedorRazonSocial: { type: 'STRING' },
    proveedorCuit: { type: 'STRING' },
    tipo: { type: 'STRING', enum: ['A', 'B', 'C', 'M', 'X', 'R'] },
    puntoVenta: { type: 'STRING' },
    numero: { type: 'STRING' },
    fecha: { type: 'STRING' },
    vencimiento: { type: 'STRING' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          codigo: { type: 'STRING' },
          descripcion: { type: 'STRING' },
          cantidad: { type: 'NUMBER' },
          precioUnitario: { type: 'NUMBER' },
          bonificacion1: { type: 'NUMBER' },
          bonificacion2: { type: 'NUMBER' },
          bonificacion3: { type: 'NUMBER' },
          alicuotaIva: { type: 'NUMBER' }
        },
        required: ['descripcion', 'cantidad', 'precioUnitario']
      }
    },
    percepcionIibb: { type: 'NUMBER' },
    percepcionIva: { type: 'NUMBER' },
    impuestosInternos: { type: 'NUMBER' },
    otrosImpuestos: { type: 'NUMBER' },
    total: { type: 'NUMBER' }
  },
  required: ['tipo', 'items']
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Usar POST' });
    return;
  }
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        ok: false,
        code: 'missing_key',
        error: 'Falta la variable GEMINI_API_KEY en Vercel (Settings → Environment Variables). Cargala y volvé a desplegar.'
      });
      return;
    }

    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const data: string = String(b.fileBase64 || '').replace(/^data:[^;]+;base64,/, '');
    const mimeType: string = String(b.mimeType || '').toLowerCase();

    if (!data) {
      res.status(400).json({ ok: false, error: 'No llegó ningún archivo.' });
      return;
    }
    if (!ALLOWED.includes(mimeType)) {
      res.status(400).json({ ok: false, error: 'Formato no soportado. Subí una foto (JPG, PNG) o un PDF.' });
      return;
    }
    if (data.length > MAX_BASE64) {
      res.status(413).json({ ok: false, error: 'El archivo es muy pesado. Probá con una foto más liviana o un PDF de menos de 3 MB.' });
      return;
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: PROMPT }, { inlineData: { mimeType, data } }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: SCHEMA
          }
        })
      }
    );

    const body: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = body?.error?.message || `HTTP ${r.status}`;
      const status = r.status === 429 ? 429 : 502;
      res.status(status).json({
        ok: false,
        error: r.status === 429
          ? 'Se alcanzó el límite de uso de la IA. Esperá un minuto y probá de nuevo.'
          : `La IA no pudo leer la factura (${msg}).`
      });
      return;
    }

    const text: string = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      res.status(502).json({ ok: false, error: 'La IA devolvió una respuesta que no se pudo interpretar. Probá con una foto más nítida.' });
      return;
    }
    if (!Array.isArray(parsed?.items) || parsed.items.length === 0) {
      res.status(422).json({ ok: false, error: 'No se encontraron renglones en el comprobante. Probá con una foto más nítida y completa.' });
      return;
    }

    res.status(200).json({ ok: true, invoice: parsed });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'Error inesperado' });
  }
}
