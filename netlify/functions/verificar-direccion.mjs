// Comprueba si una calle (y su número) existe en España usando CartoCiudad,
// el callejero gratuito del Instituto Geográfico Nacional. No necesita clave.
//
// Dónde va: en tu repo, en netlify/functions/verificar-direccion.mjs
// Cómo la llama la tienda:
//   /.netlify/functions/verificar-direccion?calle=Calle Mayor&numero=10&cp=28013&municipio=Madrid
//
// Respuestas:
//   { status: 'ok',    calle }          -> la calle y el número existen en ese código postal
//   { status: 'cp',    calle, cpReal }  -> el portal existe, pero con otro código postal
//   { status: 'calle', calle }          -> la calle existe, pero ese número no
//   { status: 'no',    sugerencias }    -> no se encontró la calle (con calles parecidas)
//   { status: 'skip' }                  -> CartoCiudad no respondió; la tienda sigue sin este paso
//
// Ojo: si CartoCiudad no tiene el número exacto, devuelve el portal MÁS CERCANO.
// Por eso comparamos siempre la calle y el número antes de dar nada por bueno.

const API = 'https://www.cartociudad.es/geocoder/api/geocoder';

const sinAcentos = (s = '') => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const PEQUENAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en', 'a', 'al', 'i', 'les', 'els', 'd', 'l', 'o', 'os', 'as']);
const TIPOS = /^(calle|avenida|plaza|paseo|carretera|travesia|ronda|glorieta|camino|urbanizacion)\s+/;
const bonito = (s = '') => s.toLowerCase().split(' ').filter(Boolean)
  .map((w, i) => (i && PEQUENAS.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// "CALLE" + "CALLE ROSARIO, GETAFE" -> "Calle Rosario"
function nombreCalle(c) {
  const via = String(c.tip_via || '').trim(), addr = String(c.address || '').split(',')[0].trim();
  const nv = sinAcentos(via), na = sinAcentos(addr);
  const palabras = bonito(via && na !== nv && !na.startsWith(nv + ' ') ? via + ' ' + addr : addr).split(' ');
  if (palabras.length > 2 && sinAcentos(palabras[0]) === sinAcentos(palabras[1])) palabras.shift();
  return palabras.join(' ');
}
const claves = s => sinAcentos(s).replace(TIPOS, '').replace(/['’]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !PEQUENAS.has(w));
function mismaCalle(a, b) {
  const x = claves(a), y = claves(b);
  return !!(x.length && y.length && (x.join(' ') === y.join(' ') || x.every(w => y.includes(w)) || y.every(w => x.includes(w))));
}
const partesNumero = n => { const m = String(n == null ? '' : n).trim().match(/^(\d+)\s*([a-z]?)/i); return m ? [+m[1], m[2].toLowerCase()] : null; };
function mismoPortal(c, numero) {
  const quiero = partesNumero(numero), tengo = partesNumero(c.portalNumber);
  if (!quiero || !tengo || quiero[0] !== tengo[0] || c.noNumber === true) return false;
  const letra = sinAcentos(c.extension || tengo[1] || '');
  return !quiero[1] || letra === quiero[1];
}

async function pedir(ruta) {
  const r = await fetch(API + ruta, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error('CartoCiudad respondió ' + r.status);
  return r.json();
}

function responder(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400' }
  });
}

export default async (req) => {
  const p = new URL(req.url).searchParams;
  const calle = (p.get('calle') || '').split(',')[0].slice(0, 120).trim();
  const numero = (p.get('numero') || '').replace(/[^0-9a-zA-Z]/g, '').slice(0, 6);
  const cp = (p.get('cp') || '').trim();
  const municipio = (p.get('municipio') || '').slice(0, 80).trim();
  if (calle.length < 2 || !/^\d{5}$/.test(cp)) return responder({ status: 'error', msg: 'Faltan la calle o el código postal.' }, 400);

  try {
    let vista = null;
    if (numero) {
      // 1) Búsqueda directa de "calle número, cp municipio"
      const f = await pedir('/find?q=' + encodeURIComponent(`${calle} ${numero}, ${cp} ${municipio}`));
      if (f && (f.type === 'portal' || f.type === 'callejero') && mismaCalle(nombreCalle(f), calle)) {
        vista = nombreCalle(f);
        if (f.type === 'portal' && mismoPortal(f, numero)) {
          if (!f.postalCode || String(f.postalCode) === cp) return responder({ status: 'ok', calle: vista });
          return responder({ status: 'cp', calle: vista, cpReal: String(f.postalCode) });
        }
      }
      // 2) Lista de portales de esa calle con ese número, dentro del código postal
      const lp = await pedir('/candidates?limit=12&q=' + encodeURIComponent(`${calle} ${numero}`) + '&cod_postal_filter=' + cp);
      const portales = (Array.isArray(lp) ? lp : []).filter(c => c.type === 'portal' && mismaCalle(nombreCalle(c), calle));
      const mismoCp = c => !c.postalCode || String(c.postalCode) === cp;
      const exacto = portales.find(c => mismoPortal(c, numero) && mismoCp(c)) || portales.find(c => mismoPortal(c, numero));
      if (exacto) return responder(mismoCp(exacto) ? { status: 'ok', calle: nombreCalle(exacto) } : { status: 'cp', calle: nombreCalle(exacto), cpReal: String(exacto.postalCode) });
      if (portales.length && !vista) vista = nombreCalle(portales[0]);
    }
    // 3) ¿Existe al menos la calle en ese código postal?
    const lista = await pedir('/candidates?limit=8&q=' + encodeURIComponent(calle) + '&cod_postal_filter=' + cp);
    const calles = (Array.isArray(lista) ? lista : []).filter(c => c.type === 'callejero' || c.type === 'portal');
    const igual = calles.find(c => mismaCalle(nombreCalle(c), calle));
    if (igual || vista) return responder({ status: 'calle', calle: igual ? nombreCalle(igual) : vista });
    return responder({ status: 'no', sugerencias: [...new Set(calles.map(nombreCalle))].slice(0, 4) });
  } catch (e) {
    // Si CartoCiudad tarda o falla, la tienda sigue con la comprobación de código postal y población.
    return responder({ status: 'skip' });
  }
};
