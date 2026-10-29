import jsPDF from 'jspdf';
import { Quote, DeliveryOrder, CompanyConfig } from '../types';

/**
 * Generates an official Colorear Pinturas Presupuesto / Cotización Comercial PDF
 */
export function generateQuotePDF(quote: Quote, config?: CompanyConfig | null) {
  const doc = new jsPDF();
  const dateFormatted = new Date(quote.date).toLocaleDateString('es-AR');
  const validUntilFormatted = new Date(quote.validUntil).toLocaleDateString('es-AR');
  const companyName = config?.companyName || 'Colorear Pinturas S.R.L.';
  const tradeName = config?.tradeName || 'Colorear PINTURAS';
  const cuit = config?.cuit || '30-71489234-8';
  const fiscalAddress = config?.fiscalAddress || 'Parque Industrial Pilar, Buenos Aires';
  const phone = config?.phone || '+54 11 4890-7000';
  const email = config?.email || 'ventas@colorearpinturas.com.ar';

  // 1. Rainbow brand top strip
  const colors = [
    [75, 0, 130],   // purple
    [0, 51, 153],   // navy
    [0, 153, 204],  // cyan
    [0, 180, 50],   // green
    [245, 200, 0],  // yellow
    [255, 120, 0],  // orange
    [211, 22, 39]   // red
  ];
  const stripWidth = 210 / colors.length;
  colors.forEach((col, idx) => {
    doc.setFillColor(col[0], col[1], col[2]);
    doc.rect(idx * stripWidth, 0, stripWidth, 4, 'F');
  });

  // 2. Header banner (Navy blue for Presupuestos)
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 4, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COLOREAR PINTURAS', 14, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Fábrica de Pinturas, Esmaltes, Impermeabilizantes & Revestimientos', 14, 23);

  // Quote box in header
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(136, 8, 60, 18, 2, 2, 'F');
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PRESUPUESTO / COTIZACIÓN', 139, 14);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.text(quote.quoteNumber, 139, 22);

  // 3. Issuer details box
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${companyName} | CUIT: ${cuit}`, 14, 36);
  doc.text(`Planta Industrial: ${fiscalAddress} | Tel: ${phone} | Email: ${email}`, 14, 41);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 45, 196, 45);

  // 4. Customer Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 48, 182, 30, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 48, 182, 30, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESTINATARIO DEL PRESUPUESTO', 18, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Cliente / Empresa: ${quote.customerName}`, 18, 62);
  doc.text(`CUIT / DNI: ${quote.customerTaxId || 'Consumidor Final'}`, 18, 68);
  doc.text(`Dirección: ${quote.customerAddress || 'A coordinar'}`, 18, 74);

  doc.text(`Fecha Emisión: ${dateFormatted}`, 120, 62);
  doc.text(`Válido Hasta: ${validUntilFormatted}`, 120, 68);
  doc.text(`Condición Pago: ${quote.paymentCondition || 'Efectivo / Contado'}`, 120, 74);

  // 5. Products Table Header
  let startY = 84;
  doc.setFillColor(30, 58, 138);
  doc.rect(14, startY, 182, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CÓDIGO', 16, startY + 5);
  doc.text('DESCRIPCIÓN DEL PRODUCTO', 45, startY + 5);
  doc.text('CANT', 115, startY + 5);
  doc.text('UNIDAD', 130, startY + 5);
  doc.text('PRECIO UNIT', 152, startY + 5);
  doc.text('BONIF', 172, startY + 5);
  doc.text('SUBTOTAL', 184, startY + 5);

  // 6. Products Table Rows
  startY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  quote.items.forEach((it, idx) => {
    const isAlt = idx % 2 === 1;
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, startY, 182, 6, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(it.code || 'S/C', 16, startY + 4.5);
    const descText = it.productName.length > 40 ? it.productName.substring(0, 38) + '...' : it.productName;
    doc.text(descText, 45, startY + 4.5);
    doc.text(String(it.quantity), 117, startY + 4.5);
    doc.text(it.presentation || it.unit || 'un', 130, startY + 4.5);
    doc.text(`$${it.unitPrice.toLocaleString('es-AR')}`, 152, startY + 4.5);
    doc.text(it.discount > 0 ? `${it.discount}%` : '-', 173, startY + 4.5);
    doc.text(`$${it.subtotal.toLocaleString('es-AR')}`, 184, startY + 4.5);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, startY + 6, 196, startY + 6);
    startY += 6;
  });

  // Table border
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 84, 182, startY - 84, 'S');

  // 7. Totals & Notes Section
  startY += 5;
  const totalsBoxY = startY;

  // Notes & terms box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, totalsBoxY, 110, 36, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, totalsBoxY, 110, 36, 2, 2, 'S');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONDICIONES COMERCIALES & OBSERVACIONES', 18, totalsBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('• Precios sujetos a variación luego de la fecha de validez indicada.', 18, totalsBoxY + 14);
  doc.text('• Entrega en fábrica o flete a convenir con la administración comercial.', 18, totalsBoxY + 20);
  doc.text('• Para confirmar este presupuesto, comunicarse a ventas@colorearpinturas.com.ar', 18, totalsBoxY + 26);
  if (quote.notes) {
    doc.text(`• Nota: ${quote.notes.substring(0, 60)}`, 18, totalsBoxY + 32);
  }

  // Totals Breakdown box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(128, totalsBoxY, 68, 36, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(128, totalsBoxY, 68, 36, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Neto:', 132, totalsBoxY + 8);
  doc.text(`$${quote.subtotal.toLocaleString('es-AR')}`, 172, totalsBoxY + 8);

  if (quote.discountPercentage > 0) {
    doc.text(`Bonif. Gral (${quote.discountPercentage}%):`, 132, totalsBoxY + 15);
    const discVal = Math.round(quote.subtotal * (quote.discountPercentage / 100));
    doc.text(`-$${discVal.toLocaleString('es-AR')}`, 172, totalsBoxY + 15);
  }

  if (quote.taxAmount > 0) {
    doc.text('IVA Estimado:', 132, totalsBoxY + 22);
    doc.text(`$${quote.taxAmount.toLocaleString('es-AR')}`, 172, totalsBoxY + 22);
  }

  // Grand Total banner
  doc.setFillColor(30, 58, 138);
  doc.rect(128, totalsBoxY + 27, 68, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL:', 132, totalsBoxY + 33.5);
  doc.text(`$${quote.total.toLocaleString('es-AR')}`, 162, totalsBoxY + 33.5);

  // Footer signature & seal
  const footerY = totalsBoxY + 48;
  doc.setDrawColor(203, 213, 225);
  doc.line(135, footerY + 12, 190, footerY + 12);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Departamento Comercial', 145, footerY + 16);
  doc.text('Colorear Pinturas S.R.L.', 146, footerY + 20);

  doc.save(`Presupuesto_${quote.quoteNumber}.pdf`);
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
