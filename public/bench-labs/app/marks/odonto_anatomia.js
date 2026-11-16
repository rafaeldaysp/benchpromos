/* Bench Marks · anatomia sintética da boca (teste pesado de Odontologia)
 *
 * A mesma boca é usada na placa de vídeo (tomografia 3D e prótese) e no processador (escaneamento e fatias):
 * 32 dentes com esmalte, dentina, polpa e raízes, mandíbula, maxila com palato, coluna, pele e via aérea.
 * Coordenadas de -1 a 1: x da esquerda para a direita, y para cima, z de trás para a frente do rosto.
 * Densidade de 0 (ar) a 1 (esmalte), como os tons de cinza de uma tomografia (CBCT).
 */

export const arcoInf = x => .55 - 1.25 * x * x;      // curva da arcada de baixo, vista de cima
export const arcoSup = x => .58 - 1.18 * x * x;

// meia arcada, do centro para trás: largura ao longo da arcada, profundidade (bochecha-língua) e altura da coroa
const TIPOS = [
  {nome: 'Incisivo central', w: .085, d: .06, h: .1},
  {nome: 'Incisivo lateral', w: .07, d: .058, h: .092},
  {nome: 'Canino', w: .08, d: .07, h: .1},
  {nome: '1º pré-molar', w: .072, d: .08, h: .082},
  {nome: '2º pré-molar', w: .07, d: .08, h: .08},
  {nome: '1º molar', w: .105, d: .1, h: .075},
  {nome: '2º molar', w: .098, d: .098, h: .072},
  {nome: '3º molar', w: .09, d: .092, h: .068},
];

function xNoArco(s, k) {                                // x em que o comprimento da curva, a partir do centro, vale s
  let x = 0, acc = 0;
  const dx = .0005;
  while (acc < s) { acc += Math.sqrt(1 + (2 * k * x) ** 2) * dx; x += dx; }
  return x;
}

/** 32 dentes: de 0 a 15 a arcada de baixo (esquerda e direita, do incisivo ao 3º molar), de 16 a 31 a de cima. */
export const DENTES = (() => {
  const out = [];
  for (const [sup, k, z0, yc] of [[0, 1.25, .55, -.07], [1, 1.18, .58, .07]]) {
    for (const lado of [-1, 1]) {
      let s = .004;
      TIPOS.forEach((T, j) => {
        const sc = s + T.w / 2;
        s += T.w + .006;
        const x = lado * xNoArco(sc, k), z = z0 - k * x * x, dzdx = -2 * k * x, l = Math.hypot(1, dzdx);
        out.push({sup, lado, tipo: j, nome: T.nome, x, z, yc, tx: 1 / l, tz: dzdx / l,
                  rw: T.w / 2, rh: T.h / 2 * (sup ? 1.05 : 1), rd: T.d / 2 * (sup ? 1.08 : 1)});
      });
    }
  }
  return out;
})();

// ------------------------------------------------------------------ ruído (igual ao da placa)
const fr = v => v - Math.floor(v);
function hash3(x, y, z) {
  let qx = fr(x * .1031), qy = fr(y * .1030), qz = fr(z * .0973);
  const d = qx * (qy + 33.33) + qy * (qx + 33.33) + qz * (qz + 33.33);
  qx += d; qy += d; qz += d;
  return fr((qx + qy) * qz);
}
function ruido(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy),
           l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy), fz);
}

// ------------------------------------------------------------------ partes
function cuspide(qx, qz, tipo) {
  if (tipo >= 5) return -.12 * Math.cos(qx * Math.PI * 1.6) * Math.cos(qz * Math.PI * 1.6);   // molares: 4 cúspides
  if (tipo >= 3) return -.1 * Math.cos(qz * Math.PI * 1.5);                                  // pré-molares: 2
  if (tipo === 2) return .12 * Math.abs(qx);                                                  // canino: ponta
  return .25 * qz * qz;                                                                       // incisivos: borda reta
}

function dente(px, py, pz, D) {
  const dx = px - D.x, dz = pz - D.z;
  const lt = dx * D.tx + dz * D.tz, ln = -dx * D.tz + dz * D.tx, ly = py - D.yc;
  if (Math.abs(lt) > D.rw * 1.3 || Math.abs(ln) > D.rd * 1.3) return 0;
  const qx = lt / D.rw, qy = ly / D.rh, qz = ln / D.rd;
  let e = Math.hypot(qx, qy, qz);
  const oc = (D.sup ? -ly : ly) / D.rh;                  // > 0 na direção da mastigação
  if (oc > .2) e += cuspide(qx, qz, D.tipo) * (oc - .2);
  let v = 0;
  if (e < 1) v = e > .8 ? 1 : e < .34 ? .26 : .74;       // esmalte, dentina e polpa
  const ry = D.sup ? ly : -ly;                           // > 0 em direção à raiz
  if (ry > 0 && ry < .3) {
    const rr = Math.min(D.rw, D.rd) * .8 + (.012 - Math.min(D.rw, D.rd) * .8) * ry / .3;
    const raiz = (ox) => { const d = Math.hypot(lt - ox, ln); return d < rr ? (d < rr * .28 ? .26 : .7) : 0; };
    const r = D.tipo >= 5 ? Math.max(raiz(-D.rw * .45), raiz(D.rw * .45)) : raiz(0);
    if (r) v = Math.max(v, r);
  }
  return v;
}

function mandibula(px, py, pz) {
  let v = 0;
  if (Math.abs(px) < .74) {
    const dz = (pz - arcoInf(px)) / Math.sqrt(1 + 6.25 * px * px);
    const e = Math.hypot(dz / .1, (py + .34) / .18);
    if (e < 1) v = e > .82 ? .62 : .36 + .1 * ruido(px * 40, py * 40, pz * 40);
  }
  const rx = Math.abs(px) - .7;
  if (Math.abs(rx) < .045 && pz < .1 && pz > -.32 && py > -.45 && py < .12) v = Math.max(v, Math.abs(rx) > .03 ? .6 : .42);
  return v;
}

function maxila(px, py, pz) {
  let v = 0;
  if (Math.abs(px) < .72) {
    const dz = (pz - arcoSup(px)) / Math.sqrt(1 + 5.57 * px * px);
    const e = Math.hypot(dz / .11, (py - .32) / .14);
    if (e < 1) v = e > .8 ? .6 : .38 + .08 * ruido(px * 35, py * 35, pz * 35);
  }
  if (Math.abs(px) < .6 && pz < arcoSup(px) && pz > -.05 && Math.abs(py - .34) < .025) v = Math.max(v, .5);   // palato
  return v;
}

function coluna(px, py, pz) {
  const d = Math.hypot(px, pz + .58);
  if (d < .12 && py < .3) { const s = fr((py + 1) / .19); return s > .12 ? (d > .1 ? .62 : .4) : .22; }
  return 0;
}

function tecido(px, py, pz) {
  const e = Math.hypot(px / .84, py / .98, pz / .8);
  if (e > 1) return 0;
  if (Math.hypot(px, pz + .34) < .07 && py < .25) return 0;                    // via aérea
  return .13 + .02 * ruido(px * 12, py * 12, pz * 12);
}

/** Densidade num ponto (0 a 1). */
export function densidade(px, py, pz) {
  let v = Math.max(tecido(px, py, pz), mandibula(px, py, pz), maxila(px, py, pz), coluna(px, py, pz));
  if (Math.abs(py) < .45 && pz > -.15) for (let i = 0; i < 32; i++) { const d = dente(px, py, pz, DENTES[i]); if (d > v) v = d; }
  v += (hash3(px * 512, py * 512, pz * 512) - .5) * .05;                       // granulado da tomografia
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Altura da superfície da arcada de baixo (dentes e gengiva) vista de cima, para o escaneamento. */
export function alturaArcada(px, pz) {
  let y = -.2;
  if (Math.abs(px) < .78) {
    const d = Math.abs(pz - arcoInf(px)) / Math.sqrt(1 + 6.25 * px * px);
    if (d < .12) y = -.13 + .03 * (1 - (d / .12) ** 2);                          // gengiva
  }
  for (let i = 0; i < 16; i++) {
    const D = DENTES[i], dx = px - D.x, dz = pz - D.z;
    const lt = dx * D.tx + dz * D.tz, ln = -dx * D.tz + dz * D.tx;
    const qx = lt / D.rw, qz = ln / D.rd, q = qx * qx + qz * qz;
    if (q < 1) { const t = D.yc + D.rh * Math.sqrt(1 - q) * (1 - Math.max(0, cuspide(qx, qz, D.tipo)) * .6); if (t > y) y = t; }
  }
  return y;
}

// ------------------------------------------------------------------ o mesmo, em WGSL (para a placa de vídeo)
const f = v => (Math.round(v * 1e5) / 1e5).toFixed(5);
export const WGSL_ANATOMIA = /* wgsl */`
const DI = array<vec4f, 32>(${DENTES.map(D => `vec4f(${f(D.x)}, ${f(D.z)}, ${f(D.tx)}, ${f(D.tz)})`).join(', ')});
const DR = array<vec4f, 32>(${DENTES.map(D => `vec4f(${f(D.rw)}, ${f(D.rh)}, ${f(D.rd)}, ${D.tipo}.)`).join(', ')});

fn fr1(v: f32) -> f32 { return v - floor(v); }
fn hash3(x: f32, y: f32, z: f32) -> f32 {
  var qx = fr1(x * .1031); var qy = fr1(y * .1030); var qz = fr1(z * .0973);
  let d = qx * (qy + 33.33) + qy * (qx + 33.33) + qz * (qz + 33.33);
  qx += d; qy += d; qz += d;
  return fr1((qx + qy) * qz);
}
fn ruido(p: vec3f) -> f32 {
  let i = floor(p); var t = p - i; t = t * t * (3. - 2. * t);
  let a = mix(mix(hash3(i.x, i.y, i.z), hash3(i.x + 1., i.y, i.z), t.x), mix(hash3(i.x, i.y + 1., i.z), hash3(i.x + 1., i.y + 1., i.z), t.x), t.y);
  let b = mix(mix(hash3(i.x, i.y, i.z + 1.), hash3(i.x + 1., i.y, i.z + 1.), t.x), mix(hash3(i.x, i.y + 1., i.z + 1.), hash3(i.x + 1., i.y + 1., i.z + 1.), t.x), t.y);
  return mix(a, b, t.z);
}
fn arcoInf(x: f32) -> f32 { return .55 - 1.25 * x * x; }
fn arcoSup(x: f32) -> f32 { return .58 - 1.18 * x * x; }
fn cuspide(qx: f32, qz: f32, tipo: f32) -> f32 {
  if (tipo > 4.5) { return -.12 * cos(qx * 5.0265) * cos(qz * 5.0265); }
  if (tipo > 2.5) { return -.1 * cos(qz * 4.7124); }
  if (tipo > 1.5) { return .12 * abs(qx); }
  return .25 * qz * qz;
}
fn raiz(lt: f32, ln: f32, ox: f32, rr: f32) -> f32 {
  let d = length(vec2f(lt - ox, ln));
  if (d < rr) { return select(.7, .26, d < rr * .28); }
  return 0.;
}
fn dente(p: vec3f, i: u32) -> f32 {
  let a = DI[i]; let r = DR[i];
  let sup = i >= 16u;
  let yc = select(-.07, .07, sup);
  let dx = p.x - a.x; let dz = p.z - a.y;
  let lt = dx * a.z + dz * a.w; let ln = -dx * a.w + dz * a.z; let ly = p.y - yc;
  if (abs(lt) > r.x * 1.3 || abs(ln) > r.z * 1.3) { return 0.; }
  let qx = lt / r.x; let qy = ly / r.y; let qz = ln / r.z;
  var e = length(vec3f(qx, qy, qz));
  let oc = select(ly, -ly, sup) / r.y;
  if (oc > .2) { e += cuspide(qx, qz, r.w) * (oc - .2); }
  var v = 0.;
  if (e < 1.) { v = select(select(.74, .26, e < .34), 1., e > .8); }
  let ry = select(-ly, ly, sup);
  if (ry > 0. && ry < .3) {
    let m = min(r.x, r.z) * .8;
    let rr = m + (.012 - m) * ry / .3;
    var rz = raiz(lt, ln, 0., rr);
    if (r.w > 4.5) { rz = max(raiz(lt, ln, -r.x * .45, rr), raiz(lt, ln, r.x * .45, rr)); }
    v = max(v, rz);
  }
  return v;
}
fn mandibula(p: vec3f) -> f32 {
  var v = 0.;
  if (abs(p.x) < .74) {
    let dz = (p.z - arcoInf(p.x)) / sqrt(1. + 6.25 * p.x * p.x);
    let e = length(vec2f(dz / .1, (p.y + .34) / .18));
    if (e < 1.) { v = select(.36 + .1 * ruido(p * 40.), .62, e > .82); }
  }
  let rx = abs(p.x) - .7;
  if (abs(rx) < .045 && p.z < .1 && p.z > -.32 && p.y > -.45 && p.y < .12) { v = max(v, select(.42, .6, abs(rx) > .03)); }
  return v;
}
fn maxila(p: vec3f) -> f32 {
  var v = 0.;
  if (abs(p.x) < .72) {
    let dz = (p.z - arcoSup(p.x)) / sqrt(1. + 5.57 * p.x * p.x);
    let e = length(vec2f(dz / .11, (p.y - .32) / .14));
    if (e < 1.) { v = select(.38 + .08 * ruido(p * 35.), .6, e > .8); }
  }
  if (abs(p.x) < .6 && p.z < arcoSup(p.x) && p.z > -.05 && abs(p.y - .34) < .025) { v = max(v, .5); }
  return v;
}
fn coluna(p: vec3f) -> f32 {
  let d = length(vec2f(p.x, p.z + .58));
  if (d < .12 && p.y < .3) { let s = fr1((p.y + 1.) / .19); return select(.22, select(.4, .62, d > .1), s > .12); }
  return 0.;
}
fn tecido(p: vec3f) -> f32 {
  let e = length(p / vec3f(.84, .98, .8));
  if (e > 1.) { return 0.; }
  if (length(vec2f(p.x, p.z + .34)) < .07 && p.y < .25) { return 0.; }
  return .13 + .02 * ruido(p * 12.);
}
fn densidade(p: vec3f) -> f32 {
  var v = max(max(tecido(p), mandibula(p)), max(maxila(p), coluna(p)));
  if (abs(p.y) < .45 && p.z > -.15) { for (var i = 0u; i < 32u; i++) { v = max(v, dente(p, i)); } }
  v += (hash3(p.x * 512., p.y * 512., p.z * 512.) - .5) * .05;
  return clamp(v, 0., 1.);
}
`;
