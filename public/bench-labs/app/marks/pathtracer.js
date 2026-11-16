/* Bench Marks · render de apresentação (perfil Arquitetura e Engenharia)
 *
 * Imita o que o Enscape, o Twinmotion e o Lumion fazem para a imagem final: "path tracing" na placa de
 * vídeo. Uma sala de estar com sol entrando pela janela, sofá, mesa, estante e luminária. Cada passada
 * soma uma amostra por pixel; a imagem vai limpando o ruído até completar as amostras pedidas.
 *
 * O resultado é o tempo para a imagem ficar pronta (4K, 512 amostras). Em placas fracas o teste para em
 * 4 minutos e estima o total.
 */

const WGSL = /* wgsl */`
struct U { res: vec2u, amostra: u32, linha0: u32, cam: vec4f };   // cam: só no tempo real (x, y: câmera; z: liga; w: mistura)
struct Caixa { mn: vec4f, mx: vec4f, cor: vec4f };      // cor.w: 0 difuso, 1 luz, 2 brilhante, 3 vidro (some)
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read_write> acum: array<vec4f>;
@group(0) @binding(2) var<storage, read> caixas: array<Caixa>;

var<private> semente: u32;
fn aleatorio() -> f32 {
  semente = semente * 747796405u + 2891336453u;
  var w = ((semente >> ((semente >> 28u) + 4u)) ^ semente) * 277803737u;
  w = (w >> 22u) ^ w;
  return f32(w) / 4294967296.;
}

const SOL = vec3f(.62, .55, -.56);
const SOL_COR = vec3f(9., 7.6, 5.8);

struct Acerto { t: f32, n: vec3f, cor: vec3f, mat: f32 };

fn cruzar(o: vec3f, d: vec3f, tmax: f32) -> Acerto {
  var a: Acerto; a.t = tmax; a.mat = -1.;
  let inv = 1. / d;
  let n = arrayLength(&caixas);
  for (var i = 0u; i < n; i++) {
    let c = caixas[i];
    if (c.cor.w > 2.5) { continue; }
    let t0 = (c.mn.xyz - o) * inv; let t1 = (c.mx.xyz - o) * inv;
    let lo = min(t0, t1); let hi = max(t0, t1);
    let tn = max(max(lo.x, lo.y), lo.z); let tf = min(min(hi.x, hi.y), hi.z);
    if (tn <= tf && tf > 1e-4) {
      let t = select(tn, tf, tn < 1e-4);
      if (t < a.t) {
        a.t = t; a.cor = c.cor.rgb; a.mat = c.cor.w;
        let p = o + d * t; let ctr = (c.mn.xyz + c.mx.xyz) * .5; let h = (c.mx.xyz - c.mn.xyz) * .5;
        let q = (p - ctr) / h; let aq = abs(q);
        if (aq.x > aq.y && aq.x > aq.z) { a.n = vec3f(sign(q.x), 0., 0.); }
        else if (aq.y > aq.z) { a.n = vec3f(0., sign(q.y), 0.); } else { a.n = vec3f(0., 0., sign(q.z)); }
      }
    }
  }
  return a;
}

fn ceu(d: vec3f) -> vec3f {
  let k = clamp(d.y, 0., 1.);
  return mix(vec3f(1.1, 1.05, 1.0), vec3f(.45, .62, 1.05), k) * 1.4;
}

fn hemisferio(n: vec3f) -> vec3f {
  let a = aleatorio() * 6.2831853; let r2 = aleatorio(); let r = sqrt(r2);
  let t = select(vec3f(1., 0., 0.), vec3f(0., 1., 0.), abs(n.x) > .9);
  let b = normalize(cross(n, t)); let c = cross(n, b);
  return normalize(b * cos(a) * r + c * sin(a) * r + n * sqrt(1. - r2));
}

@compute @workgroup_size(8, 8) fn main(@builtin(global_invocation_id) id: vec3u) {
  let x = id.x; let y = id.y + u.linha0;
  if (x >= u.res.x || y >= u.res.y) { return; }
  semente = (x * 1973u + y * 9277u + u.amostra * 26699u) | 1u;
  _ = aleatorio();
  let uv = (vec2f(f32(x) + aleatorio(), f32(u.res.y - y) - aleatorio()) * 2. - vec2f(u.res)) / f32(u.res.y);
  // câmera no canto da sala, olhando para o sofá e a janela
  let ro = vec3f(.6 + 1.2 * u.cam.x, 1.45 + .15 * u.cam.y, 7.3 - .5 * u.cam.x);
  let alvo = vec3f(3.3 + .7 * u.cam.y, 1.0, 2.2);
  let w = normalize(alvo - ro); let r = normalize(cross(w, vec3f(0., 1., 0.))); let up = cross(r, w);
  var d = normalize(uv.x * r + uv.y * up + 1.25 * w);
  var o = ro;
  var thr = vec3f(1.); var cor = vec3f(0.);
  let solDir = normalize(SOL);
  for (var salto = 0; salto < 5; salto++) {
    let h = cruzar(o, d, 1e4);
    if (h.mat < 0.) { cor += thr * ceu(d); break; }
    if (h.mat > .5 && h.mat < 1.5) { cor += thr * h.cor; break; }
    let p = o + d * h.t + h.n * 1e-3;
    thr *= h.cor;
    // luz direta do sol (raio de sombra até lá fora)
    let jit = normalize(solDir + (vec3f(aleatorio(), aleatorio(), aleatorio()) - .5) * .03);
    let ndl = dot(h.n, jit);
    if (ndl > 0.) {
      let s = cruzar(p, jit, 1e4);
      if (s.mat < 0.) { cor += thr * SOL_COR * ndl; }
    }
    if (h.mat > 1.5 && aleatorio() < .35) { d = normalize(reflect(d, h.n) + (vec3f(aleatorio(), aleatorio(), aleatorio()) - .5) * .08); }
    else { d = hemisferio(h.n); }
    o = p;
    if (salto > 1) {                                              // roleta russa nos saltos finais
      let q = max(thr.r, max(thr.g, thr.b));
      if (aleatorio() > q) { break; }
      thr /= q;
    }
  }
  let i = y * u.res.x + x;
  if (u.cam.z > .5) {                                             // tempo real: média com os quadros anteriores (acúmulo temporal)
    let a = acum[i];
    acum[i] = vec4f(select(min(cor, vec3f(30.)), mix(a.rgb / max(a.w, 1.), min(cor, vec3f(30.)), u.cam.w), a.w > 0.), 1.);
  } else {
    acum[i] += vec4f(min(cor, vec3f(30.)), 1.);
  }
}
`;

const TELA = /* wgsl */`
@group(0) @binding(0) var<storage, read> acum: array<vec4f>;
@group(0) @binding(1) var<uniform> res: vec4u;
struct V { @builtin(position) p: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> V {
  let p = array<vec2f, 3>(vec2f(-1., -3.), vec2f(-1., 1.), vec2f(3., 1.));
  var v: V; v.p = vec4f(p[i], 0., 1.); v.uv = vec2f(p[i].x * .5 + .5, .5 - p[i].y * .5); return v;
}
@fragment fn fs(v: V) -> @location(0) vec4f {
  let x = min(u32(v.uv.x * f32(res.x)), res.x - 1u); let y = min(u32(v.uv.y * f32(res.y)), res.y - 1u);
  let a = acum[y * res.x + x];
  var c = a.rgb / max(a.w, 1.) * .55;
  c = clamp((c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14), vec3f(0.), vec3f(1.));
  return vec4f(pow(c, vec3f(1. / 2.2)), 1.);
}
`;

// ------------------------------------------------------------------ a sala (metros; x 0–6, y 0–3, z 0–8)
export function sala() {
  const c = [];
  const caixa = (x0, y0, z0, x1, y1, z1, r, g, b, m = 0) => c.push(x0, y0, z0, 0, x1, y1, z1, 0, r, g, b, m);
  const parede = [.86, .84, .8];
  caixa(-.3, -.3, -.3, 6.3, 0, 8.3, .55, .38, .24);                 // piso de madeira
  caixa(-.3, 3, -.3, 6.3, 3.3, 8.3, ...parede);                      // teto
  caixa(-.3, 0, -.3, 0, 3, 8.3, ...parede);                          // parede esquerda
  caixa(-.3, 0, 8, 6.3, 3, 8.3, ...parede);                          // parede do fundo (atrás da câmera)
  // parede da janela (x = 6), com o vão entre z 1,2–5,2 e y 0,6–2,6
  caixa(6, 0, -.3, 6.3, .6, 8.3, ...parede); caixa(6, 2.6, -.3, 6.3, 3, 8.3, ...parede);
  caixa(6, .6, -.3, 6.3, 2.6, 1.2, ...parede); caixa(6, .6, 5.2, 6.3, 2.6, 8.3, ...parede);
  caixa(6.02, .6, 3.17, 6.12, 2.6, 3.23, .12, .12, .13, 2);         // caixilho
  caixa(-.3, 0, -.3, 6.3, 3, 0, .32, .36, .42);                      // parede da frente (azul acinzentado)
  // sofá
  const s = [.42, .43, .47];
  caixa(3.2, .1, .4, 5.4, .48, 1.35, ...s); caixa(3.2, .48, .4, 5.4, 1.05, .65, ...s);
  caixa(3.0, .1, .4, 3.2, .7, 1.35, ...s); caixa(5.4, .1, .4, 5.6, .7, 1.35, ...s);
  for (let i = 0; i < 3; i++) caixa(3.25 + i * .72, .48, .66, 3.92 + i * .72, .62, 1.32, .5, .5, .55);
  caixa(3.4, .62, .68, 3.8, 1.0, .82, .95, .78, .1); caixa(4.8, .62, .68, 5.2, 1.0, .82, .5, .3, .62);   // almofadas Bench
  // tapete e mesa de centro
  caixa(2.6, 0, 1.7, 5.8, .015, 4.4, .78, .74, .68);
  caixa(3.5, .38, 2.2, 4.9, .43, 3.0, .12, .1, .1, 2);
  for (const [x, z] of [[3.55, 2.25], [4.8, 2.25], [3.55, 2.9], [4.8, 2.9]]) caixa(x, 0, z, x + .05, .38, z + .05, .1, .1, .1);
  caixa(3.9, .43, 2.45, 4.2, .52, 2.75, .85, .85, .82);             // livro na mesa
  // estante na parede esquerda, com livros
  caixa(0, 0, 2, .4, 2.4, 2.05, .2, .15, .12); caixa(0, 0, 4.4, .4, 2.4, 4.45, .2, .15, .12);
  for (let k = 0; k < 5; k++) caixa(0, .02 + k * .55, 2, .4, .06 + k * .55, 4.45, .2, .15, .12);
  let sem = 5;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let k = 0; k < 4; k++) {
    let z = 2.1;
    while (z < 4.3) {
      const w = .04 + rnd() * .06, h = .3 + rnd() * .15, cores = [[.7, .2, .2], [.2, .3, .6], [.9, .75, .1], [.25, .5, .3], [.85, .82, .75], [.45, .25, .55]];
      const cr = cores[Math.floor(rnd() * cores.length)];
      caixa(.05, .06 + k * .55, z, .35, .06 + k * .55 + h, z + w, ...cr);
      z += w + .01;
    }
  }
  // luminária de chão (acesa) e quadro na parede
  caixa(5.65, 0, 6.3, 5.7, 1.6, 6.35, .1, .1, .1);
  caixa(5.5, 1.6, 6.15, 5.85, 1.85, 6.5, 6, 4.6, 3, 1);
  caixa(1.8, 1.2, 0, 3.2, 2.1, .03, .95, .78, .1);
  caixa(2.1, 1.4, .03, 2.9, 1.9, .05, .1, .06, .16);
  // TV e rack na parede do fundo
  caixa(1.2, 0, 7.5, 3.6, .5, 8, .18, .14, .12);
  caixa(1.6, 1.0, 7.92, 3.2, 1.9, 8, .03, .03, .04, 2);
  // plantas (caixas empilhadas)
  for (let k = 0; k < 8; k++) caixa(5.35 + rnd() * .2, .45 + k * .12, 1.6 + rnd() * .2, 5.65 + rnd() * .2, .6 + k * .12, 1.9 + rnd() * .2, .15, .35 + rnd() * .2, .15);
  caixa(5.35, 0, 1.6, 5.75, .45, 2.0, .7, .4, .25);
  return new Float32Array(c);
}

const canal = new MessageChannel(); let filaRespirar = [];
canal.port1.onmessage = () => { const f = filaRespirar; filaRespirar = []; f.forEach(r => r()); };
const respirar = () => new Promise(r => { filaRespirar.push(r); canal.port2.postMessage(0); });

export class Render {
  async iniciar(canvas, {largura = 3840, altura = 2160} = {}) {
    if (!navigator.gpu) throw new Error('Este computador não tem WebGPU disponível.');
    this.adaptador = await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
    if (!this.adaptador) throw new Error('Nenhuma placa de vídeo compatível encontrada.');
    const bytes = largura * altura * 16, lim = this.adaptador.limits;
    this.dev = await this.adaptador.requestDevice({requiredLimits: {maxStorageBufferBindingSize: Math.min(lim.maxStorageBufferBindingSize, Math.max(bytes, 134217728)), maxBufferSize: Math.min(lim.maxBufferSize, Math.max(bytes, 268435456))}});
    const d = this.dev;
    this.largura = largura; this.altura = altura;
    this.acum = d.createBuffer({size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST});
    const cx = sala();
    this.cx = d.createBuffer({size: cx.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    d.queue.writeBuffer(this.cx, 0, cx);
    this.uni = d.createBuffer({size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.pipe = d.createComputePipeline({layout: 'auto', compute: {module: d.createShaderModule({code: WGSL}), entryPoint: 'main'}});
    this.bg = d.createBindGroup({layout: this.pipe.getBindGroupLayout(0), entries: [
      {binding: 0, resource: {buffer: this.uni}}, {binding: 1, resource: {buffer: this.acum}}, {binding: 2, resource: {buffer: this.cx}}]});
    this.formato = navigator.gpu.getPreferredCanvasFormat();
    this.ctx = canvas ? canvas.getContext('webgpu') : null;
    if (this.ctx) {
      this.ctx.configure({device: d, format: this.formato, alphaMode: 'opaque'});
      const mt = d.createShaderModule({code: TELA});
      this.pTela = d.createRenderPipeline({layout: 'auto', vertex: {module: mt, entryPoint: 'vs'}, fragment: {module: mt, entryPoint: 'fs', targets: [{format: this.formato}]}});
      this.uRes = d.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
      d.queue.writeBuffer(this.uRes, 0, new Uint32Array([largura, altura, 0, 0]));
      this.bgTela = d.createBindGroup({layout: this.pTela.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: this.acum}}, {binding: 1, resource: {buffer: this.uRes}}]});
    }
    return this.adaptador.info || {};
  }

  _passada(amostra, linha0, linhas) {
    const d = this.dev;
    d.queue.writeBuffer(this.uni, 0, new Uint32Array([this.largura, this.altura, amostra, linha0]));
    const enc = d.createCommandEncoder();
    const p = enc.beginComputePass(); p.setPipeline(this.pipe); p.setBindGroup(0, this.bg);
    p.dispatchWorkgroups(Math.ceil(this.largura / 8), Math.ceil(linhas / 8)); p.end();
    d.queue.submit([enc.finish()]);
  }

  mostrar() {
    if (!this.ctx) return;
    const enc = this.dev.createCommandEncoder();
    const c = enc.beginRenderPass({colorAttachments: [{view: this.ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
    c.setPipeline(this.pTela); c.setBindGroup(0, this.bgTela); c.draw(3); c.end();
    this.dev.queue.submit([enc.finish()]);
  }

  /**
   * Soma `amostras` passadas. Cada envio para a placa fica abaixo de ~120 ms (divide a imagem em faixas
   * nas placas lentas, para o Windows não achar que a placa travou). Para em `limite` segundos e estima.
   */
  async rodar(amostras, aoAndar, sinal, limite = 240) {
    const d = this.dev;
    let faixa = this.altura;                                          // linhas por envio
    const inicio = performance.now();
    let feitas = 0, ultimoMostrar = 0;
    // primeira medida: uma faixa pequena, para escolher o tamanho
    {
      const t0 = performance.now(); this._passada(0, 0, 64); await d.queue.onSubmittedWorkDone();
      const ms = performance.now() - t0, porLinha = ms / 64;
      faixa = Math.max(8, Math.min(this.altura, Math.floor(100 / Math.max(porLinha, 1e-3) / 8) * 8));
    }
    // a faixa de teste também somou: zera recomeçando a amostra 0 do zero
    d.queue.writeBuffer(this.uni, 0, new Uint32Array([0, 0, 0, 0]));
    const zerar = d.createCommandEncoder(); zerar.clearBuffer(this.acum); d.queue.submit([zerar.finish()]);
    const t0 = performance.now();
    let estimado = false;
    // várias amostras por espera: esperar a placa a cada amostra deixa ela parada entre uma e outra
    let grupo = 1, tUlt = performance.now();
    for (let a = 0; a < amostras; a++) {
      if (sinal && sinal.aborted) throw new Error('interrompido');
      for (let l = 0; l < this.altura; l += faixa) this._passada(a, l, Math.min(faixa, this.altura - l));
      feitas++;
      if (feitas % grupo && a < amostras - 1) continue;
      await d.queue.onSubmittedWorkDone();
      const t = performance.now();
      if (feitas <= 3) { const ms = (t - tUlt) / grupo; grupo = Math.max(1, Math.min(32, Math.floor(120 / Math.max(ms, .5)))); }
      tUlt = t;
      if (t - ultimoMostrar > 250) { ultimoMostrar = t; this.mostrar(); await respirar(); }
      if (aoAndar) aoAndar({feitas, amostras, segundos: (t - t0) / 1000});
      if ((t - t0) / 1000 > limite) { estimado = true; break; }
    }
    this.mostrar();
    const s = (performance.now() - t0) / 1000;
    return {segundos: estimado ? s * amostras / feitas : s, feitas, estimado, faixa, total: (performance.now() - inicio) / 1000};
  }

  /**
   * Teste pesado de Arquitetura: ray tracing em tempo real, como o Enscape e o Twinmotion. A câmera passeia pela
   * sala e cada quadro soma 1 amostra por pixel, misturada aos quadros anteriores. Mede quadros por segundo.
   */
  async tempoReal(segundos, aoAndar, sinal) {
    const d = this.dev, buf = new ArrayBuffer(32), u32 = new Uint32Array(buf), f32 = new Float32Array(buf);
    let faixa = this.altura;
    {
      const t0 = performance.now(); this._passada(0, 0, 64); await d.queue.onSubmittedWorkDone();
      const porLinha = (performance.now() - t0) / 64;
      faixa = Math.max(8, Math.min(this.altura, Math.floor(100 / Math.max(porLinha, 1e-3) / 8) * 8));
    }
    const zerar = d.createCommandEncoder(); zerar.clearBuffer(this.acum); d.queue.submit([zerar.finish()]);
    const inicio = performance.now(), porSegundo = [];
    let quadro = 0, marco = null, qSeg = 0, tSeg = inicio, ultimoMostrar = 0, ultimoAviso = 0, grupo = 1, tUlt = inicio;
    while (true) {
      if (sinal && sinal.aborted) throw new Error('interrompido');
      const t = performance.now(), s = (t - inicio) / 1000;
      if (s >= segundos) break;
      if (!marco && s >= 1.5) marco = {q: quadro, t};
      u32[0] = this.largura; u32[1] = this.altura; u32[2] = quadro;
      f32[4] = .5 + .5 * Math.sin(s * .45); f32[5] = Math.sin(s * .31); f32[6] = 1; f32[7] = .1;
      for (let l = 0; l < this.altura; l += faixa) {
        u32[3] = l;
        d.queue.writeBuffer(this.uni, 0, buf);
        const enc = d.createCommandEncoder(), p = enc.beginComputePass();
        p.setPipeline(this.pipe); p.setBindGroup(0, this.bg); p.dispatchWorkgroups(Math.ceil(this.largura / 8), Math.ceil(Math.min(faixa, this.altura - l) / 8)); p.end();
        d.queue.submit([enc.finish()]);
      }
      quadro++; qSeg++;
      if (quadro % grupo) continue;
      await d.queue.onSubmittedWorkDone();
      const t2 = performance.now();
      if (quadro <= 6) { const ms = (t2 - tUlt) / grupo; grupo = Math.max(1, Math.min(8, Math.floor(50 / Math.max(ms, .5)))); }
      tUlt = t2;
      if (t2 - tSeg >= 1000) { porSegundo.push(qSeg * 1000 / (t2 - tSeg)); qSeg = 0; tSeg = t2; }
      if (t2 - ultimoMostrar > 33) { ultimoMostrar = t2; this.mostrar(); await respirar(); }
      if (aoAndar && t2 - ultimoAviso > 250) { ultimoAviso = t2; aoAndar({segundos: (t2 - inicio) / 1000, fpsAgora: porSegundo.at(-1) || quadro / ((t2 - inicio) / 1000)}); }
    }
    await d.queue.onSubmittedWorkDone();
    const total = performance.now();
    d.queue.writeBuffer(this.uni, 0, new ArrayBuffer(32));
    const fps = marco ? (quadro - marco.q) / ((total - marco.t) / 1000) : quadro / ((total - inicio) / 1000);
    return {fps, quadros: quadro, porSegundo};
  }

  /** Imagem atual reduzida (para a miniatura do resultado). */
  async capturar(larguraSaida = 960) {
    const W = this.largura, H = this.altura, bytes = W * H * 16;
    const buf = this.dev.createBuffer({size: bytes, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
    const enc = this.dev.createCommandEncoder(); enc.copyBufferToBuffer(this.acum, 0, buf, 0, bytes); this.dev.queue.submit([enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const a = new Float32Array(buf.getMappedRange());
    const ws = larguraSaida, hs = Math.round(H * ws / W), out = new Uint8ClampedArray(ws * hs * 4);
    const tom = v => { v *= .55; v = (v * (2.51 * v + .03)) / (v * (2.43 * v + .59) + .14); return 255 * Math.pow(Math.min(1, Math.max(0, v)), 1 / 2.2); };
    for (let y = 0; y < hs; y++) for (let x = 0; x < ws; x++) {
      const k = (Math.floor(y * H / hs) * W + Math.floor(x * W / ws)) * 4, n = Math.max(a[k + 3], 1), o = (y * ws + x) * 4;
      out[o] = tom(a[k] / n); out[o + 1] = tom(a[k + 1] / n); out[o + 2] = tom(a[k + 2] / n); out[o + 3] = 255;
    }
    buf.unmap(); buf.destroy();
    return new ImageData(out, ws, hs);
  }

  destruir() { try { this.dev.destroy(); } catch (e) { /* já foi */ } }
}
