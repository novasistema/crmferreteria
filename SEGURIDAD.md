# Seguridad, modo demo y alta de clientes

El sistema funciona en dos modos, según la variable de entorno `VITE_MODO_DEMO`:

| | Modo demo (`VITE_MODO_DEMO=true`) | Modo producción (sin la variable) |
|---|---|---|
| Login | Usuarios con 1 clic y claves visibles | Email y contraseña reales (Firebase Auth) |
| Claves comodín (`admin`, `1234`…) | Sí | No existen |
| Datos de ejemplo | Se cargan solos | Sistema vacío |
| Portal de clientes | Solo CUIT | CUIT + código de 6 números |
| App de preventistas | Botón en el login | Solo con usuario logueado (rol Vendedor de Calle) |
| Reglas de Firestore | `firestore.demo.rules` | `firestore.rules` |

El modo se elige en Vercel y no desde la app, para que nadie pueda activar el modo demo desde afuera.

---

## 1. Demo pública (la que mostrás a posibles compradores)

1. En Vercel, proyecto de la demo → **Settings → Environment Variables**: agregar `VITE_MODO_DEMO` = `true`.
2. **Deployments → Redeploy** (las variables se aplican en el próximo deploy).
3. En Firebase Console del proyecto de la demo → **Firestore → Reglas**: pegar el contenido de
   `firestore.demo.rules` y **Publicar**. Requiere que esté habilitado el acceso **Anónimo** en
   Authentication (ya lo está en el proyecto de AI Studio).

> La demo sigue siendo editable por cualquiera que la abra: no cargues datos reales ahí.

## 2. Cada cliente nuevo

Cada cliente tiene **su propio proyecto de Firebase** y **su propio proyecto de Vercel**, con el mismo repositorio.
Así los datos nunca se mezclan y podés cortarle el servicio a uno sin afectar a los demás.

### a) Firebase
1. [console.firebase.google.com](https://console.firebase.google.com) → **Agregar proyecto** (ej: `ferreteria-sanmartin`).
2. **Firestore Database → Crear base de datos** (ubicación `southamerica-east1`, São Paulo). Modo producción.
3. **Firestore → Reglas**: pegar el contenido de `firestore.rules` → **Publicar**.
4. **Authentication → Comenzar → Sign-in method → Correo electrónico/contraseña → Habilitar**.
5. **Configuración del proyecto → Tus apps → Web (`</>`)** → registrar la app y copiar los datos de `firebaseConfig`.

### b) Vercel
1. **Add New → Project** → importar este mismo repositorio.
2. En **Environment Variables** cargar (con los datos del paso a.5):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - **No** agregar `VITE_MODO_DEMO`.
3. Deploy.

### c) Primer ingreso (hacelo vos, apenas termina el deploy)
1. Abrí la URL nueva: aparece la pantalla **Configuración inicial** (una sola vez).
2. Creá tu cuenta (queda como **Creador del Sistema**, con control total y oculto para el cliente).
3. En **Usuarios → Nuevo Usuario** creá al dueño del negocio con rol **Gerente General & Admin**
   y una contraseña inicial. Él puede cambiarla con "¿Olvidaste tu contraseña?" en el login.
4. Recién ahí pasale el link al cliente.

> Hacé el paso c) enseguida: la pantalla de configuración inicial la puede usar el primero que entre.

## 3. Uso diario

- **Usuarios del personal:** los crea un administrador en **Usuarios**. Las contraseñas no se guardan en la
  base de datos. "Enviar email de clave" le manda al usuario un link para crear una contraseña nueva.
  "Desactivar" le bloquea el acceso al instante.
- **Portal de clientes:** en **Usuarios → Accesos al Portal de Clientes** buscás al cliente, tocás
  **Generar código** y le pasás el código de 6 números. Si lo pierde, **Nuevo código** (el anterior deja de
  andar). **Quitar** le saca el acceso.
- **Creador del sistema:** un administrador del cliente no puede ver ni modificar tu usuario creador.
  Para cortar el servicio por falta de pago podés desactivar los usuarios del cliente, o pausar el
  proyecto de Vercel.

## 4. Qué protegen las reglas (`firestore.rules`)

- Sin iniciar sesión: solo se puede leer el logo/nombre de la empresa (`public_info`) y si el sistema
  ya fue configurado. Ningún otro dato.
- Personal activo: lee y escribe los datos del negocio.
- Solo administradores: usuarios y configuración de la empresa.
- Cliente del portal: solo su ficha, sus pedidos y los premios; puede canjear premios con sus propios puntos.
- Una cuenta de Firebase sin perfil en `app_users` o `portal_access` no ve nada, aunque exista.

Después de publicar las reglas podés probarlas en **Firestore → Reglas → Zona de pruebas (Rules Playground)**.

## 5. Pendiente antes de vender

- **Facturación ARCA:** el módulo actual genera un CAE de prueba. Hay que conectarlo al servicio real
  (WSAA/WSFE) en la instalación de cada cliente que vaya a facturar.
- **Marca:** varios textos y datos de ejemplo dicen "Colorear Pinturas". Se reemplazan desde
  Configuración, pero conviene revisar los textos fijos antes de entregar.
