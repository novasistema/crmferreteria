import jsPDF from 'jspdf';
import { Customer, FinancialTransaction, CompanyConfig, SalesOrder } from '../types';

export interface PaymentReceiptData {
  receiptNumber: string;
  date: string;
  customer: Customer;
  amount: number;
  paymentMethod: FinancialTransaction['paymentMethod'];
  concept: string;
  bankOrCheckInfo?: string;
  previousBalance: number;
  newBalance: number;
  allocatedOrderNumbers?: string[];
  notes?: string;
}

/**
 * Generates an official Colorear Pinturas payment receipt PDF and downloads it
 */
export function generatePaymentReceiptPDF(receipt: PaymentReceiptData, config?: CompanyConfig | null) {
  const doc = new jsPDF();
  const dateFormatted = new Date(receipt.date).toLocaleDateString('es-AR');
  const companyName = config?.companyName || 'Colorear Pinturas S.R.L.';
  const tradeName = config?.tradeName || 'Colorear PINTURAS';
  const cuit = config?.cuit || '30-71489234-8';
  const fiscalAddress = config?.fiscalAddress || 'Parque Industrial Pilar, Buenos Aires';
  const phone = config?.phone || '+54 11 4890-7000';

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

  // 2. Header banner (Colorear brand red)
  doc.setFillColor(211, 22, 39);
  doc.rect(0, 4, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COLOREAR PINTURAS', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fábrica de Pinturas, Esmaltes, Impermeabilizantes & Revestimientos', 14, 23);

  // Receipt box in header
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(140, 8, 56, 18, 2, 2, 'F');
  doc.setTextColor(211, 22, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RECIBO OFICIAL DE COBRANZA', 142, 14);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text(receipt.receiptNumber, 142, 22);

  // 3. Issuer details box
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${companyName} | CUIT: ${cuit}`, 14, 37);
  doc.text(`Planta Industrial: ${fiscalAddress} | Tel: ${phone}`, 14, 42);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 46, 196, 46);

  // 4. Customer Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 182, 34, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 50, 182, 34, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DATOS DEL CLIENTE / RECEPTOR', 18, 57);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Cliente: ${receipt.customer.businessName}`, 18, 64);
  doc.text(`CUIT / DNI: ${receipt.customer.taxId}`, 18, 70);
  doc.text(`Condición Fiscal: ${receipt.customer.taxCategory.toUpperCase().replace('_', ' ')}`, 18, 76);

  doc.text(`Fecha de Cobranza: ${dateFormatted}`, 120, 64);
  doc.text(`Localidad: ${receipt.customer.city || 'Buenos Aires'}, ${receipt.customer.province || 'Bs.As.'}`, 120, 70);
  doc.text(`Teléfono: ${receipt.customer.phone || 'S/D'}`, 120, 76);

  // 5. Payment details table
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 90, 182, 8, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONCEPTO / DETALLE DE IMPUTACIÓN', 18, 95);
  doc.text('MEDIO DE PAGO', 120, 95);
  doc.text('IMPORTE COBRADO', 192, 95, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(receipt.concept, 18, 105);

  const methodLabel = {
    transferencia: 'Transferencia Bancaria',
    echeq: 'E-Cheq',
    cheque: 'Cheque Físico',
    efectivo: 'Efectivo en Mostrador'
  }[receipt.paymentMethod] || receipt.paymentMethod;

  doc.text(methodLabel, 120, 105);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`$ ${receipt.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 192, 105, { align: 'right' });

  // Additional payment reference if provided
  if (receipt.bankOrCheckInfo) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Referencia / Banco: ${receipt.bankOrCheckInfo}`, 18, 112);
  }

  // Allocated orders
  if (receipt.allocatedOrderNumbers && receipt.allocatedOrderNumbers.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Imputado a los pedidos: ${receipt.allocatedOrderNumbers.join(', ')}`, 18, 118);
  }

  // 6. Current Account Balance Summary Box
  const summaryY = 130;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(110, summaryY, 86, 38, 2, 2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(110, summaryY, 86, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Saldo Anterior Cta. Cte.:', 114, summaryY + 8);
  doc.setFont('helvetica', 'bold');
  doc.text(`$ ${receipt.previousBalance.toLocaleString('es-AR')}`, 192, summaryY + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Pago Recibido en este acto (-):', 114, summaryY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`$ ${receipt.amount.toLocaleString('es-AR')}`, 192, summaryY + 16, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(114, summaryY + 22, 192, summaryY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(receipt.newBalance > 0 ? 220 : 16, receipt.newBalance > 0 ? 38 : 185, receipt.newBalance > 0 ? 38 : 129);
  doc.text('Saldo Pendiente Actualizado:', 114, summaryY + 30);
  doc.text(`$ ${receipt.newBalance.toLocaleString('es-AR')}`, 192, summaryY + 30, { align: 'right' });

  // 7. Signature & Stamp Lines
  const signatureY = 210;
  doc.setDrawColor(148, 163, 184);
  doc.line(24, signatureY, 84, signatureY);
  doc.line(126, signatureY, 186, signatureY);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma y Sello de Administración / Tesorería', 54, signatureY + 5, { align: 'center' });
  doc.text('Colorear Pinturas S.R.L.', 54, signatureY + 9, { align: 'center' });

  doc.text('Conforme Cliente / Pagador', 156, signatureY + 5, { align: 'center' });
  doc.text(receipt.customer.businessName, 156, signatureY + 9, { align: 'center' });

  // 8. Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Este comprobante acredita la recepción conforme de los fondos especificados para imputación en cuenta corriente.', 14, 275);
  doc.text(`Generado electrónicamente por el Sistema de Gestión Colorear Pinturas el ${new Date().toLocaleString('es-AR')}`, 14, 280);

  // Save PDF
  const cleanNum = receipt.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Recibo_Cobranza_${cleanNum}_${receipt.customer.taxId}.pdf`);
}

/**
 * Builds a structured WhatsApp message to send the receipt details directly to the customer
 */
export function buildWhatsAppReceiptMessage(receipt: PaymentReceiptData, config?: CompanyConfig | null): string {
  const companyName = config?.companyName || 'Colorear Pinturas S.R.L.';
  const dateStr = new Date(receipt.date).toLocaleDateString('es-AR');

  return (
    `*RECIBO OFICIAL DE COBRANZA - ${companyName}*\n\n` +
    `Estimado/a *${receipt.customer.businessName}*,\n` +
    `Confirmamos la recepción de su pago con fecha ${dateStr}.\n\n` +
    `📄 *Nº Recibo:* ${receipt.receiptNumber}\n` +
    `💰 *Importe Recibido:* $ ${receipt.amount.toLocaleString('es-AR')}\n` +
    `💳 *Medio de Pago:* ${receipt.paymentMethod.toUpperCase()}\n` +
    (receipt.bankOrCheckInfo ? `🏦 *Detalle / Ref:* ${receipt.bankOrCheckInfo}\n` : '') +
    `📌 *Concepto:* ${receipt.concept}\n\n` +
    `📊 *Estado de Cuenta Actualizado:*\n` +
    `• Saldo Anterior: $ ${receipt.previousBalance.toLocaleString('es-AR')}\n` +
    `• Pago Imputado: -$ ${receipt.amount.toLocaleString('es-AR')}\n` +
    `• *Saldo Pendiente Actual: $ ${receipt.newBalance.toLocaleString('es-AR')}*\n\n` +
    `Muchas gracias por confiar en Colorear Pinturas. Cualquier consulta administrativa estamos a su disposición.`
  );
}
