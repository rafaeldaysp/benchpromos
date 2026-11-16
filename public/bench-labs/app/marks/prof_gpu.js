/* Bench Marks · testes pesados de Engenharia, Design e Edição de vídeo na placa de vídeo
 *
 *   MontagemCAD · montagem mecânica com cerca de 4.000 peças (redutores, eixos, engrenagens, parafusos), sombreada
 *                 com arestas, uma chamada de desenho por peça, como a janela 3D do SolidWorks e do Inventor
 *   FluidoLBM   · ar passando por uma asa (método de Boltzmann em rede, 2048 × 768 células), como uma simulação de fluido
 *   FotoGPU     · 7 filtros numa foto de 100 megapixels (12 blocos de 2880 × 2880), como o Photoshop com a placa ligada
 *   DenoiseIA   · remover ruído com IA: rede neural de convolução numa foto de 24 megapixels, como no Lightroom
 *   VideoNR     · redução de ruído temporal e espacial, correção de cor e brilho num vídeo 4K, como no DaVinci Resolve
 *
 * Todas desenham fora da tela em resolução fixa e mostram uma prévia na janela, como o resto do Bench Marks.
 */
import {BaseGPU} from './odonto_gpu.js';

const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function olharPara(o, a, cima = [0, 1, 0]) {
  const z = norm(sub(o, a)), x = norm(cruz(cima, z)), y = cruz(z, x);
  const d = v => -(v[0] * o[0] + v[1] * o[1] + v[2] * o[2]);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, d(x), d(y), d(z), 1]);
}
function perspectiva(fov, asp, perto, longe) {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (perto - longe);
  return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, longe * nf, -1, 0, 0, perto * longe * nf, 0]);
}
function rng(s) { s = (s >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const TELA = /* wgsl */`
@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array<vec2f, 3>(vec2f(-1., -3.), vec2f(-1., 1.), vec2f(3., 1.));
  return vec4f(p[i], 0., 1.);
}`;

// ================================================================== MONTAGEM CAD
// peças-base (eixo da peça = z local, altura de -0,5 a 0,5, raio 0,5): cilindro, caixa, engrenagem e sextavado
function malhas() {
  const V = [], I = [], A = [], ms = {};
  const fim = (nome, v0, i0, a0) => { ms[nome] = {base: v0 / 6, primeiro: i0, n: I.length - i0, aresta0: a0, arestas: A.length - a0}; };
  const vert = (x, y, z, nx, ny, nz) => { V.push(x, y, z, nx, ny, nz); return V.length / 6 - 1 - ms._base; };
  // prisma por um contorno (lista de pontos [x, y] em sentido anti-horário), lados lisos ou facetados
  const prisma = (nome, pts, liso, verticais = !liso) => {
    const v0 = V.length, i0 = I.length, a0 = A.length; ms._base = v0 / 6;
    const n = pts.length;
    for (let k = 0; k < n; k++) {                                    // lados
      const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % n];
      let nx = y1 - y0, ny = -(x1 - x0); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const na = liso ? norm([x0, y0, 0]) : [nx, ny, 0], nb = liso ? norm([x1, y1, 0]) : [nx, ny, 0];
      const a = vert(x0, y0, -.5, ...na), b = vert(x1, y1, -.5, ...nb), c = vert(x1, y1, .5, ...nb), d = vert(x0, y0, .5, ...na);
      I.push(a, b, c, a, c, d);
    }
    for (const [z, nz] of [[.5, 1], [-.5, -1]]) {                    // tampas
      const c = vert(0, 0, z, 0, 0, nz), ini = V.length / 6 - ms._base;
      for (const [x, y] of pts) vert(x, y, z, 0, 0, nz);
      for (let k = 0; k < n; k++) { const a = ini + k, b = ini + (k + 1) % n; if (nz > 0) I.push(c, a, b); else I.push(c, b, a); }
      for (let k = 0; k < n; k++) A.push(ini + k, ini + (k + 1) % n);
    }
    if (verticais) for (let k = 0; k < n; k++) A.push(k * 4, k * 4 + 3);  // arestas verticais (só nas peças facetadas)
    fim(nome, v0, i0, a0);
  };
  const circulo = (seg, r = .5) => Array.from({length: seg}, (_, k) => [Math.cos(k / seg * Math.PI * 2) * r, Math.sin(k / seg * Math.PI * 2) * r]);
  prisma('cilindro', circulo(96), true);
  prisma('sextavado', circulo(6), false);
  prisma('caixa', [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], false);
  const dentes = 40, eng = [];
  for (let t = 0; t < dentes; t++) for (let s = 0; s < 10; s++) {
    const a = (t + s / 10) / dentes * Math.PI * 2, f = s / 10;
    const r = f < .2 ? .42 : f < .35 ? .42 + (f - .2) / .15 * .08 : f < .65 ? .5 : f < .8 ? .5 - (f - .65) / .15 * .08 : .42;
    eng.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  prisma('engrenagem', eng, false, false);
  delete ms._base;
  return {V: new Float32Array(V), I: new Uint32Array(I), A: new Uint32Array(A), ms};
}

/** A montagem: uma linha com 24 redutores (motor, carcaça aberta, eixos, mancais, engrenagens e parafusos). */
export function montagem() {
  const r = rng(4000), P = [];
  const peca = (tipo, x, y, z, sx, sy, sz, eixo, cor, ang = 0) => P.push({tipo, x, y, z, sx, sy, sz, eixo, cor, ang});
  // cores: 0 aço, 1 aço escuro, 2 azul (carcaça), 3 laranja (motor), 4 amarelo (selecionado), 5 cinza claro
  for (let lin = 0; lin < 4; lin++) for (let col = 0; col < 6; col++) {
    const ox = (col - 2.5) * 3.2, oz = (lin - 1.5) * 2.6, sel = lin === 1 && col === 3;
    const az = sel ? 4 : 2;
    peca('caixa', ox, .05, oz, 2.4, .1, 1.6, 2, 1);                                        // base
    for (const s of [-1, 1]) peca('caixa', ox, .55, oz + s * .7, 2.2, .9, .08, 2, az);       // paredes laterais
    peca('caixa', ox - 1.1, .55, oz, .08, .9, 1.4, 2, az);                                   // tampa de trás
    for (let e = 0; e < 3; e++) {                                                           // eixos, mancais e porcas
      const ex = ox - .7 + e * .7, ey = .45 + (e % 2) * .25;
      peca('cilindro', ex, ey, oz, .07, .07, 1.7, 2, 0);
      for (const s of [-1, 1]) {
        peca('cilindro', ex, ey, oz + s * .7, .22, .22, .12, 2, 5);
        peca('sextavado', ex, ey, oz + s * .86, .13, .13, .08, 2, 1);
      }
      for (let g = 0; g < 2; g++) {                                                         // engrenagens
        const rg = .32 + ((e + g) % 3) * .12;
        peca('engrenagem', ex, ey, oz + (g ? .22 : -.22), rg * 2, rg * 2, .1, 2, 0, r() * 6.28);
      }
    }
    for (let b = 0; b < 40; b++) {                                                          // parafusos em volta da base
      const t = b / 40, bx = ox + (t < .5 ? (t * 4 - 1) * 1.1 : (3 - t * 4) * 1.1), bz = oz + (t < .5 ? -.72 : .72);
      peca('sextavado', bx, .14, bz, .06, .06, .05, 1, 1);
      peca('cilindro', bx, .06, bz, .035, .035, .12, 1, 0);
      peca('cilindro', bx, .105, bz, .09, .09, .015, 1, 5);
    }
    peca('cilindro', ox + 1.45, .5, oz, .7, .7, .9, 0, 3);                                   // motor
    for (let f = 0; f < 16; f++) { const a = f / 16 * Math.PI * 2; peca('caixa', ox + 1.45, .5 + Math.sin(a) * .38, oz + Math.cos(a) * .38, .06, .06, .8, 0, 3, -a); }
    peca('cilindro', ox + 1.95, .5, oz, .5, .5, .1, 0, 1);
  }
  for (let k = 0; k < 13; k++) peca('caixa', 0, -.15, (k - 6) * .9, 20, .2, .12, 2, 1);      // estrutura
  for (let k = 0; k < 15; k++) peca('caixa', (k - 7) * 1.4, -.15, 0, .12, .2, 11, 2, 1);
  return P;
}

const CAD = /* wgsl */`
struct U { vp: mat4x4f, olho: vec4f, luz: vec4f };
struct P { a: vec4f, b: vec4f, c: vec4f };        // a: posição e cor; b: tamanho e eixo; c: giro
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> pecas: array<P>;
struct VS { @builtin(position) p: vec4f, @location(0) n: vec3f, @location(1) w: vec3f, @location(2) @interpolate(flat) cor: u32 };
const CORES = array<vec3f, 6>(vec3f(.72, .74, .78), vec3f(.32, .33, .36), vec3f(.22, .42, .78), vec3f(.92, .5, .14), vec3f(1., .86, .1), vec3f(.86, .87, .89));
fn girar(v: vec3f, a: f32) -> vec3f { let c = cos(a); let s = sin(a); return vec3f(c * v.x - s * v.y, s * v.x + c * v.y, v.z); }
fn eixo(v: vec3f, e: f32) -> vec3f {                       // o eixo z da peça vira x, y ou z do mundo
  if (e < .5) { return vec3f(v.z, v.y, v.x); }
  if (e < 1.5) { return vec3f(v.x, v.z, v.y); }
  return v;
}
fn mundo(i: u32, p: vec3f) -> vec3f { let q = pecas[i]; return eixo(girar(p * q.b.xyz, q.c.x), q.b.w) + q.a.xyz; }
@vertex fn vsFace(@location(0) pos: vec3f, @location(1) nor: vec3f, @builtin(instance_index) i: u32) -> VS {
  let q = pecas[i];
  var o: VS;
  let w = mundo(i, pos);
  o.p = u.vp * vec4f(w, 1.);
  o.n = normalize(eixo(girar(nor / q.b.xyz, q.c.x), q.b.w));
  o.w = w; o.cor = u32(q.a.w);
  return o;
}
@fragment fn fsFace(i: VS) -> @location(0) vec4f {
  let n = normalize(i.n); let l = normalize(u.luz.xyz); let v = normalize(u.olho.xyz - i.w);
  let d = max(dot(n, l), 0.); let h = normalize(l + v);
  let c = CORES[i.cor] * (.35 + .65 * d + .12 * n.y) + vec3f(pow(max(dot(n, h), 0.), 40.) * .35);
  return vec4f(c, 1.);
}
@vertex fn vsAresta(@location(0) pos: vec3f, @builtin(instance_index) i: u32) -> @builtin(position) vec4f {
  var p = u.vp * vec4f(mundo(i, pos), 1.);
  p.z -= .0006 * p.w;
  return p;
}
@fragment fn fsAresta() -> @location(0) vec4f { return vec4f(.14, .15, .18, 1.); }
`;

export class MontagemCAD extends BaseGPU {
  async iniciar(canvas, {largura = 1920, altura = 1080} = {}) {
    await this._dispositivo();
    const d = this.dev;
    this._tela(canvas, largura, altura, 4);
    const m = malhas(), P = montagem();
    this.m = m; this.n = P.length;
    this.triangulos = P.reduce((s, p) => s + m.ms[p.tipo].n / 3, 0);
    const buf = (dados, uso) => { const b = d.createBuffer({size: Math.ceil(dados.byteLength / 4) * 4, usage: uso | GPUBufferUsage.COPY_DST}); d.queue.writeBuffer(b, 0, dados); return b; };
    this.vb = buf(m.V, GPUBufferUsage.VERTEX); this.ib = buf(m.I, GPUBufferUsage.INDEX); this.ab = buf(m.A, GPUBufferUsage.INDEX);
    const inst = new Float32Array(P.length * 12);
    P.forEach((p, i) => inst.set([p.x, p.y, p.z, p.cor, p.sx, p.sy, p.sz, p.eixo, p.ang, 0, 0, 0], i * 12));
    this.pb = buf(inst, GPUBufferUsage.STORAGE);
    this.P = P;
    this.uni = d.createBuffer({size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.prof = d.createTexture({size: [largura, altura], sampleCount: 4, format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT});
    const mod = d.createShaderModule({code: CAD});
    const bgl = d.createBindGroupLayout({entries: [{binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
      {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'read-only-storage'}}]});
    const lay = d.createPipelineLayout({bindGroupLayouts: [bgl]}), ds = {format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less-equal'}, ms = {count: 4};
    const vbl = [{arrayStride: 24, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}, {shaderLocation: 1, offset: 12, format: 'float32x3'}]}];
    this.pFace = d.createRenderPipeline({layout: lay, vertex: {module: mod, entryPoint: 'vsFace', buffers: vbl}, fragment: {module: mod, entryPoint: 'fsFace', targets: [{format: 'rgba8unorm'}]},
      primitive: {topology: 'triangle-list'}, depthStencil: ds, multisample: ms});
    this.pAresta = d.createRenderPipeline({layout: lay, vertex: {module: mod, entryPoint: 'vsAresta', buffers: [{arrayStride: 24, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]}]},
      fragment: {module: mod, entryPoint: 'fsAresta', targets: [{format: 'rgba8unorm'}]}, primitive: {topology: 'line-list'}, depthStencil: ds, multisample: ms});
    this.bg = d.createBindGroup({layout: bgl, entries: [{binding: 0, resource: {buffer: this.uni}}, {binding: 1, resource: {buffer: this.pb}}]});
    return this.adaptador.info || {};
  }

  _desenhar(seg, mostrar) {
    const a = seg * .18 + .5, R = 15 + 4 * Math.sin(seg * .13);
    const olho = [Math.sin(a) * R, 6.5 + 2.5 * Math.sin(seg * .11), Math.cos(a) * R], alvo = [Math.sin(seg * .07) * 2, 0, 0];
    const vp = mul(perspectiva(.7, this.largura / this.altura, .1, 100), olharPara(olho, alvo));
    const u = new Float32Array(24); u.set(vp, 0); u.set([...olho, 1], 16); u.set([...norm([.5, .9, .35]), 0], 20);
    this.dev.queue.writeBuffer(this.uni, 0, u);
    const enc = this.dev.createCommandEncoder();
    const p = enc.beginRenderPass({colorAttachments: [{view: this.alvoMS.createView(), resolveTarget: this.alvo.createView(), loadOp: 'clear', storeOp: 'discard', clearValue: [.84, .86, .9, 1]}],
      depthStencilAttachment: {view: this.prof.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'discard'}});
    p.setBindGroup(0, this.bg); p.setVertexBuffer(0, this.vb);
    // uma chamada de desenho por peça, como os programas de CAD (é o que pesa no processador)
    p.setPipeline(this.pFace); p.setIndexBuffer(this.ib, 'uint32');
    for (let i = 0; i < this.n; i++) { const g = this.m.ms[this.P[i].tipo]; p.drawIndexed(g.n, 1, g.primeiro, g.base, i); }
    p.setPipeline(this.pAresta); p.setIndexBuffer(this.ab, 'uint32');
    for (let i = 0; i < this.n; i++) { const g = this.m.ms[this.P[i].tipo]; p.drawIndexed(g.arestas, 1, g.aresta0, g.base, i); }
    p.end();
    if (mostrar) this._mostrar(enc);
    this.dev.queue.submit([enc.finish()]);
  }
}

// ================================================================== FLUIDO (Boltzmann em rede, D2Q9)
const LBM = /* wgsl */`
struct U { w: u32, h: u32, passo: u32, pad: u32, u0: f32, omega: f32, p2: f32, p3: f32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> fin: array<f32>;
@group(0) @binding(2) var<storage, read_write> fout: array<f32>;
@group(0) @binding(3) var<storage, read> solido: array<u32>;
@group(0) @binding(4) var<storage, read_write> vel: array<vec2f>;
const CX = array<i32, 9>(0, 1, 0, -1, 0, 1, -1, -1, 1);
const CY = array<i32, 9>(0, 0, 1, 0, -1, 1, 1, -1, -1);
const PESO = array<f32, 9>(.444444, .111111, .111111, .111111, .111111, .027778, .027778, .027778, .027778);
const OPOSTO = array<u32, 9>(0u, 3u, 4u, 1u, 2u, 7u, 8u, 5u, 6u);
fn feq(k: u32, rho: f32, ux: f32, uy: f32) -> f32 {
  let cu = f32(CX[k]) * ux + f32(CY[k]) * uy;
  return PESO[k] * rho * (1. + 3. * cu + 4.5 * cu * cu - 1.5 * (ux * ux + uy * uy));
}
@compute @workgroup_size(16, 16) fn passo(@builtin(global_invocation_id) id: vec3u) {
  let x = i32(id.x); let y = i32(id.y); let W = i32(u.w); let H = i32(u.h);
  if (x >= W || y >= H) { return; }
  let i = u32(y * W + x); let N = u.w * u.h;
  if (solido[i] != 0u) { for (var k = 0u; k < 9u; k++) { fout[k * N + i] = PESO[k]; } vel[i] = vec2f(0.); return; }
  var f: array<f32, 9>;
  for (var k = 0u; k < 9u; k++) {
    let xs = x - CX[k]; let ys = (y - CY[k] + H) % H;
    if (xs < 0) { f[k] = feq(k, 1., u.u0, 0.); continue; }                 // entrada do vento
    let j = u32(ys * W + min(xs, W - 1));
    if (solido[j] != 0u) { f[k] = fin[OPOSTO[k] * N + i]; } else { f[k] = fin[k * N + j]; }   // volta ao bater na asa
  }
  var rho = 0.; var ux = 0.; var uy = 0.;
  for (var k = 0u; k < 9u; k++) { rho += f[k]; ux += f[k] * f32(CX[k]); uy += f[k] * f32(CY[k]); }
  if (rho < .5 || rho > 2. || rho != rho) { rho = 1.; ux = u.u0; uy = 0.; for (var k = 0u; k < 9u; k++) { f[k] = feq(k, 1., u.u0, 0.); } }
  else { ux /= rho; uy /= rho; }
  for (var k = 0u; k < 9u; k++) { fout[k * N + i] = f[k] + u.omega * (feq(k, rho, ux, uy) - f[k]); }
  vel[i] = vec2f(ux, uy);
}
`;
const LBM_TELA = TELA + /* wgsl */`
struct U { w: u32, h: u32, passo: u32, pad: u32, u0: f32, omega: f32, p2: f32, p3: f32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> vel: array<vec2f>;
@group(0) @binding(2) var<storage, read> solido: array<u32>;
@group(0) @binding(3) var<uniform> res: vec4f;
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let W = i32(u.w); let H = i32(u.h);
  let x = clamp(i32(fc.x / res.x * f32(W)), 1, W - 2); let y = clamp(i32((1. - fc.y / res.y) * f32(H)), 1, H - 2);
  let i = y * W + x;
  if (solido[i] != 0u) { return vec4f(.78, .8, .84, 1.); }
  let vort = (vel[i + 1].y - vel[i - 1].y) - (vel[i + W].x - vel[i - W].x);
  let rapidez = length(vel[i]) / (u.u0 * 1.6);
  let k = clamp(vort * 28., -1., 1.);
  let base = mix(vec3f(.05, .04, .09), vec3f(.16, .12, .26), clamp(rapidez, 0., 1.));
  let c = select(mix(base, vec3f(1., .82, .1), k), mix(base, vec3f(.4, .62, 1.), -k), k < 0.);
  return vec4f(c, 1.);
}
`;

export class FluidoLBM extends BaseGPU {
  async iniciar(canvas, {largura = 1920, altura = 720, W = 2048, H = 768} = {}) {
    const bytes = W * H * 9 * 4;
    await this._dispositivo({maxStorageBufferBindingSize: Math.max(134217728, bytes), maxBufferSize: Math.max(268435456, bytes)});
    const d = this.dev, N = W * H;
    this.W = W; this.H = H; this.celulas = N;
    this._tela(canvas, largura, altura);
    // asa (perfil NACA 2412) inclinada 10 graus, e um cilindro mais atrás
    const sol = new Uint32Array(N), c = H * .5, ox = W * .2, oy = H * .52, ang = -10 * Math.PI / 180;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x - ox, dy = y - oy, px = (dx * Math.cos(ang) - dy * Math.sin(ang)) / c, py = (dx * Math.sin(ang) + dy * Math.cos(ang)) / c;
      if (px >= 0 && px <= 1) {
        const yt = .6 * (.2969 * Math.sqrt(px) - .126 * px - .3516 * px * px + .2843 * px ** 3 - .1015 * px ** 4);
        const yc = px < .4 ? .02 / .16 * (.8 * px - px * px) : .02 / .36 * (.2 + .8 * px - px * px);
        if (Math.abs(py - yc) <= yt) sol[y * W + x] = 1;
      }
      if (Math.hypot(x - W * .62, y - H * .3) < H * .05) sol[y * W + x] = 1;
    }
    const f = new Float32Array(N * 9), u0 = .1, w = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36], cx = [0, 1, 0, -1, 0, 1, -1, -1, 1];
    for (let k = 0; k < 9; k++) { const cu = cx[k] * u0, v = w[k] * (1 + 3 * cu + 4.5 * cu * cu - 1.5 * u0 * u0); f.fill(v, k * N, (k + 1) * N); }
    const S = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
    this.fa = d.createBuffer({size: bytes, usage: S}); this.fb = d.createBuffer({size: bytes, usage: S});
    d.queue.writeBuffer(this.fa, 0, f); d.queue.writeBuffer(this.fb, 0, f);
    this.sol = d.createBuffer({size: N * 4, usage: S}); d.queue.writeBuffer(this.sol, 0, sol);
    this.vel = d.createBuffer({size: N * 8, usage: S});
    this.uni = d.createBuffer({size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const ub = new ArrayBuffer(32); new Uint32Array(ub).set([W, H, 0, 0]); new Float32Array(ub).set([u0, 1 / .56], 4);
    d.queue.writeBuffer(this.uni, 0, ub);
    this.pipe = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: LBM}), entryPoint: 'passo'}});
    const bg = (a, b) => d.createBindGroup({layout: this.pipe.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.uni}}, {binding: 1, resource: {buffer: a}},
      {binding: 2, resource: {buffer: b}}, {binding: 3, resource: {buffer: this.sol}}, {binding: 4, resource: {buffer: this.vel}}]});
    this.bgs = [bg(this.fa, this.fb), bg(this.fb, this.fa)];
    const mt = d.createShaderModule({code: LBM_TELA});
    this.pTela = d.createRenderPipeline({layout: 'auto', vertex: {module: mt, entryPoint: 'vs'}, fragment: {module: mt, entryPoint: 'fs', targets: [{format: 'rgba8unorm'}]}});
    this.uRes = d.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    d.queue.writeBuffer(this.uRes, 0, new Float32Array([largura, altura, 0, 0]));
    this.bgTela = d.createBindGroup({layout: this.pTela.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.uni}}, {binding: 1, resource: {buffer: this.vel}},
      {binding: 2, resource: {buffer: this.sol}}, {binding: 3, resource: {buffer: this.uRes}}]});
    this.k = 0; this.passos = 0;
    return this.adaptador.info || {};
  }

  // cada "quadro" do teste avança 10 passos da simulação; a medida é em células por segundo
  _desenhar(seg, mostrar) {
    const enc = this.dev.createCommandEncoder();
    for (let s = 0; s < 10; s++) {
      const p = enc.beginComputePass(); p.setPipeline(this.pipe); p.setBindGroup(0, this.bgs[this.k]); p.dispatchWorkgroups(Math.ceil(this.W / 16), Math.ceil(this.H / 16)); p.end();
      this.k ^= 1;
    }
    this.passos += 10;
    if (mostrar) {
      const r = enc.beginRenderPass({colorAttachments: [{view: this.alvo.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
      r.setPipeline(this.pTela); r.setBindGroup(0, this.bgTela); r.draw(3); r.end();
      this._mostrar(enc);
    }
    this.dev.queue.submit([enc.finish()]);
  }
}

// ================================================================== FOTO DE 100 MEGAPIXELS (7 filtros)
const FOTO_COMUM = /* wgsl */`
struct U { tx: f32, ty: f32, W: f32, H: f32, k: f32, p1: f32, p2: f32, p3: f32 };
@group(0) @binding(0) var<uniform> u: U;
fn h2(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }
fn rd(p: vec2f) -> f32 { let i = floor(p); var f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h2(i), h2(i + vec2f(1., 0.)), f.x), mix(h2(i + vec2f(0., 1.)), h2(i + vec2f(1., 1.)), f.x), f.y); }
// a foto: pôr do sol num lago com montanhas e árvores (coordenadas de 0 a 1 na foto inteira)
fn foto(q: vec2f) -> vec3f {
  var c = mix(vec3f(.17, .24, .48), vec3f(.95, .62, .42), smoothstep(.0, .62, q.y));
  let sol = length((q - vec2f(.68, .55)) * vec2f(1.33, 1.)); c += vec3f(1., .8, .45) * smoothstep(.07, .0, sol) + vec3f(.5, .3, .1) * exp(-sol * 6.);
  let m1 = .5 + .08 * rd(vec2f(q.x * 6., 1.)) + .05 * rd(vec2f(q.x * 23., 3.));
  if (q.y > m1) { c = mix(vec3f(.35, .27, .46), vec3f(.2, .17, .3), (q.y - m1) * 4.); }
  let m2 = .62 + .05 * rd(vec2f(q.x * 9., 7.)) + .02 * rd(vec2f(q.x * 60., 9.));
  if (q.y > m2) { c = vec3f(.12, .1, .18) + .05 * rd(q * 400.); }
  if (q.y > .74) { let r = q.y - .74; c = mix(vec3f(.78, .5, .48), vec3f(.12, .13, .26), smoothstep(0., .26, r)) + vec3f(1., .8, .45) * .5 * smoothstep(.04, .0, abs(q.x - .68)) * step(fract(q.y * 220. + rd(q * 30.)), .5) * (1. - r * 3.); }
  if (q.x < .25 && q.y > .55) { let t = rd(vec2f(q.x * 140., 1.)); if (q.y > .74 - t * .16) { c = vec3f(.05, .06, .08); } }
  return c + (h2(q * 9000.) - .5) * .02;
}
`;
const FILTROS = {
  gerar: `@group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = textureDimensions(dst); if (id.x >= d.x || id.y >= d.y) { return; }
      let q = (vec2f(id.xy) + vec2f(u.tx, u.ty)) / vec2f(u.W, u.H);
      textureStore(dst, id.xy, vec4f(foto(q), 1.)); }`,
  desfoqueH: `@group(0) @binding(1) var src: texture_2d<f32>; @group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = textureDimensions(src); if (id.x >= d.x || id.y >= d.y) { return; }
      var s = vec4f(0.); var w = 0.;
      for (var k = -24; k <= 24; k++) { let x = clamp(i32(id.x) + k * select(1, 0, u.k > .5), 0, i32(d.x) - 1); let y = clamp(i32(id.y) + k * select(0, 1, u.k > .5), 0, i32(d.y) - 1);
        let g = exp(-f32(k * k) / 200.); s += textureLoad(src, vec2i(x, y), 0) * g; w += g; }
      textureStore(dst, id.xy, s / w); }`,
  nitidez: `@group(0) @binding(1) var src: texture_2d<f32>; @group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = vec2i(textureDimensions(src)); let p = vec2i(id.xy); if (p.x >= d.x || p.y >= d.y) { return; }
      var b = vec4f(0.); var w = 0.;
      for (var j = -3; j <= 3; j++) { for (var i = -3; i <= 3; i++) { let g = exp(-f32(i * i + j * j) / 4.5); b += textureLoad(src, clamp(p + vec2i(i, j), vec2i(0), d - 1), 0) * g; w += g; } }
      let c = textureLoad(src, p, 0); let det = c - b / w;
      textureStore(dst, id.xy, clamp(c + det * 1.6 * smoothstep(.0, .08, length(det.rgb)), vec4f(0.), vec4f(1.))); }`,
  curvas: `@group(0) @binding(1) var src: texture_2d<f32>; @group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = textureDimensions(src); if (id.x >= d.x || id.y >= d.y) { return; }
      var c = textureLoad(src, vec2i(id.xy), 0).rgb;
      c = c * c * (3. - 2. * c);                                     // curva em S
      let l = dot(c, vec3f(.299, .587, .114)); c = mix(vec3f(l), c, 1.3);   // mais saturação
      c = mix(c * vec3f(.92, .98, 1.08), c * vec3f(1.08, 1., .9), smoothstep(.3, .8, l));   // sombras frias, luzes quentes
      textureStore(dst, id.xy, vec4f(clamp(c, vec3f(0.), vec3f(1.)), 1.)); }`,
  lente: `@group(0) @binding(1) var src: texture_2d<f32>; @group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>; @group(0) @binding(3) var amo: sampler;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = vec2f(textureDimensions(src)); if (f32(id.x) >= d.x || f32(id.y) >= d.y) { return; }
      let q = (vec2f(id.xy) + .5) / d; let c = q - .5; let r2 = dot(c, c);
      let k = 1. + .06 * r2 + .02 * r2 * r2;
      let rr = textureSampleLevel(src, amo, .5 + c * k * 1.003, 0.).r; let gg = textureSampleLevel(src, amo, .5 + c * k, 0.).g; let bb = textureSampleLevel(src, amo, .5 + c * k * .997, 0.).b;
      textureStore(dst, id.xy, vec4f(vec3f(rr, gg, bb) * (1. - .35 * r2 * 2.), 1.)); }`,
  liquify: `@group(0) @binding(1) var src: texture_2d<f32>; @group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>; @group(0) @binding(3) var amo: sampler;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = vec2f(textureDimensions(src)); if (f32(id.x) >= d.x || f32(id.y) >= d.y) { return; }
      let q = (vec2f(id.xy) + .5) / d; var o = vec2f(0.);
      for (var k = 0; k < 6; k++) { let fk = f32(k); let ctr = vec2f(rd(vec2f(fk, 1.)), rd(vec2f(fk, 5.))); let v = q - ctr; o += vec2f(-v.y, v.x) * exp(-dot(v, v) * 40.) * .05; }
      textureStore(dst, id.xy, textureSampleLevel(src, amo, q + o, 0.)); }`,
  granulado: `@group(0) @binding(1) var src: texture_2d<f32>; @group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = textureDimensions(src); if (id.x >= d.x || id.y >= d.y) { return; }
      let c = textureLoad(src, vec2i(id.xy), 0).rgb; let p = vec2f(id.xy) + vec2f(u.tx, u.ty);
      let g = (rd(p * .7) + rd(p * 1.9) + h2(p) - 1.5) * .06;
      textureStore(dst, id.xy, vec4f(clamp(c + g * (1. - dot(c, vec3f(.33))), vec3f(0.), vec3f(1.)), 1.)); }`,
  camadas: `@group(0) @binding(1) var src: texture_2d<f32>; @group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>;
    @compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
      _ = u.W; let d = textureDimensions(src); if (id.x >= d.x || id.y >= d.y) { return; }
      let q = (vec2f(id.xy) + vec2f(u.tx, u.ty)) / vec2f(u.W, u.H);
      var c = textureLoad(src, vec2i(id.xy), 0).rgb;
      for (var k = 0; k < 12; k++) {                               // 12 camadas: degradês, manchas de luz e texturas
        let fk = f32(k); let a = vec3f(rd(q * (2. + fk) + fk), rd(q * (3. + fk) + fk * 2.), rd(q * (5. + fk) - fk));
        let ov = select(2. * c * a, 1. - 2. * (1. - c) * (1. - a), c > vec3f(.5));
        c = mix(c, ov, .06);
      }
      textureStore(dst, id.xy, vec4f(clamp(c, vec3f(0.), vec3f(1.)), 1.)); }`,
};
export const NOMES_FILTROS = [['desfoque', 'Desfoque de lente'], ['nitidez', 'Nitidez inteligente'], ['curvas', 'Curvas e cores'], ['lente', 'Correção de lente'],
  ['liquify', 'Distorcer (Liquify)'], ['granulado', 'Granulado de filme'], ['camadas', 'Juntar 12 camadas']];
const PREVIA_FOTO = /* wgsl */`
@group(0) @binding(0) var<uniform> u: vec4f;                  // largura e altura da foto, colunas de blocos, posição da linha antes/depois
@group(0) @binding(1) var blocos: texture_2d_array<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var amo: sampler;
${FOTO_COMUM.replace('@group(0) @binding(0) var<uniform> u: U;', '')}
@compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
  let d = vec2f(textureDimensions(dst)); if (f32(id.x) >= d.x || f32(id.y) >= d.y) { return; }
  let q = (vec2f(id.xy) + .5) / d;
  var c: vec3f;
  if (q.x < u.w) { c = foto(q); }
  else {
    let tam = vec2f(u.x / u.z, u.x / u.z); let px = q * vec2f(u.x, u.y); let b = floor(px / tam);
    let camada = i32(b.y * u.z + b.x); let dentro = (px - b * tam) / tam;
    c = textureSampleLevel(blocos, amo, dentro, camada, 0.).rgb;
  }
  if (abs(q.x - u.w) < .0015) { c = vec3f(.96); }
  textureStore(dst, id.xy, vec4f(c, 1.));
}`;

export class FotoGPU extends BaseGPU {
  /** blocos: [colunas, linhas] de blocos de `lado` pixels (padrão 4 × 3 de 2880 = 99,5 megapixels). */
  async iniciar(canvas, {largura = 1440, altura = 1080, lado = 2880, colunas = 4, linhas = 3} = {}) {
    await this._dispositivo();
    const d = this.dev, TU = GPUTextureUsage;
    this.lado = lado; this.colunas = colunas; this.linhas = linhas; this.W = lado * colunas; this.H = lado * linhas;
    this.megapixels = Math.round(this.W * this.H / 1e5) / 10;
    this.blocos = d.createTexture({size: [lado, lado, colunas * linhas], format: 'rgba8unorm', usage: TU.STORAGE_BINDING | TU.TEXTURE_BINDING | TU.COPY_DST | TU.COPY_SRC});
    this.temp = d.createTexture({size: [lado, lado], format: 'rgba8unorm', usage: TU.STORAGE_BINDING | TU.TEXTURE_BINDING | TU.COPY_SRC});
    this.amo = d.createSampler({magFilter: 'linear', minFilter: 'linear'});
    this.uni = d.createBuffer({size: 32 * 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.pipes = {};
    for (const [k, src] of Object.entries(FILTROS)) this.pipes[k] = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: FOTO_COMUM + src}), entryPoint: 'main'}});
    this._tela(canvas, largura, altura);
    this.pPrev = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: PREVIA_FOTO}), entryPoint: 'main'}});
    this.uPrev = d.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.bgPrev = d.createBindGroup({layout: this.pPrev.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.uPrev}},
      {binding: 1, resource: this.blocos.createView({dimension: '2d-array'})}, {binding: 2, resource: this.alvo.createView()}, {binding: 3, resource: this.amo}]});
    this.vistas = Array.from({length: colunas * linhas}, (_, i) => this.blocos.createView({dimension: '2d', baseArrayLayer: i, arrayLayerCount: 1}));
    this.vTemp = this.temp.createView();
    await this.aplicar('gerar');
    return this.adaptador.info || {};
  }

  _grupo(nome, src, dst, slot) {
    const pipe = this.pipes[nome], L = pipe.getBindGroupLayout(0), e = [{binding: 0, resource: {buffer: this.uni, offset: slot * 256, size: 32}}];
    if (nome !== 'gerar') e.push({binding: 1, resource: src});
    e.push({binding: 2, resource: dst});
    if (nome === 'lente' || nome === 'liquify') e.push({binding: 3, resource: this.amo});
    return this.dev.createBindGroup({layout: L, entries: e});
  }

  /** Aplica um filtro na foto inteira (todos os blocos) e espera a placa terminar. Devolve os segundos. */
  async aplicar(nome) {
    const d = this.dev, t0 = performance.now(), n = this.colunas * this.linhas, wg = Math.ceil(this.lado / 16);
    for (let b = 0; b < n; b++) {
      const tx = (b % this.colunas) * this.lado, ty = Math.floor(b / this.colunas) * this.lado;
      const passadas = nome === 'desfoque' ? [['desfoqueH', 0], ['desfoqueH', 1]] : [[nome, 0]];
      const enc = d.createCommandEncoder();
      passadas.forEach(([p, k], j) => {
        d.queue.writeBuffer(this.uni, j * 256, new Float32Array([tx, ty, this.W, this.H, k, 0, 0, 0]));
        if (p === 'gerar') { const c = enc.beginComputePass(); c.setPipeline(this.pipes.gerar); c.setBindGroup(0, this._grupo('gerar', null, this.vistas[b], j)); c.dispatchWorkgroups(wg, wg); c.end(); return; }
        const c = enc.beginComputePass(); c.setPipeline(this.pipes[p]); c.setBindGroup(0, this._grupo(p, this.vistas[b], this.vTemp, j)); c.dispatchWorkgroups(wg, wg); c.end();
        enc.copyTextureToTexture({texture: this.temp}, {texture: this.blocos, origin: [0, 0, b]}, [this.lado, this.lado, 1]);
      });
      d.queue.submit([enc.finish()]);
      await d.queue.onSubmittedWorkDone();                         // um bloco por vez: cada envio fica curto
      if (this.perdida) throw new Error('O driver de vídeo reiniciou durante o teste.');
    }
    return (performance.now() - t0) / 1000;
  }

  /** Prévia reduzida da foto inteira, com a linha de antes e depois. */
  mostrarPrevia(linha = .5) {
    const d = this.dev;
    d.queue.writeBuffer(this.uPrev, 0, new Float32Array([this.W, this.H, this.colunas, linha]));
    const enc = d.createCommandEncoder(), c = enc.beginComputePass();
    c.setPipeline(this.pPrev); c.setBindGroup(0, this.bgPrev); c.dispatchWorkgroups(Math.ceil(this.largura / 16), Math.ceil(this.altura / 16)); c.end();
    this._mostrar(enc);
    d.queue.submit([enc.finish()]);
  }
}

// ================================================================== REMOVER RUÍDO COM IA (rede de convolução)
const CANAIS = 24;
const CONV = /* wgsl */`
struct U { w: u32, h: u32, cin: u32, cout: u32, relu: u32, x0: u32, y0: u32, semente: u32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> ent: array<f32>;
@group(0) @binding(2) var<storage, read_write> sai: array<f32>;
@group(0) @binding(3) var<storage, read> pesos: array<f32>;      // [saída][entrada][9]
@compute @workgroup_size(8, 8) fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u.w || id.y >= u.h) { return; }
  let N = u.w * u.h;
  var acc: array<f32, ${CANAIS}>;
  for (var c = 0u; c < ${CANAIS}u; c++) { acc[c] = 0.; }
  for (var t = 0u; t < 9u; t++) {
    let x = clamp(i32(id.x) + i32(t % 3u) - 1, 0, i32(u.w) - 1); let y = clamp(i32(id.y) + i32(t / 3u) - 1, 0, i32(u.h) - 1);
    let j = u32(y) * u.w + u32(x);
    for (var ci = 0u; ci < u.cin; ci++) {
      let v = ent[ci * N + j];
      for (var co = 0u; co < u.cout; co++) { acc[co] += v * pesos[(co * u.cin + ci) * 9u + t]; }
    }
  }
  let i = id.y * u.w + id.x;
  for (var co = 0u; co < u.cout; co++) { sai[co * N + i] = select(acc[co], max(acc[co], 0.), u.relu == 1u); }
}`;
const RUIDO = /* wgsl */`
struct U { w: u32, h: u32, cin: u32, cout: u32, relu: u32, x0: u32, y0: u32, semente: u32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read_write> sai: array<f32>;
fn h2(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }
fn pcg(v: u32) -> u32 { let s = v * 747796405u + 2891336453u; let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
@compute @workgroup_size(8, 8) fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= u.w || id.y >= u.h) { return; }
  let N = u.w * u.h; let i = id.y * u.w + id.x;
  let q = vec2f(f32(id.x + u.x0), f32(id.y + u.y0)) / vec2f(6000., 4000.);
  // retrato noturno: rosto iluminado, fundo com luzes desfocadas, e o ruído de ISO alto
  var c = mix(vec3f(.05, .05, .1), vec3f(.18, .1, .22), q.y);
  for (var k = 0; k < 14; k++) { let fk = f32(k); let p = vec2f(h2(vec2f(fk, 2.)), h2(vec2f(fk, 9.)) * .6); c += vec3f(1., .7, .3) * .25 * exp(-length(q - p) * 30.); }
  let r = length((q - vec2f(.5, .55)) * vec2f(1., .8)); c = mix(c, vec3f(.86, .62, .5) * (1.1 - r * 1.5), smoothstep(.22, .2, r));
  let s = f32(u.semente);
  for (var k = 0u; k < 3u; k++) {
    let n = (f32(pcg((id.x + u.x0) * 1973u + (id.y + u.y0) * 9277u + k * 26699u + u.semente * 7919u) & 65535u) / 65535. - .5) * .35;
    sai[k * N + i] = clamp(c[k] + n, 0., 1.);
  }
}`;

export class DenoiseIA {
  async iniciar({fw = 6000, fh = 4000, tw = 750, th = 800} = {}) {
    if (!navigator.gpu) throw new Error('Este computador não tem WebGPU disponível.');
    const a = await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
    if (!a) throw new Error('Nenhuma placa de vídeo compatível encontrada.');
    const bytes = tw * th * CANAIS * 4;
    this.dev = await a.requestDevice({requiredLimits: {maxStorageBufferBindingSize: Math.min(a.limits.maxStorageBufferBindingSize, Math.max(bytes, 134217728)), maxBufferSize: Math.min(a.limits.maxBufferSize, Math.max(bytes, 268435456))}});
    const d = this.dev; this.fw = fw; this.fh = fh; this.tw = tw; this.th = th;
    const S = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;
    this.a = d.createBuffer({size: bytes, usage: S}); this.b = d.createBuffer({size: bytes, usage: S});
    // pesos: cada camada é um filtro suave com um pouco de mistura entre canais (o resultado limpa o ruído)
    const r = rng(77), camadas = [[3, CANAIS, 1], [CANAIS, CANAIS, 1], [CANAIS, CANAIS, 1], [CANAIS, 3, 0]], G = [1, 2, 1, 2, 4, 2, 1, 2, 1].map(v => v / 16);
    this.camadas = camadas.map(([cin, cout, relu], L) => {
      const w = new Float32Array(cout * cin * 9);
      for (let co = 0; co < cout; co++) for (let ci = 0; ci < cin; ci++) for (let t = 0; t < 9; t++) {
        let v = (r() - .5) * .002;
        if (L === 0 && ci === co % 3) v += G[t];
        else if (L === 3 && co === ci % 3) v += G[t] / (CANAIS / 3);
        else if ((L === 1 || L === 2) && ci === co) v += G[t] * .96;
        else if (L === 1 || L === 2) v += G[t] * .04 / CANAIS;
        w[(co * cin + ci) * 9 + t] = v;
      }
      const pb = d.createBuffer({size: w.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST}); d.queue.writeBuffer(pb, 0, w);
      return {cin, cout, relu, pb};
    });
    this.pConv = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: CONV}), entryPoint: 'main'}});
    this.pRuido = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: RUIDO}), entryPoint: 'main'}});
    this.unis = Array.from({length: 5}, () => d.createBuffer({size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST}));
    this.ler = d.createBuffer({size: 3 * 256 * 256 * 4 * 2, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
    this.fotos = 0;
    return a.info || {};
  }

  /** Uma foto de 24 megapixels (6000 × 4000), em blocos. Devolve os segundos e, se pedido, um recorte de antes e depois. */
  async foto(sinal, comRecorte = false) {
    const d = this.dev, TW = this.tw, TH = this.th, t0 = performance.now(), n = 256;
    let recorte = null;
    for (let y0 = 0; y0 < this.fh; y0 += TH) for (let x0 = 0; x0 < this.fw; x0 += TW) {
      if (sinal && sinal.aborted) throw new Error('interrompido');
      const enc = d.createCommandEncoder();
      d.queue.writeBuffer(this.unis[0], 0, new Uint32Array([TW, TH, 0, 3, 0, x0, y0, this.fotos * 7 + 1]));
      let p = enc.beginComputePass(); p.setPipeline(this.pRuido);
      p.setBindGroup(0, d.createBindGroup({layout: this.pRuido.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.unis[0]}}, {binding: 1, resource: {buffer: this.a}}]}));
      p.dispatchWorkgroups(Math.ceil(TW / 8), Math.ceil(TH / 8)); p.end();
      const centro = comRecorte && !recorte && x0 <= this.fw / 2 && this.fw / 2 < x0 + TW && y0 <= this.fh / 2 && this.fh / 2 < y0 + TH;
      const linhas = (buf, destino) => { for (let k = 0; k < 3; k++) for (let y = 0; y < n; y++) enc.copyBufferToBuffer(buf, (k * TW * TH + (y + (TH - n) / 2 | 0) * TW + (TW - n) / 2 | 0) * 4, this.ler, destino + (k * n * n + y * n) * 4, n * 4); };
      if (centro) linhas(this.a, 0);                                  // o pedaço com ruído, antes da rede
      let src = this.a, dst = this.b;
      this.camadas.forEach((c, i) => {
        d.queue.writeBuffer(this.unis[i + 1], 0, new Uint32Array([TW, TH, c.cin, c.cout, c.relu, x0, y0, 0]));
        p = enc.beginComputePass(); p.setPipeline(this.pConv);
        p.setBindGroup(0, d.createBindGroup({layout: this.pConv.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.unis[i + 1]}}, {binding: 1, resource: {buffer: src}},
          {binding: 2, resource: {buffer: dst}}, {binding: 3, resource: {buffer: c.pb}}]}));
        p.dispatchWorkgroups(Math.ceil(TW / 8), Math.ceil(TH / 8)); p.end();
        [src, dst] = [dst, src];
      });
      if (centro) linhas(src, 3 * n * n * 4);                         // o mesmo pedaço, limpo
      d.queue.submit([enc.finish()]);
      await d.queue.onSubmittedWorkDone();
      if (centro) recorte = await this._recorte(n);
    }
    this.fotos++;
    return {segundos: (performance.now() - t0) / 1000, recorte};
  }

  async _recorte(n) {
    await this.ler.mapAsync(GPUMapMode.READ);
    const f = new Float32Array(this.ler.getMappedRange().slice(0));
    this.ler.unmap();
    const img = desloc => { const im = new ImageData(n, n); for (let i = 0; i < n * n; i++) { for (let k = 0; k < 3; k++) im.data[i * 4 + k] = Math.min(255, Math.max(0, f[desloc + k * n * n + i] * 255)); im.data[i * 4 + 3] = 255; } return im; };
    return {antes: img(0), depois: img(3 * n * n)};
  }

  destruir() { try { this.dev.destroy(); } catch (e) { /* já foi */ } }
}

// ================================================================== VÍDEO 4K: REDUÇÃO DE RUÍDO E EFEITOS
const NR = /* wgsl */`
struct U { W: f32, H: f32, t: f32, linha: f32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var hist: texture_2d_array<f32>;           // 3 quadros anteriores (com ruído)
@group(0) @binding(2) var atual: texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var limpo: texture_storage_2d<rgba16float, write>;
fn h2(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }
fn pcg(v: u32) -> u32 { let s = v * 747796405u + 2891336453u; let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
fn cena(q: vec2f, t: f32) -> vec3f {                             // rua à noite com carro passando e letreiros
  var c = mix(vec3f(.04, .05, .1), vec3f(.12, .08, .16), q.y);
  for (var k = 0; k < 10; k++) { let fk = f32(k); let p = vec2f(fract(h2(vec2f(fk, 1.)) + t * .02 * (1. + fk * .1)), .3 + .3 * h2(vec2f(fk, 4.))); c += vec3f(1., .5 + .4 * h2(vec2f(fk, 7.)), .3) * .2 * exp(-length(q - p) * 18.); }
  let carro = vec2f(fract(t * .07), .72); let dc = abs(q - carro);
  if (dc.x < .12 && dc.y < .04) { c = vec3f(.6, .08, .1); }
  c += vec3f(1., .95, .8) * exp(-length(q - carro - vec2f(.11, 0.)) * 60.);
  return c;
}
@compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
  let d = vec2i(i32(u.W), i32(u.H)); let p = vec2i(id.xy); if (p.x >= d.x || p.y >= d.y) { return; }
  let q = (vec2f(id.xy) + .5) / vec2f(u.W, u.H);
  // quadro novo da câmera, com ruído de ISO alto
  let sem = id.x * 1973u + id.y * 9277u + u32(u.t * 30.) * 26699u;
  let n = vec3f(f32(pcg(sem) & 65535u), f32(pcg(sem + 1u) & 65535u), f32(pcg(sem + 2u) & 65535u)) / 65535. - .5;
  let cru = cena(q, u.t) * 1.6 + n * .2;
  textureStore(atual, id.xy, vec4f(cru, 1.));
  // redução de ruído temporal (média com os quadros anteriores onde não houve movimento) e espacial (bilateral 7 x 7)
  var soma = cru; var peso = 1.;
  for (var k = 0; k < 3; k++) { let h = textureLoad(hist, p, k, 0).rgb; let w = exp(-dot(h - cru, h - cru) * 6.); soma += h * w; peso += w; }
  let temporal = soma / peso;
  var s = vec3f(0.); var w2 = 0.;
  for (var j = -3; j <= 3; j++) { for (var i = -3; i <= 3; i++) {
    let v = textureLoad(hist, clamp(p + vec2i(i, j), vec2i(0), d - 1), 0, 0).rgb;
    let w = exp(-f32(i * i + j * j) / 8. - dot(v - temporal, v - temporal) * 10.); s += v * w; w2 += w; } }
  var c = mix(temporal, s / w2, .5);
  // correção de cor (estilo cinema) e brilho nas luzes
  c = c * c * (3. - 2. * clamp(c, vec3f(0.), vec3f(1.)));
  c = mix(c * vec3f(.9, 1., 1.12), c * vec3f(1.12, 1., .86), smoothstep(.2, .7, dot(c, vec3f(.33))));
  c += max(c - .7, vec3f(0.)) * 1.5;
  textureStore(limpo, id.xy, vec4f(select(cru, c, q.x > u.linha), 1.));
}`;

export class VideoNR extends BaseGPU {
  async iniciar(canvas, {largura = 1920, altura = 1080, W = 3840, H = 2160} = {}) {
    await this._dispositivo();
    const d = this.dev, TU = GPUTextureUsage;
    this.W = W; this.H = H;
    this.hist = d.createTexture({size: [W, H, 3], format: 'rgba16float', usage: TU.TEXTURE_BINDING | TU.COPY_DST});
    this.atual = d.createTexture({size: [W, H], format: 'rgba16float', usage: TU.STORAGE_BINDING | TU.COPY_SRC});
    this.limpo = d.createTexture({size: [W, H], format: 'rgba16float', usage: TU.STORAGE_BINDING | TU.TEXTURE_BINDING});
    this.uni = d.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.pipe = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: NR}), entryPoint: 'main'}});
    this.bg = d.createBindGroup({layout: this.pipe.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.uni}},
      {binding: 1, resource: this.hist.createView({dimension: '2d-array'})}, {binding: 2, resource: this.atual.createView()}, {binding: 3, resource: this.limpo.createView()}]});
    this._tela(canvas, largura, altura);
    // a prévia mostra o quadro limpo (com a parte da esquerda ainda com ruído)
    const mc = d.createShaderModule({code: TELA + `@group(0) @binding(0) var t: texture_2d<f32>; @group(0) @binding(1) var s: sampler; @group(0) @binding(2) var<uniform> r: vec4f;
      @fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f { let q = fc.xy / r.xy; var c = textureSampleLevel(t, s, q, 0.).rgb; if (abs(q.x - r.z) < .0012) { c = vec3f(.96); } return vec4f(c, 1.); }`});
    this.pPrev = d.createRenderPipeline({layout: 'auto', vertex: {module: mc, entryPoint: 'vs'}, fragment: {module: mc, entryPoint: 'fs', targets: [{format: 'rgba8unorm'}]}});
    this.uRes = d.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.bgPrev = d.createBindGroup({layout: this.pPrev.getBindGroupLayout(0), entries: [{binding: 0, resource: this.limpo.createView()},
      {binding: 1, resource: d.createSampler({magFilter: 'linear', minFilter: 'linear'})}, {binding: 2, resource: {buffer: this.uRes}}]});
    this.q = 0;
    return this.adaptador.info || {};
  }

  _desenhar(seg, mostrar) {
    const d = this.dev, linha = .5 + .3 * Math.sin(seg * .4);
    d.queue.writeBuffer(this.uni, 0, new Float32Array([this.W, this.H, this.q / 30, linha]));
    const enc = d.createCommandEncoder();
    const p = enc.beginComputePass(); p.setPipeline(this.pipe); p.setBindGroup(0, this.bg); p.dispatchWorkgroups(Math.ceil(this.W / 16), Math.ceil(this.H / 16)); p.end();
    enc.copyTextureToTexture({texture: this.atual}, {texture: this.hist, origin: [0, 0, this.q % 3]}, [this.W, this.H, 1]);
    if (mostrar) {
      d.queue.writeBuffer(this.uRes, 0, new Float32Array([this.largura, this.altura, linha, 0]));
      const r = enc.beginRenderPass({colorAttachments: [{view: this.alvo.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
      r.setPipeline(this.pPrev); r.setBindGroup(0, this.bgPrev); r.draw(3); r.end();
      this._mostrar(enc);
    }
    d.queue.submit([enc.finish()]);
    this.q++;
  }
}
