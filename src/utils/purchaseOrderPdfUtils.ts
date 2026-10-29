import jsPDF from 'jspdf';
import { PurchaseOrder, CompanyConfig, Supplier } from '../types';

/**
 * Generates an official Purchase Order PDF (Orden de Compra a Proveedor) and downloads it.
 */
export function generatePurchaseOrderPDF(
  order: PurchaseOrder, 
  config?: CompanyConfig | null,
  supplier?: Supplier | null
) {
  const doc = new jsPDF();
  const dateFormatted = order.date 
    ? new Date(order.date).toLocaleDateString('es-AR') 
    : new Date().toLocaleDateString('es-AR');

  const companyName = config?.companyName || 'Colorear Pinturas S.R.L.';
  const tradeName = config?.tradeName || 'Colorear PINTURAS';
  const cuit = config?.cuit || '30-71489234-8';
  const fiscalAddress = config?.fiscalAddress || 'Parque Industrial Pilar, Buenos Aires';
  const plantAddress = config?.plantAddress || 'Ruta 8 Km 58, Parque Industrial Pilar';
  const phone = config?.phone || '+54 11 4890-7000';
  const email = config?.email || 'compras@colorearpinturas.com';

  const supName = order.supplierName || supplier?.businessName || 'Proveedor';
  const supTaxId = order.supplierTaxId || supplier?.taxId || 'Sin CUIT';
  const supPhone = order.supplierPhone || supplier?.phone || '-';
  const supEmail = order.supplierEmail || supplier?.email || '-';
  const supContact = order.supplierContact || supplier?.name || '-';

  // 1. Brand top strip (Rainbow colors)
  const colors = ['#4b0082', '#003399', '#0099cc', '#33cc33', '#f5c800', '#ff7800', '#d31627'];
  const segmentWidth = 210 / colors.length;
  colors.forEach((col, idx) => {
    doc.setFillColor(col);
    doc.rect(idx * segmentWidth, 0, segmentWidth, 3, 'F');
  });

  // 2. Company Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(tradeName.toUpperCase(), 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`${companyName} | CUIT: ${cuit}`, 14, 21);
  doc.text(`Dirección Fiscal: ${fiscalAddress}`, 14, 26);
  doc.text(`Tel: ${phone} | Email: ${email}`, 14, 31);

  // 3. Document Type Box (Right Side)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(130, 8, 66, 26, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(130, 8, 66, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ORDEN DE COMPRA', 163, 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(order.orderNumber || 'OC-2026-0001', 163, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Fecha Emisión: ${dateFormatted}`, 163, 29, { align: 'center' });

  // 4. Supplier Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 182, 28, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('DATOS DEL PROVEEDOR', 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Razón Social: `, 18, 51);
  doc.setFont('helvetica', 'bold');
  doc.text(supName, 40, 51);

  doc.setFont('helvetica', 'normal');
  doc.text(`CUIT: ${supTaxId}`, 18, 57);
  doc.text(`Contacto: ${supContact}`, 18, 63);

  doc.text(`Teléfono / WhatsApp: ${supPhone}`, 110, 51);
  doc.text(`Email: ${supEmail}`, 110, 57);
  if (order.deliveryDate) {
    doc.text(`Fecha Entrega Solicitada: ${new Date(order.deliveryDate).toLocaleDateString('es-AR')}`, 110, 63);
  }

  // 5. Items Table Header
  let currentY = 73;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(14, currentY, 182, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('CÓD / SKU', 17, currentY + 5);
  doc.text('CÓD. PROV.', 45, currentY + 5);
  doc.text('DESCRIPCIÓN DE MERCADERÍA', 75, currentY + 5);
  doc.text('CANT.', 140, currentY + 5, { align: 'right' });
  doc.text('PRECIO REF.', 165, currentY + 5, { align: 'right' });
  doc.text('SUBTOTAL', 192, currentY + 5, { align: 'right' });

  currentY += 7;

  // 6. Items Table Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const items = order.items || [];
  items.forEach((item, index) => {
    // Page overflow check
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 6.5, 'F');
    }

    doc.setTextColor(51, 65, 85);
    const code = item.productCode || item.productId?.substring(0, 8) || '-';
    const provCode = item.supplierCode || '-';
    const desc = item.productName || item.rawMaterialName || 'Producto';
    const unitText = item.unit ? ` ${item.unit}` : '';

    doc.text(String(code).substring(0, 14), 17, currentY + 4.5);
    doc.text(String(provCode).substring(0, 14), 45, currentY + 4.5);
    doc.text(String(desc).substring(0, 42), 75, currentY + 4.5);
    doc.text(`${item.quantity}${unitText}`, 140, currentY + 4.5, { align: 'right' });
    doc.text(`$${Number(item.unitCost || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 165, currentY + 4.5, { align: 'right' });
    doc.text(`$${Number(item.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 192, currentY + 4.5, { align: 'right' });

    currentY += 6.5;
  });

  // Table bottom border
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, 196, currentY);
  currentY += 5;

  // 7. Totals & Notes section
  const totalY = Math.min(currentY, 240);

  // Notes Box (Left)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, totalY, 110, 32, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, totalY, 110, 32, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('LUGAR DE ENTREGA & CONDICIONES:', 18, totalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const deliveryPlace = order.deliveryAddress || plantAddress || fiscalAddress;
  doc.text(`Entrega en: ${deliveryPlace}`, 18, totalY + 12, { maxWidth: 102 });
  if (order.notes) {
    doc.text(`Observaciones: ${order.notes}`, 18, totalY + 20, { maxWidth: 102 });
  } else {
    doc.text('Acompañar la entrega con remito oficial y factura correspondiente.', 18, totalY + 20, { maxWidth: 102 });
  }

  // Totals Box (Right)
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(128, totalY, 68, 32, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(128, totalY, 68, 32, 1.5, 1.5, 'S');

  const subtotal = order.subtotalBeforeDiscount || order.total;
  const discountAmount = order.discountAmount || 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Estimado:', 132, totalY + 8);
  doc.text(`$${Number(subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 192, totalY + 8, { align: 'right' });

  if (discountAmount > 0) {
    doc.text(`Descuento (${order.discountPercentage || 0}%):`, 132, totalY + 15);
    doc.text(`-$${Number(discountAmount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 192, totalY + 15, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL ESTIMADO:', 132, totalY + 26);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(`$${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 192, totalY + 26, { align: 'right' });

  // 8. Footer signatures
  const footerY = 278;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento generado electrónicamente por el Sistema ERP & Gestión Fabril de Colorear Pinturas.', 105, footerY, { align: 'center' });

  // Save / Download PDF
  const filename = `OrdenDeCompra_${order.orderNumber || 'OC'}_${supName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Generates formatted text for WhatsApp dispatch
 */
export function buildPurchaseOrderWhatsAppMessage(
  order: PurchaseOrder,
  companyName: string = 'Colorear Pinturas'
): string {
  const itemsText = (order.items || [])
    .map((item, idx) => {
      const codeInfo = [
        item.productCode ? `SKU: ${item.productCode}` : '',
        item.supplierCode ? `Cód. Prov: ${item.supplierCode}` : ''
      ].filter(Boolean).join(' | ');

      const unitText = item.unit ? ` ${item.unit}` : ' u.';
      const unitCostText = item.unitCost ? ` | Ref: $${Number(item.unitCost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '';
      const subtotalText = item.subtotal ? `\n   *Subtotal:* $${Number(item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '';

      return `${idx + 1}️⃣ *${item.productName || item.rawMaterialName}*\n   ${codeInfo ? `• ${codeInfo}\n   ` : ''}• Cantidad: *${item.quantity}${unitText}*${unitCostText}${subtotalText}`;
    })
    .join('\n\n');

  const totalFormatted = `$${Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const dateFormatted = order.date ? new Date(order.date).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR');

  return `📦 *PEDIDO DE MERCADERÍA - ${companyName.toUpperCase()}*
📋 *Orden de Compra:* ${order.orderNumber}
📅 *Fecha:* ${dateFormatted}
👤 *Proveedor:* ${order.supplierName}

Hola, les hacemos llegar nuestro pedido de reposición:

${itemsText}

─────────────────────
💰 *TOTAL ESTIMADO:* ${totalFormatted}
${order.deliveryAddress ? `📍 *Lugar de Entrega:* ${order.deliveryAddress}\n` : ''}${order.notes ? `📝 *Observaciones:* ${order.notes}\n` : ''}
Rogamos confirmar recepción del pedido y fecha estimada de despacho.
¡Muchas gracias!`.trim();
}
