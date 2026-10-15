// ─────────────────────────────────────────────────────────────────────────────
//  Conexión con Firebase
//
//  1) En Firebase: ⚙️ Configuración del proyecto → «Tus apps» → app web </>.
//  2) Copia el bloque firebaseConfig y pégalo abajo, en lugar de null.
//
//  Estas claves NO son secretas: Firebase las pone en todas las webs que lo usan.
//  Lo que protege tus datos son las reglas de firestore.rules.
//
//  Mientras esto valga null, la tienda funciona sola con el catálogo de catalogo.js
//  (sin stock real, sin pedidos guardados) y el panel te enseña cómo conectarlo.
// ─────────────────────────────────────────────────────────────────────────────
window.ASF_FIREBASE = null;

/* Ejemplo de cómo queda (los valores son inventados):
window.ASF_FIREBASE = {
  apiKey: "AQUÍ-VA-TU-APIKEY",
  authDomain: "asfalto-tienda.firebaseapp.com",
  projectId: "asfalto-tienda",
  storageBucket: "asfalto-tienda.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
*/
