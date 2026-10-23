import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for AI Invoice Parsing
  app.post("/api/parse-invoice", async (req, res) => {
    try {
      const { imageBase64, mimeType, textContent } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const contents: any[] = [];

      if (imageBase64 && mimeType) {
        contents.push({
          inlineData: {
            mimeType: mimeType,
            data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }

      if (textContent) {
        contents.push({ text: textContent });
      }

      const prompt = `
Eres un sistema experto en lectura y procesamiento OCR de Facturas de Compra y Comprobantes comerciales de Argentina (AFIP / ARCA, Factura A, Factura B, Factura C, Factura M, Remitos, Notas de Crédito y Débito).
Analiza el documento / texto / imagen proporcionado y extrae toda la información en un formato JSON estructurado válido con los siguientes campos EXACTOS:

{
  "supplierName": "Razón social o nombre comercial del proveedor emisor (ej: BERMON DISTRIBUIDORA)",
  "supplierTaxId": "CUIT del proveedor con o sin guiones (ej: 33-67086939-9)",
  "supplierTaxCondition": "Responsable Inscripto | Monotributo | Exento",
  "invoiceType": "Factura A | Factura B | Factura C | Factura M | Remito | Nota de Crédito | Nota de Débito",
  "pointOfSale": "Número de punto de venta en 4 o 5 dígitos (ej: 0011)",
  "invoiceNumber": "Número de comprobante en 8 dígitos (ej: 00005773)",
  "date": "Fecha de emisión en formato YYYY-MM-DD",
  "dueDate": "Fecha de vencimiento en formato YYYY-MM-DD (si existe)",
  "items": [
    {
      "productCode": "Código de artículo o SKU del proveedor (ej: 00104)",
      "productName": "Descripción completa del producto o artículo",
      "quantity": 3.0,
      "unitCost": 15058.60,
      "vatRate": 21,
      "discount1": 0,
      "subtotal": 45175.80,
      "profitMargin": 40
    }
  ],
  "subtotal": 799509.78,
  "vatAmount": 167897.05,
  "internalTax": 0,
  "otherTaxes": 0,
  "perceptionIIBB": 0,
  "perceptionIVA": 23985.29,
  "generalDiscountPercent": 0,
  "extraDiscountPercent": 0,
  "total": 991392.13,
  "notes": "Observaciones o detalles relevantes"
}

Reglas importantes:
- IMPORTANTE: Extrae TODOS los productos, ítems, cargos y percepciones detallados en el comprobante sin omitir ninguno.
- Si el documento indica "IVA 21%" o "IVA 10.5%", extrae la tasa correspondiente.
- Devuelve ÚNICAMENTE el bloque JSON válido, sin delimitadores adicionales ni texto explicativo.
`;

      contents.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const rawJson = response.text?.trim() || '{}';
      const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      res.json(parsed);
    } catch (err: any) {
      console.error("Gemini OCR server error:", err);
      res.status(500).json({ error: err?.message || "Error processing invoice with Gemini API." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
