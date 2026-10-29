import { Product } from '../types';

export interface RawColorearItem {
  category: string;
  description: string;
  presentation: string;
  color?: string;
  priceSinIva: number;
}

export const COLOREAR_AGOSTO_2026_RAW: RawColorearItem[] = [
  // --- FONDO PREPARACION DE SUPERFICIE ---
  { category: 'Fondo Preparación de Superficie', description: 'ENDUCOL INT/EXT 1/2 KG', presentation: '1/2 KG', priceSinIva: 3790.89 },
  { category: 'Fondo Preparación de Superficie', description: 'ENDUCOL INT/EXT 1 KG', presentation: '1 KG', priceSinIva: 5204.78 },
  { category: 'Fondo Preparación de Superficie', description: 'ENDUCOL INT/EXT 4 KG', presentation: '4 KG', priceSinIva: 18733.49 },
  { category: 'Fondo Preparación de Superficie', description: 'ENDUCOL INT/EXT 10 KG', presentation: '10 KG', priceSinIva: 37382.91 },
  { category: 'Fondo Preparación de Superficie', description: 'ENDUCOL INT/EXT 20 KG', presentation: '20 KG', priceSinIva: 64820.55 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR TRANSPARENTE 1 LT', presentation: '1 LT', color: 'Incoloro', priceSinIva: 6675.34 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR TRANSPARENTE 4 LT', presentation: '4 LTS', color: 'Incoloro', priceSinIva: 24474.97 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR TRANSPARENTE 10 LTS', presentation: '10 LTS', color: 'Incoloro', priceSinIva: 53758.28 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR TRANSPARENTE 20 LTS', presentation: '20 LTS', color: 'Incoloro', priceSinIva: 97669.68 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR AL AGUA BLANCO 1 LT', presentation: '1 LT', color: 'Blanco', priceSinIva: 5448.95 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR AL AGUA BLANCO 4 LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 19476.30 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR AL AGUA BLANCO 10 LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 38051.94 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR AL AGUA BLANCO 20 LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 70185.17 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR AL AGUARRAS 1 LT', presentation: '1 LT', color: 'Incoloro', priceSinIva: 15909.75 },
  { category: 'Fondo Preparación de Superficie', description: 'FIJADOR AL AGUARRAS 4 LTS', presentation: '4 LTS', color: 'Incoloro', priceSinIva: 63062.96 },
  { category: 'Fondo Preparación de Superficie', description: 'SELLADOR DE GRIETAS 1/2 KG', presentation: '1/2 KG', priceSinIva: 6999.12 },
  { category: 'Fondo Preparación de Superficie', description: 'SELLADOR DE GRIETAS 1 KG', presentation: '1 KG', priceSinIva: 11530.11 },
  { category: 'Fondo Preparación de Superficie', description: 'SELLADOR DE GRIETAS 4 KG', presentation: '4 KG', priceSinIva: 45561.25 },
  { category: 'Fondo Preparación de Superficie', description: 'SELLADOR DE GRIETAS 10 KG', presentation: '10 KG', priceSinIva: 103067.79 },
  { category: 'Fondo Preparación de Superficie', description: 'SELLADOR DE GRIETAS 20 KG', presentation: '20 KG', priceSinIva: 196049.75 },

  // --- TERMINACION PARA MAMPOSTERIA ---
  { category: 'Terminación para Mampostería', description: 'LATEX CIELORRASOS 1 LT', presentation: '1 LT', color: 'Blanco Nieve', priceSinIva: 6756.82 },
  { category: 'Terminación para Mampostería', description: 'LATEX CIELORRASOS 4 LTS', presentation: '4 LTS', color: 'Blanco Nieve', priceSinIva: 23648.87 },
  { category: 'Terminación para Mampostería', description: 'LATEX CIELORRASOS 10 LTS', presentation: '10 LTS', color: 'Blanco Nieve', priceSinIva: 45888.34 },
  { category: 'Terminación para Mampostería', description: 'LATEX CIELORRASOS 20 LTS', presentation: '20 LTS', color: 'Blanco Nieve', priceSinIva: 87282.76 },
  { category: 'Terminación para Mampostería', description: 'LATEX BLANQUEO BASIC X4LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 17400.00 },
  { category: 'Terminación para Mampostería', description: 'LATEX BLANQUEO BASIC X10LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 34546.46 },
  { category: 'Terminación para Mampostería', description: 'LATEX BLANQUEO BASIC X20LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 59466.00 },
  { category: 'Terminación para Mampostería', description: 'LATEX ECOPRO 3,6 LTS', presentation: '3,6 LTS', color: 'Blanco Mate', priceSinIva: 18163.97 },
  { category: 'Terminación para Mampostería', description: 'LATEX ECOPRO 8 LTS', presentation: '8 LTS', color: 'Blanco Mate', priceSinIva: 34900.00 },
  { category: 'Terminación para Mampostería', description: 'LATEX ECOPRO 20 KG', presentation: '20 KG', color: 'Blanco Mate', priceSinIva: 69485.42 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORPRO INT/EXT 1 LT', presentation: '1 LT', color: 'Blanco', priceSinIva: 7140.16 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORPRO INT/EXT 4 LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 22774.77 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORPRO INT/EXT 10 LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 50910.49 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORPRO INT/EXT 20 LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 92523.31 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM INTERIOR 1 LT', presentation: '1 LT', color: 'Blanco Puro', priceSinIva: 7170.88 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM INTERIOR 4 LTS', presentation: '4 LTS', color: 'Blanco Puro', priceSinIva: 26651.02 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM INTERIOR 10 LTS', presentation: '10 LTS', color: 'Blanco Puro', priceSinIva: 57284.53 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM INTERIOR 20 LTS', presentation: '20 LTS', color: 'Blanco Puro', priceSinIva: 108515.55 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM EXTERIOR 1 LT', presentation: '1 LT', color: 'Blanco', priceSinIva: 8674.30 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM EXTERIOR 4 LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 32046.57 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM EXTERIOR 10 LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 72564.65 },
  { category: 'Terminación para Mampostería', description: 'LATEX PREMIUM EXTERIOR 20 LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 129346.15 },
  { category: 'Terminación para Mampostería', description: 'LATEX FRENTES Y MUROS 1 LT', presentation: '1 LT', color: 'Blanco Frentes', priceSinIva: 8538.30 },
  { category: 'Terminación para Mampostería', description: 'LATEX FRENTES Y MUROS 4 LTS', presentation: '4 LTS', color: 'Blanco Frentes', priceSinIva: 32085.05 },
  { category: 'Terminación para Mampostería', description: 'LATEX FRENTES Y MUROS 10 LTS', presentation: '10 LTS', color: 'Blanco Frentes', priceSinIva: 73255.15 },
  { category: 'Terminación para Mampostería', description: 'LATEX FRENTES Y MUROS 20 LTS', presentation: '20 LTS', color: 'Blanco Frentes', priceSinIva: 135863.86 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G1 1 LT', presentation: '1 LT', color: 'G1 Colores', priceSinIva: 10903.41 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G1 4 LTS', presentation: '4 LTS', color: 'G1 Colores', priceSinIva: 41892.68 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G1 10 LTS', presentation: '10 LTS', color: 'G1 Colores', priceSinIva: 86200.00 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G1 20 LTS', presentation: '20 LTS', color: 'G1 Colores', priceSinIva: 170000.00 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G2 1 LT', presentation: '1 LT', color: 'G2 Colores', priceSinIva: 9000.00 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G2 4 LTS', presentation: '4 LTS', color: 'G2 Colores', priceSinIva: 33920.00 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G2 10 LTS', presentation: '10 LTS', color: 'G2 Colores', priceSinIva: 67713.33 },
  { category: 'Terminación para Mampostería', description: 'LATEX COLORFREN G2 20 LTS', presentation: '20 LTS', color: 'G2 Colores', priceSinIva: 133000.00 },
  { category: 'Terminación para Mampostería', description: 'ENTONADOR 120 CM2', presentation: '120 CM3', color: 'Surtido', priceSinIva: 3372.98 },

  // --- ESMALTES SINTETICOS ---
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G1 1/4 LT', presentation: '1/4 LT', color: 'G1 Colores', priceSinIva: 6222.00 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G1 1/2 LT', presentation: '1/2 LT', color: 'G1 Colores', priceSinIva: 10149.43 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G1 1 LT', presentation: '1 LT', color: 'G1 Colores', priceSinIva: 17790.54 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G1 4 LTS', presentation: '4 LTS', color: 'G1 Colores', priceSinIva: 66088.13 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G1 20 LTS', presentation: '20 LTS', color: 'G1 Colores', priceSinIva: 316101.71 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G2 1/4 LT', presentation: '1/4 LT', color: 'G2 Colores', priceSinIva: 5510.96 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G2 1/2 LT', presentation: '1/2 LT', color: 'G2 Colores', priceSinIva: 9445.76 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G2 1 LT', presentation: '1 LT', color: 'G2 Colores', priceSinIva: 16670.60 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G2 4 LTS', presentation: '4 LTS', color: 'G2 Colores', priceSinIva: 60878.30 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE G2 20 LTS', presentation: '20 LTS', color: 'G2 Colores', priceSinIva: 293107.27 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE ALUMINIO 1/4 LT', presentation: '1/4 LT', color: 'Aluminio', priceSinIva: 6693.56 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE ALUMINIO 1/2 LT', presentation: '1/2 LT', color: 'Aluminio', priceSinIva: 10710.06 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE ALUMINIO 1 LT', presentation: '1 LT', color: 'Aluminio', priceSinIva: 18826.27 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE ALUMINIO 4 LTS', presentation: '4 LTS', color: 'Aluminio', priceSinIva: 66435.56 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE ALUMINIO 20 LTS', presentation: '20 LTS', color: 'Aluminio', priceSinIva: 319041.25 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO SAT. 1/4 LT', presentation: '1/4 LT', color: 'Blanco Satinado', priceSinIva: 6683.75 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO SAT. 1/2 LT', presentation: '1/2 LT', color: 'Blanco Satinado', priceSinIva: 10612.62 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO SAT. 1 LT', presentation: '1 LT', color: 'Blanco Satinado', priceSinIva: 18486.35 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO SAT. 4 LTS', presentation: '4 LTS', color: 'Blanco Satinado', priceSinIva: 67470.37 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO SAT. 20 LTS', presentation: '20 LTS', color: 'Blanco Satinado', priceSinIva: 315076.49 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO MATE 1/4 LT', presentation: '1/4 LT', color: 'Blanco Mate', priceSinIva: 5935.97 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO MATE 1/2 LT', presentation: '1/2 LT', color: 'Blanco Mate', priceSinIva: 10295.77 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO MATE 1 LT', presentation: '1 LT', color: 'Blanco Mate', priceSinIva: 18370.61 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO MATE 4 LTS', presentation: '4 LTS', color: 'Blanco Mate', priceSinIva: 67678.35 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE BLANCO MATE 20 LTS', presentation: '20 LTS', color: 'Blanco Mate', priceSinIva: 327107.49 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO MATE 1/4 LT', presentation: '1/4 LT', color: 'Negro Mate', priceSinIva: 6406.43 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO MATE 1/2 LT', presentation: '1/2 LT', color: 'Negro Mate', priceSinIva: 10726.00 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO MATE 1 LT', presentation: '1 LT', color: 'Negro Mate', priceSinIva: 19331.00 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO MATE 4 LTS', presentation: '4 LTS', color: 'Negro Mate', priceSinIva: 71756.00 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO MATE 20 LTS', presentation: '20 LTS', color: 'Negro Mate', priceSinIva: 347910.00 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO SAT. 1/4 LT', presentation: '1/4 LT', color: 'Negro Satinado', priceSinIva: 5899.10 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO SAT. 1/2 LT', presentation: '1/2 LT', color: 'Negro Satinado', priceSinIva: 8979.89 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO SAT. 1 LT', presentation: '1 LT', color: 'Negro Satinado', priceSinIva: 15180.31 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO SAT. 4 LTS', presentation: '4 LTS', color: 'Negro Satinado', priceSinIva: 58446.89 },
  { category: 'Esmaltes Sintéticos', description: 'ESMALTE NEGRO SAT. 20 LTS', presentation: '20 LTS', color: 'Negro Satinado', priceSinIva: 276636.16 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. GRIS 1LT', presentation: '1 LT', color: 'Gris', priceSinIva: 18370.61 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. GRIS 4LTS', presentation: '4 LTS', color: 'Gris', priceSinIva: 67678.35 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. GRIS 20LTS', presentation: '20 LTS', color: 'Gris', priceSinIva: 327107.49 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. ROJO 1LT', presentation: '1 LT', color: 'Rojo', priceSinIva: 18370.61 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. ROJO 4LTS', presentation: '4 LTS', color: 'Rojo', priceSinIva: 67678.35 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. ROJO 20LTS', presentation: '20 LTS', color: 'Rojo', priceSinIva: 327107.49 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. NEGRO 1LT', presentation: '1 LT', color: 'Negro', priceSinIva: 18370.61 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. NEGRO 4LTS', presentation: '4 LTS', color: 'Negro', priceSinIva: 67678.35 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. NEGRO 20LTS', presentation: '20 LTS', color: 'Negro', priceSinIva: 327107.49 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. BLANCO 1LTS', presentation: '1 LT', color: 'Blanco', priceSinIva: 18370.61 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. BLANCO 4LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 67678.35 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. BLANCO 20LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 327107.49 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. AMARILLO 1LTS', presentation: '1 LT', color: 'Amarillo Vial', priceSinIva: 18370.61 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. AMARILLO 4LTS', presentation: '4 LTS', color: 'Amarillo Vial', priceSinIva: 67678.35 },
  { category: 'Esmaltes Sintéticos', description: 'ESM. P/ PISOS ALTO TRANS. AMARILLO 20LTS', presentation: '20 LTS', color: 'Amarillo Vial', priceSinIva: 327107.49 },

  // --- TERMINACION IMPERMEABILIZANTE ---
  { category: 'Terminación Impermeabilizante', description: 'ECOMEMBRANA BASIC 20 LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 84923.19 },
  { category: 'Terminación Impermeabilizante', description: 'ECOMEMBRANA BASIC 10 LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 45502.40 },
  { category: 'Terminación Impermeabilizante', description: 'ECOMEMBRANA BASIC 4 LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 23700.58 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA 1 LT', presentation: '1 LT', color: 'Blanco', priceSinIva: 7382.21 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA 4 LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 27268.03 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA 10 LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 61694.30 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA 20 LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 112742.16 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA TEJA 1 LT', presentation: '1 LT', color: 'Rojo Teja', priceSinIva: 8917.50 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA TEJA 4 LTS', presentation: '4 LTS', color: 'Rojo Teja', priceSinIva: 33665.06 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA TEJA 10 LTS', presentation: '10 LTS', color: 'Rojo Teja', priceSinIva: 77047.17 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA TEJA 20 LTS', presentation: '20 LTS', color: 'Rojo Teja', priceSinIva: 143447.89 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA BORGOÑA 1 LT', presentation: '1 LT', color: 'Borgoña', priceSinIva: 9211.69 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA BORGOÑA 4 LTS', presentation: '4 LTS', color: 'Borgoña', priceSinIva: 34890.83 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA BORGOÑA 10 LTS', presentation: '10 LTS', color: 'Borgoña', priceSinIva: 79989.02 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA BORGOÑA 20 LTS', presentation: '20 LTS', color: 'Borgoña', priceSinIva: 149331.60 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA VERDE 1 LTS', presentation: '1 LT', color: 'Verde', priceSinIva: 8384.42 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA VERDE 4 LTS', presentation: '4 LTS', color: 'Verde', priceSinIva: 31443.89 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA VERDE 10 LTS', presentation: '10 LTS', color: 'Verde', priceSinIva: 71716.36 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA VERDE 20 LTS', presentation: '20 LTS', color: 'Verde', priceSinIva: 132786.27 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA GRIS 1 LTS', presentation: '1 LT', color: 'Gris', priceSinIva: 7619.87 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA GRIS 4 LTS', presentation: '4 LTS', color: 'Gris', priceSinIva: 28258.24 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA GRIS 10 LTS', presentation: '10 LTS', color: 'Gris', priceSinIva: 64070.82 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA LIQUIDA GRIS 20 LTS', presentation: '20 LTS', color: 'Gris', priceSinIva: 117495.18 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO 1 LT', presentation: '1 LT', color: 'Blanco', priceSinIva: 9000.00 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO 4 LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 34212.71 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO 10 LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 74100.00 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO 20 LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 146268.68 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO TEJA 1 LT', presentation: '1 LT', color: 'Teja', priceSinIva: 9729.07 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO TEJA 4 LTS', presentation: '4 LTS', color: 'Teja', priceSinIva: 34576.83 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO TEJA 10 LTS', presentation: '10 LTS', color: 'Teja', priceSinIva: 82535.97 },
  { category: 'Terminación Impermeabilizante', description: 'FIBRADO TEJA 20 LTS', presentation: '20 LTS', color: 'Teja', priceSinIva: 161670.80 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA POLIURETANICA 1 LT', presentation: '1 LT', color: 'Blanco Transitable', priceSinIva: 9900.00 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA POLIURETANICA 4 LTS', presentation: '4 LTS', color: 'Blanco Transitable', priceSinIva: 37541.58 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA POLIURETANICA 10 LTS', presentation: '10 LTS', color: 'Blanco Transitable', priceSinIva: 82000.00 },
  { category: 'Terminación Impermeabilizante', description: 'MEMBRANA POLIURETANICA 20 LTS', presentation: '20 LTS', color: 'Blanco Transitable', priceSinIva: 151000.00 },
  { category: 'Terminación Impermeabilizante', description: 'PILETA ACRILICA 1 LT', presentation: '1 LT', color: 'Azul Pileta', priceSinIva: 10316.17 },
  { category: 'Terminación Impermeabilizante', description: 'PILETA ACRILICA 4 LTS', presentation: '4 LTS', color: 'Azul Pileta', priceSinIva: 39756.38 },
  { category: 'Terminación Impermeabilizante', description: 'PILETA ACRILICA 10 LTS', presentation: '10 LTS', color: 'Azul Pileta', priceSinIva: 88737.40 },
  { category: 'Terminación Impermeabilizante', description: 'PILETA ACRILICA 20 LTS', presentation: '20 LTS', color: 'Azul Pileta', priceSinIva: 167529.53 },
  { category: 'Terminación Impermeabilizante', description: 'LADRICOL ACUOSO 1 LT', presentation: '1 LT', color: 'Incoloro Mate', priceSinIva: 8900.00 },
  { category: 'Terminación Impermeabilizante', description: 'LADRICOL ACUOSO 4 LTS', presentation: '4 LTS', color: 'Incoloro Mate', priceSinIva: 33298.32 },
  { category: 'Terminación Impermeabilizante', description: 'LADRICOL ACUOSO 10 LTS', presentation: '10 LTS', color: 'Incoloro Mate', priceSinIva: 69400.00 },
  { category: 'Terminación Impermeabilizante', description: 'LADRICOL ACUOSO 20 LTS', presentation: '20 LTS', color: 'Incoloro Mate', priceSinIva: 135000.00 },
  { category: 'Terminación Impermeabilizante', description: 'TAPAGOTERAS 1 LT', presentation: '1 LT', color: 'Transparente', priceSinIva: 8760.10 },
  { category: 'Terminación Impermeabilizante', description: 'TAPAGOTERAS 4 LTS', presentation: '4 LTS', color: 'Transparente', priceSinIva: 33298.32 },
  { category: 'Terminación Impermeabilizante', description: 'TAPAGOTERAS 10 LTS', presentation: '10 LTS', color: 'Transparente', priceSinIva: 67000.00 },
  { category: 'Terminación Impermeabilizante', description: 'TAPAGOTERAS 20 LTS', presentation: '20 LTS', color: 'Transparente', priceSinIva: 130000.00 },
  { category: 'Terminación Impermeabilizante', description: 'LADRICOL SOLVENTE 1 LT', presentation: '1 LT', color: 'Incoloro Brillante', priceSinIva: 14465.97 },
  { category: 'Terminación Impermeabilizante', description: 'LADRICOL SOLVENTE 4 LTS', presentation: '4 LTS', color: 'Incoloro Brillante', priceSinIva: 52059.78 },
  { category: 'Terminación Impermeabilizante', description: 'LADRICOL SOLVENTE 20 LTS', presentation: '20 LTS', color: 'Incoloro Brillante', priceSinIva: 250000.00 },

  // Pisos Deportivos Acuoso
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BLANCO 1 LTS', presentation: '1 LT', color: 'Blanco', priceSinIva: 10450.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BLANCO 4 LTS', presentation: '4 LTS', color: 'Blanco', priceSinIva: 39800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BLANCO 10 LTS', presentation: '10 LTS', color: 'Blanco', priceSinIva: 79800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BLANCO 20 LTS', presentation: '20 LTS', color: 'Blanco', priceSinIva: 154890.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO VERDE 1 LTS', presentation: '1 LT', color: 'Verde Frontón', priceSinIva: 10450.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO VERDE 4 LTS', presentation: '4 LTS', color: 'Verde Frontón', priceSinIva: 39800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO VERDE 10 LTS', presentation: '10 LTS', color: 'Verde Frontón', priceSinIva: 79800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO VERDE 20 LTS', presentation: '20 LTS', color: 'Verde Frontón', priceSinIva: 154890.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO GRIS 1 LTS', presentation: '1 LT', color: 'Gris Cemento', priceSinIva: 10450.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO GRIS 4 LTS', presentation: '4 LTS', color: 'Gris Cemento', priceSinIva: 39800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO GRIS 10 LTS', presentation: '10 LTS', color: 'Gris Cemento', priceSinIva: 79800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO GRIS 20 LTS', presentation: '20 LTS', color: 'Gris Cemento', priceSinIva: 154890.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO NEGRO 1 LTS', presentation: '1 LT', color: 'Negro', priceSinIva: 10450.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO NEGRO 4 LTS', presentation: '4 LTS', color: 'Negro', priceSinIva: 39800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO NEGRO 10 LTS', presentation: '10 LTS', color: 'Negro', priceSinIva: 79800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO NEGRO 20 LTS', presentation: '20 LTS', color: 'Negro', priceSinIva: 154890.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BORGOÑA 1 LTS', presentation: '1 LT', color: 'Borgoña / Tenis', priceSinIva: 10450.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BORGOÑA 4 LTS', presentation: '4 LTS', color: 'Borgoña / Tenis', priceSinIva: 39800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BORGOÑA 10 LTS', presentation: '10 LTS', color: 'Borgoña / Tenis', priceSinIva: 79800.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO BORGOÑA 20 LTS', presentation: '20 LTS', color: 'Borgoña / Tenis', priceSinIva: 154890.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO AMARILLO 1 LTS', presentation: '1 LT', color: 'Amarillo', priceSinIva: 12300.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO AMARILLO 4 LTS', presentation: '4 LTS', color: 'Amarillo', priceSinIva: 46785.84 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO AMARILLO 10 LTS', presentation: '10 LTS', color: 'Amarillo', priceSinIva: 97000.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVOS ACUOSO AMARILLO 20 LTS', presentation: '20 LTS', color: 'Amarillo', priceSinIva: 185675.26 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVO ACUOSO AZUL 4 LTS', presentation: '4 LTS', color: 'Azul Canchas', priceSinIva: 46785.84 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVO ACUOSO AZUL 10 LTS', presentation: '10 LTS', color: 'Azul Canchas', priceSinIva: 97000.00 },
  { category: 'Pisos Deportivos', description: 'PISOS DEPORTIVO ACUOSO AZUL 20 LTS', presentation: '20 LTS', color: 'Azul Canchas', priceSinIva: 185675.26 },

  // Protectores y Ladricol Block
  { category: 'Protectores de Fachada', description: 'LADRICOL BLOCK ACUOSO 1 LTS', presentation: '1 LT', priceSinIva: 9520.00 },
  { category: 'Protectores de Fachada', description: 'LADRICOL BLOCK ACUOSO 4 LTS', presentation: '4 LTS', priceSinIva: 35725.18 },
  { category: 'Protectores de Fachada', description: 'LADRICOL BLOCK ACUOSO 10 LTS', presentation: '10 LTS', priceSinIva: 79148.21 },
  { category: 'Protectores de Fachada', description: 'LADRICOL BLOCK ACUOSO 20 LTS', presentation: '20 LTS', priceSinIva: 148421.72 },
  { category: 'Protectores de Fachada', description: 'PROTECTOR COLORES INTENSOS 1 LTS', presentation: '1 LT', priceSinIva: 8900.00 },
  { category: 'Protectores de Fachada', description: 'PROTECTOR COLORES INTENSOS 4 LTS', presentation: '4 LTS', priceSinIva: 33298.32 },
  { category: 'Protectores de Fachada', description: 'PROTECTOR COLORES INTENSOS 10 LTS', presentation: '10 LTS', priceSinIva: 69400.00 },
  { category: 'Protectores de Fachada', description: 'PROTECTOR COLORES INTENSOS 20 LTS', presentation: '20 LTS', priceSinIva: 135000.00 },

  // --- REVESTIMIENTOS ---
  { category: 'Revestimientos', description: 'REVECOL BLANCO 6 KG', presentation: '6 KG', color: 'Blanco', priceSinIva: 26496.85 },
  { category: 'Revestimientos', description: 'REVECOL BLANCO 15 KG', presentation: '15 KG', color: 'Blanco', priceSinIva: 58412.39 },
  { category: 'Revestimientos', description: 'REVECOL BLANCO 30 KG', presentation: '30 KG', color: 'Blanco', priceSinIva: 92682.57 },
  { category: 'Revestimientos', description: 'REVECOL G1 6 KG', presentation: '6 KG', color: 'G1 Colores', priceSinIva: 26118.55 },
  { category: 'Revestimientos', description: 'REVECOL G1 15 KG', presentation: '15 KG', color: 'G1 Colores', priceSinIva: 57466.65 },
  { category: 'Revestimientos', description: 'REVECOL G1 30 KG', presentation: '30 KG', color: 'G1 Colores', priceSinIva: 104819.35 },
  { category: 'Revestimientos', description: 'REVECOL G2 6 KG', presentation: '6 KG', color: 'G2 Colores', priceSinIva: 26118.55 },
  { category: 'Revestimientos', description: 'REVECOL G2 15 KG', presentation: '15 KG', color: 'G2 Colores', priceSinIva: 57466.65 },
  { category: 'Revestimientos', description: 'REVECOL G2 30 KG', presentation: '30 KG', color: 'G2 Colores', priceSinIva: 104819.35 },
  { category: 'Revestimientos', description: 'MICROCEMENTO KIT 3 PASOS', presentation: 'Kit Completo', color: 'Gris Cemento', priceSinIva: 165396.00 },

  // --- LINEA MADERAS ---
  { category: 'Línea Maderas', description: 'MADERCOL 1LT', presentation: '1 LT', color: 'Natural/Nogal/Cedro', priceSinIva: 16935.15 },
  { category: 'Línea Maderas', description: 'MADERCOL 4 LTS', presentation: '4 LTS', color: 'Natural/Nogal/Cedro', priceSinIva: 61936.52 },
  { category: 'Línea Maderas', description: 'MADERCOL 20 LTS', presentation: '20 LTS', color: 'Natural/Nogal/Cedro', priceSinIva: 298398.37 },
  { category: 'Línea Maderas', description: 'BARNIZ MARINO 1/4 LT', presentation: '1/4 LT', color: 'Transparente Brillante', priceSinIva: 5555.41 },
  { category: 'Línea Maderas', description: 'BARNIZ MARINO 1/2 LT', presentation: '1/2 LT', color: 'Transparente Brillante', priceSinIva: 9534.65 },
  { category: 'Línea Maderas', description: 'BARNIZ MARINO 1 LT', presentation: '1 LT', color: 'Transparente Brillante', priceSinIva: 16848.37 },
  { category: 'Línea Maderas', description: 'BARNIZ MARINO 4 LTS', presentation: '4 LTS', color: 'Transparente Brillante', priceSinIva: 61589.39 },
  { category: 'Línea Maderas', description: 'BARNIZ MARINO 20 LTS', presentation: '20 LTS', color: 'Transparente Brillante', priceSinIva: 296662.69 },
  { category: 'Línea Maderas', description: 'ACUALAC 1 LTS', presentation: '1 LT', color: 'Incoloro Al Agua', priceSinIva: 9520.00 },
  { category: 'Línea Maderas', description: 'ACUALAC 4 LTS', presentation: '4 LTS', color: 'Incoloro Al Agua', priceSinIva: 35600.00 },
  { category: 'Línea Maderas', description: 'ACUALAC 20 LTS', presentation: '20 LTS', color: 'Incoloro Al Agua', priceSinIva: 121640.60 },
  { category: 'Línea Maderas', description: 'ACUALAC 200 LTS', presentation: '200 LTS', color: 'Incoloro Al Agua', priceSinIva: 925200.00 },
  { category: 'Línea Maderas', description: 'LACART 1 LTS', presentation: '1 LT', color: 'Laca Poliuretánica', priceSinIva: 13823.29 },
  { category: 'Línea Maderas', description: 'LACART 4 LTS', presentation: '4 LTS', color: 'Laca Poliuretánica', priceSinIva: 52084.05 },
  { category: 'Línea Maderas', description: 'SELLADOR DE CABAÑAS 1 KG', presentation: '1 KG', color: 'Madera', priceSinIva: 11530.11 },
  { category: 'Línea Maderas', description: 'SELLADOR DE CABAÑAS 4 KG', presentation: '4 KG', color: 'Madera', priceSinIva: 45561.25 },
  { category: 'Línea Maderas', description: 'SELLADOR DE CABAÑAS 10 KG', presentation: '10 KG', color: 'Madera', priceSinIva: 103067.79 },
  { category: 'Línea Maderas', description: 'SELLADOR DE CABAÑAS 20 KG', presentation: '20 KG', color: 'Madera', priceSinIva: 196049.75 },

  // --- LINEA ECOLÓGICA ---
  { category: 'Línea Ecológica', description: 'ACUART BLANCO X 20L', presentation: '20 LTS', color: 'Blanco Ecológico', priceSinIva: 277811.65 },
  { category: 'Línea Ecológica', description: 'ACUART BLANCO X 4L', presentation: '4 LTS', color: 'Blanco Ecológico', priceSinIva: 72719.93 },
  { category: 'Línea Ecológica', description: 'ACUART BLANCO X 1L', presentation: '1 LT', color: 'Blanco Ecológico', priceSinIva: 17653.64 },
  { category: 'Línea Ecológica', description: 'ACUART NEGRO X 20L', presentation: '20 LTS', color: 'Negro Ecológico', priceSinIva: 242057.79 },
  { category: 'Línea Ecológica', description: 'ACUART NEGRO X 4L', presentation: '4 LTS', color: 'Negro Ecológico', priceSinIva: 63929.46 },
  { category: 'Línea Ecológica', description: 'ACUART NEGRO X 1L', presentation: '1 LT', color: 'Negro Ecológico', priceSinIva: 15610.56 },
];

/**
 * Generate Product entities with SKU format:
 * "las dos primeras letras de la descripcion seguido por - y seguido con numeros de 4 digitos"
 */
export function generateColorearProducts(): Product[] {
  // Counters per 2-letter prefix to ensure clean 4-digit formatting
  const prefixCounter: Record<string, number> = {};

  return COLOREAR_AGOSTO_2026_RAW.map((item, index) => {
    // Extract first two letters of the description
    const cleanDesc = item.description.trim().replace(/[^a-zA-Z]/g, '');
    const prefix = cleanDesc.slice(0, 2).toUpperCase() || 'CP';
    
    prefixCounter[prefix] = (prefixCounter[prefix] || 0) + 1;
    const fourDigitNum = String(prefixCounter[prefix]).padStart(4, '0');
    const skuCode = `${prefix}-${fourDigitNum}`;

    const priceDistributor = Math.round(item.priceSinIva);
    const priceWholesale = Math.round(item.priceSinIva * 1.15); // +15%
    const priceRetail = Math.round(item.priceSinIva * 1.45);    // +45% al público
    const unitCost = Math.round(item.priceSinIva * 0.58);       // ~58% costo de fábrica

    return {
      id: `prod-col-${index + 1}`,
      code: skuCode,
      name: item.description,
      category: item.category,
      presentation: item.presentation,
      volumeOrWeight: item.presentation,
      color: item.color || 'Estándar',
      stock: Math.floor(Math.random() * 60) + 20, // initial plant stock
      minStock: 15,
      priceDistributor,
      priceWholesale,
      priceRetail,
      unitCost
    };
  });
}
