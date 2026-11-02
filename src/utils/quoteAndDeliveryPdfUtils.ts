import jsPDF from 'jspdf';
import { Quote, DeliveryOrder, CompanyConfig } from '../types';

/**
 * Presupuesto en formato comprobante "X" (A4, ORIGINAL + DUPLICADO) con IVA discriminado:
 * precios unitarios sin IVA, subtotal neto, IVA e importe total.
 */
const TAX_LABEL: Record<string, string> = {
  responsable_inscripto: 'Responsable Inscripto',
  monotributo: 'Monotributo',
  consumidor_final: 'Consumidor Final',
  exento: 'Exento'
};

const ar = (n: number) => (Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const arDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

// Suma litros o kilos a partir de la presentación ("4 LTS", "1 LT", "20 kg", "500 ml")
const presentationQty = (text: string): number => {
  const m = /(\d+(?:[.,]\d+)?)\s*(lts?|l\b|litros?|kg|kgs|kilos?|ml|cc|gr|g\b)/i.exec(text || '');
  if (!m) return 0;
  const n = Number(m[1].replace(',', '.'));
  const u = m[2].toLowerCase();
  if (u === 'ml' || u === 'cc' || u === 'gr' || u === 'g') return n / 1000;
  return n;
};

export function generateQuotePDF(quote: Quote, config?: CompanyConfig | null) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 10; // margen
  const R = W - M;
  const companyName = config?.companyName || config?.tradeName || 'Empresa';
  const emitterTax = config?.taxSettings?.ivaCondition || config?.arcaTaxCondition || 'responsable_inscripto';
  const iibb = config?.taxSettings?.iibbNumber || config?.grossIncomeNumber || '';
  const quoteNumber = (quote.quoteNumber || '').replace(/^PRES-\d{4}-/, '').padStart(8, '0');

  // Importes: neto después de descuentos, IVA y total
  const lineNet = quote.items.reduce((a, it) => a + (Number(it.subtotal) || 0), 0);
  const discountAmount = quote.discountAmount ?? (lineNet * (quote.discountPercentage || 0)) / 100;
  const net = Math.max(0, lineNet - discountAmount);
  const tax = Number(quote.taxAmount) || 0;
  const total = Number(quote.total) || net + tax;
  const effectiveRate = net > 0 ? tax / net : 0;
  const totalQty = quote.items.reduce((a, it) => a + presentationQty(`${it.presentation} ${it.productName}`) * (Number(it.quantity) || 0), 0);

  const label = (x: number, y: number, title: string, value: string, size = 9) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.text(title, x, y);
    const w = doc.getTextWidth(title);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', x + w + 1.2, y);
  };

  const drawPage = (copy: string) => {
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // --- Banda ORIGINAL / DUPLICADO ---
    doc.rect(M, 10, W - 2 * M, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(copy, W / 2, 16.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1 / 1', R - 3, 15.5, { align: 'right' });

    // --- Cabecera emisor ---
    const top = 19;
    const headH = 47;
    doc.rect(M, top, W - 2 * M, headH);
    doc.line(W / 2, top + 14, W / 2, top + headH);
    // Recuadro X
    doc.rect(W / 2 - 8, top, 16, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('X', W / 2, top + 9.5, { align: 'center' });

    // Logo o nombre
    let nameY = top + 13;
    if (config?.logoUrl && /^data:image\/(png|jpe?g)/i.test(config.logoUrl)) {
      try {
        doc.addImage(config.logoUrl, config.logoUrl.includes('png') ? 'PNG' : 'JPEG', M + 4, top + 3, 30, 14);
        nameY = top + 13;
      } catch {
        /* sin logo */
      }
    }
    doc.setFontSize(companyName.length > 22 ? 14 : 18);
    doc.text(companyName, W / 4 + 2, nameY, { align: 'center', maxWidth: W / 2 - 24 });

    doc.setFontSize(18);
    doc.text('PRESUPUESTO', (W * 3) / 4 + 2, top + 7.5, { align: 'center' });
    label((W * 3) / 4 - 21, top + 13, 'Fecha de Emisión:', arDate(quote.date), 9);

    const ly = top + 26;
    label(M + 2, ly, 'Razón Social:', companyName);
    label(M + 2, ly + 5.5, 'Domicilio:', config?.fiscalAddress || '');
    label(M + 2, ly + 11, 'Teléfono:', config?.phone || '');
    label(M + 2, ly + 16.5, 'Email:', config?.email || '');

    const rx = W / 2 + 3;
    label(rx, top + 20, 'Comp. Nro:', quoteNumber);
    label(rx, top + 25.5, 'Condición IVA:', TAX_LABEL[emitterTax] || emitterTax);
    label(rx, top + 31, 'CUIT:', (config?.cuit || '').replace(/\D/g, ''));
    label(rx, top + 36.5, 'Ingresos Brutos:', iibb);
    label(rx, top + 42, 'Fecha de Inicio de Actividades:', arDate(config?.activityStartDate));

    // --- Cliente ---
    const cy = top + headH;
    const cliH = 21;
    doc.rect(M, cy, W - 2 * M, cliH);
    const address = [quote.customerAddress, quote.customerCity].filter(Boolean).join(' - ');
    label(M + 2, cy + 6, 'Cliente:', quote.customerName || '');
    label(M + 2, cy + 11.5, 'Domicilio:', address);
    label(M + 2, cy + 17, 'Condición IVA:', TAX_LABEL[quote.customerTaxCategory || ''] || '');
    const cx = 138;
    label(cx, cy + 6, 'CUIT:', (quote.customerTaxId || '').replace(/\D/g, '').replace(/^0+$/, ''));
    label(cx, cy + 11.5, 'Teléfono:', quote.customerPhone || '');
    label(cx, cy + 17, 'Cond. Venta:', quote.paymentCondition || '-');

    // --- Tabla de productos ---
    const cols = [
      { t: 'Código', x: M, w: 23, a: 'left' as const },
      { t: 'Producto', x: M + 23, w: 85, a: 'left' as const },
      { t: 'Cantidad', x: M + 108, w: 16, a: 'right' as const },
      { t: 'Precio Unit.', x: M + 124, w: 22, a: 'right' as const },
      { t: '% Des/Rec', x: M + 146, w: 14, a: 'right' as const },
      { t: 'Subtotal', x: M + 160, w: 30, a: 'right' as const }
    ];
    let ty = cy + cliH + 4;
    doc.setFillColor(200, 200, 200);
    doc.rect(M, ty, W - 2 * M, 5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    cols.forEach(c => doc.text(c.t, c.x + c.w / 2, ty + 3.5, { align: 'center' }));
    ty += 5;

    const tableBottomLimit = 228;
    doc.setFontSize(7.5);
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.1);
    quote.items.forEach(it => {
      if (ty > tableBottomLimit) return;
      const rate = it.ivaRate !== undefined ? it.ivaRate / 100 : effectiveRate;
      const withIva = (Number(it.subtotal) || 0) * (1 + rate);
      const name = doc.splitTextToSize(`${it.productName}`.toUpperCase(), cols[1].w - 2) as string[];
      const h = Math.max(4.5, name.length * 3.4 + 1.2);
      const vals = [
        it.code || '',
        '',
        ar(it.quantity),
        `$ ${ar(it.unitPrice)}`,
        ar(it.discount || 0),
        `$ ${ar(withIva)}`
      ];
      cols.forEach((c, i) => {
        doc.rect(c.x, ty, c.w, h);
        if (i === 1) doc.text(name, c.x + 1, ty + 3.2);
        else doc.text(vals[i], c.a === 'right' ? c.x + c.w - 1 : c.x + 1, ty + 3.2, { align: c.a });
      });
      ty += h;
    });
    if (quote.items.length && ty > tableBottomLimit) {
      doc.setFont('helvetica', 'italic');
      doc.text('… (continúa: el detalle completo está en el sistema)', M + 1, ty + 4);
    }
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    if (totalQty > 0) {
      label(R - 22, ty + 12, 'Total KG/L :', ` ${ar(totalQty)}`, 7.5);
    }
    if (quote.validUntil) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Válido hasta el ${arDate(quote.validUntil)}`, M + 1, ty + 12);
    }

    // --- Pie: saldo, observaciones, totales ---
    const fy = 236;
    const split = 136;
    doc.rect(M, fy, W - 2 * M, 41);
    doc.line(split, fy, split, fy + 41);
    doc.line(M, fy + 8, R, fy + 8);
    doc.line(M, fy + 25, R, fy + 25);

    doc.setFontSize(7);
    const under = (x: number, y: number, t: string) => {
      doc.setFont('helvetica', 'normal');
      doc.text(t, x, y);
      doc.line(x, y + 0.6, x + doc.getTextWidth(t), y + 0.6);
    };
    if (quote.customerBalance !== undefined) {
      under(M + 1, fy + 5, `Saldo al ${arDate(quote.date)}:`);
      doc.setFont('helvetica', 'bold');
      doc.text(`$ ${ar(quote.customerBalance)}`, M + 30, fy + 5);
    }
    if (quote.sellerName) {
      under(M + 72, fy + 5, 'Vendedor:');
      doc.setFont('helvetica', 'normal');
      doc.text(` ${quote.sellerName}`, M + 72 + doc.getTextWidth('Vendedor:'), fy + 5);
    }
    under(M + 1, fy + 12, 'Observaciones:');
    doc.setFont('helvetica', 'normal');
    const obs = [
      ...(quote.notes ? [quote.notes] : []),
      tax > 0 ? `PRECIOS UNITARIOS SIN IVA. IVA DISCRIMINADO ${Math.round(effectiveRate * 1000) / 10}%` : 'LOS PRECIOS NO INCLUYEN IVA'
    ];
    doc.text(doc.splitTextToSize(obs.join(' · '), split - M - 3) as string[], M + 1, fy + 16);
    under(M + 1, fy + 29, 'Remito/s:');

    const lx = R - 30;
    const vx = R - 1.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Descuento ${ar(quote.discountPercentage || 0)} % : $`, lx, fy + 5.5, { align: 'right' });
    doc.text(ar(discountAmount), vx, fy + 5.5, { align: 'right' });
    doc.text('Subtotal : $', lx, fy + 14, { align: 'right' });
    doc.text(ar(net), vx, fy + 14, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('IVA : $', lx, fy + 21, { align: 'right' });
    doc.setFontSize(10);
    doc.text(ar(tax), vx, fy + 21, { align: 'right' });
    doc.setFontSize(11);
    doc.text('Importe Total : $', lx, fy + 32, { align: 'right' });
    doc.setFontSize(10);
    doc.text(ar(total), vx, fy + 32, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('DOCUMENTO NO VALIDO COMO FACTURA', W / 2, fy + 47, { align: 'center' });
  };

  drawPage('ORIGINAL');
  doc.addPage();
  drawPage('DUPLICADO');

  doc.save(`Presupuesto_${quoteNumber}_${(quote.customerName || 'cliente').replace(/[^\w]+/g, '_').slice(0, 40)}.pdf`);
}

/**
 * Generates an official Colorear Pinturas Remito de Entrega / Despacho (Documento No Válido Como Factura)
 */
export function generateRemitoPDF(remito: DeliveryOrder, config?: CompanyConfig | null) {
  const doc = new jsPDF();
  const dateFormatted = new Date(remito.date).toLocaleDateString('es-AR');
  const companyName = config?.companyName || 'Colorear Pinturas S.R.L.';
  const tradeName = config?.tradeName || 'Colorear PINTURAS';
  const cuit = config?.cuit || '30-71489234-8';
  const fiscalAddress = config?.fiscalAddress || 'Parque Industrial Pilar, Buenos Aires';
  const phone = config?.phone || '+54 11 4890-7000';

  // 1. Rainbow brand top strip
  const colors = [
    [75, 0, 130],
    [0, 51, 153],
    [0, 153, 204],
    [0, 180, 50],
    [245, 200, 0],
    [255, 120, 0],
    [211, 22, 39]
  ];
  const stripWidth = 210 / colors.length;
  colors.forEach((col, idx) => {
    doc.setFillColor(col[0], col[1], col[2]);
    doc.rect(idx * stripWidth, 0, stripWidth, 4, 'F');
  });

  // 2. Header banner (Emerald green for Remitos de Despacho)
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 4, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COLOREAR PINTURAS', 14, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Fábrica de Pinturas, Esmaltes, Impermeabilizantes & Revestimientos', 14, 23);

  // Remito box in header
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(125, 8, 71, 18, 2, 2, 'F');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REMITO DE SALIDA (R)', 128, 14);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.text(remito.deliveryNumber, 128, 22);

  // Disclaimer: Documento No Válido Como Factura
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENTO NO VÁLIDO COMO FACTURA - TRASLADO DE MERCADERÍA', 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Razón Social: ${companyName} | CUIT: ${cuit}`, 14, 40);
  doc.text(`Planta Industrial: ${fiscalAddress} | Tel: ${phone}`, 14, 44);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 47, 196, 47);

  // 4. Customer Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 182, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 50, 182, 26, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DEL DESTINATARIO / ENTREGA', 18, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Cliente: ${remito.customerName}`, 18, 63);
  doc.text(`Dirección Entrega: ${remito.customerAddress || 'Retiro en Planta'}`, 18, 70);

  doc.text(`Fecha Despacho: ${dateFormatted}`, 120, 63);
  if (remito.salesOrderNumber) {
    doc.text(`Ref. Pedido / Factura: ${remito.salesOrderNumber}`, 120, 70);
  }

  // 5. Transport & Driver Details Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 78, 182, 20, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 78, 182, 20, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATOS DEL TRANSPORTE, CHOFER & VEHÍCULO', 18, 84);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Transporte: ${remito.transportName || 'Propio de Fábrica'}`, 18, 91);
  doc.text(`Chofer: ${remito.driverName || 'Depósito'}`, 18, 96);

  doc.text(`Vehículo / Patente / DNI: ${remito.driverDniOrPlate || 'S/D'}`, 110, 91);
  doc.text(`Receptor en Obra: ${remito.receiverName || remito.customerName} ${remito.receiverDni ? `(DNI: ${remito.receiverDni})` : ''}`, 110, 96);

  // 6. Products Table Header
  let startY = 101;
  doc.setFillColor(5, 150, 105);
  doc.rect(14, startY, 182, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CÓDIGO', 16, startY + 5);
  doc.text('DESCRIPCIÓN DE LA PINTURA / PRODUCTO', 45, startY + 5);
  doc.text('ENVASE', 115, startY + 5);
  doc.text('LOTE / PARTIDA', 145, startY + 5);
  doc.text('CANTIDAD', 178, startY + 5);

  // 7. Products Table Rows
  startY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  let totalPackages = 0;

  remito.items.forEach((it, idx) => {
    const isAlt = idx % 2 === 1;
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 6, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(it.code || 'S/C', 16, startY + 4.5);
    const descText = it.productName.length > 42 ? it.productName.substring(0, 40) + '...' : it.productName;
    doc.text(descText, 45, startY + 4.5);
    doc.text(it.presentation || it.unit || 'Balde 20L', 115, startY + 4.5);
    
    const batchPartida = `${it.batchNumber || 'L-OFICIAL'}${it.partidaNumber ? ` / ${it.partidaNumber}` : ''}`;
    doc.text(batchPartida, 145, startY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`${it.quantity} un`, 180, startY + 4.5);
    doc.setFont('helvetica', 'normal');

    totalPackages += it.quantity;

    doc.setDrawColor(241, 245, 249);
    doc.line(14, startY + 6, 196, startY + 6);
    startY += 6;
  });

  // Table border
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 101, 182, startY - 101, 'S');

  // Total Bultos banner
  startY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, startY, 182, 8, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`TOTAL DE BULTOS / ENVASES ENTREGADOS: ${totalPackages} UNIDADES`, 18, startY + 5.5);

  if (remito.notes) {
    startY += 10;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Observaciones de carga: ${remito.notes}`, 14, startY + 4);
  }

  // 8. Signatures Block: Chofer & Receptor
  const sigY = 220;
  doc.setDrawColor(148, 163, 184);

  // Driver signature
  doc.line(20, sigY, 90, sigY);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma y Aclaración Chofer / Transportista', 22, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Entregó mercadería conforme en origen', 22, sigY + 9);

  // Receiver signature
  doc.line(120, sigY, 190, sigY);
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma, Aclaración y DNI de Quien Recibe', 122, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Recibí conforme mercadería en destino / obra', 122, sigY + 9);

  doc.save(`Remito_${remito.deliveryNumber}.pdf`);
}
