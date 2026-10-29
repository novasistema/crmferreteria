import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Product, SalesOrder, Customer, CompanyConfig } from '../types';

export function exportPriceListToExcel(products: Product[], config?: CompanyConfig) {
  const data = products.map(p => ({
    'Código SKU': p.code,
    'Descripción / Producto': p.name,
    'Categoría / Línea': p.category,
    'Presentación': p.presentation,
    'Color': p.color || 'Estándar',
    'Precio Base Sin IVA ($)': p.priceDistributor,
    'Precio Mayorista ($)': p.priceWholesale,
    'Precio Sugerido Público ($)': p.priceRetail,
    'Stock en Planta': p.stock,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista Precios Agosto 2026');
  
  // Generate filename with current date
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Lista_Colorear_Pinturas_Agosto_2026_${dateStr}.xlsx`);
}

export function exportPriceListToPDF(products: Product[], config?: CompanyConfig) {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString('es-AR');
  const companyName = config?.companyName || 'Colorear Pinturas S.R.L.';
  const cuit = config?.cuit || '30-71489234-8';
  const phone = config?.phone || '+54 11 4890-7000';

  // Header background
  doc.setFillColor(211, 22, 39); // Colorear brand red
  doc.rect(0, 0, 210, 24, 'F');

  // Rainbow top strip (purple, navy, blue, green, yellow, orange, red)
  const colors = [
    [75, 0, 130],
    [0, 51, 153],
    [0, 153, 204],
    [0, 180, 50],
    [245, 200, 0],
    [255, 120, 0],
    [220, 20, 30]
  ];
  const stripWidth = 210 / colors.length;
  colors.forEach((col, idx) => {
    doc.setFillColor(col[0], col[1], col[2]);
    doc.rect(idx * stripWidth, 0, stripWidth, 3, 'F');
  });

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('COLOREAR PINTURAS - LISTA OFICIAL AGOSTO 2026', 14, 16);

  // Subheader
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Empresa: ${companyName} | CUIT: ${cuit} | Tel: ${phone}`, 14, 32);
  doc.text(`Vigencia: AGOSTO 2026 (Emisión: ${dateStr}) | Precios oficiales de fábrica sin IVA`, 14, 37);

  // Table header
  doc.setFillColor(240, 243, 246);
  doc.rect(14, 42, 182, 8, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CÓDIGO SKU', 16, 47);
  doc.text('PRODUCTO / PRESENTACIÓN', 45, 47);
  doc.text('COLOR', 110, 47);
  doc.text('DISTRIB. ($)', 138, 47);
  doc.text('MAYORISTA ($)', 162, 47);
  doc.text('SUG. PÚBLICO', 186, 47, { align: 'right' });

  // Rows
  let y = 56;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  products.forEach((p, idx) => {
    if (y > 275) {
      doc.addPage();
      // repeat header on new page
      doc.setFillColor(211, 22, 39);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('COLOREAR PINTURAS - LISTA OFICIAL DE PRECIOS (Cont.)', 14, 10);
      y = 25;
      doc.setFillColor(240, 243, 246);
      doc.rect(14, y, 182, 8, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', 16, y + 5);
      doc.text('PRODUCTO / PRESENTACIÓN', 45, y + 5);
      doc.text('COLOR', 110, y + 5);
      doc.text('DISTRIB. ($)', 138, y + 5);
      doc.text('MAYORISTA ($)', 162, y + 5);
      doc.text('SUG. PÚBLICO', 186, y + 5, { align: 'right' });
      y += 13;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 182, 7, 'F');
    }

    doc.setTextColor(40, 40, 40);
    doc.text(p.code, 16, y);
    const prodDesc = `${p.name} (${p.presentation})`;
    doc.text(prodDesc.length > 36 ? prodDesc.slice(0, 35) + '...' : prodDesc, 45, y);
    doc.text(p.color || '-', 110, y);
    doc.text(`$ ${p.priceDistributor.toLocaleString('es-AR')}`, 138, y);
    doc.text(`$ ${p.priceWholesale.toLocaleString('es-AR')}`, 162, y);
    doc.text(`$ ${p.priceRetail.toLocaleString('es-AR')}`, 194, y, { align: 'right' });

    y += 7;
  });

  // Footer notes
  if (y > 260) {
    doc.addPage();
    y = 25;
  }
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('* Precios sujetos a modificación sin previo aviso. Descuentos por volumen disponibles según acuerdo comercial.', 14, y + 10);
  doc.text('* Horario de atención y despacho de fábrica: Lunes a Viernes de 07:00 a 16:30 hs.', 14, y + 14);

  doc.save(`Lista_Precios_Colorear_${dateStr.replace(/\//g, '-')}.pdf`);
}

export function generateWhatsAppMessage(order: SalesOrder, config?: CompanyConfig): string {
  const template = config?.notificationWhatsappTemplate || 
    'Hola {cliente}, le informamos desde Colorear Pinturas que su pedido {pedido} se encuentra {estado}. Transporte: {transporte}. Seguimiento: {tracking}. Total: ${total}. Muchas gracias.';
  
  return template
    .replace('{cliente}', order.customerName)
    .replace('{pedido}', order.orderNumber)
    .replace('{estado}', order.status.toUpperCase().replace('_', ' '))
    .replace('{transporte}', order.transportName || 'A coordinar')
    .replace('{tracking}', order.trackingCode || 'S/N')
    .replace('{total}', order.total.toLocaleString('es-AR'));
}

export function generatePaymentReminderWhatsApp(customer: Customer, config?: CompanyConfig): string {
  const template = config?.paymentReminderTemplate ||
    'Estimado/a {cliente}, le recordamos desde el área de administración de Colorear Pinturas que registra un saldo pendiente de ${monto}. Agradecemos coordinar la cancelación correspondiente. Datos de cuenta CBU: 0720045620000012345678.';

  return template
    .replace('{cliente}', customer.businessName)
    .replace('{monto}', customer.currentBalance.toLocaleString('es-AR'));
}
