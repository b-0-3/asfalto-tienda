# Asfalto · tienda online

Tienda de ropa de prueba (estructura parecida a Bershka) hecha con HTML, CSS y JavaScript, sin frameworks, con un **panel de gestión** conectado a Firebase.

- Tienda: `https://b-0-3.github.io/asfalto-tienda/`
- Panel: `https://b-0-3.github.io/asfalto-tienda/admin.html`

## Qué hay aquí

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la tienda: portada, categorías, ficha de producto, cesta y compra. |
| `admin.html` | Panel de gestión: pedidos, precios y rebajas, stock por color y talla, códigos de descuento, envíos y equipo. |
| `catalogo.js` | Las prendas (nombre, colores, tallas, descripción…). Lo usan la tienda y el panel. |
| `firebase-config.js` | Las claves de tu proyecto de Firebase. Mientras valga `null`, la tienda funciona sola sin Firebase. |
| `firebase-tienda.js` | Conecta la tienda con Firebase: lee precios, stock y ajustes, comprueba códigos y guarda pedidos. |
| `firestore.rules` | Reglas de seguridad de la base de datos. Se pegan en Firebase. |
| `datos/codigos-postales.json` | Los 11.034 códigos postales de España con su municipio (INE). Sirve para comprobar la dirección. |
| `netlify/functions/verificar-direccion.mjs` | Comprueba calle y número con CartoCiudad (IGN). Solo funciona en Netlify. |

## Poner en marcha Firebase (una sola vez)

1. **console.firebase.google.com** → Crear proyecto (por ejemplo `asfalto-tienda`). Google Analytics no hace falta.
2. **Authentication** → Comenzar → Método de inicio de sesión → **Correo electrónico/contraseña** → Activar.
3. Authentication → Configuración → **Dominios autorizados** → añade `b-0-3.github.io`.
4. **Firestore Database** → Crear base de datos → ubicación `eur3 (Europa)` → **modo producción**.
5. Firestore → pestaña **Reglas** → borra lo que haya → pega todo `firestore.rules` → **Publicar**.
6. ⚙️ Configuración del proyecto → Tus apps → icono `</>` → registra la app (sin Hosting) → copia el bloque `firebaseConfig` y pégalo en `firebase-config.js` en lugar de `null`.
7. Abre `admin.html` → **Crea tu cuenta** (será la del dueño) → **Cargar catálogo inicial**.

Hazlo seguido: la primera cuenta que se crea en el panel se queda como dueño.

## Qué controla el panel

- **Pedidos**: llegan al momento, sin recargar. Los pasas de *nuevo → preparando → enviado (con nº de seguimiento) → entregado*. Si cancelas uno, las prendas vuelven al stock.
- **Productos**: precio, rebaja (−10 %, −20 %…), etiqueta («Nuevo», «Solo online»…), mostrar u ocultar, y unidades por color y talla.
- **Códigos**: porcentaje o importe fijo, pedido mínimo, fecha de caducidad, activar o pausar.
- **Ajustes** (solo dueño): precio de cada envío, a partir de cuánto es gratis, mensajes de la barra de arriba y cuándo avisar de «pocas unidades».
- **Equipo** (solo dueño): dar acceso a empleados. Los empleados no ven Ajustes ni Equipo.

Cuando alguien compra, la tienda guarda el pedido y resta las unidades a la vez. Si en ese momento ya no quedan, el pedido no se guarda y le avisa.

Las prendas nuevas (dibujo, colores y tallas) se añaden en `catalogo.js`.

## Cómo se comprueba la dirección

1. **Código postal, población y provincia**: con `datos/codigos-postales.json`.
2. **Calle y número**: con CartoCiudad (función de Netlify o directamente desde el navegador).
3. Si CartoCiudad no responde, la compra sigue con el paso 1.

## Modo demo

El pago todavía no cobra nada (falta conectar una pasarela como Stripe o Redsys). Cuando se conecte, el pedido lo debería crear el servidor después de cobrar, en vez del navegador.
