/* Bench GPU · motor do teste
 *
 * Uma cena 3D gerada por matemática (sem modelos nem texturas): uma cidade de torres com faixas de luz,
 * chão espelhado, sombras suaves, oclusão de ambiente e um reflexo. Tudo é calculado na placa de vídeo,
 * pixel a pixel, então o processador quase não interfere na nota.
 *
 * Como mede sem o limite da tela (60/120/165 Hz): a cena é desenhada numa imagem fora da tela, em
 * resolução fixa (2560x1440 por padrão), o mais rápido que a placa aguenta. Só de vez em quando uma cópia
 * vai para a janela, para a pessoa ver. Cada quadro tem a câmera numa posição definida pelo número do
 * quadro (não pelo relógio), então todo notebook desenha exatamente as mesmas imagens.
 *
 * Nota = quadros por segundo médios × 100.
 */

const WGSL = /* wgsl */`
struct U { res: vec2f, quadro: f32, qualidade: f32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var logoTex: texture_2d<f32>;   // forma do "B" do logo da Bench (campo de distância)
@group(0) @binding(2) var logoAmostra: sampler;

@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array<vec2f, 3>(vec2f(-1., -3.), vec2f(-1., 1.), vec2f(3., 1.));
  return vec4f(p[i], 0., 1.);
}

fn hash2(c: vec2f) -> f32 { return fract(sin(dot(c, vec2f(127.1, 311.7))) * 43758.5453); }

fn sdCaixa(p: vec3f, b: vec3f, r: f32) -> f32 {
  let q = abs(p) - b + vec3f(r);
  return length(max(q, vec3f(0.))) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}

var<private> luzPerto: f32 = 1e5;  // menor distância até uma faixa de luz (para o brilho em volta)

// "B" do logo da Bench: distância 2D (em unidades do mundo) para um logo de meia-largura S centrado em xy
fn distB(xy: vec2f, S: f32) -> f32 {
  let uv = vec2f(xy.x / S * .5 + .5, .5 - xy.y / S * .5);
  let fora = length(max(abs(uv - .5) - .5, vec2f(0.))) * 2. * S;
  return (textureSampleLevel(logoTex, logoAmostra, clamp(uv, vec2f(0.), vec2f(1.)), 0.).r - .5) * 80. * (S / 256.) + fora;
}

fn retArredondado(xy: vec2f, b: f32, r: f32) -> f32 {
  let q = abs(xy) - vec2f(b - r);
  return length(max(q, vec2f(0.))) + min(max(q.x, q.y), 0.) - r;
}

fn extrudar(d2: f32, z: f32, meia: f32, r: f32) -> f32 {
  let w = vec2f(d2 + r, abs(z) - meia + r);
  return min(max(w.x, w.y), 0.) + length(max(w, vec2f(0.))) - r;
}

// Logo da Bench em 3D, no estilo do original: placa amarela com borda escura e o "B" branco com contorno
// preto, saltado para fora com a lateral escura (como a "sombra" do logo de verdade).
// Um a cada 60 unidades, flutuando sobre a avenida e girando devagar.
fn logoBench(p: vec3f) -> vec2f {
  let zc = (floor(p.z / 60.) + .5) * 60.;
  var q = p - vec3f(0., 5.9, zc);
  let ang = sin(u.quadro * .0021 + zc * .37) * .75;                 // balança de um lado para o outro (sempre de frente)
  let c = cos(ang); let s = sin(ang);
  q = vec3f(c * q.x - s * q.z, q.y, s * q.x + c * q.z);
  let S = 2.7;
  let caixa = sdCaixa(q, vec3f(S, S, .7), 0.);
  if (caixa > .4) { return vec2f(caixa, 3.); }                      // longe: nem olha a textura
  let r2 = retArredondado(q.xy, S * .96, S * .23);
  let placa = extrudar(r2, q.z, .2, .06);
  let dB = distB(q.xy, S);
  let b3 = extrudar(dB, q.z, .46, .03);
  if (b3 < placa) {
    let naFrente = abs(q.z) - .46 > dB - .02;                       // face do B ou lateral?
    return vec2f(b3, select(5., select(5., 4., dB < -.09), naFrente));   // branco, contorno preto, lateral escura
  }
  let naFrenteP = abs(q.z) - .2 > r2 - .02;
  return vec2f(placa, select(5., select(5., 3., r2 < -.13), naFrenteP));
}

// telão com o logo nas torres da beira da avenida (só as que sorteiam); xy no plano do telão
fn telao(local: vec3f, celula: vec2f) -> vec3f {           // .x distância, .yz posição no telão
  let lado = -sign(celula.x + .5);
  let pl = vec3f(local.x - lado * 1.27, local.y - 3.4, local.z);
  return vec3f(sdCaixa(pl, vec3f(.025, 1.05, 1.05), .02), pl.z * lado, pl.y);
}

fn corLogo(xy: vec2f, S: f32) -> vec3f {                  // cores chapadas do logo (telões e chão)
  let r2 = retArredondado(xy, S * .96, S * .23);
  let dB = distB(xy, S);
  if (dB < -.035 * S) { return vec3f(1.); }
  if (dB < .02 * S) { return vec3f(.05, .03, .08); }
  if (r2 < -.06 * S) { return vec3f(1., .8, .05); }
  if (r2 < 0.) { return vec3f(.05, .03, .08); }
  return vec3f(-1.);
}

// distância até a cena; .y = material (0 chão, 1 torre, 2 luz, 3 amarelo do logo, 4 "B" branco, 5 contorno escuro, 6 telão)
fn cena(p: vec3f) -> vec2f {
  var d = vec2f(p.y, 0.);
  let celula = floor(p.xz / 4.);
  let local = vec3f(p.x - (celula.x + .5) * 4., p.y, p.z - (celula.y + .5) * 4.);
  let h = hash2(celula);
  // não deixa o raio "pular" para dentro da torre vizinha (a cena se repete a cada 4 unidades)
  d.x = min(d.x, max(2. - max(abs(local.x), abs(local.z)), 0.) + .08);
  if (abs(celula.x + .5) > 1.7) {               // deixa uma avenida livre no meio, por onde a câmera passa
    let alt = 1. + h * h * 9.;
    let t = sdCaixa(local - vec3f(0., alt, 0.), vec3f(1.25, alt, 1.25), .18);
    if (t < d.x) { d = vec2f(t, 1.); }
    // faixas de luz amarela em alturas diferentes
    let faixaY = floor(alt * 1.4) * .7 + .35;
    let f = sdCaixa(local - vec3f(0., faixaY, 0.), vec3f(1.32, .07, 1.32), .03);
    if (h > .35) { luzPerto = min(luzPerto, f); if (f < d.x) { d = vec2f(f, 2.); } }
    if (abs(celula.x + .5) < 2.7 && alt > 2.6 && hash2(celula + 7.3) > .55) {
      let tl = telao(local, celula).x;
      if (tl < d.x) { d = vec2f(tl, 6.); }
    }
  }
  // portais no meio da avenida
  let z = p.z - (floor(p.z / 24.) + .5) * 24.;
  let arco = max(sdCaixa(vec3f(p.x, p.y - 3., z), vec3f(4.2, 3.2, .35), .1), -sdCaixa(vec3f(p.x, p.y - 2.6, z), vec3f(3.4, 2.8, 1.), .3));
  if (arco < d.x) { d = vec2f(arco, 1.); }
  let neon = sdCaixa(vec3f(p.x, p.y - 5.45, z - .38), vec3f(3.2, .05, .04), .02);
  luzPerto = min(luzPerto, neon);
  if (neon < d.x) { d = vec2f(neon, 2.); }
  let lg = logoBench(p);
  if (lg.x < d.x) { d = lg; }
  return d;
}

fn normal(p: vec3f) -> vec3f {
  let e = vec2f(.0015, 0.);
  return normalize(vec3f(cena(p + e.xyy).x - cena(p - e.xyy).x, cena(p + e.yxy).x - cena(p - e.yxy).x,
                         cena(p + e.yyx).x - cena(p - e.yyx).x));
}

var<private> brilho: f32 = 0.;

fn marchar(ro: vec3f, rd: vec3f, passos: i32, longe: f32) -> vec3f {  // x = distância, y = material, z = acertou
  var t = .02;
  brilho = 0.;
  for (var i = 0; i < passos; i++) {
    luzPerto = 1e5;
    let r = cena(ro + rd * t);
    brilho += .03 / (1. + luzPerto * luzPerto * 25.) * min(r.x * 4., 1.);
    if (r.x < .0008 * t) { return vec3f(t, r.y, 1.); }
    t += r.x * .9;
    if (t > longe) { break; }
  }
  return vec3f(t, -1., 0.);
}

fn sombra(ro: vec3f, rd: vec3f, passos: i32) -> f32 {
  var s = 1.; var t = .05;
  for (var i = 0; i < passos; i++) {
    let h = cena(ro + rd * t).x;
    s = min(s, 10. * h / t);
    t += clamp(h, .03, .6);
    if (s < .002 || t > 30.) { break; }
  }
  return clamp(s, 0., 1.);
}

fn oclusao(p: vec3f, n: vec3f) -> f32 {
  var o = 0.; var k = 1.;
  for (var i = 1; i <= 6; i++) {
    let h = .08 * f32(i);
    o += k * (h - cena(p + n * h).x);
    k *= .7;
  }
  return clamp(1. - 2.2 * o, 0., 1.);
}

const SOL = vec3f(-.35, .28, .9);

fn ceu(rd: vec3f) -> vec3f {
  let y = clamp(rd.y, 0., 1.);
  var c = mix(vec3f(.42, .14, .5), vec3f(.03, .015, .07), pow(y, .4));
  c += vec3f(1., .55, .3) * pow(max(dot(rd, normalize(SOL)), 0.), 12.) * .7;
  return c;
}

fn iluminar(p: vec3f, rd: vec3f, m: f32, n: vec3f, q: f32) -> vec3f {
  if (m > 1.5 && m < 2.5) { return vec3f(1., .9, .1) * 3.2; }       // luz amarela (emite)
  let l = normalize(SOL);
  var base = select(vec3f(.10, .08, .16), vec3f(.20, .17, .30), m > .5);
  var emite = vec3f(0.);
  if (m > 5.5) {                                                    // telão: o logo aceso
    let cel = floor(p.xz / 4.);
    let loc = vec3f(p.x - (cel.x + .5) * 4., p.y, p.z - (cel.y + .5) * 4.);
    let t = telao(loc, cel);
    let cl = corLogo(t.yz, 1.);
    return select(cl * 1.6, vec3f(.04, .02, .07), cl.x < 0.);
  }
  if (m > 4.5) { base = vec3f(.035, .025, .06); }                                        // contorno/lateral escura
  else if (m > 3.5) { base = vec3f(1., 1., 1.); emite = vec3f(.42, .41, .45); }          // "B" branco
  else if (m > 2.5) { base = vec3f(1., .8, .04); emite = vec3f(.3, .22, .0); }          // amarelo Bench
  else if (m < .5) {                                                                     // chão: logo pintado na avenida
    let zd = p.z - round(p.z / 60.) * 60.;                        // a cada 60, entre um logo flutuante e outro
    let cl = corLogo(vec2f(p.x, zd), 3.2);
    if (cl.x >= 0.) { base = cl * .45; }
  }
  let dif = max(dot(n, l), 0.) * sombra(p + n * .01, l, i32(24. * q));
  let ao = oclusao(p, n);
  let esp = pow(max(dot(reflect(rd, n), l), 0.), 32.) * dif;
  let ceuLuz = .5 + .5 * n.y;
  var c = base * (dif * vec3f(1.5, 1.1, .9) + ao * ceuLuz * vec3f(.4, .25, .6)) + esp * .6 + emite;
  return c;
}

@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let q = u.qualidade;
  let uv = (vec2f(fc.x, u.res.y - fc.y) * 2. - u.res) / u.res.y;
  let a = u.quadro / 2400.;                                          // volta completa a cada 2400 quadros
  let ro = vec3f(sin(a * 6.2831) * 1.6, 2.2 + sin(a * 12.566) * .9, a * 240.);
  let alvo = vec3f(sin((a + .01) * 6.2831) * 1.6, 2.9 + sin(a * 9.42) * .6, a * 240. + 6.);
  let w = normalize(alvo - ro); let r = normalize(cross(vec3f(0., 1., 0.), w)); let up = cross(w, r);
  let rd = normalize(uv.x * r + uv.y * up + 1.6 * w);

  var cor = ceu(rd);
  let h = marchar(ro, rd, i32(160. * q), 140.);
  let neonPrimario = brilho;
  if (h.z > .5) {
    let p = ro + rd * h.x; let n = normal(p);
    cor = iluminar(p, rd, h.y, n, q);
    if (h.y < 1.5 || (h.y > 2.5 && h.y < 5.5)) {                    // um reflexo (chão espelhado, torres e logo acetinados)
      let rr = reflect(rd, n);
      let h2 = marchar(p + n * .02, rr, i32(80. * q), 80.);
      var refl = ceu(rr);
      if (h2.z > .5) { let p2 = p + n * .02 + rr * h2.x; refl = iluminar(p2, rr, h2.y, normal(p2), q * .5); }
      let fres = select(select(.35, .18, h.y > 2.5), .7, h.y < .5) * (.25 + .75 * pow(1. - max(dot(-rd, n), 0.), 3.));
      cor = mix(cor, refl, fres);
    }
    cor = mix(cor, vec3f(.2, .08, .26), 1. - exp(-h.x * .016));     // névoa
  }
  cor += vec3f(1., .82, .15) * neonPrimario;                          // halo das luzes
  cor *= 1.1;
  cor = clamp((cor * (2.51 * cor + .03)) / (cor * (2.43 * cor + .59) + .14), vec3f(0.), vec3f(1.));  // tom (ACES)
  cor = pow(cor, vec3f(.9));
  let vin = 1. - .25 * dot(uv * .55, uv * .55);
  return vec4f(cor * vin, 1.);
}
`;

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

// devolve a vez para a janela por um instante (mais rápido que setTimeout e sem depender da taxa da tela)
const canal = new MessageChannel(); let filaRespirar = [];
canal.port1.onmessage = () => { const f = filaRespirar; filaRespirar = []; f.forEach(r => r()); };
const respirar = () => new Promise(r => { filaRespirar.push(r); canal.port2.postMessage(0); });

/** Muda sempre que a cena mudar: notas de versões diferentes não se comparam. */
export const VERSAO_CENA = '1.0';

export class MotorGPU {
  /** Prepara a placa. Retorna as informações dela ({vendor, architecture, description}). */
  async iniciar(canvas, {largura = 2560, altura = 1440, qualidade = 1} = {}) {
    if (!navigator.gpu) throw new Error('Este computador não tem WebGPU disponível.');
    this.adaptador = await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
    if (!this.adaptador) throw new Error('Nenhuma placa de vídeo compatível encontrada.');
    this.info = this.adaptador.info || {};
    this.dev = await this.adaptador.requestDevice();
    this.largura = largura; this.altura = altura; this.qualidade = qualidade;
    this.formato = navigator.gpu.getPreferredCanvasFormat();
    this.ctx = canvas ? canvas.getContext('webgpu') : null;            // sem canvas: só desenha fora da tela
    if (this.ctx) this.ctx.configure({device: this.dev, format: this.formato, alphaMode: 'opaque'});
    this.alvo = this.dev.createTexture({size: [largura, altura], format: 'rgba8unorm',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC});
    this.uni = this.dev.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const mod = this.dev.createShaderModule({code: WGSL});
    this.pipe = this.dev.createRenderPipeline({layout: 'auto', vertex: {module: mod, entryPoint: 'vs'},
      fragment: {module: mod, entryPoint: 'fs', targets: [{format: 'rgba8unorm'}]}});
    const bmp = await createImageBitmap(await (await fetch(new URL('logo_sdf.png', import.meta.url))).blob());
    const logo = this.dev.createTexture({size: [bmp.width, bmp.height], format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT});
    this.dev.queue.copyExternalImageToTexture({source: bmp}, {texture: logo}, [bmp.width, bmp.height]);
    this.bind = this.dev.createBindGroup({layout: this.pipe.getBindGroupLayout(0), entries: [
      {binding: 0, resource: {buffer: this.uni}}, {binding: 1, resource: logo.createView()},
      {binding: 2, resource: this.dev.createSampler({magFilter: 'linear', minFilter: 'linear'})}]});
    const mc = this.dev.createShaderModule({code: COPIA});
    this.pipeCopia = this.dev.createRenderPipeline({layout: 'auto', vertex: {module: mc, entryPoint: 'vs'},
      fragment: {module: mc, entryPoint: 'fs', targets: [{format: this.formato}]}});
    this.bindCopia = this.dev.createBindGroup({layout: this.pipeCopia.getBindGroupLayout(0), entries: [
      {binding: 0, resource: this.alvo.createView()}, {binding: 1, resource: this.dev.createSampler({magFilter: 'linear', minFilter: 'linear'})}]});
    return this.info;
  }

  _desenhar(quadro, mostrar) {
    this.dev.queue.writeBuffer(this.uni, 0, new Float32Array([this.largura, this.altura, quadro, this.qualidade]));
    const enc = this.dev.createCommandEncoder();
    const p = enc.beginRenderPass({colorAttachments: [{view: this.alvo.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
    p.setPipeline(this.pipe); p.setBindGroup(0, this.bind); p.draw(3); p.end();
    if (mostrar && this.ctx) {
      const c = enc.beginRenderPass({colorAttachments: [{view: this.ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
      c.setPipeline(this.pipeCopia); c.setBindGroup(0, this.bindCopia); c.draw(3); c.end();
    }
    this.dev.queue.submit([enc.finish()]);
  }

  /** Copia a imagem atual para um ImageData (miniatura do resultado, e prévias sem tela). */
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

  /** Desenha um quadro só (para prévia/miniatura). */
  async quadro(n) { this._desenhar(n, true); await this.dev.queue.onSubmittedWorkDone(); }

  /**
   * Roda o teste por `segundos`. aoAndar({quadros, segundos, fps, fpsAgora}) é chamado ~4x por segundo.
   * Retorna {quadros, segundos, fps, nota, porSegundo: [fps de cada segundo]}.
   */
  async rodar(segundos, aoAndar, sinal) {
    let quadro = 0, emVoo = [], ultimoMostrar = 0, ultimoAviso = 0, marco2 = null;
    const porSegundo = []; let marcoSeg = performance.now(), quadrosSeg = 0;
    const inicio = performance.now();
    while (true) {
      if (sinal && sinal.aborted) throw new Error('interrompido');
      const agora = performance.now();
      if ((agora - inicio) / 1000 >= segundos) break;
      if (!marco2 && (agora - inicio) >= 2000) marco2 = {q: quadro, t: (agora - inicio) / 1000};
      const mostrar = agora - ultimoMostrar > 33;                    // ~30 imagens por segundo na janela
      if (mostrar) ultimoMostrar = agora;
      this._desenhar(quadro, mostrar);
      emVoo.push(this.dev.queue.onSubmittedWorkDone().then(() => { quadrosSeg++; }));
      quadro++;
      // até 8 quadros na fila: mesmo nas placas muito rápidas (300+ fps) a placa nunca fica esperando o app
      if (emVoo.length >= 8) await emVoo.shift();
      if (mostrar) await respirar();                                  // deixa a janela atualizar, sem esperar a tela (vsync)
      if (agora - marcoSeg >= 1000) { porSegundo.push(quadrosSeg * 1000 / (agora - marcoSeg)); quadrosSeg = 0; marcoSeg = agora; }
      if (aoAndar && agora - ultimoAviso > 250) {
        ultimoAviso = agora;
        const s = (agora - inicio) / 1000;
        aoAndar({quadros: quadro, segundos: s, fps: quadro / s, fpsAgora: porSegundo.at(-1) || quadro / s});
      }
    }
    await Promise.all(emVoo);
    const total = (performance.now() - inicio) / 1000;
    // a nota não conta os 2 primeiros segundos (a placa ainda está subindo o clock)
    const fps = marco2 ? (quadro - marco2.q) / (total - marco2.t) : quadro / total;
    return {quadros: quadro, segundos: total, fps, nota: Math.round(fps * 100), porSegundo};
  }
}
