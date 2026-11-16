/* Bench Marks · cargas do processador e da memória
 *
 * Roda dentro de "workers" (uma linha de execução por núcleo). Tudo é determinístico: o mesmo trabalho
 * dá exatamente o mesmo resultado em qualquer computador. É isso que permite o stress conferir erros de
 * cálculo: se um núcleo instável errar uma conta, a "assinatura" do resultado muda.
 *
 * Tipos de trabalho (mensagem {tipo, ...}):
 *   render     · pedaço de uma imagem por "path tracing" (como o Cinebench)
 *   colisao    · física de um pedaço das unidades da batalha (ajudante do 'jogo')
 *   jogo       · a batalha inteira: IA no núcleo principal + física espalhada nos ajudantes
 *   banda      · velocidade da memória (ler, gravar, copiar)
 *   latencia   · tempo de acesso da memória (saltos aleatórios)
 *   bim        · regenerar um prédio paramétrico depois de mover uma parede (Revit)
 *   pranchas   · desenhar e compactar pranchas em PDF
 */

const agora = () => performance.now();
const PARAR = {sim: false};

// ------------------------------------------------------------------ números aleatórios fixos
function rng(semente) {
  let s = (semente >>> 0) || 0x9E3779B9;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ================================================================== RENDER (path tracing)
// Cena: chão xadrez roxo, esferas (amarela, metal, roxa), pedestais e uma luz grande no alto.
const ESF = new Float64Array([   // x, y, z, raio, r, g, b, material (0 difuso, 1 metal, 2 luz)
  0, 1, 0, 1, .95, .78, .05, 0,
  -2.25, .8, .6, .8, .9, .9, .95, 1,
  2.15, .7, -.2, .7, .45, .2, .7, 0,
  0, 7, 1.5, 2.2, 7, 6.5, 5.5, 2,
  -1.1, .3, -1.6, .3, .95, .95, .95, 0,
  1.0, .25, -1.9, .25, .2, .75, .45, 1,
]);
for (let i = 0; i < 12; i++) {   // anel de esferinhas
  const a = i / 12 * Math.PI * 2;
  ESF.__extra = ESF.__extra || [];
  ESF.__extra.push(Math.cos(a) * 3.6, .22, Math.sin(a) * 3.6 + .8, .22, i % 2 ? .95 : .4, i % 2 ? .8 : .2, i % 2 ? .1 : .75, i % 3 === 0 ? 1 : 0);
}
const SFS = new Float64Array([...ESF, ...ESF.__extra]);
const NS = SFS.length / 8;
const CAIXAS = new Float64Array([  // min xyz, max xyz, r g b, material
  -3.2, 0, -.6, -1.3, .05, 1.8, .3, .25, .4, 0,
  1.2, 0, -1.4, 3.1, .02, .9, .3, .25, .4, 0,
  -.5, 0, 2.6, .5, 2.6, 3.3, .2, .15, .3, 0,
]);
const NC = CAIXAS.length / 10;

let hN0 = 0, hN1 = 0, hN2 = 0, hR = 0, hG = 0, hB = 0, hM = 0;   // dados do último acerto (sem criar objetos)

function cruzar(ox, oy, oz, dx, dy, dz) {
  let t = 1e9, id = -1, tipo = 0;
  if (dy < -1e-6) { const tp = -oy / dy; if (tp > 1e-4 && tp < t) { t = tp; id = 0; tipo = 0; } }
  for (let i = 0; i < NS; i++) {
    const k = i * 8, cx = ox - SFS[k], cy = oy - SFS[k + 1], cz = oz - SFS[k + 2], r = SFS[k + 3];
    const b = cx * dx + cy * dy + cz * dz, c = cx * cx + cy * cy + cz * cz - r * r, h = b * b - c;
    if (h < 0) continue;
    const sh = Math.sqrt(h);
    let tt = -b - sh; if (tt < 1e-4) tt = -b + sh;
    if (tt > 1e-4 && tt < t) { t = tt; id = i; tipo = 1; }
  }
  for (let i = 0; i < NC; i++) {
    const k = i * 10;
    let t0 = -1e9, t1 = 1e9;
    let ix = (CAIXAS[k] - ox) / dx, ax = (CAIXAS[k + 3] - ox) / dx; if (ix > ax) { const q = ix; ix = ax; ax = q; }
    let iy = (CAIXAS[k + 1] - oy) / dy, ay = (CAIXAS[k + 4] - oy) / dy; if (iy > ay) { const q = iy; iy = ay; ay = q; }
    let iz = (CAIXAS[k + 2] - oz) / dz, az = (CAIXAS[k + 5] - oz) / dz; if (iz > az) { const q = iz; iz = az; az = q; }
    t0 = Math.max(ix, iy, iz); t1 = Math.min(ax, ay, az);
    if (t1 >= t0 && t0 > 1e-4 && t0 < t) { t = t0; id = i; tipo = 2; }
  }
  if (id < 0) return -1;
  const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
  if (tipo === 0) {
    hN0 = 0; hN1 = 1; hN2 = 0;
    const xa = Math.floor(px * .8) + Math.floor(pz * .8);
    const faixa = Math.abs(px) < .08 || Math.abs(pz - .8) < .08;
    if (faixa) { hR = 1; hG = .85; hB = .1; } else if (xa & 1) { hR = .16; hG = .1; hB = .24; } else { hR = .3; hG = .22; hB = .42; }
    hM = 0;
  } else if (tipo === 1) {
    const k = id * 8, r = SFS[k + 3];
    hN0 = (px - SFS[k]) / r; hN1 = (py - SFS[k + 1]) / r; hN2 = (pz - SFS[k + 2]) / r;
    hR = SFS[k + 4]; hG = SFS[k + 5]; hB = SFS[k + 6]; hM = SFS[k + 7];
  } else {
    const k = id * 10, e = 1e-3;
    hN0 = Math.abs(px - CAIXAS[k]) < e ? -1 : Math.abs(px - CAIXAS[k + 3]) < e ? 1 : 0;
    hN1 = Math.abs(py - CAIXAS[k + 1]) < e ? -1 : Math.abs(py - CAIXAS[k + 4]) < e ? 1 : 0;
    hN2 = hN0 || hN1 ? 0 : (Math.abs(pz - CAIXAS[k + 2]) < e ? -1 : 1);
    hR = CAIXAS[k + 6]; hG = CAIXAS[k + 7]; hB = CAIXAS[k + 8]; hM = CAIXAS[k + 9];
  }
  return t;
}

/** Desenha um pedaço da imagem. Retorna a soma das cores por pixel e a assinatura (soma inteira). */
export function renderPedaco({W, H, x0, y0, w, h, spp = 1, passo = 0}) {
  const out = new Float32Array(w * h * 3);
  const cx = 0, cy = 2.3, cz = -6.8, fx = 0, fy = .9, fz = .4;
  let wx = fx - cx, wy = fy - cy, wz = fz - cz; const wl = Math.hypot(wx, wy, wz); wx /= wl; wy /= wl; wz /= wl;
  let rx = wz, rz = -wx; const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;            // direita = cima × frente
  const ux = rz * wy, uy = rx * wz - rz * wx, uz = -rx * wy;                            // cima
  let assinatura = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const px = x0 + i, py = y0 + j;
    const rnd = rng((px * 1973 + py * 9277 + passo * 26699) ^ 0x5bd1e995);
    let sr = 0, sg = 0, sb = 0;
    for (let s = 0; s < spp; s++) {
      const u = ((px + rnd()) / W * 2 - 1) * (W / H), v = 1 - (py + rnd()) / H * 2;
      let dx = rx * u * .62 + ux * v * .62 + wx, dy = uy * v * .62 + wy, dz = rz * u * .62 + uz * v * .62 + wz;
      const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      let ox = cx, oy = cy, oz = cz, tr = 1, tg = 1, tb = 1;
      for (let salto = 0; salto < 5; salto++) {
        const t = cruzar(ox, oy, oz, dx, dy, dz);
        if (t < 0) {                                                  // céu
          const k = Math.max(0, dy);
          sr += tr * (.22 - .14 * k); sg += tg * (.13 - .09 * k); sb += tb * (.3 - .16 * k);
          break;
        }
        if (hM === 2) { sr += tr * hR; sg += tg * hG; sb += tb * hB; break; }
        ox += dx * t; oy += dy * t; oz += dz * t;
        tr *= hR; tg *= hG; tb *= hB;
        if (hM === 1) {                                               // metal: reflexo com um pouco de desfoque
          const dn = dx * hN0 + dy * hN1 + dz * hN2;
          dx -= 2 * dn * hN0; dy -= 2 * dn * hN1; dz -= 2 * dn * hN2;
          dx += (rnd() - .5) * .12; dy += (rnd() - .5) * .12; dz += (rnd() - .5) * .12;
        } else {                                                      // difuso: direção aleatória (cosseno)
          const a = rnd() * 6.2831853, r2 = rnd(), r = Math.sqrt(r2);
          const tx = Math.abs(hN0) > .9 ? 0 : 1, ty = Math.abs(hN0) > .9 ? 1 : 0;
          let bx = hN1 * 0 - hN2 * ty, by = hN2 * tx - hN0 * 0, bz = hN0 * ty - hN1 * tx;
          const bl = Math.hypot(bx, by, bz); bx /= bl; by /= bl; bz /= bl;
          const cx2 = hN1 * bz - hN2 * by, cy2 = hN2 * bx - hN0 * bz, cz2 = hN0 * by - hN1 * bx;
          const z = Math.sqrt(1 - r2);
          dx = bx * Math.cos(a) * r + cx2 * Math.sin(a) * r + hN0 * z;
          dy = by * Math.cos(a) * r + cy2 * Math.sin(a) * r + hN1 * z;
          dz = bz * Math.cos(a) * r + cz2 * Math.sin(a) * r + hN2 * z;
        }
        const dl2 = Math.hypot(dx, dy, dz); dx /= dl2; dy /= dl2; dz /= dl2;
        ox += hN0 * 2e-4; oy += hN1 * 2e-4; oz += hN2 * 2e-4;
      }
    }
    const k = (j * w + i) * 3;
    out[k] = sr; out[k + 1] = sg; out[k + 2] = sb;
    assinatura = (assinatura + Math.round(sr * 4096) * 3 + Math.round(sg * 4096) * 5 + Math.round(sb * 4096) * 7) >>> 0;
  }
  return {rgb: out, assinatura, amostras: w * h * spp};
}

// ================================================================== BATALHA (CPU pra jogos)
const ARENA_W = 1200, ARENA_H = 700, CEL = 8, GW = Math.ceil(ARENA_W / CEL), GH = Math.ceil(ARENA_H / CEL);

function montarGrade(x, y, n, ini, idx) {
  ini.fill(0);
  const cel = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const c = Math.min(GH - 1, Math.max(0, (y[i] / CEL) | 0)) * GW + Math.min(GW - 1, Math.max(0, (x[i] / CEL) | 0));
    cel[i] = c; ini[c + 1]++;
  }
  for (let c = 0; c < GW * GH; c++) ini[c + 1] += ini[c];
  const pos = ini.slice(0, GW * GH);
  for (let i = 0; i < n; i++) idx[pos[cel[i]]++] = i;
}

// relevo do campo (ajudantes usam para frear subida)
function relevo(x, y) {
  return Math.sin(x * .013) * Math.cos(y * .017) * 6 + Math.sin((x + y) * .031) * 2 + Math.cos(x * .005 - y * .009) * 4;
}

/** Ajudante: separa unidades que se encostam e aplica o relevo. Trabalha só no pedaço [de, ate). */
export function colisao({x, y, ini, idx, de, ate}) {
  const f = new Float32Array((ate - de) * 2);
  const R = 2.4, R2 = R * R;
  for (let i = de; i < ate; i++) {
    const xi = x[i], yi = y[i];
    const gx = (xi / CEL) | 0, gy = (yi / CEL) | 0;
    let fx = 0, fy = 0;
    for (let cy = gy - 1; cy <= gy + 1; cy++) {
      if (cy < 0 || cy >= GH) continue;
      for (let cx = gx - 1; cx <= gx + 1; cx++) {
        if (cx < 0 || cx >= GW) continue;
        const c = cy * GW + cx;
        for (let k = ini[c]; k < ini[c + 1]; k++) {
          const j = idx[k];
          if (j === i) continue;
          const ddx = xi - x[j], ddy = yi - y[j], d2 = ddx * ddx + ddy * ddy;
          if (d2 < R2 && d2 > 1e-9) { const d = Math.sqrt(d2), p = (R - d) / d * .5; fx += ddx * p; fy += ddy * p; }
        }
      }
    }
    // relevo: a unidade escorrega morro abaixo (derivada numérica, de propósito "cara" como física de jogo)
    const e = .5, hx = (relevo(xi + e, yi) - relevo(xi - e, yi)) / (2 * e), hy = (relevo(xi, yi + e) - relevo(xi, yi - e)) / (2 * e);
    f[(i - de) * 2] = fx - hx * .05; f[(i - de) * 2 + 1] = fy - hy * .05;
  }
  return f;
}

export async function jogo({segundos = 60, ajudantes = 1, unidades = 30000}, avisar) {
  const N = unidades, r = rng(42);
  const x = new Float32Array(N), y = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
  const hp = new Float32Array(N), time = new Uint8Array(N), alvo = new Int32Array(N).fill(-1), recarga = new Float32Array(N);
  const nasce = i => { const t = time[i]; x[i] = t ? ARENA_W - 30 - r() * 120 : 30 + r() * 120; y[i] = 20 + r() * (ARENA_H - 40); hp[i] = 100; alvo[i] = -1; vx[i] = vy[i] = 0; };
  for (let i = 0; i < N; i++) { time[i] = i & 1; nasce(i); x[i] = time[i] ? ARENA_W * .51 + r() * ARENA_W * .3 : ARENA_W * .19 + r() * ARENA_W * .3; }
  const ini = new Int32Array(GW * GH + 1), idx = new Int32Array(N);
  const nAj = Math.max(0, ajudantes);
  const trab = [];
  for (let k = 0; k < nAj; k++) trab.push(new Worker(new URL(import.meta.url), {type: 'module'}));
  let pedidos = new Map(), nPed = 0, tempoAj = 0;
  trab.forEach(w => w.onmessage = e => { const p = pedidos.get(e.data.id); pedidos.delete(e.data.id); tempoAj += e.data.ms; p(e.data.f); });
  const pedir = (w, dados) => new Promise(ok => { const id = ++nPed; pedidos.set(id, ok); w.postMessage({tipo: 'colisao', id, ...dados}); });
  const DT = 1 / 30;
  let quadros = 0, ocupado = 0, mortes = 0, assinatura = 0, ultimoAviso = 0, porSegundo = [], qSeg = 0, tSeg = agora();
  const t0 = agora();
  while (agora() - t0 < segundos * 1000) {
    if (PARAR.sim) break;
    const a0 = agora();
    montarGrade(x, y, N, ini, idx);
    // ---- IA (núcleo principal): escolher alvo, decidir avançar / atacar / recuar
    for (let i = 0; i < N; i++) {
      let a = alvo[i];
      if (a >= 0 && (hp[a] <= 0 || Math.abs(x[a] - x[i]) + Math.abs(y[a] - y[i]) > 160)) a = -1;
      if (a < 0 && ((i + quadros) & 3) === 0) {                         // procura o inimigo mais perto (em anéis)
        const gx = (x[i] / CEL) | 0, gy = (y[i] / CEL) | 0;
        let melhor = 1e9;
        for (let anel = 0; anel < 6 && a < 0; anel++) {
          for (let cy = gy - anel; cy <= gy + anel; cy++) {
            if (cy < 0 || cy >= GH) continue;
            for (let cx = gx - anel; cx <= gx + anel; cx++) {
              if (cx < 0 || cx >= GW || (Math.abs(cy - gy) !== anel && Math.abs(cx - gx) !== anel)) continue;
              const c = cy * GW + cx;
              for (let k = ini[c]; k < ini[c + 1]; k++) {
                const j = idx[k];
                if (time[j] === time[i] || hp[j] <= 0) continue;
                const d = (x[j] - x[i]) ** 2 + (y[j] - y[i]) ** 2;
                if (d < melhor) { melhor = d; a = j; }
              }
            }
          }
        }
        if (a < 0) a = -1;
      }
      alvo[i] = a;
      let ax = (time[i] ? -1 : 1) * 12, ay = 0;                         // sem alvo: marcha para o outro lado
      if (a >= 0) {
        const dx = x[a] - x[i], dy = y[a] - y[i], d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (hp[i] < 25) { ax = -dx / d * 20; ay = -dy / d * 20; }        // pouca vida: recua
        else if (d > 5) { ax = dx / d * 16; ay = dy / d * 16; }
        else {
          ax = ay = 0;
          recarga[i] -= DT;
          if (recarga[i] <= 0) { hp[a] -= 7 + ((i * 7 + quadros) % 9); recarga[i] = .5; }
        }
      }
      vx[i] = vx[i] * .8 + ax * .2; vy[i] = vy[i] * .8 + ay * .2;
    }
    ocupado += agora() - a0;
    // ---- física (outros núcleos)
    let forcas;
    if (nAj) {
      const parte = Math.ceil(N / nAj);
      forcas = await Promise.all(trab.map((w, k) => pedir(w, {x, y, ini, idx, de: k * parte, ate: Math.min(N, (k + 1) * parte)})));
    } else forcas = [colisao({x, y, ini, idx, de: 0, ate: N})];
    const a1 = agora();
    // ---- integrar, mortes e reforços (núcleo principal)
    const parte = nAj ? Math.ceil(N / nAj) : N;
    for (let i = 0; i < N; i++) {
      const f = forcas[(i / parte) | 0], k = (i % parte) * 2;
      x[i] = Math.min(ARENA_W - 1, Math.max(1, x[i] + vx[i] * DT + f[k]));
      y[i] = Math.min(ARENA_H - 1, Math.max(1, y[i] + vy[i] * DT + f[k + 1]));
      if (hp[i] <= 0) { mortes++; nasce(i); }
    }
    quadros++; qSeg++;
    ocupado += agora() - a1;
    const t = agora();
    if (t - tSeg >= 1000) { porSegundo.push(qSeg * 1000 / (t - tSeg)); qSeg = 0; tSeg = t; }
    if (avisar && t - ultimoAviso > 120) {
      ultimoAviso = t;
      const amostra = new Float32Array(3 * 3000);
      for (let k = 0; k < 3000; k++) { const i = (k * 10 + (k & 1)) % N; amostra[k * 3] = x[i]; amostra[k * 3 + 1] = y[i]; amostra[k * 3 + 2] = time[i]; }
      avisar({tipo: 'andamento', segundos: (t - t0) / 1000, sps: quadros / ((t - t0) / 1000), spsAgora: porSegundo.at(-1) || 0, amostra, W: ARENA_W, H: ARENA_H}, [amostra.buffer]);
    }
  }
  const total = (agora() - t0);
  trab.forEach(w => w.terminate());
  for (let i = 0; i < N; i += 97) assinatura = (assinatura + Math.round(x[i] * 16) + Math.round(y[i] * 16)) >>> 0;
  return {tipo: 'fim', quadros, segundos: total / 1000, sps: quadros / (total / 1000), porSegundo,
          principal: Math.min(100, Math.round(100 * ocupado / total)),
          outros: nAj ? Math.min(100, Math.round(100 * tempoAj / nAj / total)) : 0, mortes, ajudantes: nAj, assinatura};
}

// ================================================================== MEMÓRIA
export function banda({modo, segundos = 3, mb = 64}) {
  const n = (mb * 1024 * 1024 / 8) | 0;
  const a = new Float64Array(n), b = modo === 'copiar' ? new Float64Array(n) : null;
  for (let i = 0; i < n; i += 512) a[i] = i;                            // encosta em todas as páginas antes
  let bytes = 0, soma = 0, v = 1;
  const t0 = agora(), lim = segundos * 1000;
  while (agora() - t0 < lim) {
    if (modo === 'ler') {
      let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
      for (let i = 0; i < n; i += 4) { s0 += a[i]; s1 += a[i + 1]; s2 += a[i + 2]; s3 += a[i + 3]; }
      soma += s0 + s1 + s2 + s3; bytes += n * 8;
    } else if (modo === 'gravar') { a.fill(v++); bytes += n * 8; }
    else { b.set(a); bytes += n * 16; }                                   // copiar = ler + gravar
  }
  const s = (agora() - t0) / 1000;
  return {gbs: bytes / s / 1e9, soma};
}

export function latencia({mb = 256, segundos = 2}) {
  const n = (mb * 1024 * 1024 / 4) | 0, p = new Int32Array(n);
  for (let i = 0; i < n; i++) p[i] = i;
  const r = rng(7);
  for (let i = n - 1; i > 0; i--) { const j = (r() * i) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }   // um ciclo só (Sattolo)
  let k = 0, passos = 0;
  for (let i = 0; i < 200000; i++) k = p[k];                             // aquece
  const t0 = agora();
  while (agora() - t0 < segundos * 1000) {
    for (let i = 0; i < 1000000; i++) k = p[k];
    passos += 1000000;
  }
  const ns = (agora() - t0) * 1e6 / passos;
  return {ns, k};
}

// ================================================================== PRÉDIO PARAMÉTRICO (Revit / BIM)
const ESP = .2, PE = 3.1;   // espessura da parede e pé-direito (m)

/** Gera o prédio: andares com paredes (contorno + divisórias), portas e janelas. */
export function criarPredio({andares = 20, largura = 64, fundo = 40, semente = 1} = {}) {
  const r = rng(semente * 7919);
  const predio = {andares: [], largura, fundo};
  for (let a = 0; a < andares; a++) {
    const paredes = [];
    const ext = [[0, 0, largura, 0], [largura, 0, largura, fundo], [largura, fundo, 0, fundo], [0, fundo, 0, 0]];
    ext.forEach(([x1, y1, x2, y2]) => paredes.push({x1, y1, x2, y2, externa: true}));
    // divide a planta em salas (cortes alternados), sempre em módulos de 0,5 m
    const salas = [[0, 0, largura, fundo]];
    const corredorY = fundo / 2;
    paredes.push({x1: 0, y1: corredorY - 1, x2: largura, y2: corredorY - 1}, {x1: 0, y1: corredorY + 1, x2: largura, y2: corredorY + 1});
    const fila = [[0, 0, largura, corredorY - 1], [0, corredorY + 1, largura, fundo]];
    while (fila.length) {
      const [x0, y0, x1, y1] = fila.pop();
      const w = x1 - x0, h = y1 - y0;
      if (w < 7 && h < 7 || paredes.length > 220) { salas.push([x0, y0, x1, y1]); continue; }
      if (w >= h) {
        const c = Math.round((x0 + w * (.35 + r() * .3)) * 2) / 2;
        paredes.push({x1: c, y1: y0, x2: c, y2: y1}); fila.push([x0, y0, c, y1], [c, y0, x1, y1]);
      } else {
        const c = Math.round((y0 + h * (.35 + r() * .3)) * 2) / 2;
        paredes.push({x1: x0, y1: c, x2: x1, y2: c}); fila.push([x0, y0, x1, c], [x0, c, x1, y1]);
      }
    }
    // aberturas: janela a cada 1,6 m nas externas, uma porta por divisória
    paredes.forEach(p => {
      const L = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
      p.aberturas = [];
      if (p.externa) for (let s = 1.2; s < L - 1.6; s += 1.6) p.aberturas.push({tipo: 'janela', ini: s, larg: 1.1, base: .9, alt: 1.4});
      else if (L > 2.4) p.aberturas.push({tipo: 'porta', ini: Math.min(L - 1.3, .5 + r() * (L - 2.2)), larg: .9, base: 0, alt: 2.1});
    });
    predio.andares.push({paredes, nivel: a * PE});
  }
  return predio;
}

/** Move a parede externa leste (em todos os andares) e arrasta as paredes que encostam nela. */
export function moverParede(predio, delta) {
  const xa = predio.largura;
  predio.largura += delta;
  predio.andares.forEach(an => an.paredes.forEach(p => {
    if (Math.abs(p.x1 - xa) < 1e-6) p.x1 += delta;
    if (Math.abs(p.x2 - xa) < 1e-6) p.x2 += delta;
  }));
}

// ---- geometria
function intersecaoRetas(ax, ay, bx, by, cx, cy, dx, dy) {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(d) < 1e-12) return null;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
  return [ax + (bx - ax) * t, ay + (by - ay) * t];
}

function contornoParede(p, vizinhos) {
  // retângulo da parede, com as pontas ajustadas pelas paredes que encontram nela
  const dx = p.x2 - p.x1, dy = p.y2 - p.y1, L = Math.hypot(dx, dy), nx = -dy / L * ESP / 2, ny = dx / L * ESP / 2;
  const lados = [[p.x1 + nx, p.y1 + ny, p.x2 + nx, p.y2 + ny], [p.x1 - nx, p.y1 - ny, p.x2 - nx, p.y2 - ny]];
  const pts = [];
  for (const [ax, ay, bx, by] of lados) {
    let ini = [ax - dx / L * ESP / 2, ay - dy / L * ESP / 2], fim = [bx + dx / L * ESP / 2, by + dy / L * ESP / 2];
    for (const q of vizinhos) {
      const qdx = q.x2 - q.x1, qdy = q.y2 - q.y1, qL = Math.hypot(qdx, qdy), qnx = -qdy / qL * ESP / 2, qny = qdx / qL * ESP / 2;
      for (const s of [1, -1]) {
        const i = intersecaoRetas(ax, ay, bx, by, q.x1 + qnx * s, q.y1 + qny * s, q.x2 + qnx * s, q.y2 + qny * s);
        if (!i) continue;
        const t = ((i[0] - ax) * dx + (i[1] - ay) * dy) / (L * L);
        if (t < .02 && t > -.05) ini = i; else if (t > .98 && t < 1.05) fim = i;
      }
    }
    pts.push(ini, fim);
  }
  return [pts[0], pts[1], pts[3], pts[2]];
}

function areaPoligono(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
}

/** Triangula um polígono simples com furos (orelhas). Retorna o número de triângulos. */
function triangular(externo, furos) {
  // costura cada furo no contorno (ponte até o vértice visível mais próximo) e corta orelhas
  let pol = externo.slice();
  const ordenados = furos.slice().sort((a, b) => Math.max(...b.map(p => p[0])) - Math.max(...a.map(p => p[0])));
  for (const f of ordenados) {
    let mi = 0; for (let i = 1; i < f.length; i++) if (f[i][0] > f[mi][0]) mi = i;
    const m = f[mi];
    let melhor = -1, dm = 1e18;
    for (let i = 0; i < pol.length; i++) {
      const d = (pol[i][0] - m[0]) ** 2 + (pol[i][1] - m[1]) ** 2;
      if (pol[i][0] >= m[0] - 1e-9 && d < dm) { dm = d; melhor = i; }
    }
    if (melhor < 0) melhor = 0;
    const furo = [...f.slice(mi), ...f.slice(0, mi + 1)];
    pol = [...pol.slice(0, melhor + 1), ...furo, pol[melhor], ...pol.slice(melhor + 1)];
  }
  const cruz = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const dentro = (p, a, b, c) => cruz(a, b, p) >= 0 && cruz(b, c, p) >= 0 && cruz(c, a, p) >= 0;
  let idx = pol.map((_, i) => i), tri = 0, guarda = 0;
  if (areaPoligono(pol) && (() => { let s = 0; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) s += (pol[i][0] - pol[j][0]) * (pol[i][1] + pol[j][1]); return s > 0; })()) idx.reverse();
  while (idx.length > 3 && guarda++ < 20000) {
    let cortou = false;
    for (let k = 0; k < idx.length; k++) {
      const a = pol[idx[(k + idx.length - 1) % idx.length]], b = pol[idx[k]], c = pol[idx[(k + 1) % idx.length]];
      if (cruz(a, b, c) <= 1e-12) continue;
      let ok = true;
      for (let m = 0; m < idx.length; m++) {
        const p = pol[idx[m]];
        if (p === a || p === b || p === c) continue;
        if (dentro(p, a, b, c)) { ok = false; break; }
      }
      if (ok) { idx.splice(k, 1); tri++; cortou = true; break; }
    }
    if (!cortou) idx.splice(0, 1);
  }
  return tri + 1;
}

/** Recalcula tudo que depende das paredes: encontros, faces com aberturas, ambientes, cotas e tabelas. */
export function regenerar(predio, {resolucao = .08} = {}) {
  let triangulos = 0, ambientes = 0, areaTotal = 0, cotas = 0, linhasTabela = [];
  const res = {andares: []};
  for (const an of predio.andares) {
    const ps = an.paredes;
    // 1. encontros das paredes (índice por ponta)
    const pontas = new Map();
    const chave = (x, y) => Math.round(x * 20) + ',' + Math.round(y * 20);
    ps.forEach((p, i) => { for (const k of [chave(p.x1, p.y1), chave(p.x2, p.y2)]) { if (!pontas.has(k)) pontas.set(k, []); pontas.get(k).push(i); } });
    const contornos = ps.map((p, i) => {
      const viz = new Set();
      for (const k of [chave(p.x1, p.y1), chave(p.x2, p.y2)]) (pontas.get(k) || []).forEach(j => j !== i && viz.add(j));
      // paredes que terminam no meio desta (T)
      ps.forEach((q, j) => {
        if (j === i) return;
        for (const [qx, qy] of [[q.x1, q.y1], [q.x2, q.y2]]) {
          const L2 = (p.x2 - p.x1) ** 2 + (p.y2 - p.y1) ** 2, t = ((qx - p.x1) * (p.x2 - p.x1) + (qy - p.y1) * (p.y2 - p.y1)) / L2;
          if (t > 0 && t < 1) { const px = p.x1 + (p.x2 - p.x1) * t, py = p.y1 + (p.y2 - p.y1) * t; if (Math.hypot(px - qx, py - qy) < .01) viz.add(j); }
        }
      });
      return contornoParede(p, [...viz].map(j => ps[j]));
    });
    // 2. faces das paredes (vista de frente) com os furos das aberturas, trianguladas
    ps.forEach(p => {
      const L = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
      const furos = p.aberturas.filter(o => o.ini + o.larg < L).map(o => [[o.ini, o.base + .001], [o.ini + o.larg, o.base + .001], [o.ini + o.larg, o.base + o.alt], [o.ini, o.base + o.alt]]);
      triangulos += 2 * triangular([[0, 0], [L, 0], [L, PE], [0, PE]], furos);
    });
    // 3. ambientes: desenha as paredes numa grade fina, pinta cada sala (preenchimento) e mede a área
    const gw = Math.ceil(predio.largura / resolucao) + 2, gh = Math.ceil(predio.fundo / resolucao) + 2;
    const g = new Int32Array(gw * gh);
    contornos.forEach(c => {
      const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
      const x0 = Math.max(0, Math.floor(Math.min(...xs) / resolucao)), x1 = Math.min(gw - 1, Math.ceil(Math.max(...xs) / resolucao));
      const y0 = Math.max(0, Math.floor(Math.min(...ys) / resolucao)), y1 = Math.min(gh - 1, Math.ceil(Math.max(...ys) / resolucao));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const px = (x + .5) * resolucao, py = (y + .5) * resolucao;
        let dentro = false;
        for (let i = 0, j = 3; i < 4; j = i++) if ((c[i][1] > py) !== (c[j][1] > py) && px < (c[j][0] - c[i][0]) * (py - c[i][1]) / (c[j][1] - c[i][1]) + c[i][0]) dentro = !dentro;
        if (dentro) g[y * gw + x] = -1;
      }
    });
    let rot = 0;
    const pilha = new Int32Array(gw * gh);
    const areas = [], perimetros = [];
    for (let s = 0; s < gw * gh; s++) {
      if (g[s] !== 0) continue;
      rot++; let topo = 0, cont = 0, borda = 0; pilha[topo++] = s; g[s] = rot;
      while (topo) {
        const c = pilha[--topo]; cont++;
        const cx = c % gw, cy = (c / gw) | 0;
        for (let v = 0; v < 4; v++) {
          const nx = cx + (v === 0 ? 1 : v === 1 ? -1 : 0), ny = cy + (v === 2 ? 1 : v === 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) { borda++; continue; }
          const n = ny * gw + nx;
          if (g[n] === 0) { g[n] = rot; pilha[topo++] = n; } else if (g[n] === -1) borda++;
        }
      }
      areas.push(cont * resolucao * resolucao); perimetros.push(borda * resolucao);
    }
    // a primeira "sala" é a parte de fora do prédio
    const salas = areas.slice(1).filter(a => a > 2);
    ambientes += salas.length; areaTotal += salas.reduce((s, a) => s + a, 0);
    // 4. cotas: distância de cada parede até a paralela mais próxima
    ps.forEach((p, i) => {
      const hor = Math.abs(p.y2 - p.y1) < 1e-6;
      let dm = 1e9;
      ps.forEach((q, j) => { if (j !== i && (Math.abs(q.y2 - q.y1) < 1e-6) === hor) { const d = hor ? Math.abs(q.y1 - p.y1) : Math.abs(q.x1 - p.x1); if (d > .01 && d < dm) dm = d; } });
      if (dm < 1e9) cotas++;
      p.cota = dm;
    });
    // 5. tabelas (quantitativos), como as do Revit
    ps.forEach((p, i) => {
      const L = Math.hypot(p.x2 - p.x1, p.y2 - p.y1), vaos = p.aberturas.reduce((s, o) => s + o.larg * o.alt, 0);
      linhasTabela.push([p.externa ? 'Parede externa 20cm' : 'Divisória 20cm', (an.nivel / PE + 1).toFixed(0).padStart(2, '0'), L.toFixed(2), (L * PE - vaos).toFixed(2), ((L * PE - vaos) * ESP).toFixed(3), String(p.cota.toFixed(2))].join(';'));
      p.aberturas.forEach((o, k) => linhasTabela.push([o.tipo === 'janela' ? 'Janela 110x140' : 'Porta 90x210', (an.nivel / PE + 1).toFixed(0).padStart(2, '0'), `${i}-${k}`, (o.larg * o.alt).toFixed(2)].join(';')));
    });
    salas.forEach((a, k) => linhasTabela.push(['Ambiente', (an.nivel / PE + 1).toFixed(0).padStart(2, '0'), `Sala ${k + 1}`, a.toFixed(2), perimetros[k + 1].toFixed(2)].join(';')));
    res.andares.push({contornos, salas, gw, gh});
  }
  linhasTabela.sort();
  let assinatura = 0;
  for (const l of linhasTabela) for (let i = 0; i < l.length; i += 3) assinatura = (assinatura * 31 + l.charCodeAt(i)) >>> 0;
  return {...res, triangulos, ambientes, area: areaTotal, cotas, linhas: linhasTabela.length, assinatura};
}

// ================================================================== PRANCHAS (PDF)
function compactar(bytes) {
  // LZ77 com tabela de espalhamento (o "zip" do PDF faz parecido)
  const N = bytes.length, out = new Uint8Array(N + (N >> 3) + 16), tab = new Int32Array(1 << 15).fill(-1);
  let i = 0, o = 0;
  while (i < N - 4) {
    const h = ((bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2]) * 2654435761 >>> 17) & 0x7fff;
    const c = tab[h]; tab[h] = i;
    let len = 0;
    if (c >= 0 && i - c < 32768) while (len < 255 && i + len < N && bytes[c + len] === bytes[i + len]) len++;
    if (len >= 4) { out[o++] = 255; out[o++] = len; out[o++] = (i - c) & 255; out[o++] = (i - c) >> 8; i += len; }
    else { out[o++] = bytes[i] === 255 ? 254 : bytes[i]; i++; }
    if (o > out.length - 8) break;
  }
  return o;
}

export function prancha(predio, regen, numero) {
  const an = regen.andares[numero % regen.andares.length];
  const L = [];
  const n = v => v.toFixed(2);
  L.push('q 0.5 w 0 0 0 RG');
  // carimbo e margens
  L.push(`20 20 1150 800 re S 870 20 300 120 re S BT /F1 14 Tf 880 110 Td (BENCH MARKS - PRANCHA ${String(numero + 1).padStart(2, '0')}) Tj ET`);
  const esc = 15, ox = 60, oy = 60;
  an.contornos.forEach((c, k) => {
    L.push(`${n(ox + c[0][0] * esc)} ${n(oy + c[0][1] * esc)} m ${c.slice(1).map(p => `${n(ox + p[0] * esc)} ${n(oy + p[1] * esc)} l`).join(' ')} h S`);
    // hachura da parede: linhas a 45° recortadas pelo contorno
    const xs = c.map(p => p[0]), ys = c.map(p => p[1]);
    const mn = Math.min(...xs.map((x, i) => x + ys[i])), mx = Math.max(...xs.map((x, i) => x + ys[i]));
    for (let s = mn; s <= mx; s += .012) {
      const cortes = [];
      for (let i = 0, j = 3; i < 4; j = i++) {
        const a = c[j], b = c[i], fa = a[0] + a[1] - s, fb = b[0] + b[1] - s;
        if ((fa > 0) !== (fb > 0)) { const t = fa / (fa - fb); cortes.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      if (cortes.length === 2) L.push(`${n(ox + cortes[0][0] * esc)} ${n(oy + cortes[0][1] * esc)} m ${n(ox + cortes[1][0] * esc)} ${n(oy + cortes[1][1] * esc)} l S`);
    }
  });
  predio.andares[numero % predio.andares.length].paredes.forEach(p => {
    const dx = p.x2 - p.x1, dy = p.y2 - p.y1, Lp = Math.hypot(dx, dy);
    p.aberturas.forEach(o => {
      const cx = p.x1 + dx / Lp * o.ini, cy = p.y1 + dy / Lp * o.ini;
      if (o.tipo === 'porta') {                                          // giro da porta: arco em 24 segmentos
        const pts = [];
        for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI / 2 + Math.atan2(dy, dx); pts.push(`${n(ox + (cx + Math.cos(a) * o.larg) * esc)} ${n(oy + (cy + Math.sin(a) * o.larg) * esc)} l`); }
        L.push(`${n(ox + cx * esc)} ${n(oy + cy * esc)} m ${pts.join(' ')} S`);
      } else L.push(`${n(ox + cx * esc)} ${n(oy + cy * esc)} m ${n(ox + (cx + dx / Lp * o.larg) * esc)} ${n(oy + (cy + dy / Lp * o.larg) * esc)} l S`);
    });
    if (p.cota < 1e9) L.push(`BT /F1 7 Tf ${n(ox + (p.x1 + dx / 2) * esc)} ${n(oy + (p.y1 + dy / 2) * esc + 6)} Td (${p.cota.toFixed(2).replace('.', ',')}) Tj ET`);
  });
  an.salas.forEach((a, k) => L.push(`BT /F1 8 Tf ${200 + (k % 12) * 50} ${700 - Math.floor(k / 12) * 14} Td (SALA ${k + 1} - ${a.toFixed(2).replace('.', ',')} m2) Tj ET`));
  L.push('Q');
  const texto = L.join('\n');
  const bytes = new TextEncoder().encode(texto);
  const comp = compactar(bytes);
  let assinatura = 0;
  for (let i = 0; i < bytes.length; i += 61) assinatura = (assinatura * 33 + bytes[i]) >>> 0;
  return {bytes: bytes.length, comp, assinatura};
}

// ================================================================== SALA no processador (mesma cena do render da placa)
let SALA = null;
async function carregarSala() {
  if (!SALA) { const m = await import('./pathtracer.js'); SALA = m.sala(); }
  return SALA;
}

/** Path tracing da sala no processador (mesmo algoritmo do render na placa). Retorna quantas amostras fez. */
export function salaPedaco(cx, {W, H, x0, y0, w, h, spp = 1, passo = 0}) {
  const n = cx.length / 12;
  const SOL = [.62, .55, -.56], sl = Math.hypot(...SOL), sx = SOL[0] / sl, sy = SOL[1] / sl, sz = SOL[2] / sl;
  const ro = [.6, 1.45, 7.3], al = [3.3, 1.0, 2.2];
  let wx = al[0] - ro[0], wy = al[1] - ro[1], wz = al[2] - ro[2]; const wl = Math.hypot(wx, wy, wz); wx /= wl; wy /= wl; wz /= wl;
  let rx = -wz, rz = wx; const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;                  // cross(w, cima)
  const ux = -rz * wy, uy = rz * wx - rx * wz, uz = rx * wy;                               // cross(r, w)
  let hT = 0, hM = 0, hR = 0, hG = 0, hB = 0, nX = 0, nY = 0, nZ = 0;
  const cruzar = (ox, oy, oz, dx, dy, dz) => {
    hT = 1e9; hM = -1;
    const ix = 1 / dx, iy = 1 / dy, iz = 1 / dz;
    for (let i = 0; i < n; i++) {
      const k = i * 12;
      if (cx[k + 11] > 2.5) continue;
      let t0 = (cx[k] - ox) * ix, t1 = (cx[k + 4] - ox) * ix; let lo = Math.min(t0, t1), hi = Math.max(t0, t1);
      t0 = (cx[k + 1] - oy) * iy; t1 = (cx[k + 5] - oy) * iy; lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
      t0 = (cx[k + 2] - oz) * iz; t1 = (cx[k + 6] - oz) * iz; lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
      if (lo <= hi && hi > 1e-4) {
        const t = lo < 1e-4 ? hi : lo;
        if (t < hT) { hT = t; hM = cx[k + 11]; hR = cx[k + 8]; hG = cx[k + 9]; hB = cx[k + 10];
          const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
          const qx = (px - (cx[k] + cx[k + 4]) / 2) / ((cx[k + 4] - cx[k]) / 2), qy = (py - (cx[k + 1] + cx[k + 5]) / 2) / ((cx[k + 5] - cx[k + 1]) / 2), qz = (pz - (cx[k + 2] + cx[k + 6]) / 2) / ((cx[k + 6] - cx[k + 2]) / 2);
          const ax = Math.abs(qx), ay = Math.abs(qy), az = Math.abs(qz);
          if (ax > ay && ax > az) { nX = Math.sign(qx); nY = 0; nZ = 0; } else if (ay > az) { nX = 0; nY = Math.sign(qy); nZ = 0; } else { nX = 0; nY = 0; nZ = Math.sign(qz); }
        }
      }
    }
  };
  let soma = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const px = x0 + i, py = y0 + j, rnd = rng((px * 1973 + py * 9277 + passo * 26699) | 1);
    for (let s = 0; s < spp; s++) {
      const u = ((px + rnd()) * 2 - W) / H, v = ((H - py - rnd()) * 2 - H) / H;
      let dx = u * rx + v * ux + 1.25 * wx, dy = v * uy + 1.25 * wy, dz = u * rz + v * uz + 1.25 * wz;
      let dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
      let ox = ro[0], oy = ro[1], oz = ro[2], tr = 1, tg = 1, tb = 1, cr = 0;
      for (let salto = 0; salto < 5; salto++) {
        cruzar(ox, oy, oz, dx, dy, dz);
        if (hM < 0) { cr += tr * 1.4; break; }
        if (hM > .5 && hM < 1.5) { cr += tr * hR; break; }
        ox += dx * hT + nX * 1e-3; oy += dy * hT + nY * 1e-3; oz += dz * hT + nZ * 1e-3;
        tr *= hR; tg *= hG; tb *= hB;
        const ndl = nX * sx + nY * sy + nZ * sz;
        if (ndl > 0) { const m0 = hM, r0 = hR, g0 = hG, b0 = hB, a = nX, b = nY, c = nZ; cruzar(ox, oy, oz, sx, sy, sz); if (hM < 0) cr += tr * 9 * ndl; hM = m0; hR = r0; hG = g0; hB = b0; nX = a; nY = b; nZ = c; }
        const an = rnd() * 6.2831853, r2 = rnd(), rr = Math.sqrt(r2);
        const tx = Math.abs(nX) > .9 ? 0 : 1, ty = Math.abs(nX) > .9 ? 1 : 0;
        let bx = -nZ * ty, by = nZ * tx, bz = nX * ty - nY * tx; const bl = Math.hypot(bx, by, bz); bx /= bl; by /= bl; bz /= bl;
        const ex = nY * bz - nZ * by, ey = nZ * bx - nX * bz, ez = nX * by - nY * bx, zz = Math.sqrt(1 - r2);
        dx = bx * Math.cos(an) * rr + ex * Math.sin(an) * rr + nX * zz; dy = by * Math.cos(an) * rr + ey * Math.sin(an) * rr + nY * zz; dz = bz * Math.cos(an) * rr + ez * Math.sin(an) * rr + nZ * zz;
        if (salto > 1) { const q = Math.max(tr, tg, tb); if (rnd() > q) break; tr /= q; tg /= q; tb /= q; }
      }
      soma += cr;
    }
  }
  return {amostras: w * h * spp, soma};
}

// ================================================================== MOTION GRAPHICS (After Effects)
/** Desenha o quadro `k` de uma animação (formas, textos em barras, 1.500 partículas com brilho, desfoque de movimento). */
export function motionQuadro(k, {W = 1920, H = 1080, sub = 4, previa = false} = {}) {
  const img = new Float32Array(W * H * 3);
  const r = rng(99);
  const parts = [];
  for (let i = 0; i < 1500; i++) parts.push([r() * W, r() * H, (r() - .5) * 18, (r() - .5) * 18, 3 + r() * 6, r()]);
  for (let s = 0; s < sub; s++) {                                       // desfoque de movimento: 4 instantes por quadro
    const t = (k + s / sub) / 30;
    const peso = 1 / sub;
    // formas: 6 retângulos arredondados e 4 círculos animados (campo de distância, borda suave)
    const formas = [];
    for (let f = 0; f < 10; f++) {
      const a = t * (0.6 + f * .13) + f;
      formas.push([W * (.5 + .35 * Math.cos(a)), H * (.5 + .32 * Math.sin(a * 1.3)), 60 + 40 * Math.sin(a * 2), f < 6 ? 30 : 999, f % 2 ? [1, .85, .1] : [.6, .35, .95]]);
    }
    for (let y = 0; y < H; y++) {
      const fy = y / H;
      for (let x = 0; x < W; x++) {
        const o = (y * W + x) * 3, fx = x / W;
        let cr = .09 + .06 * fy, cg = .06 + .03 * fx, cb = .14 + .08 * fy;   // fundo em degradê
        for (let f = 0; f < 10; f++) {
          const F = formas[f], dx = Math.abs(x - F[0]), dy = Math.abs(y - F[1]);
          let d;
          if (F[3] < 999) { const qx = Math.max(dx - F[2] + F[3], 0), qy = Math.max(dy - F[2] * .6 + F[3], 0); d = Math.hypot(qx, qy) - F[3]; }
          else d = Math.hypot(dx, dy) - F[2] * .7;
          if (d < 24) {
            const cob = Math.min(1, Math.max(0, .5 - d / 2)), sombra = Math.max(0, 1 - Math.max(d, 0) / 24) * .25;
            cr = cr * (1 - cob) * (1 - sombra) + F[4][0] * cob; cg = cg * (1 - cob) * (1 - sombra) + F[4][1] * cob; cb = cb * (1 - cob) * (1 - sombra) + F[4][2] * cob;
          }
        }
        // "texto": barras animadas entrando da esquerda
        const linha = Math.floor((fy - .78) / .035);
        if (linha >= 0 && linha < 4) { const fim = Math.min(1, t * .9 - linha * .12) * (.5 - linha * .06); if (fx > .06 && fx < .06 + fim && ((fy - .78) / .035 % 1) < .55) { cr = cg = cb = .96; } }
        img[o] += cr * peso; img[o + 1] += cg * peso; img[o + 2] += cb * peso;
      }
    }
    // partículas com brilho (soma)
    for (const p of parts) {
      const px = (p[0] + p[2] * t * 30) % W, py = (p[1] + p[3] * t * 30 + H * 4) % H, R = p[4] * 3, x0 = Math.max(0, px - R | 0), x1 = Math.min(W - 1, px + R | 0);
      for (let y = Math.max(0, py - R | 0); y <= Math.min(H - 1, py + R | 0); y++) for (let x = x0; x <= x1; x++) {
        const d2 = ((x - px) ** 2 + (y - py) ** 2) / (p[4] * p[4]);
        const g = Math.exp(-d2) * peso * .9, o = (y * W + x) * 3;
        img[o] += g * (p[5] > .5 ? 1 : .7); img[o + 1] += g * (p[5] > .5 ? .85 : .45); img[o + 2] += g * (p[5] > .5 ? .2 : 1);
      }
    }
  }
  let assinatura = 0;
  for (let i = 0; i < img.length; i += 997) assinatura = (assinatura + Math.round(img[i] * 1000)) >>> 0;
  let mini = null;
  if (previa) {
    const w = 480, h = 270; mini = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = ((y * 4) * W + x * 4) * 3, d = (y * w + x) * 4;
      mini[d] = Math.min(255, img[o] * 255); mini[d + 1] = Math.min(255, img[o + 1] * 255); mini[d + 2] = Math.min(255, img[o + 2] * 255); mini[d + 3] = 255;
    }
  }
  return {assinatura, mini};
}

// ================================================================== SIMULAÇÃO (tecido + partículas)
export function simulacao({quadros = 250, lado = 110, particulas = 30000, aoAndar} = {}) {
  const N = lado * lado, x = new Float32Array(N * 3), px = new Float32Array(N * 3), fixo = new Uint8Array(N);
  for (let j = 0; j < lado; j++) for (let i = 0; i < lado; i++) {
    const k = (j * lado + i) * 3; x[k] = (i / (lado - 1) - .5) * 2; x[k + 1] = 2.2; x[k + 2] = (j / (lado - 1) - .5) * 2; px.set(x.subarray(k, k + 3), k);
  }
  const L = 2 / (lado - 1), restr = [];
  for (let j = 0; j < lado; j++) for (let i = 0; i < lado; i++) {
    const a = j * lado + i;
    if (i < lado - 1) restr.push(a, a + 1, L); if (j < lado - 1) restr.push(a, a + lado, L);
    if (i < lado - 1 && j < lado - 1) restr.push(a, a + lado + 1, L * Math.SQRT2);
    if (i < lado - 2) restr.push(a, a + 2, 2 * L);
  }
  const R = new Float32Array(restr), nR = R.length / 3;
  const r = rng(5), P = particulas, pp = new Float32Array(P * 3), pv = new Float32Array(P * 3);
  for (let i = 0; i < P; i++) { pp[i * 3] = (r() - .5) * 3; pp[i * 3 + 1] = 3 + r() * 3; pp[i * 3 + 2] = (r() - .5) * 3; }
  const dt = 1 / 30 / 4, esfera = [0, .9, 0, .7];
  const t0 = agora();
  for (let q = 0; q < quadros; q++) {
    if (PARAR.sim) break;
    for (let sub = 0; sub < 4; sub++) {
      for (let k = 0; k < N; k++) {                                     // Verlet com gravidade
        if (fixo[k]) continue;
        const o = k * 3;
        for (let c = 0; c < 3; c++) { const v = x[o + c] - px[o + c]; px[o + c] = x[o + c]; x[o + c] += v * .995 + (c === 1 ? -9.8 * dt * dt : 0); }
      }
      for (let it = 0; it < 12; it++) {
        for (let c = 0; c < nR; c++) {
          const a = R[c * 3] * 3, b = R[c * 3 + 1] * 3, rest = R[c * 3 + 2];
          const dx = x[b] - x[a], dy = x[b + 1] - x[a + 1], dz = x[b + 2] - x[a + 2], d = Math.hypot(dx, dy, dz) || 1e-6, f = (d - rest) / d * .5;
          x[a] += dx * f; x[a + 1] += dy * f; x[a + 2] += dz * f; x[b] -= dx * f; x[b + 1] -= dy * f; x[b + 2] -= dz * f;
        }
        for (let k = 0; k < N; k++) {                                   // colisão com a esfera e o chão
          const o = k * 3, dx = x[o] - esfera[0], dy = x[o + 1] - esfera[1], dz = x[o + 2] - esfera[2], d = Math.hypot(dx, dy, dz);
          if (d < esfera[3] + .02) { const s = (esfera[3] + .02) / d; x[o] = esfera[0] + dx * s; x[o + 1] = esfera[1] + dy * s; x[o + 2] = esfera[2] + dz * s; }
          if (x[o + 1] < 0) x[o + 1] = 0;
        }
      }
      for (let i = 0; i < P; i++) {                                     // partículas: gravidade, chão e a esfera
        const o = i * 3;
        pv[o + 1] -= 9.8 * dt; pp[o] += pv[o] * dt; pp[o + 1] += pv[o + 1] * dt; pp[o + 2] += pv[o + 2] * dt;
        if (pp[o + 1] < 0) { pp[o + 1] = 0; pv[o + 1] *= -.4; pv[o] *= .8; pv[o + 2] *= .8; }
        const dx = pp[o] - esfera[0], dy = pp[o + 1] - esfera[1], dz = pp[o + 2] - esfera[2], d = Math.hypot(dx, dy, dz);
        if (d < esfera[3]) { const nx = dx / d, ny = dy / d, nz = dz / d, vn = pv[o] * nx + pv[o + 1] * ny + pv[o + 2] * nz; if (vn < 0) { pv[o] -= 1.5 * vn * nx; pv[o + 1] -= 1.5 * vn * ny; pv[o + 2] -= 1.5 * vn * nz; } pp[o] = esfera[0] + nx * esfera[3]; pp[o + 1] = esfera[1] + ny * esfera[3]; pp[o + 2] = esfera[2] + nz * esfera[3]; }
      }
    }
    if (aoAndar) aoAndar(q + 1, quadros);
  }
  return {segundos: (agora() - t0) / 1000, quadros};
}

// ================================================================== mensagens
const ehWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
if (ehWorker) {
  let predio = null, regen = null;
  self.onmessage = async e => {
    const m = e.data;
    try {
      if (m.tipo === 'render') {
        const t0 = agora(), r = renderPedaco(m);
        self.postMessage({tipo: 'render', id: m.id, x0: m.x0, y0: m.y0, w: m.w, h: m.h, spp: m.spp, passo: m.passo, ms: agora() - t0,
                          rgb: r.rgb, assinatura: r.assinatura, amostras: r.amostras}, [r.rgb.buffer]);
      } else if (m.tipo === 'colisao') {
        const t0 = agora(), f = colisao(m);
        self.postMessage({id: m.id, f, ms: agora() - t0}, [f.buffer]);
      } else if (m.tipo === 'jogo') {
        self.postMessage(await jogo(m, (d, tr) => self.postMessage(d, tr)));
      } else if (m.tipo === 'parar') {
        PARAR.sim = true;
      } else if (m.tipo === 'banda') {
        self.postMessage({tipo: 'banda', ...banda(m)});
      } else if (m.tipo === 'latencia') {
        self.postMessage({tipo: 'latencia', ...latencia(m)});
      } else if (m.tipo === 'bim') {
        predio = criarPredio(m.predio || {});
        regen = regenerar(predio, m);                                    // primeira montagem (fora da conta)
        const tempos = [], tIni = agora();
        for (let k = 0; k < m.alteracoes; k++) {
          if (PARAR.sim || (m.segundos && agora() - tIni > m.segundos * 1000)) break;   // teste pesado: repete até dar o tempo
          const t0 = agora();
          moverParede(predio, k % 2 ? -.3 : .3);
          regen = regenerar(predio, m);
          tempos.push((agora() - t0) / 1000);
          self.postMessage({tipo: 'andamento', feitas: k + 1, ultimo: tempos.at(-1)});
        }
        self.postMessage({tipo: 'fim', tempos, triangulos: regen.triangulos, ambientes: regen.ambientes, area: regen.area, linhas: regen.linhas, assinatura: regen.assinatura});
      } else if (m.tipo === 'sala') {
        const cx = await carregarSala();
        const t0 = agora(), r = salaPedaco(cx, m);
        self.postMessage({tipo: 'sala', id: m.id, amostras: r.amostras, ms: agora() - t0});
      } else if (m.tipo === 'motion') {
        const r = motionQuadro(m.quadro, m);
        self.postMessage({tipo: 'motion', id: m.id, quadro: m.quadro, assinatura: r.assinatura, mini: r.mini}, r.mini ? [r.mini.buffer] : []);
      } else if (m.tipo === 'simulacao') {
        const r = simulacao({...m, aoAndar: (q, t) => { if (q % 10 === 0) self.postMessage({tipo: 'andamento', feitos: q, total: t}); }});
        self.postMessage({tipo: 'fim', ...r});
      } else if (m.tipo === 'pranchas') {
        predio = criarPredio(m.predio || {});
        regen = regenerar(predio, {resolucao: .1});
        const t0 = agora();
        let bytes = 0, comp = 0;
        for (const k of m.numeros) {
          if (PARAR.sim) break;
          for (let vista = 0; vista < 3; vista++) {                     // 3 vistas por prancha (planta, ampliação e cobertura)
            const p = prancha(predio, regen, k + vista * 7);
            bytes += p.bytes; comp += p.comp;
          }
          self.postMessage({tipo: 'andamento', feita: k});
        }
        self.postMessage({tipo: 'fim', segundos: (agora() - t0) / 1000, bytes, comp});
      }
    } catch (err) {
      self.postMessage({tipo: 'erro', id: m.id, erro: String(err && err.stack || err)});
    }
  };
}
