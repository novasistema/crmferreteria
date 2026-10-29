/**
 * Modo de funcionamiento del sistema.
 *
 * - MODO DEMO (VITE_MODO_DEMO=true): login con 1 clic, usuarios y claves de prueba visibles,
 *   datos de ejemplo cargados automáticamente. Usar SOLO en el deploy de demostración.
 * - MODO PRODUCCIÓN (variable sin definir o cualquier otro valor): login real con Firebase Auth
 *   (email + contraseña), sin claves comodín, portal de clientes con CUIT + código de acceso.
 *
 * Se define como variable de entorno (en Vercel: Settings → Environment Variables) y no como
 * opción en la base de datos, para que nadie pueda activar el modo demo desde afuera.
 */
export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === 'true';
