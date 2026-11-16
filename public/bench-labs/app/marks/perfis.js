/* Bench Marks · perfis Edição de vídeo, IA no notebook e 3D e animação (sem tela: a interface chama e mostra).
 *
 * Todas as funções recebem {aoAndar, sinal}. As réguas dos vereditos são provisórias: calibrar com os
 * programas de verdade (Premiere, LM Studio, Blender) nos notebooks da bancada.
 */
import {THREADS} from './testes.js';

const URL_WORKER = new URL('./cpu_worker.js', import.meta.url);
const novoWorker = () => new Worker(URL_WORKER, {type: 'module'});
const espera = ms => new Promise(r => setTimeout(r, ms));
const interrompido = () => new Error('interrompido');
const ver = s => { if (s && s.aborted) throw interrompido(); };
const NIVEIS = ['Fraco', 'Regular', 'Bom', 'Muito bom', 'Ótimo'];
const faixa = (v, limites, menorMelhor) => {
  if (v == null || isNaN(v)) return null;
  for (let i = 0; i < limites.length; i++) if (menorMelhor ? v <= limites[i] : v >= limites[i]) return 4 - i;
  return 0;
};
const tempoTxt = s => s < 60 ? `${Math.round(s * 10) / 10} s`.replace('.', ',') : s < 3600 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.floor(s / 3600)} h ${Math.round(s % 3600 / 60)} min`;
const minN = (...xs) => { const v = xs.filter(x => x != null); return v.length ? Math.min(...v) : 2; };
// estrelas de 1 a 5 com meia estrela: o nível de um programa é o do fator mais fraco (0 a 4);
// se os outros fatores estão bem acima dele, ganha meia estrela.
const nMin = (...xs) => {
  const v = xs.filter(x => x != null && !isNaN(x)); if (!v.length) return 2;
  const m = Math.min(...v), media = v.reduce((a, b) => a + b, 0) / v.length;
  return m < 4 && v.length > 1 && media - m >= .75 ? m + .5 : m;
};
const comEstrelas = p => { const n = p.nivel ?? 1, i = Math.max(0, Math.min(4, Math.floor(n))); return {...p, nivel: i, estrelas: Math.min(5, 1 + n), rotulo: NIVEIS[i]}; };


export async function dispositivo(extra = {}) {
  if (!navigator.gpu) throw new Error('Este computador não tem WebGPU disponível.');
  const a = await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
  if (!a) throw new Error('Nenhuma placa de vídeo compatível foi encontrada.');
  const feats = [];
  if (extra.f16 && a.features.has('shader-f16')) feats.push('shader-f16');
  if (extra.tempo && a.features.has('timestamp-query')) feats.push('timestamp-query');
  const lim = a.limits;
  const dev = await a.requestDevice({requiredFeatures: feats, requiredLimits: {
    maxStorageBufferBindingSize: Math.min(lim.maxStorageBufferBindingSize, 268435456), maxBufferSize: Math.min(lim.maxBufferSize, 268435456),
    maxComputeWorkgroupStorageSize: lim.maxComputeWorkgroupStorageSize}});
  return {a, dev, f16: feats.includes('shader-f16'), ts: feats.includes('timestamp-query'), info: a.info || {}};
}

/** Mede quantas vezes por segundo a placa executa `gravar(passada)`.
 *  Usa o relógio da própria placa (timestamp-query) quando existe: assim o tempo do navegador entre um envio e outro
 *  não entra na conta. Antes de medir, aquece a placa para o clock subir. */
async function medirGPU(dev, gravar, {segundos = 3, sinal, ts, rep = 8, aquecer = 1} = {}) {
  const passada = (enc, tw) => { const p = enc.beginComputePass(tw ? {timestampWrites: tw} : undefined); for (let k = 0; k < rep; k++) gravar(p); p.end(); };
  const enviar = () => { const e = dev.createCommandEncoder(); passada(e); dev.queue.submit([e.finish()]); };
  await medirPassadas(dev, enviar, {segundos: aquecer, sinal});                       // aquecimento
  if (!ts) return rep * await medirPassadas(dev, enviar, {segundos, sinal});
  const L = 8;
  const qs = dev.createQuerySet({type: 'timestamp', count: 2 * L});
  const res = dev.createBuffer({size: 16 * L, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC});
  const ler = dev.createBuffer({size: 16 * L, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST});
  let ns = 0, n = 0, total = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < segundos * 1000) {
    ver(sinal);
    const e = dev.createCommandEncoder();
    for (let j = 0; j < L; j++) passada(e, {querySet: qs, beginningOfPassWriteIndex: 2 * j, endOfPassWriteIndex: 2 * j + 1});
    e.resolveQuerySet(qs, 0, 2 * L, res, 0);
    e.copyBufferToBuffer(res, 0, ler, 0, 16 * L);
    dev.queue.submit([e.finish()]);
    await ler.mapAsync(GPUMapMode.READ);
    const v = new BigUint64Array(ler.getMappedRange().slice(0));
    ler.unmap();
    for (let j = 0; j < L; j++) { const d = Number(v[2 * j + 1] - v[2 * j]); if (d > 0 && d < 1e10) { ns += d; n += rep; } }
    total += L * rep;
  }
  const relogio = total / ((performance.now() - t0) / 1000);                          // sem o relógio da placa
  const placa = ns > 0 ? n / (ns / 1e9) : 0;
  // relógio da placa com valor estranho (zerado ou exagerado): fica o tempo do navegador
  return placa > relogio * .9 && placa < relogio * 6 ? placa : relogio;
}

// Executa `n` envios de uma passada de computação e mede o tempo (com até 4 envios na fila)
async function medirPassadas(dev, enviar, {segundos = 3, sinal, aoAndar} = {}) {
  await enviar(); await dev.queue.onSubmittedWorkDone();                 // aquece
  let n = 0, fila = [];
  const t0 = performance.now();
  while (performance.now() - t0 < segundos * 1000) {
    ver(sinal);
    enviar(); n++;
    if (n % 4) continue;                                                 // espera só a cada 4 envios (a placa não fica parada)
    fila.push(dev.queue.onSubmittedWorkDone());
    if (fila.length >= 3) await fila.shift();
    if (aoAndar && n % 4 === 0) aoAndar(n / ((performance.now() - t0) / 1000));
  }
  await Promise.all(fila);
  return n / ((performance.now() - t0) / 1000);
}

// ================================================================== EDIÇÃO DE VÍDEO
export const FORMATOS = [
  {id: 'h264', arq: 'clipes/h264_8bit.bmv', nome: 'H.264 8-bit', origem: 'Celular, GoPro, OBS'},
  {id: 'hevc10', arq: 'clipes/hevc_10bit.bmv', nome: 'HEVC 10-bit 4:2:0', origem: 'iPhone, DJI, Samsung'},
  {id: 'hevc422', arq: 'clipes/hevc_422.bmv', nome: 'HEVC 10-bit 4:2:2', origem: 'Sony A7 IV, FX3, Canon R6 II'},
  {id: 'av1', arq: 'clipes/av1_10bit.bmv', nome: 'AV1 10-bit', origem: 'Gravações do OBS, downloads'},
];

export async function carregarClipe(url) {
  const buf = new Uint8Array(await (await fetch(new URL(url, import.meta.url))).arrayBuffer());
  const dv = new DataView(buf.buffer);
  if (String.fromCharCode(...buf.subarray(0, 4)) !== 'BMV1') throw new Error('Clipe de teste inválido');
  const n = dv.getUint32(4, true), meta = JSON.parse(new TextDecoder().decode(buf.subarray(8, 8 + n))), base = 8 + n;
  meta.dados = meta.quadros.map(([o, t, k]) => ({dados: buf.subarray(base + o, base + o + t), key: !!k}));
  return meta;
}

export async function suporte(clipe, hw) {
  try {
    const r = await VideoDecoder.isConfigSupported({codec: clipe.codec, codedWidth: clipe.largura, codedHeight: clipe.altura, hardwareAcceleration: hw});
    return !!r.supported;
  } catch (e) { return false; }
}

/** Decodifica `streams` cópias do clipe ao mesmo tempo por `segundos`. Retorna quadros/s de cada uma. */
export async function decodificar(clipe, {streams = 1, segundos = 3, hw = 'prefer-hardware', sinal} = {}) {
  let erro = null;
  const contas = Array(streams).fill(0);
  const decs = Array.from({length: streams}, (_, i) => {
    const d = new VideoDecoder({output: f => { contas[i]++; f.close(); }, error: e => { erro = e; }});
    d.configure({codec: clipe.codec, codedWidth: clipe.largura, codedHeight: clipe.altura, hardwareAcceleration: hw, optimizeForLatency: false});
    return d;
  });
  const fim = performance.now() + segundos * 1000, t0 = performance.now();
  const alimentar = async (d) => {
    let ts = 0;
    while (performance.now() < fim && !erro && !(sinal && sinal.aborted)) {
      for (const q of clipe.dados) {
        if (performance.now() >= fim || erro) break;
        while (d.decodeQueueSize > 6) await new Promise(r => d.addEventListener('dequeue', r, {once: true}));
        d.decode(new EncodedVideoChunk({type: q.key ? 'key' : 'delta', timestamp: ts, duration: 33333, data: q.dados}));
        ts += 33333;
      }
    }
  };
  await Promise.all(decs.map(alimentar));
  const s = (performance.now() - t0) / 1000;
  decs.forEach(d => { try { d.close(); } catch (e) { /**/ } });
  ver(sinal);
  if (erro) throw erro;
  return contas.map(c => c / s);
}

/** Formatos que cada chip do notebook decodifica no hardware, pelo modelo (o que o Premiere e o DaVinci usam).
 *  O motor do Edge nem sempre abre o que a placa decodifica: o HEVC passa pela "Extensão de Vídeo HEVC" do Windows,
 *  que falta em muito Windows recém-formatado, e o HEVC 4:2:2 não abre no Edge em vários notebooks. */
export function chipsDeVideo(info) {
  const placas = (info.placas || []).map(p => p.nome || '').concat([(info.gpu && info.gpu.nome) || '']).join(' | ');
  const cpu = (info.cpu && info.cpu.nome) || '';
  const chips = [];
  // NVIDIA: GTX 10 em diante lê HEVC 10-bit; RTX 30 em diante, AV1; RTX 50 (Blackwell), também o 4:2:2
  const nv = placas.match(/(RTX|GTX|MX)\s*(\d{3,4})/i);
  if (nv) {
    const serie = nv[1].toUpperCase(), num = +nv[2], geracao = num >= 1000 ? Math.floor(num / 100) : Math.floor(num / 10);
    const f = new Set(['h264']);
    if (serie === 'MX' ? num >= 150 : geracao >= 10) f.add('hevc10');
    if (serie === 'RTX' && geracao >= 30) f.add('av1');
    if (serie === 'RTX' && geracao >= 50) f.add('hevc422');
    chips.push({quem: serie === 'RTX' && geracao >= 50 ? 'NVIDIA RTX 50 (hardware)' : 'NVIDIA (hardware)', formatos: f});
  }
  // Intel Arc dedicada e vídeo integrado Intel (pela geração do processador; some no modo só placa dedicada)
  if (/Arc\(TM\) A\d|Arc A\d{3}/i.test(placas)) chips.push({quem: 'Intel Arc (hardware)', formatos: new Set(['h264', 'hevc10', 'hevc422', 'av1'])});
  if (/Intel/i.test(placas.replace(/Arc\(TM\) A\d+\w*|Arc A\d{3}\w*/gi, '')) || /Intel\(R\) Graphics|Intel Graphics|Iris|UHD/i.test(placas)) {
    const f = new Set(['h264', 'hevc10']);
    const core = cpu.match(/i[3579]-(\d{4,5})/i), novo = /Core\(TM\) Ultra|Core Ultra|Core\(TM\) [357] \d{3}|Core [357] \d{3}/i.test(cpu);
    // geração pelo número do modelo: i7-14650HX e i5-1235U (2 dígitos: 10 a 14) ou i7-8750H (1 dígito)
    const gen = core ? (core[1].length === 5 || core[1][0] === '1' ? +core[1].slice(0, 2) : +core[1][0]) : 0;
    if (novo || gen >= 11 || /Iris\(R\) Xe|Iris Xe|Arc/i.test(placas)) { f.add('hevc422'); f.add('av1'); }           // Xe: 11ª geração em diante
    else if (/i[3579]-10\d{2}G\d/i.test(cpu)) f.add('hevc422');                                                      // Ice Lake (10ª geração "G")
    chips.push({quem: 'Vídeo integrado Intel (Quick Sync)', formatos: f});
  }
  // AMD: todas as Radeon dos Ryzen leem HEVC 10-bit; RDNA 2 em diante (RX 6000+, 680M/780M/880M/890M/8060S, 610M), AV1.
  // Nenhuma Radeon decodifica HEVC 4:2:2 no hardware.
  if (/Radeon/i.test(placas) || /Ryzen/i.test(cpu)) {
    const f = new Set(['h264', 'hevc10']);
    if (/RX\s*[679]\d{3}|Radeon\s*(\d{3}M|8060S|8050S|8040S)|Ryzen (AI|[5-9] [6-9]\d\d\d|Z\d)/i.test(placas + ' ' + cpu)) f.add('av1');
    chips.push({quem: /RX\s*\d{4}/i.test(placas) ? 'AMD Radeon (hardware)' : 'Vídeo integrado AMD Radeon', formatos: f});
  }
  // Snapdragon X: o Adreno lê H.264, HEVC 10-bit e AV1
  if (/Adreno|Snapdragon/i.test(placas + ' ' + cpu)) chips.push({quem: 'Qualcomm Adreno (hardware)', formatos: new Set(['h264', 'hevc10', 'av1'])});
  return chips;
}

/** Qual chip lê cada formato (o que o WebView mede + o que se sabe de cada chip para o Premiere). */
export function quemLe(id, hwWeb, info) {
  const nvidia = info.gpu && info.gpu.nvidia;
  if (hwWeb) return {quem: nvidia ? 'NVIDIA (hardware)' : `${((info.gpu && info.gpu.nome) || 'Placa').replace(/\(R\)|\(TM\)/g, '')} (hardware)`, ok: true};
  const chip = chipsDeVideo(info).find(c => c.formatos.has(id));
  if (chip) return {quem: chip.quem, ok: true, previsto: true};
  return {quem: 'Processador', ok: false};
}

// --- cor e efeitos na placa (como o Lumetri): grade de cor, desfoque em 2 passadas, nitidez, granulado e vinheta
const EFEITOS = /* wgsl */`
@group(0) @binding(0) var ent: texture_2d<f32>;
@group(0) @binding(1) var sai: texture_storage_2d<rgba16float, write>;
@group(0) @binding(2) var<uniform> u: vec4f;   // x = quadro, y = passada (0 cor, 1 desfoque H, 2 desfoque V, 3 final)
fn ld(p: vec2i) -> vec3f { let d = vec2i(textureDimensions(ent)); return textureLoad(ent, clamp(p, vec2i(0), d - 1), 0).rgb; }
fn h(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453); }
@compute @workgroup_size(16, 16) fn main(@builtin(global_invocation_id) id: vec3u) {
  let d = textureDimensions(ent);
  if (id.x >= d.x || id.y >= d.y) { return; }
  let p = vec2i(id.xy);
  var c = vec3f(0.);
  let passo = i32(u.y);
  if (passo == 0) {
    // imagem de origem gerada (o "vídeo") + correção de cor: lift/gamma/gain, saturação, curva em S
    let uv = vec2f(id.xy) / vec2f(d);
    var s = vec3f(.5 + .5 * sin(uv.x * 9. + u.x * .05), .5 + .5 * sin(uv.y * 7. + u.x * .03), .5 + .5 * sin((uv.x + uv.y) * 11.));
    s = s * .8 + vec3f(h(uv * 999. + u.x)) * .2;
    s = pow(max(s * 1.08 + vec3f(.02, 0., -.01), vec3f(0.)), vec3f(.92, .95, 1.02));
    let l = dot(s, vec3f(.2126, .7152, .0722));
    s = mix(vec3f(l), s, 1.25);
    s = s * s * (3. - 2. * s);
    c = s;
  } else if (passo == 1 || passo == 2) {
    let dir = select(vec2i(0, 1), vec2i(1, 0), passo == 1);
    var soma = vec3f(0.); var pesos = 0.;
    for (var k = -12; k <= 12; k++) { let w = exp(-f32(k * k) / 72.); soma += ld(p + dir * k) * w; pesos += w; }
    c = soma / pesos;
  } else {
    let b = ld(p);
    let viz = (ld(p + vec2i(1, 0)) + ld(p - vec2i(1, 0)) + ld(p + vec2i(0, 1)) + ld(p - vec2i(0, 1))) * .25;
    c = b + (b - viz) * .8;
    c += (h(vec2f(id.xy) + u.x * 7.) - .5) * .04;
    let uv = vec2f(id.xy) / vec2f(d) - .5;
    c *= 1. - dot(uv, uv) * .6;
  }
  textureStore(sai, p, vec4f(c, 1.));
}`;

async function corEfeitos({segundos = 6, sinal, aoAndar}) {
  const {dev} = await dispositivo();
  try {
    const W = self.DEV_PEQUENO ? 960 : 3840, H = self.DEV_PEQUENO ? 540 : 2160, TU = GPUTextureUsage;
    const tex = [0, 1].map(() => dev.createTexture({size: [W, H], format: 'rgba16float', usage: TU.TEXTURE_BINDING | TU.STORAGE_BINDING}));
    const pipe = dev.createComputePipeline({layout: 'auto', compute: {module: dev.createShaderModule({code: EFEITOS}), entryPoint: 'main'}});
    const unis = [0, 1, 2, 3].map(() => dev.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST}));
    const grupos = [0, 1, 2, 3].map(i => dev.createBindGroup({layout: pipe.getBindGroupLayout(0), entries: [
      {binding: 0, resource: tex[i % 2].createView()}, {binding: 1, resource: tex[(i + 1) % 2].createView()}, {binding: 2, resource: {buffer: unis[i]}}]}));
    let q = 0;
    const enviar = () => {
      for (let i = 0; i < 4; i++) dev.queue.writeBuffer(unis[i], 0, new Float32Array([q, i, 0, 0]));
      const enc = dev.createCommandEncoder();
      for (let i = 0; i < 4; i++) { const p = enc.beginComputePass(); p.setPipeline(pipe); p.setBindGroup(0, grupos[i]); p.dispatchWorkgroups(Math.ceil(W / 16), Math.ceil(H / 16)); p.end(); }
      dev.queue.submit([enc.finish()]); q++;
    };
    return await medirPassadas(dev, enviar, {segundos, sinal, aoAndar});
  } finally { dev.destroy(); }
}

// --- exportar: codificador de vídeo (placa ou processador)
export async function quadrosOrigem(W, H) {
  const c = new OffscreenCanvas(W, H), x = c.getContext('2d'), fr = [];
  for (let k = 0; k < 6; k++) {
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, `hsl(${270 + k * 8},60%,${18 + k}%)`); g.addColorStop(1, `hsl(${50 + k * 5},90%,${45 + k}%)`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 400; i++) { x.fillStyle = `hsla(${(i * 37 + k * 20) % 360},70%,60%,.5)`; x.fillRect((i * 997 + k * 131) % W, (i * 571 + k * 77) % H, 40 + i % 160, 20 + i % 90); }
    x.fillStyle = '#FFE500'; x.font = `800 ${H / 6}px sans-serif`; x.fillText('BENCH MARKS', W * .1 + k * 30, H * .55);
    fr.push(new VideoFrame(c, {timestamp: 0}));
  }
  return fr;
}

async function codificar({codec, W, H, hw, segundos = 8, sinal}) {
  // o HEVC tem vários jeitos de ser pedido; usa o primeiro que o Windows aceitar
  const opcoes = codec.startsWith('hvc1') ? ['hvc1.1.6.L153.B0', 'hev1.1.6.L153.B0', 'hvc1.1.6.L150.90', 'hev1.1.6.L150.90', 'hvc1.1.6.L156.B0'] : [codec];
  let cfg = null;
  for (const c of opcoes) {
    const t = {codec: c, width: W, height: H, bitrate: W > 2000 ? 45e6 : 16e6, framerate: 30, hardwareAcceleration: hw, latencyMode: 'quality'};
    if (c.startsWith('avc1')) t.avc = {format: 'annexb'};
    if (c.startsWith('hvc1') || c.startsWith('hev1')) t.hevc = {format: 'annexb'};
    try { if ((await VideoEncoder.isConfigSupported(t)).supported) { cfg = t; break; } } catch (e) { /* tenta o próximo */ }
    try { delete t.hevc; if ((await VideoEncoder.isConfigSupported(t)).supported) { cfg = t; break; } } catch (e) { /* tenta o próximo */ }
  }
  if (!cfg) { codificar.motivo = 'sem_codificador'; return null; }
  const base = await quadrosOrigem(W, H);
  let saidas = 0, erro = null;
  const enc = new VideoEncoder({output: () => { saidas++; }, error: e => { erro = e; }});
  try {
    enc.configure(cfg);
    let ts = 0, k = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < segundos * 1000 && !erro) {
      ver(sinal);
      while (enc.encodeQueueSize > 6) await new Promise(r => enc.addEventListener('dequeue', r, {once: true}));
      const f = new VideoFrame(base[k % base.length], {timestamp: ts});
      enc.encode(f, {keyFrame: k % 60 === 0}); f.close();
      ts += 33333; k++;
    }
    await enc.flush();
    if (erro) { codificar.motivo = String(erro.message || erro).slice(0, 160); return null; }
    return saidas / ((performance.now() - t0) / 1000);
  } catch (e) { if (String(e).includes('interrompido')) throw e; codificar.motivo = String(e.message || e).slice(0, 160); return null; }
  finally { try { enc.close(); } catch (e) { /**/ } base.forEach(f => f.close()); }
}

// --- Motion: animação com formas, textos em barras e partículas com brilho, desenhada pela placa de vídeo em 4K,
//     com desfoque de movimento (8 instantes por quadro), como um render de motion graphics.
const MOTION = /* wgsl */`
struct U { res: vec2f, quadro: f32, pad: f32 };
@group(0) @binding(0) var<uniform> u: U;
@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array<vec2f, 3>(vec2f(-1., -3.), vec2f(-1., 1.), vec2f(3., 1.));
  return vec4f(p[i], 0., 1.);
}
fn h1(n: f32) -> f32 { return fract(sin(n * 127.1) * 43758.5453); }
fn cena(px: vec2f, t: f32) -> vec3f {
  let uv = px / u.res;
  var c = vec3f(.09 + .06 * uv.y, .06 + .03 * uv.x, .14 + .08 * uv.y);
  for (var f = 0; f < 10; f++) {                                  // formas animadas com sombra suave
    let ff = f32(f); let a = t * (.6 + ff * .13) + ff;
    let ctr = u.res * vec2f(.5 + .35 * cos(a), .5 + .32 * sin(a * 1.3));
    let tam = (60. + 40. * sin(a * 2.)) * u.res.y / 1080.;
    let d0 = abs(px - ctr);
    var d: f32;
    if (f < 6) { let q = max(d0 - vec2f(tam, tam * .6) + 30., vec2f(0.)); d = length(q) - 30.; } else { d = length(d0) - tam * .7; }
    let cob = clamp(.5 - d / 2., 0., 1.);
    let sombra = clamp(1. - max(d, 0.) / 24., 0., 1.) * .25;
    let cor = select(vec3f(.6, .35, .95), vec3f(1., .85, .1), f % 2 == 1);
    c = c * (1. - cob) * (1. - sombra) + cor * cob;
  }
  let linha = floor((uv.y - .78) / .035);                          // "texto" entrando em barras
  if (linha >= 0. && linha < 4.) {
    let fim = min(1., t * .9 - linha * .12) * (.5 - linha * .06);
    if (uv.x > .06 && uv.x < .06 + fim && fract((uv.y - .78) / .035) < .55) { c = vec3f(.96); }
  }
  var brilho = vec3f(0.);
  for (var i = 0; i < 400; i++) {                                 // 400 partículas com brilho
    let fi = f32(i);
    let p0 = vec2f(h1(fi), h1(fi + 31.)) * u.res;
    let v = (vec2f(h1(fi + 7.), h1(fi + 13.)) - .5) * 18. * u.res.y / 1080.;
    let p = (p0 + v * t * 30. + u.res * 4.) % u.res;
    let r = (3. + h1(fi + 3.) * 6.) * u.res.y / 1080.;
    let d2 = dot(px - p, px - p) / (r * r);
    if (d2 < 9.) { brilho += exp(-d2) * select(vec3f(.7, .45, 1.), vec3f(1., .85, .2), h1(fi + 5.) > .5); }
  }
  return c + brilho * .9;
}
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  var acc = vec3f(0.);
  for (var s = 0; s < 8; s++) { acc += cena(fc.xy, (u.quadro + f32(s) / 8.) / 30.); }
  return vec4f(min(acc / 8., vec3f(1.)), 1.);
}`;

async function motionGPU({quadros = 300, sinal, aoAndar, canvas}) {
  const {dev} = await dispositivo();
  try {
    const W = self.DEV_PEQUENO ? 480 : 3840, H = self.DEV_PEQUENO ? 270 : 2160;
    const alvo = dev.createTexture({size: [W, H], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC});
    const mod = dev.createShaderModule({code: MOTION});
    const pipe = dev.createRenderPipeline({layout: 'auto', vertex: {module: mod, entryPoint: 'vs'}, fragment: {module: mod, entryPoint: 'fs', targets: [{format: 'rgba8unorm'}]}});
    const uni = dev.createBuffer({size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const bg = dev.createBindGroup({layout: pipe.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: uni}}]});
    const desenhar = q => {
      dev.queue.writeBuffer(uni, 0, new Float32Array([W, H, q, 0]));
      const e = dev.createCommandEncoder();
      const p = e.beginRenderPass({colorAttachments: [{view: alvo.createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
      p.setPipeline(pipe); p.setBindGroup(0, bg); p.draw(3); p.end();
      dev.queue.submit([e.finish()]);
    };
    desenhar(0); await dev.queue.onSubmittedWorkDone();                // aquece
    const t0 = performance.now();
    for (let q = 0; q < quadros; q++) {
      ver(sinal);
      desenhar(q);
      await dev.queue.onSubmittedWorkDone();                           // um quadro de cada vez, como um render
      if (aoAndar && q % 5 === 0) aoAndar({feitos: q + 1, total: quadros});
    }
    const s = (performance.now() - t0) / 1000;
    if (canvas) {                                                        // prévia do último quadro
      try {
        const bpr = Math.ceil(W * 4 / 256) * 256, buf = dev.createBuffer({size: bpr * H, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
        const e = dev.createCommandEncoder(); e.copyTextureToBuffer({texture: alvo}, {buffer: buf, bytesPerRow: bpr}, [W, H]); dev.queue.submit([e.finish()]);
        await buf.mapAsync(GPUMapMode.READ);
        const src = new Uint8Array(buf.getMappedRange()), out = new Uint8ClampedArray(W * H * 4);
        for (let y = 0; y < H; y++) out.set(src.subarray(y * bpr, y * bpr + W * 4), y * W * 4);
        buf.unmap();
        const c = new OffscreenCanvas(W, H); c.getContext('2d').putImageData(new ImageData(out, W, H), 0, 0);
        canvas.width = 960; canvas.height = 540; canvas.getContext('2d').drawImage(c, 0, 0, 960, 540);
      } catch (e) { /* sem prévia */ }
    }
    return {quadros, segundos: s, porQuadro: s / quadros};
  } finally { dev.destroy(); }
}

export async function perfilVideo({info, aoAndar, sinal, canvas, escala = 1, exportarDireto = null}) {
  const r = {formatos: []};
  const etapa = (n, txt, extra = {}) => aoAndar && aoAndar({etapa: n, txt, ...extra});
  // 1. formatos e timeline
  etapa(1, 'Lendo os vídeos de teste');
  const clipes = {};
  for (const f of FORMATOS) clipes[f.id] = await carregarClipe(f.arq);
  for (const f of FORMATOS) {
    ver(sinal);
    etapa(1, `Testando ${f.nome}`);
    const c = clipes[f.id];
    let hw = await suporte(c, 'prefer-hardware'), fps = null, fpsSw = null;
    if (hw) { try { fps = (await decodificar(c, {segundos: 2.5 * escala, sinal}))[0]; } catch (e) { if (String(e).includes('interrompido')) throw e; hw = false; } }
    if (!hw && await suporte(c, 'prefer-software')) { try { fpsSw = (await decodificar(c, {segundos: 2.5 * escala, hw: 'prefer-software', sinal}))[0]; } catch (e) { if (String(e).includes('interrompido')) throw e; } }
    const q = quemLe(f.id, hw, info);
    const vel = fps || fpsSw;
    const status = q.ok ? (vel == null || vel >= 30 || q.previsto ? 'liso' : 'pesado') : (fpsSw && fpsSw >= 30 ? 'ok' : 'trava');
    r.formatos.push({id: f.id, nome: f.nome, origem: f.origem, hw, fps: fps && Math.round(fps), fps_sw: fpsSw && Math.round(fpsSw), quem: q.quem, previsto: !!q.previsto, status});
  }
  // HEVC 10-bit comum não abriu no Edge, mas a placa decodifica: quase sempre é a Extensão de Vídeo HEVC que falta no Windows
  r.sem_extensao_hevc = r.formatos.some(f => f.id === 'hevc10' && !f.hw && f.previsto);
  r.formatos.push({id: 'prores', nome: 'ProRes 422', origem: 'iPhone Pro, gravadores Atomos', quem: 'Processador', status: 'ok', previsto: true});
  // multicâmera: quantos vídeos 4K tocam juntos (no formato mais comum de câmera/celular que este notebook lê no hardware)
  const alvo = ['hevc10', 'h264'].find(id => r.formatos.find(x => x.id === id && x.hw));
  if (alvo) {
    const c = clipes[alvo];
    let n = Math.max(1, Math.min(8, Math.floor((r.formatos.find(x => x.id === alvo).fps || 30) / 30)));
    let melhor = 0;
    for (let tent = 0; tent < 4 && n >= 1; tent++) {
      etapa(1, `Timeline: ${n} vídeo${n > 1 ? 's' : ''} 4K ao mesmo tempo`);
      const v = await decodificar(c, {streams: n, segundos: 3 * escala, sinal});
      if (Math.min(...v) >= 29) { melhor = n; if (n >= 8) break; n++; if (tent > 0 && melhor) break; }
      else { n--; if (melhor) break; }
    }
    r.timeline = melhor; r.timeline_formato = FORMATOS.find(f => f.id === alvo).nome;
  } else r.timeline = 0;
  // 2. cor e efeitos
  etapa(2, 'Correção de cor, desfoque, nitidez e granulado em 4K');
  r.efeitos_fps = Math.round(await corEfeitos({segundos: 6 * escala, sinal, aoAndar: fps => etapa(2, 'Cor e efeitos em 4K', {valor: fps})}));
  // 3. exportar, sempre pelo codificador da placa de vídeo (como no Premiere com codificação por hardware)
  const exp = {};
  const casos = [['fhd_h264', 'avc1.640028', 1920, 1080, 'Full HD H.264'], ['uhd_h264', 'avc1.640033', 3840, 2160, '4K H.264'], ['uhd_hevc', 'hvc1.1.6.L153.B0', 3840, 2160, '4K HEVC']];
  for (const [k, codec, W, H, nome] of casos) {
    ver(sinal);
    etapa(3, `Exportando ${nome} pela placa de vídeo`);
    codificar.motivo = null;
    const fps = await codificar({codec, W, H, hw: 'prefer-hardware', segundos: 8 * escala, sinal});
    exp[k] = fps ? Math.round(18000 / fps) : null;                         // segundos para 10 min (18.000 quadros)
    if (!fps && k === 'uhd_h264') exp.motivo_web = codificar.motivo || 'sem_codificador';
  }
  r.exportar = exp;
  // Em alguns notebooks novos o motor do Edge não oferece codificador nenhum (o edge://gpu mostra "Encoding" vazio),
  // mas a placa tem: mede direto nela, pelo FFmpeg, como o Premiere e o DaVinci fazem.
  if (exp.uhd_h264 == null && exportarDireto) {
    etapa(3, 'Exportando direto pela placa de vídeo');
    try {
      const d = await exportarDireto(txt => etapa(3, txt), sinal) || {};
      exp.codificador = d.codificador || null;
      if (d.uhd_h264 || d.fhd_h264) Object.assign(exp, {fhd_h264: d.fhd_h264 ?? null, uhd_h264: d.uhd_h264 ?? null, uhd_hevc: d.uhd_hevc ?? null, via: 'direto'});
      else exp.erro_direto = d.erro || d.uhd_h264_erro || 'não funcionou';
    } catch (e) {
      if (String(e).includes('interrompido')) throw e;
      exp.erro_direto = String(e.message || e).slice(0, 200);
    }
  }
  // 4. motion graphics, pela placa
  etapa(4, 'Motion: animação com formas, textos e partículas em 4K');
  const qm = Math.max(10, Math.round(300 * Math.min(1, escala)));
  const mo = await motionGPU({quadros: qm, sinal, canvas, aoAndar: p => etapa(4, `Motion · quadro ${p.feitos} de ${p.total}`)});
  r.motion_10s = Math.round(mo.porQuadro * 300 * 10) / 10;                 // 10 s a 30 fps
  r.veredito = vereditoVideo(r, info);
  return r;
}

export function vereditoVideo(r, info) {
  const vram = (info.gpu && info.gpu.vram) || 0;
  const tl = r.timeline >= 4 ? 4 : r.timeline >= 3 ? 3 : r.timeline >= 2 ? 2 : r.timeline >= 1 ? 1 : 0;
  const cam = r.formatos.filter(f => ['h264', 'hevc10', 'hevc422'].includes(f.id));
  const fluidos = cam.filter(f => f.status === 'liso').length;
  const c422 = (r.formatos.find(f => f.id === 'hevc422') || {}).status === 'liso';
  const fx = faixa(r.efeitos_fps, [60, 40, 30, 15]);
  const ex = faixa(r.exportar.uhd_h264, [360, 600, 1200, 2400], true);
  const mo = faixa(r.motion_10s, [60, 120, 240, 480], true);
  const vr = faixa(vram, [12, 8, 6, 4]);
  const prog = [
    {nome: 'Premiere Pro', nivel: nMin(tl, ex, fluidos === 3 ? 4 : fluidos === 2 ? 2 : 1), texto: `${tl >= 2 ? 'Timeline 4K sem proxy' : tl === 1 ? 'Timeline 4K com 1 vídeo; multicâmera exige proxy' : 'Use proxy para editar em 4K'} · ${r.exportar.uhd_h264 ? 'exportação pela placa de vídeo' : 'exportação pela placa não medida'}`},
    {nome: 'DaVinci Resolve', nivel: nMin(fx, tl, vr), texto: `Cor e efeitos em 4K ${fx >= 2 ? 'em tempo real' : 'abaixo do tempo real'}${vram && vram < 12 ? ` · ${vram} GB de memória de vídeo limitam nós pesados` : ''}`},
    {nome: 'Motion graphics', nivel: mo, texto: `Animações com formas, textos e partículas em 4K${r.motion_10s != null ? ` · 10 s de animação em ${tempoTxt(r.motion_10s)}` : ''}`},
    {nome: 'CapCut', nivel: Math.min(4, minN(tl, ex) + 1), texto: 'Reels e TikTok em 4K'},
  ].map(comEstrelas);
  const base = minN(prog[0].nivel, prog[1].nivel);
  const titulo = base >= 3 && c422 ? 'Edita vídeo 4K de câmera e celular sem travamentos'
    : base >= 3 ? 'Edita vídeo 4K de celular e drone sem travamentos' : base >= 2 ? 'Edita 4K bem, com algumas limitações' : base >= 1 ? 'Edita Full HD bem; 4K exige proxy' : 'Para edição, apenas vídeos simples';
  const sobre422 = (r.formatos.find(f => f.id === 'hevc422') || {});
  const frase = [
    fluidos === 3 ? 'Decodifica no hardware todos os formatos comuns de câmera e celular' + (sobre422.previsto ? `, inclusive o 4:2:2 da Sony e da Canon (${sobre422.quem.replace(/ \(.*\)/, '')})` : '') + '.'
      : !c422 ? 'O vídeo 4:2:2 da Sony e da Canon é decodificado pelo processador, o que deixa a timeline mais pesada.' : 'Alguns formatos são decodificados pelo processador.',
    r.exportar.uhd_h264 ? 'A exportação usa o codificador da placa de vídeo.' : '',
  ].filter(Boolean).join(' ');
  const selos = [
    {txt: 'YouTube e redes', ok: base >= 1},
    {txt: '4K de câmera', ok: c422 && tl >= 1, quase: !c422},
    {txt: 'Multicâmera', ok: tl >= 3},
    {txt: 'Motion graphics', ok: mo >= 2},
  ];
  return {titulo, frase, programas: prog, selos};
}

// ================================================================== IA NO NOTEBOOK
const BANDA = /* wgsl */`
@group(0) @binding(0) var<storage, read> a: array<vec4f>;
@group(0) @binding(1) var<storage, read_write> b: array<vec4f>;
@compute @workgroup_size(256) fn main(@builtin(global_invocation_id) id: vec3u, @builtin(num_workgroups) nw: vec3u) {
  let n = arrayLength(&a); let passo = nw.x * 256u;
  var i = id.x;
  loop {
    if (i + 3u * passo >= n) { break; }
    let x0 = a[i]; let x1 = a[i + passo]; let x2 = a[i + 2u * passo]; let x3 = a[i + 3u * passo];
    b[i] = x0; b[i + passo] = x1; b[i + 2u * passo] = x2; b[i + 3u * passo] = x3;
    i += 4u * passo;
  }
}`;

const MATMUL = (f16, T, N) => {
  // cada linha de execução calcula um bloco 4x4 com vetores (rápido em qualquer placa); T = 64
  const E = f16 ? 'f16' : 'f32';
  return /* wgsl */`
${f16 ? 'enable f16;' : ''}
@group(0) @binding(0) var<storage, read> A: array<${E}>;
@group(0) @binding(1) var<storage, read> B: array<${E}>;
@group(0) @binding(2) var<storage, read_write> C: array<${E}>;
const N = ${N}u;
var<workgroup> ta: array<array<vec4<${E}>, 16>, 64>;   // ta[k][linha/4] = 4 linhas de A na coluna k
var<workgroup> tb: array<array<vec4<${E}>, 16>, 64>;   // tb[k][col/4]   = 4 colunas de B na linha k
@compute @workgroup_size(16, 16) fn main(@builtin(local_invocation_id) l: vec3u, @builtin(workgroup_id) g: vec3u) {
  var c0 = vec4<${E}>(0.); var c1 = vec4<${E}>(0.); var c2 = vec4<${E}>(0.); var c3 = vec4<${E}>(0.);
  let lin0 = g.y * 64u; let col0 = g.x * 64u;
  let r = lin0 + l.y * 4u; let c = col0 + l.x * 4u;
  for (var k0 = 0u; k0 < N; k0 += 64u) {
    let ka = k0 + l.x * 4u;
    ta[l.x * 4u + 0u][l.y] = vec4<${E}>(A[r * N + ka], A[(r + 1u) * N + ka], A[(r + 2u) * N + ka], A[(r + 3u) * N + ka]);
    ta[l.x * 4u + 1u][l.y] = vec4<${E}>(A[r * N + ka + 1u], A[(r + 1u) * N + ka + 1u], A[(r + 2u) * N + ka + 1u], A[(r + 3u) * N + ka + 1u]);
    ta[l.x * 4u + 2u][l.y] = vec4<${E}>(A[r * N + ka + 2u], A[(r + 1u) * N + ka + 2u], A[(r + 2u) * N + ka + 2u], A[(r + 3u) * N + ka + 2u]);
    ta[l.x * 4u + 3u][l.y] = vec4<${E}>(A[r * N + ka + 3u], A[(r + 1u) * N + ka + 3u], A[(r + 2u) * N + ka + 3u], A[(r + 3u) * N + ka + 3u]);
    let kb = k0 + l.y * 4u;
    tb[l.y * 4u + 0u][l.x] = vec4<${E}>(B[kb * N + c], B[kb * N + c + 1u], B[kb * N + c + 2u], B[kb * N + c + 3u]);
    tb[l.y * 4u + 1u][l.x] = vec4<${E}>(B[(kb + 1u) * N + c], B[(kb + 1u) * N + c + 1u], B[(kb + 1u) * N + c + 2u], B[(kb + 1u) * N + c + 3u]);
    tb[l.y * 4u + 2u][l.x] = vec4<${E}>(B[(kb + 2u) * N + c], B[(kb + 2u) * N + c + 1u], B[(kb + 2u) * N + c + 2u], B[(kb + 2u) * N + c + 3u]);
    tb[l.y * 4u + 3u][l.x] = vec4<${E}>(B[(kb + 3u) * N + c], B[(kb + 3u) * N + c + 1u], B[(kb + 3u) * N + c + 2u], B[(kb + 3u) * N + c + 3u]);
    workgroupBarrier();
    for (var k = 0u; k < 64u; k++) {
      let a = ta[k][l.y]; let b = tb[k][l.x];
      c0 = fma(vec4<${E}>(a.x), b, c0); c1 = fma(vec4<${E}>(a.y), b, c1);
      c2 = fma(vec4<${E}>(a.z), b, c2); c3 = fma(vec4<${E}>(a.w), b, c3);
    }
    workgroupBarrier();
  }
  C[r * N + c] = c0.x; C[r * N + c + 1u] = c0.y; C[r * N + c + 2u] = c0.z; C[r * N + c + 3u] = c0.w;
  C[(r + 1u) * N + c] = c1.x; C[(r + 1u) * N + c + 1u] = c1.y; C[(r + 1u) * N + c + 2u] = c1.z; C[(r + 1u) * N + c + 3u] = c1.w;
  C[(r + 2u) * N + c] = c2.x; C[(r + 2u) * N + c + 1u] = c2.y; C[(r + 2u) * N + c + 2u] = c2.z; C[(r + 2u) * N + c + 3u] = c2.w;
  C[(r + 3u) * N + c] = c3.x; C[(r + 3u) * N + c + 1u] = c3.y; C[(r + 3u) * N + c + 2u] = c3.z; C[(r + 3u) * N + c + 3u] = c3.w;
}`;
};

export async function bandaVideo({sinal, segundos = 3}) {
  const {dev, ts} = await dispositivo({tempo: true});
  try {
    const bytes = 128 * 1024 * 1024;
    const a = dev.createBuffer({size: bytes, usage: GPUBufferUsage.STORAGE}), b = dev.createBuffer({size: bytes, usage: GPUBufferUsage.STORAGE});
    const pipe = dev.createComputePipeline({layout: 'auto', compute: {module: dev.createShaderModule({code: BANDA}), entryPoint: 'main'}});
    const bg = dev.createBindGroup({layout: pipe.getBindGroupLayout(0), entries: [{binding: 0, resource: {buffer: a}}, {binding: 1, resource: {buffer: b}}]});
    const grupos = Math.min(65535, bytes / 16 / 256 / 4);                             // cada linha de execução copia 4 blocos
    const porSeg = await medirGPU(dev, p => { p.setPipeline(pipe); p.setBindGroup(0, bg); p.dispatchWorkgroups(grupos); }, {segundos, sinal, ts, rep: 8});
    return porSeg * bytes * 2 / 1e9;                                                 // lê + grava
  } finally { dev.destroy(); }
}

export async function calculoIA({sinal, segundos = 3}) {
  const {dev, f16, ts} = await dispositivo({f16: true, tempo: true});
  try {
    const N = self.DEV_PEQUENO ? 256 : 2048, bytes = N * N * (f16 ? 2 : 4);
    const T = 64;
    if (dev.limits.maxComputeWorkgroupStorageSize < 2 * 64 * 64 * (f16 ? 2 : 4)) throw new Error('A placa não tem memória compartilhada suficiente para o teste de IA.');
    const bufs = [0, 1, 2].map(() => dev.createBuffer({size: bytes, usage: GPUBufferUsage.STORAGE}));
    const pipe = dev.createComputePipeline({layout: 'auto', compute: {module: dev.createShaderModule({code: MATMUL(f16, T, N)}), entryPoint: 'main'}});
    const bg = dev.createBindGroup({layout: pipe.getBindGroupLayout(0), entries: bufs.map((b, i) => ({binding: i, resource: {buffer: b}}))});
    const porSeg = await medirGPU(dev, p => { p.setPipeline(pipe); p.setBindGroup(0, bg); p.dispatchWorkgroups(N / T, N / T); }, {segundos, sinal, ts, rep: self.DEV_PEQUENO ? 1 : 4});
    return {tflops: porSeg * 2 * N ** 3 / 1e12, f16};
  } finally { dev.destroy(); }
}

// banda teórica da memória de vídeo (GB/s) das placas mais comuns; "L" = versão de notebook
const BANDA_TEORICA = [
  // NVIDIA de notebook
  [/5090 Laptop/, 896], [/5080 Laptop/, 896], [/5070 Ti Laptop/, 448], [/50[5-7]0 Laptop/, 384],
  [/4090 Laptop/, 576], [/4080 Laptop/, 432], [/40[67]0 Laptop/, 256], [/4050 Laptop/, 192],
  [/3080 Ti Laptop/, 512], [/30[78]0 Laptop/, 448], [/3060 Laptop/, 336], [/3050 Ti Laptop|3050 \d?GB Laptop|3050 Laptop/, 192],
  [/2080.*(Laptop|Max-Q)/, 448], [/2070.*(Laptop|Max-Q)/, 448], [/2060.*(Laptop|Max-Q)/, 336], [/RTX 2050/, 112],
  [/1660 Ti/, 288], [/1650 Ti/, 192], [/GTX 1650/, 192],
  // AMD e Intel de notebook
  [/RX 7900M/, 576], [/RX 7800M/, 432], [/RX 7700S/, 288], [/RX 7600M XT/, 288], [/RX 7600[MS]/, 256],
  [/RX 6850M XT/, 432], [/RX 6800M/, 384], [/RX 6700M/, 320], [/RX 6650M XT/, 288], [/RX 6650M/, 256], [/RX 6600M/, 224], [/RX 65[05]0M/, 144],
  [/A770M/, 512], [/A730M/, 336], [/A5[57]0M/, 224], [/A3[57]0M/, 112],
  // de mesa
  [/RTX 5090/, 1792], [/RTX 5080/, 960], [/RTX 5070 Ti/, 896], [/RTX 5070/, 672], [/RTX 5060 Ti/, 448], [/RTX 5060/, 448],
  [/RTX 4090/, 1008], [/RTX 4080/, 717], [/RTX 4070 Ti/, 504], [/RTX 4070/, 504], [/RTX 4060 Ti/, 288], [/RTX 4060/, 272],
  [/RTX 3090/, 936], [/RTX 3080/, 760], [/RTX 3070/, 448], [/RTX 3060 Ti/, 448], [/RTX 3060/, 360],
  [/RX 9070/, 640], [/RX 7900 XTX/, 960], [/RX 7900 XT/, 800], [/RX 7800 XT/, 624], [/RX 7700 XT/, 432], [/RX 7600( XT)?(?![MS])/, 288],
  [/B580/, 456], [/B570/, 380], [/A770(?!M)/, 560], [/A750(?!M)/, 512],
];
/** Placas com meia precisão (FP16) rápida: RTX, GTX 16, Radeon RX 5000 em diante e as Radeon integradas atuais, Intel Xe e Arc. */
export function meiaPrecisao(info) {
  const n = ((info.gpu && info.gpu.nome) || '') + ' ' + (info.placas || []).map(p => p.nome || '').join(' ');
  return /RTX|GTX 16|RX\s*[5-9]\d{3}|Radeon\s*(\(TM\)\s*)?\d{3}M|Radeon\s*8\d{3}S|Arc|Iris\(R\) Xe|Iris Xe|Intel\(R\) Graphics/i.test(n);
}
export function bandaTeorica(nome) {
  const x = BANDA_TEORICA.find(([re]) => re.test(nome || ''));
  return x ? x[1] : null;
}

export const MODELOS = [
  {tam: '3B', gb: 2.0, ex: 'Llama 3.2 3B, Phi-3.5', precisa: '2,5 GB'},
  {tam: '8B', gb: 4.9, ex: 'Llama 3.1 8B, Qwen 7B, Gemma 9B', precisa: '~5,5 GB'},
  {tam: '14B', gb: 8.9, ex: 'Qwen 14B, Phi-4', precisa: '~9,5 GB'},
  {tam: '32B', gb: 19, ex: 'Qwen 32B, DeepSeek-R1 32B', precisa: '~20 GB'},
];

export async function perfilIA({info, aoAndar, sinal, escala = 1}) {
  const r = {};
  aoAndar && aoAndar({etapa: 1, txt: 'Velocidade da memória de vídeo'});
  r.banda_gbs = Math.round(await bandaVideo({sinal, segundos: Math.max(1.5, 3 * escala)}));
  aoAndar && aoAndar({etapa: 2, txt: 'Força de cálculo para IA (matrizes)'});
  const c = await calculoIA({sinal, segundos: Math.max(1.5, 3 * escala)});
  r.tflops = c.tflops >= .05 ? Math.round(c.tflops * 10) / 10 : null; r.f16 = c.f16;
  // Sem meia precisão (FP16) no WebGPU deste driver, a conta sai em FP32, com metade da velocidade. Os programas de IA
  // usam FP16 nas placas atuais, então a estimativa considera o dobro.
  r.tflops_ia = r.tflops && !c.f16 && meiaPrecisao(info) ? Math.round(r.tflops * 20) / 10 : r.tflops;
  // O WebGPU às vezes mede bem menos do que a placa entrega (RTX 50 de notebook: ~1/3). Se a medida ficou abaixo
  // de 60% da banda teórica conhecida, usa 75% da teórica, que é o que programas de IA costumam aproveitar.
  r.banda_teorica = bandaTeorica(info.gpu && info.gpu.nome);
  r.banda_ia = r.banda_teorica && r.banda_gbs < r.banda_teorica * .6 ? Math.round(r.banda_teorica * .75) : r.banda_gbs;
  r.vram_total = info.gpu.vram || null;
  r.vram_livre = info.gpu.vram_livre ?? null;
  // o que cabe é decidido pela memória total (menos ~0,8 GB do Windows); a livre na hora varia com o que estiver aberto
  const vram = r.vram_total ? Math.max(r.vram_total - .8, r.vram_livre ?? 0) : (r.vram_livre ?? 2);
  const ramBw = (info.ram && /DDR5/.test(info.ram.tipo || '') ? 60 : 38);
  // geração de texto: limitada pela memória (cada palavra lê o modelo inteiro); se não cabe, o resto vem da RAM
  r.modelos = MODELOS.map(m => {
    const cabe = m.gb + .6 <= vram;
    const naPlaca = cabe ? m.gb : Math.max(0, vram - .6), fora = m.gb - naPlaca;
    const tps = 1 / (naPlaca / r.banda_ia + fora / (ramBw * .6));
    return {...m, cabe, quase: !cabe && m.gb <= vram * 1.25, tokens_s: Math.round(tps * 10) / 10, palavras_s: Math.round(tps * .7)};
  });
  // imagens (SDXL 1024x1024, 25 passos) e legendas: proporcionais à força de cálculo medida
  r.imagem_s = r.tflops_ia ? Math.round(45 / r.tflops_ia * 10) / 10 : null;
  if ((r.vram_total || vram) < 7) r.imagem_s = r.imagem_s ? Math.round(r.imagem_s * 2.5 * 10) / 10 : null;      // SDXL não cabe inteiro: fica bem mais lento
  r.whisper_min_por_hora = r.tflops_ia ? Math.max(.5, Math.round(24 / r.tflops_ia * 10) / 10) : null;
  r.veredito = vereditoIA(r, info);
  aoAndar && aoAndar({etapa: 4, txt: 'Pronto'});
  return r;
}

export function vereditoIA(r, info) {
  const vram = r.vram_total || 0, m8 = r.modelos.find(m => m.tam === '8B'), m14 = r.modelos.find(m => m.tam === '14B');
  // velocidade com o modelo 8B e o maior modelo que cabe na memória de vídeo (8B: Muito bom; 14B: quase Ótimo; 32B: Ótimo)
  const maiorCabe = [...r.modelos].reverse().find(m => m.cabe);
  const capac = !maiorCabe ? 0 : {'3B': 1, '8B': 3, '14B': 3.5, '32B': 4}[maiorCabe.tam] ?? 1;
  const llm = nMin(faixa(m8.palavras_s, [30, 18, 9, 4]), capac);
  // 6 GB rodam o SDXL com o modo de pouca memória (o tempo medido já mostra isso): até "Bom", não mais "Regular" fixo
  const img = Math.min(faixa(r.imagem_s, [3, 6, 15, 30], true) ?? 1, vram >= 8 ? 4 : vram >= 6 ? 2 : 0);
  const flux = Math.min(faixa(r.imagem_s ? r.imagem_s * 4 : null, [20, 36, 60, 120], true) ?? 1, vram >= 16 ? 4 : vram >= 12 ? 3 : vram >= 8 ? 1 : 0);
  const wh = faixa(r.whisper_min_por_hora, [3, 6, 12, 25], true);
  const maior = [...r.modelos].reverse().find(m => m.cabe);
  const prog = [
    {nome: 'LM Studio · Ollama', nivel: llm, texto: maior ? `Cabem modelos de até ${maior.tam}${m14.cabe ? '' : '; o 14B fica mais lento'}` : 'Apenas modelos pequenos, com lentidão'},
    {nome: 'Stable Diffusion · ComfyUI', nivel: img, texto: r.imagem_s ? `SDXL a cada ~${String(r.imagem_s).replace('.', ',')} s em 1024×1024` : '—'},
    {nome: 'Flux', nivel: flux, texto: !r.imagem_s ? '—' : vram >= 12 ? `~${Math.round(r.imagem_s * 4)} s por imagem` : vram >= 8 ? `Cabe apenas na versão reduzida, ~${Math.round(r.imagem_s * 4)} s por imagem` : 'Não cabe na memória de vídeo'},
    {nome: 'Whisper (legendas)', nivel: wh, texto: r.whisper_min_por_hora ? `Transcreve 1 h de áudio em ~${String(r.whisper_min_por_hora).replace('.', ',')} min` : '—'},
  ].map(comEstrelas);
  const titulo = llm >= 3 && img >= 3 ? 'Executa modelos de IA de bom porte no próprio notebook' : llm >= 2 ? 'Executa IA no notebook com modelos menores' : 'IA no notebook apenas com modelos pequenos';
  const frase = `Conversa com modelos de até ${maior ? maior.tam.replace('B', ' bilhões') : 'poucos bilhões'} de parâmetros${m8.palavras_s >= 5 ? ' mais rápido do que se consegue ler' : ''}${r.imagem_s ? ` e gera uma imagem em ~${Math.round(r.imagem_s)} segundos` : ''}. O limite ${vram < 16 ? `são os ${vram} GB de memória de vídeo: modelos maiores ficam lentos` : 'é a velocidade da placa'}.`;
  const selos = [
    {txt: 'Assistente de IA local', ok: llm >= 2},
    {txt: 'Gerar imagens', ok: img >= 2},
    {txt: vram >= 16 ? 'Modelos grandes' : 'Modelos grandes · com mais memória de vídeo', ok: vram >= 16, quase: vram < 16},
  ];
  return {titulo, frase, programas: prog, selos};
}

// ================================================================== 3D E ANIMAÇÃO
/** Path tracing da sala no processador: mede amostras por segundo em todos os núcleos. */
async function salaCPU({segundos = 12, sinal, aoAndar}) {
  const ws = Array.from({length: THREADS}, novoWorker);
  let amostras = 0, k = 0;
  const t0 = performance.now();
  try {
    await new Promise((ok, falha) => {
      // pedaços que levam 30-60 ms e 2 na fila por núcleo: o núcleo principal não vira gargalo nem com 192 threads
      let emVoo = 0, fim = false;
      const pedir = w => {
        if (performance.now() - t0 > segundos * 1000 || (sinal && sinal.aborted)) fim = true;
        if (fim) { if (emVoo === 0) ok(); return; }
        const i = k++; emVoo++;
        w.postMessage({tipo: 'sala', id: i, W: 1920, H: 1080, x0: (i * 64 * 7) % 1856, y0: (i * 64 * 3) % 1016, w: 64, h: 64, spp: w._spp, passo: i});
      };
      ws.forEach(w => {
        w._spp = 1;
        w.onmessage = e => {
          const m = e.data;
          if (m.tipo === 'erro') return falha(new Error(m.erro));
          emVoo--; amostras += m.amostras;
          if (m.ms != null) { if (m.ms < 30 && w._spp < 256) w._spp *= 2; else if (m.ms > 120 && w._spp > 1) w._spp /= 2; }
          aoAndar && aoAndar((performance.now() - t0) / 1000); pedir(w);
        };
        pedir(w); pedir(w);
      });
    });
  } finally { ws.forEach(w => w.terminate()); }
  ver(sinal);
  return amostras / ((performance.now() - t0) / 1000);
}

function simulacaoCPU({sinal, aoAndar, quadros = 250}) {
  const w = novoWorker();
  const parar = () => w.postMessage({tipo: 'parar'});
  sinal && sinal.addEventListener('abort', parar);
  return new Promise((ok, falha) => {
    w.onmessage = e => {
      const m = e.data;
      if (m.tipo === 'erro') falha(new Error(m.erro));
      if (m.tipo === 'andamento') aoAndar && aoAndar(m);
      if (m.tipo === 'fim') ok(m);
    };
    w.postMessage({tipo: 'simulacao', quadros});
  }).finally(() => { w.terminate(); sinal && sinal.removeEventListener('abort', parar); ver(sinal); });
}

export async function perfil3D({info, aoAndar, sinal, canvas, escala = 1, Navegacao, Render, CV = c => c}) {
  const r = {};
  // 1. viewport
  const nav = new Navegacao();
  await nav.iniciar(CV(canvas), {largura: 1920 * (escala < .1 ? .25 : 1), altura: 1080 * (escala < .1 ? .25 : 1)});
  r.poligonos = nav.modelo.triangulos;
  try {
    for (const [e, k, nome] of [['sombreado', 'viewport_solido', 'Sólido'], ['realista', 'viewport_material', 'Material']]) {
      aoAndar && aoAndar({etapa: 1, txt: `Viewport · ${nome}`, visual: 'gpu'});
      const x = await nav.rodar(e, 10 * escala, p => aoAndar && aoAndar({etapa: 1, txt: `Viewport · ${nome}`, valor: p.fpsAgora, unidade: 'fps', visual: 'gpu'}), sinal);
      r[k] = Math.round(x.fps);
    }
  } finally { nav.destruir(); }
  // 2. render na placa (sala, Full HD, 256 amostras)
  const ren = new Render();
  const W = escala < .1 ? 480 : 1920, H = escala < .1 ? 270 : 1080, AM = Math.max(4, Math.round(256 * Math.min(1, escala)));
  let mini = null;
  try {
    await ren.iniciar(CV(canvas), {largura: W, altura: H});
    aoAndar && aoAndar({etapa: 2, txt: 'Render na placa · sala de estar · Full HD', visual: 'gpu'});
    const x = await ren.rodar(AM, q => aoAndar && aoAndar({etapa: 2, txt: `Render na placa · ${q.feitas} de ${q.amostras} amostras`, valor: Math.round(100 * q.feitas / q.amostras), unidade: '%', visual: 'gpu'}), sinal);
    r.render_placa_s = Math.round(x.segundos * (1920 * 1080 * 256) / (W * H * AM) * 10) / 10;
    try { const img = await ren.capturar(800); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').putImageData(img, 0, 0); mini = c.toDataURL('image/jpeg', .82); } catch (e) { /**/ }
  } finally { ren.destroy ? ren.destroy() : ren.destruir(); }
  // 3. render no processador (mesma cena, mesmo método)
  aoAndar && aoAndar({etapa: 3, txt: 'Simulação de tecido e partículas', visual: 'texto'});
  const sim = await simulacaoCPU({sinal, quadros: Math.max(10, Math.round(250 * Math.min(1, escala * 4))), aoAndar: m => aoAndar && aoAndar({etapa: 3, txt: `Simulação · ${m.feitos} de ${m.total} quadros`, visual: 'texto'})});
  r.simulacao_s = Math.round(sim.segundos * 250 / sim.quadros);
  r.animacao_placa_s = Math.round(r.render_placa_s * 240);
  r.vram_gb = info.gpu.vram || null;
  r.miniatura = mini;
  r.veredito = veredito3D(r, info);
  return r;
}

export function veredito3D(r, info) {
  const vram = (info.gpu && info.gpu.vram) || 0;
  const vs = faixa(r.viewport_solido, [90, 50, 30, 15]), vm = faixa(r.viewport_material, [60, 35, 20, 10]);
  const rp = faixa(r.render_placa_s, [6, 12, 25, 50], true), vr = faixa(vram, [16, 12, 8, 6]);
  const vezes = null;   // comparação com o processador fica fora até calibrar com o Blender de verdade
  const prog = [
    {nome: 'Blender · Cycles', nivel: nMin(rp, Math.max(vr ?? 0, 2)), texto: `Render pela placa (OptiX) · ${tempoTxt(r.render_placa_s)} por quadro em Full HD`},
    {nome: 'Blender · Eevee', nivel: nMin(vm, vs), texto: vm >= 3 ? 'Tempo real fluido no viewport' : vm >= 2 ? 'Tempo real bom em cenas médias' : 'O viewport fica pesado em cenas grandes'},
    {nome: 'Cinema 4D · Redshift', nivel: nMin(rp, vr), texto: `Render na placa${vram && vram < 12 ? ` · cenas pesadas limitadas por ${vram} GB` : ''}`},
    {nome: 'Unreal Engine 5', nivel: nMin(vm, vr), texto: vm >= 2 && vram >= 8 ? 'Lumen e Nanite funcionam bem em cenas médias' : 'Cenas leves; o Lumen fica pesado'},
  ].map(comEstrelas);
  const base = minN(prog[0].nivel, prog[1].nivel);
  const titulo = base >= 3 ? 'Render rápido na placa e viewport fluido' : base >= 2 ? 'Bom para 3D, com cenas médias' : 'Para 3D, apenas cenas leves';
  const frase = `${vezes && vezes > 1 ? `A placa renderiza a mesma cena ~${vezes}× mais rápido que o processador. ` : ''}${vram >= 12 ? 'Cenas pesadas cabem na memória de vídeo.' : `Cenas médias cabem nos ${vram} GB de memória de vídeo; cenas com muita textura e simulação exigem 12 GB ou mais.`}`;
  const selos = [
    {txt: 'Modelagem', ok: vs >= 2}, {txt: 'Render de produto e personagem', ok: rp >= 2}, {txt: 'Animação curta', ok: rp >= 3},
    {txt: vram >= 16 ? 'Cenas gigantes' : 'Cenas gigantes · com mais memória de vídeo', ok: vram >= 16, quase: vram < 16},
  ];
  return {titulo, frase, programas: prog, selos, vezes};
}
