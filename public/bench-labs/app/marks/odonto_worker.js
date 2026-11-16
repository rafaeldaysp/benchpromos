/* Bench Marks · Odontologia no processador (teste pesado). Roda em workers, um por núcleo.
 *
 *   scan   · escaneamento intraoral ao vivo: cada imagem 3D da ponteira (23 mil pontos) é alinhada ao modelo já
 *            montado (ICP, como os scanners fazem para "costurar" as imagens) e somada à malha (fusão em voxels, TSDF).
 *   fatias · cortes da tomografia com espessura (axial, coronal, sagital, transversal e panorâmica), como no
 *            planejamento de implantes e na reconstrução panorâmica.
 *
 * O volume e a arcada vêm de odonto_anatomia.js, os mesmos da parte feita na placa de vídeo.
 */
import {DENTES, arcoInf, alturaArcada, densidade} from './odonto_anatomia.js';

const agora = () => performance.now();
let semente = 1;
const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
const gauss = () => (rnd() + rnd() + rnd() - 1.5) * .8;

// ================================================================== escaneamento intraoral
const HX0 = -.8, HZ0 = -.15, HR = .002, HW = 800, HH = 452;           // mapa de altura da arcada (vista de cima)
function mapaAltura() {
  const m = new Float32Array(HW * HH);
  for (let j = 0; j < HH; j++) for (let i = 0; i < HW; i++) m[j * HW + i] = alturaArcada(HX0 + i * HR, HZ0 + j * HR);
  return m;
}
function altura(m, x, z) {
  let fx = (x - HX0) / HR, fz = (z - HZ0) / HR;
  fx = fx < 0 ? 0 : fx > HW - 1.001 ? HW - 1.001 : fx; fz = fz < 0 ? 0 : fz > HH - 1.001 ? HH - 1.001 : fz;
  const i = fx | 0, j = fz | 0, a = fx - i, b = fz - j, k = j * HW + i;
  return (m[k] * (1 - a) + m[k + 1] * a) * (1 - b) + (m[k + HW] * (1 - a) + m[k + HW + 1] * a) * b;
}

const FW = 176, FH = 132, NP = FW * FH, CAMPO_W = .15, CAMPO_H = .11;    // pontos por imagem 3D e campo da ponteira
// modelo para o alinhamento: altura média da superfície já escaneada, numa grade fina vista de cima
const MC = .002, MX0 = -.8, MZ0 = -.15, MGX = 800, MGZ = 452;
// fusão em voxels (TSDF)
const VC = .008, VX0 = -.8, VY0 = -.25, VZ0 = -.15, VGX = 200, VGY = 46, VGZ = 114, TRUNC = .024;

function resolver6(A, b) {                                            // A x = b por eliminação de Gauss (A 6x6 em vetor)
  const n = 6, M = new Float64Array(42);
  for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) M[i * 7 + j] = A[i * 6 + j] + (i === j ? 1e-6 : 0); M[i * 7 + 6] = b[i]; }
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r * 7 + c]) > Math.abs(M[p * 7 + c])) p = r;
    if (p !== c) for (let k = 0; k < 7; k++) { const t = M[c * 7 + k]; M[c * 7 + k] = M[p * 7 + k]; M[p * 7 + k] = t; }
    const d = M[c * 7 + c] || 1e-12;
    for (let r = c + 1; r < n; r++) { const f = M[r * 7 + c] / d; if (f) for (let k = c; k < 7; k++) M[r * 7 + k] -= f * M[c * 7 + k]; }
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) { let s = M[i * 7 + 6]; for (let j = i + 1; j < n; j++) s -= M[i * 7 + j] * x[j]; x[i] = s / (M[i * 7 + i] || 1e-12); }
  return x;
}
function rodrigues(w) {                                               // matriz de rotação de um vetor de ângulo pequeno
  const t = Math.hypot(w[0], w[1], w[2]);
  if (t < 1e-12) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const k = [w[0] / t, w[1] / t, w[2] / t], c = Math.cos(t), s = Math.sin(t), v = 1 - c;
  return [c + k[0] * k[0] * v, k[0] * k[1] * v - k[2] * s, k[0] * k[2] * v + k[1] * s,
          k[1] * k[0] * v + k[2] * s, c + k[1] * k[1] * v, k[1] * k[2] * v - k[0] * s,
          k[2] * k[0] * v - k[1] * s, k[2] * k[1] * v + k[0] * s, c + k[2] * k[2] * v];
}
const mulR = (a, b) => { const o = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return o; };

function escanear({segundos = 60, fase = 0, visual = false, id = 0}, avisar) {
  semente = 1 + id * 7919;
  const hm = mapaAltura();
  const mAlt = new Float32Array(MGX * MGZ), mPeso = new Uint8Array(MGX * MGZ);
  const tsdf = new Float32Array(VGX * VGY * VGZ).fill(1), peso = new Uint8Array(VGX * VGY * VGZ);
  const med = new Float32Array(NP * 3), alin = new Float32Array(NP * 3);
  const A = new Float64Array(36), b = new Float64Array(6);
  let s = fase % 1, dir = 1, passada = 0, quadros = 0, erroSoma = 0, erroN = 0, ultimoAviso = agora();
  let erroR = [1, 0, 0, 0, 1, 0, 0, 0, 1], erroT = [0, 0, 0];
  const erroW = [0, 0, 0];
  let R = [1, 0, 0, 0, 1, 0, 0, 0, 1], T = [0, 0, 0];               // alinhamento da imagem anterior: ponto de partida da próxima
  const t0 = agora();
  const somar = (x, y, z) => {                                       // a superfície do modelo é a média das imagens já alinhadas
    const gx = Math.round((x - MX0) / MC), gz = Math.round((z - MZ0) / MC);
    if (gx < 0 || gz < 0 || gx >= MGX || gz >= MGZ) return;
    const c = gz * MGX + gx, w = mPeso[c];
    mAlt[c] = (mAlt[c] * w + y) / (w + 1); if (w < 30) mPeso[c] = w + 1;
  };
  while (agora() - t0 < segundos * 1000) {
    // ---- posição da ponteira: vai e volta ao longo da arcada, por fora, por cima e por dentro dos dentes
    s += dir * .0045;
    if (s > 1 || s < 0) { dir = -dir; s = Math.max(0, Math.min(1, s)); passada++; }
    const lado = [0, -.035, .035][passada % 3];
    const px = -.64 + 1.28 * s, d = Math.hypot(1, -2.5 * px), tx = 1 / d, tz = -2.5 * px / d;
    const cx = px - tz * lado, cz = arcoInf(px) + tx * lado, ang = Math.atan2(tz, tx) + Math.sin(quadros * .05) * .12;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    // ---- a mão treme: o scanner não sabe exatamente onde a ponteira está (erro que o alinhamento corrige)
    erroW[0] = erroW[0] * .97 + gauss() * .004; erroW[1] = erroW[1] * .97 + gauss() * .01; erroW[2] = erroW[2] * .97 + gauss() * .004;
    erroR = rodrigues(erroW); erroT = erroT.map(v => v * .97 + gauss() * .0012);
    // ---- imagem 3D: pontos da superfície vistos pela ponteira, com ruído do sensor
    const cy = altura(hm, cx, cz);
    for (let j = 0, k = 0; j < FH; j++) for (let i = 0; i < FW; i++, k++) {
      const u = (i / (FW - 1) - .5) * CAMPO_W, v = (j / (FH - 1) - .5) * CAMPO_H;
      const x = cx + u * ca - v * sa, z = cz + u * sa + v * ca, y = altura(hm, x, z) + gauss() * .0012;
      const lx = x - cx, ly = y - cy, lz = z - cz;                       // no referencial da ponteira, com o erro
      med[k * 3] = erroR[0] * lx + erroR[1] * ly + erroR[2] * lz + erroT[0];
      med[k * 3 + 1] = erroR[3] * lx + erroR[4] * ly + erroR[5] * lz + erroT[1];
      med[k * 3 + 2] = erroR[6] * lx + erroR[7] * ly + erroR[8] * lz + erroT[2];
    }
    // ---- alinhamento (ICP ponto a ponto): encaixa a imagem no que já foi escaneado
    if (quadros > 0) {
      for (let it = 0; it < 6; it++) {
        A.fill(0); b.fill(0);
        let pares = 0;
        for (let k = 0; k < NP; k += 2) {
          const mx = med[k * 3], my = med[k * 3 + 1], mz = med[k * 3 + 2];
          const qx0 = R[0] * mx + R[1] * my + R[2] * mz + T[0], qy0 = R[3] * mx + R[4] * my + R[5] * mz + T[1], qz0 = R[6] * mx + R[7] * my + R[8] * mz + T[2];
          // ponto a plano: compara a altura com a superfície do modelo naquele lugar (e a inclinação dela)
          const fx = (qx0 + cx - MX0) / MC, fz = (qz0 + cz - MZ0) / MC, gx = fx | 0, gz = fz | 0;
          if (gx < 1 || gz < 1 || gx >= MGX - 2 || gz >= MGZ - 2) continue;
          const c = gz * MGX + gx;
          if (!mPeso[c] || !mPeso[c + 1] || !mPeso[c + MGX] || !mPeso[c + MGX + 1]) continue;
          const a = fx - gx, bb = fz - gz;
          const h00 = mAlt[c], h10 = mAlt[c + 1], h01 = mAlt[c + MGX], h11 = mAlt[c + MGX + 1];
          const H = (h00 * (1 - a) + h10 * a) * (1 - bb) + (h01 * (1 - a) + h11 * a) * bb;
          const gxH = ((h10 - h00) * (1 - bb) + (h11 - h01) * bb) / MC, gzH = ((h01 - h00) * (1 - a) + (h11 - h10) * a) / MC;
          const il = 1 / Math.sqrt(gxH * gxH + 1 + gzH * gzH), nx = -gxH * il, ny = il, nz = -gzH * il;
          const r = (qy0 + cy - H) * ny;
          if (r > .01 || r < -.01) continue;
          pares++;
          const j0 = qy0 * nz - qz0 * ny, j1 = qz0 * nx - qx0 * nz, j2 = qx0 * ny - qy0 * nx;   // p × n
          const J = [j0, j1, j2, nx, ny, nz];
          for (let i = 0; i < 6; i++) { const ji = J[i]; b[i] += ji * r; for (let j = i; j < 6; j++) A[i * 6 + j] += ji * J[j]; }
        }
        if (pares < 50) break;
        for (let i = 0; i < 6; i++) for (let j = 0; j < i; j++) A[i * 6 + j] = A[j * 6 + i];
        const x = resolver6(A, b.map(v => -v));
        const dR = rodrigues([x[0], x[1], x[2]]);
        R = mulR(dR, R);
        T = [dR[0] * T[0] + dR[1] * T[1] + dR[2] * T[2] + x[3], dR[3] * T[0] + dR[4] * T[1] + dR[5] * T[2] + x[4], dR[6] * T[0] + dR[7] * T[1] + dR[8] * T[2] + x[5]];
        if (Math.hypot(x[0], x[1], x[2]) < 1e-5 && Math.hypot(x[3], x[4], x[5]) < 1e-6) break;
      }
    } else {
      // primeira imagem: o scanner parte da posição que acha que está
      R = [erroR[0], erroR[3], erroR[6], erroR[1], erroR[4], erroR[7], erroR[2], erroR[5], erroR[8]];
      T = [-(R[0] * erroT[0] + R[1] * erroT[1] + R[2] * erroT[2]), -(R[3] * erroT[0] + R[4] * erroT[1] + R[5] * erroT[2]), -(R[6] * erroT[0] + R[7] * erroT[1] + R[8] * erroT[2])];
    }
    // ---- soma a imagem alinhada: fusão em voxels e novos pontos no modelo
    let errQ = 0;
    for (let k = 0; k < NP; k++) {
      const mx = med[k * 3], my = med[k * 3 + 1], mz = med[k * 3 + 2];
      const x = R[0] * mx + R[1] * my + R[2] * mz + T[0] + cx, y = R[3] * mx + R[4] * my + R[5] * mz + T[1] + cy, z = R[6] * mx + R[7] * my + R[8] * mz + T[2] + cz;
      alin[k * 3] = x; alin[k * 3 + 1] = y; alin[k * 3 + 2] = z;
      if ((k & 63) === 0) errQ += Math.abs(y - altura(hm, x, z));
      const ix = ((x - VX0) / VC) | 0, iz = ((z - VZ0) / VC) | 0;
      if (ix < 0 || iz < 0 || ix >= VGX || iz >= VGZ) continue;
      const iy = ((y - VY0) / VC) | 0;
      for (let dy = -4; dy <= 4; dy++) {
        const Y = iy + dy; if (Y < 0 || Y >= VGY) continue;
        const v = (iz * VGY + Y) * VGX + ix, sd = (y - (VY0 + (Y + .5) * VC)) / TRUNC, sdf = sd > 1 ? 1 : sd < -1 ? -1 : sd, w = peso[v];
        tsdf[v] = (tsdf[v] * w + sdf) / (w + 1); if (w < 60) peso[v] = w + 1;
      }
      somar(x, y, z);
    }
    erroSoma += errQ / Math.ceil(NP / 64); erroN++;
    quadros++;
    const t = agora();
    if (t - ultimoAviso > 400) {
      ultimoAviso = t;
      const m = {tipo: 'andamento', quadros, segundos: (t - t0) / 1000, sonda: [cx, cz, ang]};
      const tr = [];
      if (visual) {                                                    // a arcada já montada (altura da superfície), para a tela
        const gx = MGX >> 1, gz = MGZ >> 1, alt = new Float32Array(gx * gz);
        for (let j = 0; j < gz; j++) for (let i = 0; i < gx; i++) { const c = (j * 2) * MGX + i * 2; alt[j * gx + i] = mPeso[c] ? mAlt[c] : NaN; }
        const pts = new Float32Array(600); for (let i = 0; i < 300; i++) { const k = (i * 997) % NP; pts[i * 2] = alin[k * 3]; pts[i * 2 + 1] = alin[k * 3 + 2]; }
        m.cobertura = alt; m.pontos = pts; m.grade = [gx, gz, MX0, MZ0, MC * 2]; tr.push(alt.buffer, pts.buffer);
      }
      avisar(m, tr);
    }
  }
  return {tipo: 'fim', quadros, segundos: (agora() - t0) / 1000, erro_medio: erroN ? erroSoma / erroN : null, pontos_por_imagem: NP};
}

// ================================================================== fatias da tomografia
const NX = 160, NY = 128, NZ = 160;
function montarVolume() {
  const v = new Uint8Array(NX * NY * NZ);
  for (let z = 0; z < NZ; z++) for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++)
    v[(z * NY + y) * NX + x] = densidade((x + .5) / NX * 2 - 1, 1 - (y + .5) / NY * 2, (z + .5) / NZ * 2 - 1) * 255 + .5;
  return v;
}
function amostra(v, px, py, pz) {                                    // coordenadas -1..1, interpolação trilinear
  let fx = (px + 1) * .5 * NX - .5, fy = (1 - py) * .5 * NY - .5, fz = (pz + 1) * .5 * NZ - .5;
  if (fx < 0 || fy < 0 || fz < 0 || fx >= NX - 1 || fy >= NY - 1 || fz >= NZ - 1) return 0;
  const x = fx | 0, y = fy | 0, z = fz | 0, a = fx - x, b = fy - y, c = fz - z, k = (z * NY + y) * NX + x, sY = NX, sZ = NX * NY;
  const c00 = v[k] + (v[k + 1] - v[k]) * a, c10 = v[k + sY] + (v[k + sY + 1] - v[k + sY]) * a;
  const c01 = v[k + sZ] + (v[k + sZ + 1] - v[k + sZ]) * a, c11 = v[k + sZ + sY] + (v[k + sZ + sY + 1] - v[k + sZ + sY]) * a;
  const c0 = c00 + (c10 - c00) * b, c1 = c01 + (c11 - c01) * b;
  return c0 + (c1 - c0) * c;
}

const TAM = 320, TIPOS_FATIA = ['Axial', 'Coronal', 'Sagital', 'Transversal', 'Panorâmica'];
function fatia(v, k, out) {
  const tipo = k % 5, f = ((k / 5 | 0) * .618034) % 1;                // a posição do corte muda a cada volta
  let soma = 0;
  for (let j = 0; j < TAM; j++) for (let i = 0; i < TAM; i++) {
    const a = i / (TAM - 1) * 2 - 1, b = 1 - j / (TAM - 1) * 2;
    let acc = 0, mx = 0;
    if (tipo === 0) { const y0 = -.25 + .5 * f; for (let t = 0; t < 10; t++) acc += amostra(v, a, y0 + (t - 4.5) * .004, -b); acc /= 10; }
    else if (tipo === 1) { const z0 = -.2 + .8 * f; for (let t = 0; t < 10; t++) acc += amostra(v, a, b, z0 + (t - 4.5) * .004); acc /= 10; }
    else if (tipo === 2) { const x0 = -.6 + 1.2 * f; for (let t = 0; t < 10; t++) acc += amostra(v, x0 + (t - 4.5) * .004, b, -a); acc /= 10; }
    else if (tipo === 3) {                                            // corte perpendicular à arcada (planejamento de implante)
      const px = -.6 + 1.2 * f, d = Math.hypot(1, -2.5 * px), nx = 2.5 * px / d, nz = 1 / d, cz = arcoInf(px);
      const tx = nz, tz = -nx;
      for (let t = 0; t < 10; t++) { const o = (t - 4.5) * .004; acc += amostra(v, px + a * .25 * nx + o * tx, b * .5, cz + a * .25 * nz + o * tz); } acc /= 10;
    } else {                                                          // panorâmica: superfície curva ao longo da arcada, máximo na espessura
      const px = a * .72, d = Math.hypot(1, -2.5 * px), nx = 2.5 * px / d, nz = 1 / d, cz = arcoInf(px) - .01;
      for (let t = 0; t < 16; t++) { const o = (t - 7.5) * .008, s2 = amostra(v, px + o * nx, b * .55, cz + o * nz); if (s2 > mx) mx = s2; } acc = mx;
    }
    let g = (acc / 255 - .05) / .75; g = g < 0 ? 0 : g > 1 ? 1 : Math.pow(g, .8);
    out[j * TAM + i] = g * 255; soma += g;
  }
  return {tipo, soma};
}

function fatias({segundos = 60, visual = false}, avisar) {
  const t0 = agora();
  const v = montarVolume();
  const prep = (agora() - t0) / 1000;
  avisar({tipo: 'pronto', preparo_s: prep});
  const out = new Uint8Array(TAM * TAM);
  const t1 = agora();
  let n = 0, ultimoAviso = t1, assin = 0;
  const ultPrev = [0, 0, 0, 0, 0];
  while (agora() - t1 < segundos * 1000) {
    const r = fatia(v, n, out);
    assin += r.soma; n++;
    const t = agora();
    if (visual && t - ultPrev[r.tipo] > 600) {                         // miniatura de 160 x 160 para a tela
      ultPrev[r.tipo] = t;
      const p = new Uint8Array(160 * 160);
      for (let j = 0; j < 160; j++) for (let i = 0; i < 160; i++) p[j * 160 + i] = out[j * 2 * TAM + i * 2];
      avisar({tipo: 'previa', qual: r.tipo, nome: TIPOS_FATIA[r.tipo], img: p}, [p.buffer]);
    }
    if (t - ultimoAviso > 400) { ultimoAviso = t; avisar({tipo: 'andamento', fatias: n, segundos: (t - t1) / 1000}); }
  }
  return {tipo: 'fim', fatias: n, segundos: (agora() - t1) / 1000, preparo_s: prep, assinatura: Math.round(assin)};
}

// ================================================================== mensagens
const ehWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
if (ehWorker) {
  self.onmessage = e => {
    const m = e.data;
    try {
      const avisar = (d, tr = []) => self.postMessage(d, tr);
      if (m.tipo === 'scan') self.postMessage(escanear(m, avisar));
      else if (m.tipo === 'fatias') self.postMessage(fatias(m, avisar));
    } catch (err) {
      self.postMessage({tipo: 'erro', erro: String(err && err.stack || err)});
    }
  };
}
export {escanear, fatias, montarVolume, DENTES};
