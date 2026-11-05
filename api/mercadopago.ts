/// <reference types="node" />
// Mercado Pago Checkout Pro para la Tienda Online. Corre en el servidor (Vercel Functions):
// el access token se guarda cifrado con ARCA_SECRET y nunca llega en claro al navegador.
import crypto from 'node:crypto';

const MP_API = 'https://api.mercadopago.com';

class MpError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const getSecretKey = (): Buffer => {
  const secret = process.env.ARCA_SECRET;
  if (!secret || secret.length < 16) {
    throw new MpError(
      'missing_secret',
      'Falta la variable ARCA_SECRET en Vercel (mínimo 16 caracteres). Se usa para guardar cifrado el token de Mercado Pago.'
    );
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptSecret = (plain: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
};

const decryptSecret = (enc: string): string => {
  const [v, iv, tag, data] = (enc || '').split(':');
  if (v !== 'v1' || !iv || !tag || !data) throw new MpError('not_configured', 'Mercado Pago no está configurado en la tienda.');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', getSecretKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    throw new MpError('bad_secret', 'No se pudo leer el token de Mercado Pago guardado. Volvé a cargarlo en la configuración de la tienda.');
  }
};

const mpFetch = async (token: string, path: string, init: RequestInit = {}) => {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  const text = await res.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!res.ok) {
    const msg = body?.message || body?.error || `HTTP ${res.status}`;
    if (res.status === 401) throw new MpError('bad_token', 'Mercado Pago rechazó el access token. Revisalo en la configuración de la tienda.');
    throw new MpError('mp', `Mercado Pago respondió: ${msg}`);
  }
  return body;
};

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Usar POST' });
    return;
  }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  try {
    switch (b.action) {
      case 'save_token': {
        const token = String(b.accessToken || '').trim();
        if (!/^(APP_USR|TEST)-/.test(token)) {
          throw new MpError('bad_token', 'El access token tiene que empezar con APP_USR- (producción) o TEST- (pruebas).');
        }
        const me = await mpFetch(token, '/users/me');
        res.json({ ok: true, tokenEnc: encryptSecret(token), account: me?.nickname || me?.email || String(me?.id || '') });
        return;
      }
      case 'create_preference': {
        const token = decryptSecret(b.tokenEnc);
        const order = b.order || {};
        const baseUrl = String(b.baseUrl || '').replace(/\/$/, '');
        if (!order.id || !Array.isArray(order.items) || order.items.length === 0) throw new MpError('bad_order', 'Pedido inválido.');
        const items = order.items.map((it: any) => ({
          id: String(it.code || it.productId || ''),
          title: String(it.title || 'Producto').slice(0, 250),
          quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
          unit_price: round2(it.unitPrice),
          currency_id: 'ARS'
        }));
        if (Number(order.shippingCost) > 0) {
          items.push({ id: 'envio', title: 'Envío', quantity: 1, unit_price: round2(order.shippingCost), currency_id: 'ARS' });
        }
        const back = `${baseUrl}/tienda?pedido=${encodeURIComponent(order.id)}`;
        const pref = await mpFetch(token, '/checkout/preferences', {
          method: 'POST',
          body: JSON.stringify({
            items,
            external_reference: String(order.id),
            statement_descriptor: String(order.storeName || '').slice(0, 22) || undefined,
            payer: { name: order.payerName || undefined, email: order.payerEmail || undefined },
            back_urls: { success: back, pending: back, failure: back },
            auto_return: 'approved'
          })
        });
        res.json({ ok: true, preferenceId: pref.id, initPoint: pref.init_point });
        return;
      }
      case 'check_payment': {
        const token = decryptSecret(b.tokenEnc);
        let payment: any = null;
        if (b.paymentId) {
          payment = await mpFetch(token, `/v1/payments/${encodeURIComponent(String(b.paymentId))}`);
        } else if (b.orderId) {
          const r = await mpFetch(token, `/v1/payments/search?sort=date_created&criteria=desc&external_reference=${encodeURIComponent(String(b.orderId))}`);
          payment = (r?.results || []).find((p: any) => p.status === 'approved') || (r?.results || [])[0] || null;
        }
        if (!payment) {
          res.json({ ok: true, found: false });
          return;
        }
        if (b.orderId && payment.external_reference && String(payment.external_reference) !== String(b.orderId)) {
          throw new MpError('mismatch', 'El pago no corresponde a este pedido.');
        }
        res.json({
          ok: true,
          found: true,
          paymentId: String(payment.id),
          status: payment.status, // approved, pending, in_process, rejected, cancelled, refunded
          statusDetail: payment.status_detail,
          amount: payment.transaction_amount,
          orderId: payment.external_reference
        });
        return;
      }
      default:
        res.status(400).json({ ok: false, error: 'Acción desconocida' });
    }
  } catch (err: any) {
    const code = err instanceof MpError ? err.code : 'internal';
    res.status(code === 'missing_secret' || code === 'internal' ? 500 : 400).json({ ok: false, code, error: err?.message || 'Error inesperado' });
  }
}
