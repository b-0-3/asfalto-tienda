// Conecta la tienda con Firebase (Firestore):
//   · lee precios, stock y ajustes que cambias en el panel (admin.html)
//   · comprueba los códigos de descuento
//   · guarda los pedidos y descuenta el stock
// Si firebase-config.js está vacío, o Firebase no responde, la tienda sigue
// funcionando con el catálogo local (catalogo.js).

const VERSION = '10.12.2';
const cfg = window.ASF_FIREBASE;

window.asfaltoFBListo = (cfg && cfg.apiKey && cfg.projectId)
  ? arrancar().catch(e => { console.warn('[Asfalto] Firebase no ha cargado; la tienda sigue con el catálogo local.', e); return null; })
  : Promise.resolve(null);

async function arrancar() {
  const [{ initializeApp }, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore.js`)
  ]);
  const db = fs.getFirestore(initializeApp(cfg));

  // Trae todo lo que la tienda necesita y se lo pasa con el evento «asfalto:datos»
  async function cargar() {
    const [pr, sk, aj] = await Promise.all([
      fs.getDocs(fs.collection(db, 'productos')),
      fs.getDocs(fs.collection(db, 'stock')),
      fs.getDoc(fs.doc(db, 'ajustes', 'tienda'))
    ]);
    const productos = {};
    pr.forEach(d => { productos[d.id] = d.data(); });
    const stock = {};
    sk.forEach(d => { const n = d.data().n; if (typeof n === 'number') stock[d.id] = n; });
    const datos = { productos, stock: sk.empty ? null : stock, ajustes: aj.exists() ? aj.data() : null };
    window.dispatchEvent(new CustomEvent('asfalto:datos', { detail: datos }));
    return datos;
  }

  const api = {
    // Devuelve el código de descuento tal cual está en Firestore, o null si no existe
    async codigo(code) {
      const s = await fs.getDoc(fs.doc(db, 'codigos', code));
      return s.exists() ? s.data() : null;
    },
    // Guarda el pedido y resta las unidades en una sola operación:
    // o sale todo bien, o no se guarda nada (así nunca vendes algo sin stock).
    async guardarPedido(pedido, cambios) {
      const b = fs.writeBatch(db);
      b.set(fs.doc(db, 'pedidos', pedido.numero), { ...pedido, fecha: fs.serverTimestamp() });
      for (const c of cambios) b.update(fs.doc(db, 'stock', c.key), { n: fs.increment(-c.qty), ultimoPedido: pedido.numero });
      await b.commit();
      cargar().catch(() => { });
    },
    recargar: cargar
  };
  window.asfaltoFB = api;
  await cargar();
  return api;
}
