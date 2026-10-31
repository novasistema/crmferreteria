/// <reference types="node" />
// Conexión con ARCA (ex AFIP): WSAA (autenticación) + WSFEv1 (factura electrónica)
// Corre solo en el servidor (Vercel Functions). La clave privada nunca viaja en claro al navegador.
import https from 'node:https';
import crypto from 'node:crypto';
import forge from 'node-forge';

export type ArcaEnv = 'homologacion' | 'produccion';

const URLS = {
  homologacion: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
  },
  produccion: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
  }
} as const;

export class ArcaError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// ---------- Cifrado de secretos (clave privada y ticket de acceso) ----------
const getSecretKey = (): Buffer => {
  const secret = process.env.ARCA_SECRET;
  if (!secret || secret.length < 16) {
    throw new ArcaError(
      'missing_secret',
      'Falta la variable ARCA_SECRET en Vercel (mínimo 16 caracteres). Cargala en Settings → Environment Variables y volvé a desplegar.'
    );
  }
  return crypto.createHash('sha256').update(secret).digest();
};

export const encryptSecret = (plain: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${data.toString('base64')}`;
};

export const decryptSecret = (enc: string): string => {
  const [v, iv, tag, data] = (enc || '').split(':');
  if (v !== 'v1' || !iv || !tag || !data) throw new ArcaError('bad_secret', 'Dato cifrado inválido.');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', getSecretKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    throw new ArcaError(
      'bad_secret',
      'No se pudo descifrar la clave guardada. ¿Cambió ARCA_SECRET en Vercel? Si es así, generá el certificado de nuevo.'
    );
  }
};

// ---------- Certificados ----------
export const cleanCuit = (cuit: string) => (cuit || '').replace(/\D/g, '');

export const isValidCuit = (cuit: string): boolean => {
  const c = cleanCuit(cuit);
  if (c.length !== 11) return false;
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = mult.reduce((acc, m, i) => acc + m * Number(c[i]), 0);
  let dv = 11 - (sum % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) dv = 9;
  return dv === Number(c[10]);
};

export const generateKeyAndCsr = (cuit: string, companyName: string, alias: string) => {
  const c = cleanCuit(cuit);
  if (!isValidCuit(c)) throw new ArcaError('bad_cuit', 'El CUIT no es válido.');
  const keys = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;
  csr.setSubject([
    { shortName: 'C', value: 'AR' },
    { shortName: 'O', value: (companyName || 'Empresa').slice(0, 60) },
    { shortName: 'CN', value: (alias || 'sistema').replace(/[^a-zA-Z0-9]/g, '').slice(0, 30) || 'sistema' },
    { type: '2.5.4.5', value: `CUIT ${c}` }
  ]);
  csr.sign(keys.privateKey, forge.md.sha256.create());
  return {
    keyPem: forge.pki.privateKeyToPem(keys.privateKey),
    csrPem: forge.pki.certificationRequestToPem(csr)
  };
};

const normalizePem = (pem: string) => (pem || '').trim().replace(/\r/g, '');

export const parseKey = (keyPem: string) => {
  try {
    return forge.pki.privateKeyFromPem(normalizePem(keyPem));
  } catch {
    throw new ArcaError('bad_key', 'La clave privada no es válida (tiene que ser un archivo .key en formato PEM).');
  }
};

export const parseCert = (certPem: string) => {
  try {
    return forge.pki.certificateFromPem(normalizePem(certPem));
  } catch {
    throw new ArcaError('bad_cert', 'El certificado no es válido (tiene que ser el archivo .crt que descargás de ARCA).');
  }
};

export const inspectCertificate = (certPem: string, keyPem?: string) => {
  const cert = parseCert(certPem);
  const serial = cert.subject.getField({ type: '2.5.4.5' })?.value as string | undefined;
  const cn = cert.subject.getField('CN')?.value as string | undefined;
  let matchesKey: boolean | undefined;
  if (keyPem) {
    const key = parseKey(keyPem) as forge.pki.rsa.PrivateKey;
    const pub = cert.publicKey as forge.pki.rsa.PublicKey;
    matchesKey = pub.n.equals(key.n) && pub.e.equals(key.e);
  }
  return {
    notBefore: cert.validity.notBefore.toISOString(),
    notAfter: cert.validity.notAfter.toISOString(),
    cuit: serial ? cleanCuit(serial) : undefined,
    alias: cn,
    issuer: (cert.issuer.getField('CN')?.value as string) || '',
    matchesKey
  };
};

// ---------- HTTP / SOAP ----------
// Los servidores de ARCA usan parámetros TLS viejos: bajamos el nivel de seguridad de OpenSSL solo para ellos
const arcaAgent = new https.Agent({ keepAlive: true, ciphers: 'DEFAULT@SECLEVEL=1' });

const postSoap = (url: string, soapAction: string, body: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'POST',
        agent: arcaAgent,
        timeout: 25000,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: soapAction,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      res => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      }
    );
    req.on('timeout', () => req.destroy(new ArcaError('timeout', 'ARCA no respondió a tiempo. Probá de nuevo en unos minutos.')));
    req.on('error', err =>
      reject(err instanceof ArcaError ? err : new ArcaError('network', `No se pudo conectar con ARCA: ${err.message}`))
    );
    req.write(body);
    req.end();
  });

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xmlUnescape = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// Toma el primer <Tag> (con o sin prefijo de namespace)
export const tag = (xml: string, name: string): string | undefined => {
  const m = new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${name}>`).exec(xml);
  return m ? m[1] : undefined;
};
export const tags = (xml: string, name: string): string[] => {
  const re = new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${name}>`, 'g');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
};

const soapFault = (xml: string) => {
  const fault = tag(xml, 'faultstring');
  return fault ? xmlUnescape(fault).trim() : undefined;
};

// ---------- WSAA ----------
export interface AccessTicket {
  token: string;
  sign: string;
  expirationTime: string; // ISO
  env: ArcaEnv;
  cuit: string;
}

const isoArgentina = (d: Date) => {
  const local = new Date(d.getTime() - 3 * 3600 * 1000);
  return local.toISOString().replace(/\.\d{3}Z$/, '-03:00');
};

export const buildTra = (service: string) => {
  const now = Date.now();
  return `<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header><uniqueId>${Math.floor(now / 1000)}</uniqueId><generationTime>${isoArgentina(new Date(now - 10 * 60 * 1000))}</generationTime><expirationTime>${isoArgentina(new Date(now + 10 * 60 * 1000))}</expirationTime></header><service>${service}</service></loginTicketRequest>`;
};

export const signCms = (content: string, certPem: string, keyPem: string) => {
  const cert = parseCert(certPem);
  const key = parseKey(keyPem);
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(content, 'utf8');
  p7.addCertificate(cert);
  p7.addSigner({
    key: key as any,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() as any }
    ]
  });
  p7.sign();
  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());
};

export const isTicketValid = (ta: AccessTicket | null | undefined, env: ArcaEnv, cuit: string) =>
  !!ta && ta.env === env && ta.cuit === cuit && new Date(ta.expirationTime).getTime() - Date.now() > 10 * 60 * 1000;

export const loginWsaa = async (env: ArcaEnv, cuit: string, certPem: string, keyPem: string): Promise<AccessTicket> => {
  const cms = signCms(buildTra('wsfe'), certPem, keyPem);
  const body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov"><soapenv:Header/><soapenv:Body><wsaa:loginCms><wsaa:in0>${cms}</wsaa:in0></wsaa:loginCms></soapenv:Body></soapenv:Envelope>`;
  const xml = await postSoap(URLS[env].wsaa, '""', body);
  const fault = soapFault(xml);
  if (fault) {
    if (/ya posee un TA valido/i.test(fault)) {
      throw new ArcaError(
        'ta_in_use',
        'ARCA indica que ya hay un ticket de acceso vigente que el sistema no tiene guardado. Esperá unos 10 minutos y volvé a probar.'
      );
    }
    if (/no autorizado|not authorized|Computador no autorizado/i.test(fault)) {
      throw new ArcaError(
        'not_authorized',
        `ARCA rechazó el acceso: ${fault}. Revisá que el certificado esté autorizado para el servicio "Facturación electrónica" (wsfe) en el Administrador de Relaciones.`
      );
    }
    throw new ArcaError('wsaa', `ARCA (autenticación) respondió: ${fault}`);
  }
  const ret = tag(xml, 'loginCmsReturn');
  if (!ret) throw new ArcaError('wsaa', 'Respuesta inesperada del servicio de autenticación de ARCA.');
  const inner = xmlUnescape(ret);
  const token = tag(inner, 'token');
  const sign = tag(inner, 'sign');
  const expirationTime = tag(inner, 'expirationTime');
  if (!token || !sign || !expirationTime) throw new ArcaError('wsaa', 'ARCA no devolvió el ticket de acceso.');
  return { token, sign, expirationTime: new Date(expirationTime).toISOString(), env, cuit };
};

// ---------- WSFEv1 ----------
const FE_NS = 'http://ar.gov.afip.dif.FEV1/';

const wsfeCall = async (env: ArcaEnv, method: string, inner: string) => {
  const body = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="${FE_NS}"><soap:Header/><soap:Body><ar:${method}>${inner}</ar:${method}></soap:Body></soap:Envelope>`;
  const xml = await postSoap(URLS[env].wsfe, `${FE_NS}${method}`, body);
  const fault = soapFault(xml);
  if (fault) throw new ArcaError('wsfe', `ARCA (factura electrónica) respondió: ${fault}`);
  return xml;
};

const authXml = (ta: AccessTicket) =>
  `<ar:Auth><ar:Token>${ta.token}</ar:Token><ar:Sign>${ta.sign}</ar:Sign><ar:Cuit>${ta.cuit}</ar:Cuit></ar:Auth>`;

const collectErrors = (xml: string) =>
  tags(tag(xml, 'Errors') || '', 'Err').map(e => `${tag(e, 'Code')}: ${xmlUnescape(tag(e, 'Msg') || '')}`);

export const feDummy = async (env: ArcaEnv) => {
  const xml = await wsfeCall(env, 'FEDummy', '');
  return { app: tag(xml, 'AppServer'), db: tag(xml, 'DbServer'), auth: tag(xml, 'AuthServer') };
};

export const feLastVoucher = async (ta: AccessTicket, ptoVta: number, cbteTipo: number) => {
  const xml = await wsfeCall(ta.env, 'FECompUltimoAutorizado', `${authXml(ta)}<ar:PtoVta>${ptoVta}</ar:PtoVta><ar:CbteTipo>${cbteTipo}</ar:CbteTipo>`);
  const errors = collectErrors(xml);
  const nro = tag(xml, 'CbteNro');
  if (nro === undefined) throw new ArcaError('wsfe', errors.join(' | ') || 'No se pudo consultar el último comprobante.');
  return { number: Number(nro), errors };
};

export const fePointsOfSale = async (ta: AccessTicket) => {
  const xml = await wsfeCall(ta.env, 'FEParamGetPtosVenta', authXml(ta));
  const list = tags(xml, 'PtoVenta').map(p => ({
    number: Number(tag(p, 'Nro')),
    type: tag(p, 'EmisionTipo') || '',
    blocked: tag(p, 'Bloqueado') === 'S',
    deletedAt: tag(p, 'FchBaja') && tag(p, 'FchBaja') !== 'NULL' ? tag(p, 'FchBaja') : undefined
  }));
  return { list, errors: collectErrors(xml) };
};

export interface InvoiceRequest {
  ptoVta: number;
  cbteTipo: number; // 1 = A, 6 = B, 11 = C
  docTipo: number; // 80 CUIT, 86 CUIL, 96 DNI, 99 consumidor final sin identificar
  docNro: string;
  condicionIvaReceptorId: number; // 1 RI, 4 Exento, 5 Consumidor final, 6 Monotributo
  impTotal: number;
  impNeto: number;
  impIva: number;
  iva: { id: number; baseImp: number; importe: number }[];
  date?: string; // yyyymmdd
}

const money = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

const todayArgentina = () => {
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
};

export const feAuthorizeInvoice = async (ta: AccessTicket, r: InvoiceRequest) => {
  const last = await feLastVoucher(ta, r.ptoVta, r.cbteTipo);
  const next = last.number + 1;
  const date = r.date || todayArgentina();
  const ivaXml =
    r.cbteTipo === 11 || r.iva.length === 0
      ? ''
      : `<ar:Iva>${r.iva
          .map(a => `<ar:AlicIva><ar:Id>${a.id}</ar:Id><ar:BaseImp>${money(a.baseImp)}</ar:BaseImp><ar:Importe>${money(a.importe)}</ar:Importe></ar:AlicIva>`)
          .join('')}</ar:Iva>`;
  const det = `<ar:FECAEDetRequest><ar:Concepto>1</ar:Concepto><ar:DocTipo>${r.docTipo}</ar:DocTipo><ar:DocNro>${cleanCuit(r.docNro) || '0'}</ar:DocNro><ar:CbteDesde>${next}</ar:CbteDesde><ar:CbteHasta>${next}</ar:CbteHasta><ar:CbteFch>${date}</ar:CbteFch><ar:ImpTotal>${money(r.impTotal)}</ar:ImpTotal><ar:ImpTotConc>0.00</ar:ImpTotConc><ar:ImpNeto>${money(r.impNeto)}</ar:ImpNeto><ar:ImpOpEx>0.00</ar:ImpOpEx><ar:ImpTrib>0.00</ar:ImpTrib><ar:ImpIVA>${money(r.impIva)}</ar:ImpIVA><ar:MonId>PES</ar:MonId><ar:MonCotiz>1</ar:MonCotiz><ar:CondicionIVAReceptorId>${r.condicionIvaReceptorId}</ar:CondicionIVAReceptorId>${ivaXml}</ar:FECAEDetRequest>`;
  const inner = `${authXml(ta)}<ar:FeCAEReq><ar:FeCabReq><ar:CantReg>1</ar:CantReg><ar:PtoVta>${r.ptoVta}</ar:PtoVta><ar:CbteTipo>${r.cbteTipo}</ar:CbteTipo></ar:FeCabReq><ar:FeDetReq>${det}</ar:FeDetReq></ar:FeCAEReq>`;
  const xml = await wsfeCall(ta.env, 'FECAESolicitar', inner);
  const detResp = tag(xml, 'FECAEDetResponse') || '';
  const result = tag(detResp, 'Resultado') || tag(xml, 'Resultado');
  const observations = tags(tag(detResp, 'Observaciones') || '', 'Obs').map(o => `${tag(o, 'Code')}: ${xmlUnescape(tag(o, 'Msg') || '')}`);
  const errors = collectErrors(xml);
  const cae = tag(detResp, 'CAE');
  if (result !== 'A' || !cae) {
    throw new ArcaError('rejected', `ARCA rechazó la factura. ${[...errors, ...observations].join(' | ') || 'Sin detalle.'}`);
  }
  const vto = tag(detResp, 'CAEFchVto') || '';
  return {
    cae,
    caeVto: vto ? `${vto.slice(0, 4)}-${vto.slice(4, 6)}-${vto.slice(6, 8)}` : '',
    number: next,
    date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    observations
  };
};



// ---------- Endpoint HTTP: POST /api/arca { action, ... } ----------
const readTicket = (taEnc: string | undefined, env: ArcaEnv, cuit: string): AccessTicket | null => {
  if (!taEnc) return null;
  try {
    const ta = JSON.parse(decryptSecret(taEnc)) as AccessTicket;
    return isTicketValid(ta, env, cuit) ? ta : null;
  } catch {
    return null;
  }
};

const getTicket = async (b: any) => {
  const env: ArcaEnv = b.env === 'produccion' ? 'produccion' : 'homologacion';
  const cuit = cleanCuit(b.cuit);
  if (!isValidCuit(cuit)) throw new ArcaError('bad_cuit', 'El CUIT configurado no es válido.');
  if (!b.keyEnc || !b.certPem) throw new ArcaError('not_configured', 'Falta cargar el certificado de ARCA en la configuración.');
  const cached = readTicket(b.taEnc, env, cuit);
  if (cached) return { ta: cached, taEnc: b.taEnc as string, renewed: false };
  const ta = await loginWsaa(env, cuit, b.certPem, decryptSecret(b.keyEnc));
  return { ta, taEnc: encryptSecret(JSON.stringify(ta)), renewed: true };
};

const VOUCHER_TYPES: Record<string, number> = { A: 1, B: 6, C: 11 };

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Usar POST' });
    return;
  }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  try {
    switch (b.action) {
      case 'status': {
        // Para el asistente: confirma que el servidor está listo
        getSecretKey();
        res.json({ ok: true });
        return;
      }
      case 'generate_csr': {
        const { keyPem, csrPem } = generateKeyAndCsr(b.cuit, b.companyName, b.alias);
        res.json({ ok: true, csrPem, keyEnc: encryptSecret(keyPem) });
        return;
      }
      case 'import_key': {
        parseKey(b.keyPem);
        res.json({ ok: true, keyEnc: encryptSecret(normalizePem(b.keyPem)) });
        return;
      }
      case 'inspect_cert': {
        const info = inspectCertificate(b.certPem, b.keyEnc ? decryptSecret(b.keyEnc) : undefined);
        res.json({ ok: true, info });
        return;
      }
      case 'test': {
        const env: ArcaEnv = b.env === 'produccion' ? 'produccion' : 'homologacion';
        const checks: { step: string; ok: boolean; detail: string }[] = [];
        const dummy = await feDummy(env);
        const serversOk = dummy.app === 'OK' && dummy.db === 'OK' && dummy.auth === 'OK';
        checks.push({ step: 'Servidores de ARCA', ok: serversOk, detail: `App ${dummy.app} · Base ${dummy.db} · Auth ${dummy.auth}` });
        const cert = inspectCertificate(b.certPem, decryptSecret(b.keyEnc));
        const certOk = !!cert.matchesKey && new Date(cert.notAfter).getTime() > Date.now();
        checks.push({
          step: 'Certificado',
          ok: certOk,
          detail: !cert.matchesKey
            ? 'El certificado no corresponde a la clave generada.'
            : `Vence el ${new Date(cert.notAfter).toLocaleDateString('es-AR')}${cert.cuit && cert.cuit !== cleanCuit(b.cuit) ? ` · ¡Atención! es del CUIT ${cert.cuit}` : ''}`
        });
        const { ta, taEnc } = await getTicket(b);
        checks.push({ step: 'Autenticación (WSAA)', ok: true, detail: `Ticket válido hasta ${new Date(ta.expirationTime).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}` });
        const ptoVta = Number(b.ptoVta) || 1;
        const types = b.taxCondition === 'monotributo' ? ['C'] : ['A', 'B'];
        const last: Record<string, number> = {};
        for (const t of types) {
          const r = await feLastVoucher(ta, ptoVta, VOUCHER_TYPES[t]);
          last[t] = r.number;
        }
        checks.push({
          step: `Punto de venta ${ptoVta}`,
          ok: true,
          detail: types.map(t => `Último Factura ${t}: ${last[t]}`).join(' · ')
        });
        if (env === 'produccion') {
          const pv = await fePointsOfSale(ta);
          const found = pv.list.find(p => p.number === ptoVta);
          checks.push({
            step: 'Punto de venta habilitado',
            ok: !!found && !found.blocked && !found.deletedAt,
            detail: found
              ? `${found.type}${found.blocked ? ' · BLOQUEADO' : ''}${found.deletedAt ? ` · dado de baja ${found.deletedAt}` : ''}`
              : `El punto de venta ${ptoVta} no está dado de alta para Web Services. Habilitados: ${pv.list.map(p => p.number).join(', ') || 'ninguno'}`
          });
        }
        res.json({ ok: checks.every(c => c.ok), checks, taEnc, lastNumbers: last });
        return;
      }
      case 'invoice': {
        const { ta, taEnc } = await getTicket(b);
        const result = await feAuthorizeInvoice(ta, b.invoice as InvoiceRequest);
        res.json({ ok: true, ...result, taEnc });
        return;
      }
      default:
        res.status(400).json({ ok: false, error: 'Acción desconocida' });
    }
  } catch (err: any) {
    const code = err instanceof ArcaError ? err.code : 'internal';
    const status = code === 'missing_secret' || code === 'internal' ? 500 : 400;
    res.status(status).json({ ok: false, code, error: err?.message || 'Error inesperado' });
  }
}
