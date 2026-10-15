# Asfalto · tienda online

Tienda de ropa de prueba (estructura parecida a Bershka) hecha con HTML, CSS y JavaScript, sin frameworks.

## Qué hay aquí

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Toda la tienda: portada, categorías, ficha de producto, cesta y compra. |
| `datos/codigos-postales.json` | Los 11.034 códigos postales de España con su municipio (INE, mayo 2026). Sirve para comprobar la dirección. |
| `netlify/functions/verificar-direccion.mjs` | Comprueba si la calle y el número existen, preguntando a CartoCiudad (IGN). Solo funciona en Netlify. |
| `netlify.toml` | Le dice a Netlify dónde está la web y dónde están las funciones. |

## Cómo se comprueba la dirección

1. **Código postal, población y provincia**: con `datos/codigos-postales.json`. Funciona en cualquier sitio (GitHub Pages, Netlify…).
2. **Calle y número**: la web prueba primero la función de Netlify y, si no existe, pregunta directamente a CartoCiudad desde el navegador.
3. Si CartoCiudad no responde, la compra sigue con el paso 1.

## Ver la web

- **GitHub Pages**: Settings → Pages → rama `main`, carpeta `/ (root)`.
- **Netlify**: Add new site → Import from GitHub → elige este repo. No hace falta configurar nada más.

## Modo demo

El pago, el inicio de sesión y la newsletter no envían nada a ningún sitio. Los datos (cesta, favoritos, pedidos) se guardan solo en el navegador.
