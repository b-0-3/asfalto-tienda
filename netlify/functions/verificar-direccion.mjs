// Comprueba si una calle (y su número) existe en España usando CartoCiudad,
// el callejero gratuito del Instituto Geográfico Nacional. No necesita clave.
//
// Dónde va: en tu repo, en netlify/functions/verificar-direccion.mjs
// Cómo la llama la tienda:
//   /.netlify/functions/verificar-direccion?calle=Calle Mayor&numero=10&cp=28013&municipio=Madrid
//
// Respuestas:
//   { status: 'ok',    calle, numero, cp, municipio }   -> la calle y el número existen
//   { status: 'calle', calle, cp, municipio }           -> la calle existe en ese CP, el número no se encontró
//   { status: 'no',    sugerencias: [...] }              -> no se encontró la calle (con calles parecidas)
//   { status: 'skip' }                                   -> CartoCiudad no respondió; la tienda sigue sin este paso

const API = 'https://www.cartociudad.es/geocoder/api/geocoder';

const sinAcentos = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const PEQUENAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y']);
const bonito = (s = '') => s.toLowerCase().split(' ').filter(Boolean)
  .map((w, i) => (i && PEQUENAS.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const nombreCalle = c => bonito([c.tip_via, c.address].filter(Boolean).join(' '));
const TIPOS = /^(calle|avenida|plaza|paseo|carretera|travesia|ronda|glorieta|camino|urbanizacion)\s+/;

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
  const calle = (p.get('calle') || '').slice(0, 120).trim();
  const numero = (p.get('numero') || '').replace(/[^0-9a-zA-Z]/g, '').slice(0, 6);
  const cp = (p.get('cp') || '').trim();
  const municipio = (p.get('municipio') || '').slice(0, 80).trim();
  if (calle.length < 2 || !/^\d{5}$/.test(cp)) return responder({ status: 'error', msg: 'Faltan la calle o el código postal.' }, 400);

  try {
    // 1) ¿Existe el portal exacto (calle + número) en ese código postal?
    if (numero) {
      const f = await pedir('/find?q=' + encodeURIComponent(`${calle} ${numero}, ${cp} ${municipio}`));
      if (f && f.type === 'portal' && String(f.postalCode) === cp) {
        return responder({ status: 'ok', calle: nombreCalle(f), numero: String(f.portalNumber || numero), cp, municipio: f.muni });
      }
    }
    // 2) Si no, ¿existe al menos la calle en ese código postal?
    const lista = await pedir('/candidates?limit=6&q=' + encodeURIComponent(calle) + '&cod_postal_filter=' + cp);
    const calles = (Array.isArray(lista) ? lista : []).filter(c => c.type === 'callejero' || c.type === 'portal');
    const buscada = sinAcentos(calle).replace(TIPOS, '');
    const igual = calles.find(c => sinAcentos(c.address).replace(TIPOS, '') === buscada);
    if (igual) return responder({ status: 'calle', calle: nombreCalle(igual), cp, municipio: igual.muni });
    return responder({ status: 'no', sugerencias: [...new Set(calles.map(nombreCalle))].slice(0, 4) });
  } catch (e) {
    // Si CartoCiudad tarda o falla, la tienda sigue con la comprobación de código postal y población.
    return responder({ status: 'skip' });
  }
};
