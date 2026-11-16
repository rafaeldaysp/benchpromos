/* Bench Marks · Odontologia na placa de vídeo (teste pesado)
 *
 * VolumeCBCT  · tomografia 3D (CBCT) de 512 × 512 × 448 voxels montada na própria placa e girada com renderização
 *               de volume: cada pixel é um raio que atravessa o volume somando pele, osso e dentes, como no
 *               Romexis, no CS 3D Imaging e no Blue Sky Plan.
 * ProteseGPU  · modelo da arcada com uma coroa, 10 milhões de triângulos no total, como uma malha de prótese no exocad.
 *
 * Como no GPU Fight, desenha fora da tela em resolução fixa (Full HD), sem o limite da taxa da tela.
 */
import {WGSL_ANATOMIA, DENTES} from './odonto_anatomia.js';

const canal = new MessageChannel(); let filaRespirar = [];
canal.port1.onmessage = () => { const f = filaRespirar; filaRespirar = []; f.forEach(r => r()); };
const respirar = () => new Promise(r => { filaRespirar.push(r); canal.port2.postMessage(0); });

const COPIA = /* wgsl */`
@group(0) @binding(0) var t: texture_2d<f32>;
@group(0) @binding(1) var s: sampler;
struct V { @builtin(position) p: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> V {
  let p = array<vec2f, 3>(vec2f(-1., -3.), vec2f(-1., 1.), vec2f(3., 1.));
  var v: V; v.p = vec4f(p[i], 0., 1.); v.uv = vec2f(p[i].x * .5 + .5, .5 - p[i].y * .5); return v;
}
@fragment fn fs(v: V) -> @location(0) vec4f { return textureSample(t, s, v.uv); }
`;

// ------------------------------------------------------------------ matrizes (coluna por coluna)
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

// ------------------------------------------------------------------ base comum: placa, tela e repetição de quadros
export class BaseGPU {
  async _dispositivo(limites = {}) {
    if (!navigator.gpu) throw new Error('Este computador não tem WebGPU disponível. Atualize o Windows e o Microsoft Edge.');
    this.adaptador = await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
    if (!this.adaptador) throw new Error('Nenhuma placa de vídeo compatível encontrada. Atualize o driver de vídeo.');
    const lim = this.adaptador.limits, req = {};
    for (const [k, v] of Object.entries(limites)) req[k] = Math.min(lim[k], v);
    this.dev = await this.adaptador.requestDevice({requiredLimits: req});
    this.perdida = false;
    this.dev.lost.then(i => { if (i.reason !== 'destroyed') this.perdida = true; });
  }

  _tela(canvas, largura, altura, msaa = 1) {
    const d = this.dev, TU = GPUTextureUsage;
    this.largura = largura; this.altura = altura;
    this.alvo = d.createTexture({size: [largura, altura], format: 'rgba8unorm', usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING | TU.COPY_SRC | TU.COPY_DST | TU.STORAGE_BINDING});
    if (msaa > 1) this.alvoMS = d.createTexture({size: [largura, altura], sampleCount: msaa, format: 'rgba8unorm', usage: TU.RENDER_ATTACHMENT});
    this.formato = navigator.gpu.getPreferredCanvasFormat();
    this.ctx = canvas ? canvas.getContext('webgpu') : null;
    if (this.ctx) {
      this.ctx.configure({device: d, format: this.formato, alphaMode: 'opaque'});
      const mc = d.createShaderModule({code: COPIA});
      this.pCopia = d.createRenderPipeline({layout: 'auto', vertex: {module: mc, entryPoint: 'vs'}, fragment: {module: mc, entryPoint: 'fs', targets: [{format: this.formato}]}});
      this.bgCopia = d.createBindGroup({layout: this.pCopia.getBindGroupLayout(0), entries: [
        {binding: 0, resource: this.alvo.createView()}, {binding: 1, resource: d.createSampler({magFilter: 'linear', minFilter: 'linear'})}]});
    }
  }

  _mostrar(enc) {
    if (!this.ctx) return;
    const c = enc.beginRenderPass({colorAttachments: [{view: this.ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
    c.setPipeline(this.pCopia); c.setBindGroup(0, this.bgCopia); c.draw(3); c.end();
  }

  /** Repete quadros por `segundos`. Retorna {fps, quadros, porSegundo}. */
  async rodar(segundos, aoAndar, sinal) {
    let quadro = 0, emVoo = [], ultimoMostrar = 0, ultimoAviso = 0, marco = null, qSeg = 0, tSeg = performance.now();
    const porSegundo = [], inicio = performance.now();
    this.t0 = inicio;
    while (true) {
      if (sinal && sinal.aborted) throw new Error('interrompido');
      if (this.perdida) throw new Error('O driver de vídeo reiniciou durante o teste.');
      const t = performance.now();
      if ((t - inicio) / 1000 >= segundos) break;
      if (!marco && t - inicio >= 1500) marco = {q: quadro, t: t - inicio};       // 1,5 s para a placa subir o clock
      const mostrar = t - ultimoMostrar > 33;
      if (mostrar) ultimoMostrar = t;
      this._desenhar((t - inicio) / 1000, mostrar);
      emVoo.push(this.dev.queue.onSubmittedWorkDone().then(() => { qSeg++; }));
      quadro++;
      if (emVoo.length >= 3) await emVoo.shift();
      if (mostrar) await respirar();
      if (t - tSeg >= 1000) { porSegundo.push(qSeg * 1000 / (t - tSeg)); qSeg = 0; tSeg = t; }
      if (aoAndar && t - ultimoAviso > 250) { ultimoAviso = t; aoAndar({segundos: (t - inicio) / 1000, fpsAgora: porSegundo.at(-1) || quadro / ((t - inicio) / 1000), porSegundo}); }
    }
    await Promise.all(emVoo);
    const total = performance.now() - inicio;
    const fps = marco ? (quadro - marco.q) / ((total - marco.t) / 1000) : quadro / (total / 1000);
    return {fps, quadros: quadro, porSegundo};
  }

  async capturar() {
    const bpr = Math.ceil(this.largura * 4 / 256) * 256;
    const buf = this.dev.createBuffer({size: bpr * this.altura, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
    const enc = this.dev.createCommandEncoder();
    enc.copyTextureToBuffer({texture: this.alvo}, {buffer: buf, bytesPerRow: bpr}, [this.largura, this.altura]);
    this.dev.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(buf.getMappedRange()), out = new Uint8ClampedArray(this.largura * this.altura * 4);
    for (let y = 0; y < this.altura; y++) out.set(src.subarray(y * bpr, y * bpr + this.largura * 4), y * this.largura * 4);
    buf.unmap(); buf.destroy();
    return new ImageData(out, this.largura, this.altura);
  }

  destruir() { try { this.dev.destroy(); } catch (e) { /* já foi */ } }
}

// ================================================================== tomografia 3D (CBCT)
const GERAR = WGSL_ANATOMIA + /* wgsl */`
@group(0) @binding(0) var<uniform> g: vec4u;                 // largura, altura, fatias, primeira fatia deste envio
@group(0) @binding(1) var<storage, read_write> saida: array<u32>;
@compute @workgroup_size(8, 8, 1) fn gerar(@builtin(global_invocation_id) id: vec3u) {
  let n4 = g.x / 4u;
  if (id.x >= n4 || id.y >= g.y) { return; }
  let z = g.w + id.z;
  var w = 0u;
  for (var k = 0u; k < 4u; k++) {
    let x = id.x * 4u + k;
    let q = (vec3f(f32(x), f32(id.y), f32(z)) + .5) / vec3f(f32(g.x), f32(g.y), f32(g.z));
    let p = vec3f(q.x * 2. - 1., 1. - q.y * 2., q.z * 2. - 1.);
    w |= u32(densidade(p) * 255. + .5) << (8u * k);
  }
  saida[(id.z * g.y + id.y) * n4 + id.x] = w;
}
`;

const VOLUME = /* wgsl */`
struct U { olho: vec4f, frente: vec4f, direita: vec4f, cima: vec4f, luz: vec4f, res: vec4f };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var vol: texture_3d<f32>;
@group(0) @binding(2) var amo: sampler;

@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array<vec2f, 3>(vec2f(-1., -3.), vec2f(-1., 1.), vec2f(3., 1.));
  return vec4f(p[i], 0., 1.);
}

fn amostra(q: vec3f) -> f32 { return textureSampleLevel(vol, amo, q, 0.).r; }

// pele e músculo quase transparentes, osso bege e dentes brancos (a "função de transferência" dos programas de CBCT)
fn transferencia(v: f32) -> vec4f {
  if (v < .09) { return vec4f(0.); }
  if (v < .26) { return vec4f(.82, .52, .48, .0045 * smoothstep(.09, .14, v)); }
  if (v < .7) { let k = smoothstep(.3, .62, v); return vec4f(mix(vec3f(.86, .78, .66), vec3f(.98, .95, .88), k), mix(.02, .22, k) * smoothstep(.26, .32, v)); }
  return vec4f(1., .99, .95, .55);
}

@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let uv = vec2f(fc.x / u.res.x * 2. - 1., 1. - fc.y / u.res.y * 2.);
  let d = normalize(u.frente.xyz + uv.x * u.res.z * u.direita.xyz + uv.y * u.res.w * u.cima.xyz);
  let o = u.olho.xyz;
  let passo = u.olho.w;
  let inv = 1. / d;
  let t0 = (vec3f(-1.) - o) * inv; let t1 = (vec3f(1.) - o) * inv;
  let tn = max(max(min(t0.x, t1.x), min(t0.y, t1.y)), min(t0.z, t1.z));
  let tf = min(min(max(t0.x, t1.x), max(t0.y, t1.y)), max(t0.z, t1.z));
  var cor = vec3f(0.); var a = 0.;
  if (tf > max(tn, 0.)) {
    var t = max(tn, 0.) + passo * fract(sin(dot(fc.xy, vec2f(12.9898, 78.233))) * 43758.5453);
    let l = normalize(u.luz.xyz);
    let e = u.luz.w;
    loop {
      if (t > tf || a > .97) { break; }
      let p = o + d * t;
      let q = vec3f(p.x * .5 + .5, .5 - p.y * .5, p.z * .5 + .5);
      let c = transferencia(amostra(q));
      if (c.a > .003) {
        // direção da superfície pelo gradiente (6 amostras vizinhas), para a luz
        let g = vec3f(amostra(q + vec3f(e, 0., 0.)) - amostra(q - vec3f(e, 0., 0.)),
                      amostra(q - vec3f(0., e, 0.)) - amostra(q + vec3f(0., e, 0.)),
                      amostra(q + vec3f(0., 0., e)) - amostra(q - vec3f(0., 0., e)));
        let n = -normalize(g + vec3f(1e-6));
        let dif = abs(dot(n, l)) * .75 + .3;
        let esp = pow(max(dot(reflect(-l, n), -d), 0.), 24.) * .35;
        cor += (1. - a) * c.a * (c.rgb * dif + vec3f(esp));
        a += (1. - a) * c.a;
      }
      t += passo;
    }
  }
  let fundo = mix(vec3f(.035, .025, .055), vec3f(.09, .07, .13), uv.y * .5 + .5);
  return vec4f(cor + (1. - a) * fundo, 1.);
}
`;

export class VolumeCBCT extends BaseGPU {
  /** dim: voxels [largura, altura, fatias] (largura múltipla de 256). aoMontar(pct) durante a montagem do volume. */
  async iniciar(canvas, {largura = 1920, altura = 1080, dim = [512, 512, 448], aoMontar} = {}) {
    await this._dispositivo({maxBufferSize: 268435456, maxStorageBufferBindingSize: 134217728});
    const d = this.dev, [nx, ny, nz] = dim;
    this.dim = dim;
    this.vol = d.createTexture({size: [nx, ny, nz], dimension: '3d', format: 'r8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST});
    // monta o volume na placa, em blocos de fatias (cada envio fica curto, para o Windows não achar que a placa travou)
    const bloco = 16, buf = d.createBuffer({size: nx * ny * bloco, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC});
    const ug = d.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const pg = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: GERAR}), entryPoint: 'gerar'}});
    const bg = d.createBindGroup({layout: pg.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: ug}}, {binding: 1, resource: {buffer: buf}}]});
    const t0 = performance.now();
    for (let z0 = 0; z0 < nz; z0 += bloco) {
      const n = Math.min(bloco, nz - z0);
      d.queue.writeBuffer(ug, 0, new Uint32Array([nx, ny, nz, z0]));
      const enc = d.createCommandEncoder(), p = enc.beginComputePass();
      p.setPipeline(pg); p.setBindGroup(0, bg); p.dispatchWorkgroups(Math.ceil(nx / 4 / 8), Math.ceil(ny / 8), n); p.end();
      enc.copyBufferToTexture({buffer: buf, bytesPerRow: nx, rowsPerImage: ny}, {texture: this.vol, origin: [0, 0, z0]}, [nx, ny, n]);
      d.queue.submit([enc.finish()]);
      await d.queue.onSubmittedWorkDone();
      if (aoMontar) aoMontar(Math.round(100 * Math.min(nz, z0 + bloco) / nz));
    }
    this.montagem_s = (performance.now() - t0) / 1000;
    buf.destroy(); ug.destroy();
    this._tela(canvas, largura, altura);
    this.uni = d.createBuffer({size: 96, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const mv = d.createShaderModule({code: VOLUME});
    this.pipe = d.createRenderPipeline({layout: 'auto', vertex: {module: mv, entryPoint: 'vs'}, fragment: {module: mv, entryPoint: 'fs', targets: [{format: 'rgba8unorm'}]}});
    this.bg = d.createBindGroup({layout: this.pipe.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.uni}},
      {binding: 1, resource: this.vol.createView()}, {binding: 2, resource: d.createSampler({magFilter: 'linear', minFilter: 'linear'})}]});
    this.mb = Math.round(nx * ny * nz / 1048576);
    return this.adaptador.info || {};
  }

  _desenhar(seg, mostrar) {
    // gira em volta da cabeça, subindo e descendo devagar
    const a = seg * .35 + .6, el = .18 + .2 * Math.sin(seg * .23), R = 3.1;
    const olho = [Math.sin(a) * Math.cos(el) * R, Math.sin(el) * R, Math.cos(a) * Math.cos(el) * R];
    const frente = norm(sub([0, -.02, .05], olho)), direita = norm(cruz(frente, [0, 1, 0])), cima = cruz(direita, frente);
    const tf = Math.tan(.42), luz = norm([Math.sin(a + .8), .7, Math.cos(a + .8)]);
    this.dev.queue.writeBuffer(this.uni, 0, new Float32Array([...olho, 2 / this.dim[0], ...frente, 0, ...direita, 0, ...cima, 0,
      ...luz, 1 / this.dim[0], this.largura, this.altura, tf * this.largura / this.altura, tf]));
    const enc = this.dev.createCommandEncoder();
    const p = enc.beginRenderPass({colorAttachments: [{view: this.alvo.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
    p.setPipeline(this.pipe); p.setBindGroup(0, this.bg); p.draw(3); p.end();
    if (mostrar) this._mostrar(enc);
    this.dev.queue.submit([enc.finish()]);
  }
}

// ================================================================== prótese (malha de 10 milhões de triângulos)
// 13 dentes do modelo de gesso, a coroa no lugar do 1º molar de baixo à direita e a gengiva
const OBJ = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 14, 13].map(i => DENTES[i]);
const COROA = 13, GENGIVA = 14;
const fx = v => (Math.round(v * 1e5) / 1e5).toFixed(5);
const PROTESE = WGSL_ANATOMIA + /* wgsl */`
struct U { vp: mat4x4f, olho: vec4f, luz: vec4f, g: vec4u };
@group(0) @binding(0) var<uniform> u: U;
const OC = array<vec4f, 14>(${OBJ.map(D => `vec4f(${fx(D.x)}, ${fx(D.yc)}, ${fx(D.z)}, ${D.tipo}.)`).join(', ')});
const OT = array<vec4f, 14>(${OBJ.map(D => `vec4f(${fx(D.tx)}, ${fx(D.tz)}, 0., 0.)`).join(', ')});
const OR = array<vec4f, 14>(${OBJ.map(D => `vec4f(${fx(D.rw)}, ${fx(D.rh)}, ${fx(D.rd)}, 0.)`).join(', ')});

struct VS { @builtin(position) p: vec4f, @location(0) n: vec3f, @location(1) w: vec3f, @location(2) @interpolate(flat) o: u32, @location(3) v: f32 };

fn superficie(o: u32, uv: vec2f) -> vec3f {
  if (o == ${GENGIVA}u) {
    let x = mix(-.7, .7, uv.x); let z = arcoInf(x); let s = sqrt(1. + 6.25 * x * x);
    let tx = 1. / s; let tz = -2.5 * x / s;
    let a = uv.y * 3.14159265;
    let off = cos(a) * .085; let y = -.19 + sin(a) * (.06 + .005 * cos(x * 70.));
    return vec3f(x - tz * off, y, z + tx * off);
  }
  let c = OC[o]; let t = OT[o]; let r = OR[o];
  let th = uv.x * 6.2831853; let ph = uv.y * 3.14159265;
  let s = vec3f(sin(ph) * cos(th), -cos(ph), sin(ph) * sin(th));
  var k = 1. - smoothstep(.15, 1., s.y) * cuspide(s.x, s.z, c.w);
  k *= mix(.72, 1., smoothstep(-1., .1, s.y));                  // a coroa afina no colo, perto da gengiva
  k += .006 * sin(th * 64.) * sin(ph * 48.);                   // detalhe fino do escaneamento
  let l = s * r.xyz * k;
  return vec3f(c.x + l.x * t.x - l.z * t.y, c.y + l.y, c.z + l.x * t.y + l.z * t.x);
}

@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) o: u32) -> VS {
  let m = u.g.x - 1u;
  let q = vi / 6u; let cn = vi % 6u;
  var du = 0u; var dv = 0u;
  if (cn == 1u) { du = 1u; } else if (cn == 2u || cn == 4u) { du = 1u; dv = 1u; } else if (cn == 5u) { dv = 1u; }
  let e = 1. / f32(m);
  let uv = vec2f(f32(q % m + du), f32(q / m + dv)) * e;
  let p = superficie(o, uv);
  let pu = superficie(o, uv + vec2f(e * .5, 0.)); let pv = superficie(o, uv + vec2f(0., e * .5));
  var n = cross(pv - p, pu - p);
  if (o == ${GENGIVA}u) { n = -n; }
  if (dot(n, n) < 1e-14) { n = p - vec3f(OC[min(o, 13u)].x, OC[min(o, 13u)].y, OC[min(o, 13u)].z); }
  var r: VS;
  r.p = u.vp * vec4f(p, 1.); r.n = normalize(n); r.w = p; r.o = o; r.v = uv.y;
  return r;
}

@fragment fn fs(i: VS) -> @location(0) vec4f {
  let n = normalize(i.n); let l = normalize(u.luz.xyz); let v = normalize(u.olho.xyz - i.w);
  var base = vec3f(.86, .83, .76); var brilho = .15;
  if (i.o == ${GENGIVA}u) { base = vec3f(.86, .52, .56); brilho = .25; }
  if (i.o == ${COROA}u) { base = vec3f(.97, .95, .9); brilho = .6; if (abs(i.v - .32) < .007) { base = vec3f(1., .9, 0.); } }
  let d = max(dot(n, l), 0.); let h = normalize(l + v);
  let esp = pow(max(dot(n, h), 0.), 48.) * brilho;
  let c = base * (d * .8 + .28 + .22 * n.y) + vec3f(esp);
  return vec4f(pow(c, vec3f(.95)), 1.);
}
`;

export class ProteseGPU extends BaseGPU {
  /** grade: pontos por lado de cada peça (580 = 10 milhões de triângulos nas 15 peças). */
  async iniciar(canvas, {largura = 1920, altura = 1080, grade = 580} = {}) {
    await this._dispositivo();
    const d = this.dev;
    this._tela(canvas, largura, altura, 4);
    this.grade = grade;
    this.triangulos = (grade - 1) ** 2 * 2 * 15;
    this.prof = d.createTexture({size: [largura, altura], sampleCount: 4, format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT});
    this.uni = d.createBuffer({size: 112, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const m = d.createShaderModule({code: PROTESE});
    this.pipe = d.createRenderPipeline({layout: 'auto', vertex: {module: m, entryPoint: 'vs'}, fragment: {module: m, entryPoint: 'fs', targets: [{format: 'rgba8unorm'}]},
      primitive: {topology: 'triangle-list', cullMode: 'none'}, depthStencil: {format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less'}, multisample: {count: 4}});
    this.bg = d.createBindGroup({layout: this.pipe.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.uni}}]});
    return this.adaptador.info || {};
  }

  _desenhar(seg, mostrar) {
    // a câmera gira devagar em volta da coroa, aproximando e afastando, como quem confere a margem no exocad
    const alvoC = OBJ[COROA], a = seg * .3, R = .62 + .18 * Math.sin(seg * .21);
    const alvo = [alvoC.x * .55, -.08, alvoC.z * .7 + .12];
    const olho = [alvo[0] + Math.sin(a) * R, .48 + .12 * Math.sin(seg * .17), alvo[2] + Math.cos(a) * R];
    const vp = mul(perspectiva(.8, this.largura / this.altura, .02, 10), olharPara(olho, alvo));
    const buf = new ArrayBuffer(112), f = new Float32Array(buf), u = new Uint32Array(buf);
    f.set(vp, 0); f.set([...olho, 1], 16); f.set([...norm([.4, .9, .5]), 0], 20); u.set([this.grade, 0, 0, 0], 24);
    this.dev.queue.writeBuffer(this.uni, 0, buf);
    const enc = this.dev.createCommandEncoder();
    const p = enc.beginRenderPass({colorAttachments: [{view: this.alvoMS.createView(), resolveTarget: this.alvo.createView(), loadOp: 'clear', storeOp: 'discard', clearValue: [.09, .07, .13, 1]}],
      depthStencilAttachment: {view: this.prof.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'discard'}});
    p.setPipeline(this.pipe); p.setBindGroup(0, this.bg); p.draw((this.grade - 1) ** 2 * 6, 15); p.end();
    if (mostrar) this._mostrar(enc);
    this.dev.queue.submit([enc.finish()]);
  }
}
