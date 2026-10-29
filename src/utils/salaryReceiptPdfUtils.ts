import jsPDF from 'jspdf';
import { Employee, SalaryPayment, CompanyConfig } from '../types';

/**
 * Generates an official DUPLICATE Salary / Advance Voucher PDF
 * (Both ORIGINAL for the employee and DUPLICADO for the company on the same page with cut line)
 */
export function generateSalaryDuplicateReceiptPDF(
  payment: SalaryPayment,
  employee: Employee,
  config?: CompanyConfig | null
) {
  const doc = new jsPDF();
  const companyName = config?.companyName || 'Colorear Pinturas S.R.L.';
  const cuit = config?.cuit || '30-71489234-8';
  const fiscalAddress = config?.fiscalAddress || 'Parque Industrial Pilar, Buenos Aires';
  const dateFormatted = new Date(payment.date).toLocaleDateString('es-AR');

  // Render a voucher block (used twice: top for ORIGINAL, bottom for DUPLICADO)
  const renderVoucherBlock = (startY: number, titleCopy: 'ORIGINAL - COPIA EMPLEADO' | 'DUPLICADO - COPIA EMPRESA') => {
    // Mini rainbow band
    const colors = [
      [75, 0, 130],
      [0, 51, 153],
      [0, 153, 204],
      [0, 180, 50],
      [245, 200, 0],
      [255, 120, 0],
      [211, 22, 39]
    ];
    const stripWidth = 182 / colors.length;
    colors.forEach((col, idx) => {
      doc.setFillColor(col[0], col[1], col[2]);
      doc.rect(14 + idx * stripWidth, startY, stripWidth, 2, 'F');
    });

    // Header box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, startY + 2, 182, 18, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, startY + 2, 182, 18, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(211, 22, 39);
    doc.text('COLOREAR PINTURAS S.R.L.', 18, startY + 9);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`CUIT: ${cuit} • Planta: ${fiscalAddress}`, 18, startY + 15);

    // Title & Copy badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`RECIBO DE HABERES / ${payment.paymentType === 'adelanto' ? 'ADELANTO' : 'SUELDO'}`, 125, startY + 9);

    doc.setFillColor(titleCopy.includes('ORIGINAL') ? 238 : 254, titleCopy.includes('ORIGINAL') ? 242 : 242, titleCopy.includes('ORIGINAL') ? 255 : 242);
    doc.roundedRect(125, startY + 11, 67, 6, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setTextColor(titleCopy.includes('ORIGINAL') ? 59 : 185, titleCopy.includes('ORIGINAL') ? 130 : 28, titleCopy.includes('ORIGINAL') ? 246 : 28);
    doc.text(titleCopy, 127, startY + 15);

    // Employee and period bar
    const infoY = startY + 23;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, infoY, 182, 16, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, infoY, 182, 16, 'S');

    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Empleado: `, 18, infoY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${employee.fullName} (${employee.cuil})`, 33, infoY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Puesto: `, 18, infoY + 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${employee.position} • Sector: ${employee.sector.replace('_', ' ').toUpperCase()}`, 30, infoY + 11);

    doc.setFont('helvetica', 'normal');
    doc.text(`Nº Recibo: `, 125, infoY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(payment.paymentNumber, 142, infoY + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Período: `, 125, infoY + 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${payment.period} (Fecha: ${dateFormatted})`, 138, infoY + 11);

    // Table Header
    const tableY = startY + 41;
    doc.setFillColor(226, 232, 240);
    doc.rect(14, tableY, 182, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('CONCEPTO / DESCRIPCIÓN', 18, tableY + 4);
    doc.text('HABERES (+)', 130, tableY + 4);
    doc.text('DESCUENTOS (-)', 165, tableY + 4);

    // Items
    let currentY = tableY + 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    payment.items.forEach(it => {
      doc.text(it.concept, 18, currentY);
      if (it.type === 'haber') {
        doc.text(`$ ${it.amount.toLocaleString('es-AR')}`, 130, currentY);
        doc.text(`-`, 165, currentY);
      } else {
        doc.text(`-`, 130, currentY);
        doc.text(`$ ${it.amount.toLocaleString('es-AR')}`, 165, currentY);
      }
      currentY += 5;
    });

    // Total net box
    const totalY = startY + 75;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, totalY, 182, 14, 1.5, 1.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, totalY, 182, 14, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`TOTAL BRUTO: $ ${payment.grossAmount.toLocaleString('es-AR')}`, 18, totalY + 8);
    doc.text(`DESCUENTOS: $ ${payment.deductionsAmount.toLocaleString('es-AR')}`, 75, totalY + 8);

    doc.setFontSize(9.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`NETO A COBRAR: $ ${payment.netAmount.toLocaleString('es-AR')}`, 130, totalY + 8);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Medio de Pago: ${payment.paymentMethod.toUpperCase()} ${payment.cashboxName ? `(Caja: ${payment.cashboxName})` : ''} ${payment.bankRef ? `• Ref: ${payment.bankRef}` : ''}`, 18, totalY + 12);

    // Signatures
    const sigY = startY + 104;
    doc.setDrawColor(148, 163, 184);
    doc.line(25, sigY, 80, sigY);
    doc.line(125, sigY, 180, sigY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Firma y Aclaración de Empleador / RRHH', 52, sigY + 4, { align: 'center' });
    doc.text('Firma de Conformidad del Empleado', 152, sigY + 4, { align: 'center' });
    doc.text(`Recibí el importe neto de $ ${payment.netAmount.toLocaleString('es-AR')}`, 152, sigY + 8, { align: 'center' });
  };

  // 1. Render ORIGINAL (Top half)
  renderVoucherBlock(10, 'ORIGINAL - COPIA EMPLEADO');

  // 2. Perforation Cut line in middle of page
  doc.setDrawColor(156, 163, 175);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(10, 135, 200, 135);
  doc.setLineDashPattern([], 0); // reset line dash

  doc.setFontSize(6);
  doc.setTextColor(156, 163, 175);
  doc.text('✂ - - - - - - - - - - - - - - - - - - - - - CORTE AQUÍ (TALÓN DUPLICADO) - - - - - - - - - - - - - - - - - - - - - ✂', 105, 134, { align: 'center' });

  // 3. Render DUPLICADO (Bottom half)
  renderVoucherBlock(145, 'DUPLICADO - COPIA EMPRESA');

  // Save PDF
  const cleanNum = payment.paymentNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Recibo_Sueldo_Duplicado_${cleanNum}_${employee.lastName}.pdf`);
}

/**
 * Builds formatted WhatsApp message for employee salary notification
 */
export function buildWhatsAppSalaryMessage(payment: SalaryPayment, employee: Employee): string {
  const dateFormatted = new Date(payment.date).toLocaleDateString('es-AR');
  return (
    `*RECIBO DE HABERES - COLOREAR PINTURAS S.R.L.*\n\n` +
    `Hola *${employee.fullName}*,\n` +
    `Te informamos que se ha procesado el pago de *${payment.paymentType === 'adelanto' ? 'Adelanto de Sueldo' : 'Liquidación de Sueldo'}* correspondiente al período *${payment.period}*.\n\n` +
    `📄 *Nº Comprobante:* ${payment.paymentNumber}\n` +
    `📅 *Fecha:* ${dateFormatted}\n` +
    `💵 *Sueldo Bruto:* $ ${payment.grossAmount.toLocaleString('es-AR')}\n` +
    (payment.deductionsAmount > 0 ? `🔻 *Descuentos/Adelantos:* -$ ${payment.deductionsAmount.toLocaleString('es-AR')}\n` : '') +
    `💰 *NETO ABONADO: $ ${payment.netAmount.toLocaleString('es-AR')}*\n` +
    `💳 *Medio:* ${payment.paymentMethod.toUpperCase()}${payment.bankRef ? ` (${payment.bankRef})` : ''}\n\n` +
    `Se encuentra disponible tu recibo oficial duplicado para firma en la oficina de Administración. Muchas gracias.`
  );
}
