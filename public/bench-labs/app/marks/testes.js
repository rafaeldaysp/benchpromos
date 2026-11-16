/* Bench Marks · como cada teste roda (sem tela). A interface chama estas funções e mostra o andamento.
 *
 * Todas recebem {aoAndar, sinal} — aoAndar(info) para atualizar a tela e sinal (AbortSignal) para cancelar.
 */

const URL_WORKER = new URL('./cpu_worker.js', import.meta.url);
const novoWorker = () => new Worker(URL_WORKER, {type: 'module'});
export const THREADS = Math.max(1, navigator.hardwareConcurrency || 4);
const espera = ms => new Promise(r => setTimeout(r, ms));
const interrompido = () => new Error('interrompido');

// ================================================================== CPU · render (multi e single)
const IMG_W = 960, IMG_H = 540, TILE = 48, CICLO = 12;
// Cada núcleo recebe pedaços que levam ~30-60 ms (a quantidade de amostras por pixel se ajusta à velocidade do
// núcleo) e sempre tem o próximo na fila. Assim o núcleo principal atende poucas mensagens por segundo mesmo com
// 96 núcleos / 192 threads (Threadripper), em vez de virar gargalo como acontecia com pedaços fixos e pequenos.
const SPP_INI = 4, SPP_MAX = 256, MS_MIN = 30, MS_MAX = 60, FILA = 2;

/**
 * Renderiza a cena por `segundos` com `threads` linhas de execução.
 * Cada pedaço da imagem é refeito a cada CICLO passadas com os mesmos números: a "assinatura" tem que
 * bater com a da primeira vez. Se não bater, o processador errou uma conta (instabilidade).
 */
export async function cpuRender({segundos, threads = THREADS, canvas, aoAndar, sinal, verificar = false, pararSe}) {
  const ws = Array.from({length: threads}, novoWorker);
  const soma = new Float32Array(IMG_W * IMG_H * 3), cont = new Float32Array(IMG_W * IMG_H);
  const tiles = [];
  for (let y = 0; y < IMG_H; y += TILE) for (let x = 0; x < IMG_W; x += TILE) tiles.push({x0: x, y0: y, w: Math.min(TILE, IMG_W - x), h: Math.min(TILE, IMG_H - y)});
  // ordem embaralhada (fixa), para a imagem aparecer espalhada
  for (let i = tiles.length - 1; i > 0; i--) { const j = (i * 7919) % (i + 1); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
  const ctx = canvas ? canvas.getContext('2d') : null, img = ctx ? ctx.createImageData(IMG_W, IMG_H) : null;
  if (canvas) { canvas.width = IMG_W; canvas.height = IMG_H; }
  const assin = new Map();
  let proximo = 0, amostras = 0, erros = 0, ultimoDesenho = 0, ultimoAviso = 0;
  const porSegundo = []; let amSeg = 0, tSeg = performance.now();
  const t0 = performance.now();
  let fim = false, emVoo = 0;
  const desenhar = () => {
    if (!ctx) return;
    const d = img.data;
    for (let i = 0, n = IMG_W * IMG_H; i < n; i++) {
      const c = cont[i] || 1, k = i * 3;
      for (let j = 0; j < 3; j++) { let v = soma[k + j] / c * 1.15; v = v / (1 + v); d[i * 4 + j] = 255 * Math.pow(v, 1 / 2.2) * 1.08; }
      d[i * 4 + 3] = cont[i] ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);
  };
  await new Promise((resolver, rejeitar) => {
    const despachar = w => {
      if (fim) return;
      const k = proximo++, t = tiles[k % tiles.length], passo = Math.floor(k / tiles.length) % CICLO;
      w.postMessage({tipo: 'render', id: k, W: IMG_W, H: IMG_H, ...t, spp: w._spp, passo}); emVoo++;
    };
    ws.forEach(w => { w._spp = SPP_INI; });
    ws.forEach(w => {
      w.onmessage = e => {
        const m = e.data;
        if (m.tipo === 'erro') { fim = true; rejeitar(new Error(m.erro)); return; }
        emVoo--;
        if (m.ms < MS_MIN && w._spp < SPP_MAX) w._spp *= 2;               // pedaço rápido demais: mais trabalho no próximo
        else if (m.ms > MS_MAX * 2 && w._spp > 1) w._spp /= 2;
        const passoAbs = Math.floor(m.id / tiles.length), chave = (m.id % tiles.length) + ':' + (passoAbs % CICLO) + ':' + m.spp;
        if (verificar) {
          if (!assin.has(chave)) assin.set(chave, m.assinatura);
          else if (assin.get(chave) !== m.assinatura) erros++;
        }
        if (passoAbs < CICLO) {                                       // depois de CICLO passadas a imagem já está pronta
          const rgb = m.rgb;
          for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
            const p = (m.y0 + j) * IMG_W + m.x0 + i, s = (j * m.w + i) * 3;
            soma[p * 3] += rgb[s]; soma[p * 3 + 1] += rgb[s + 1]; soma[p * 3 + 2] += rgb[s + 2]; cont[p] += m.spp;
          }
        }
        amostras += m.amostras; amSeg += m.amostras;
        const agora = performance.now();
        if (agora - tSeg >= 1000) { porSegundo.push(amSeg * 1000 / (agora - tSeg)); amSeg = 0; tSeg = agora; }
        if (agora - ultimoDesenho > 500) { ultimoDesenho = agora; desenhar(); }
        if (aoAndar && agora - ultimoAviso > 250) {
          ultimoAviso = agora;
          aoAndar({segundos: (agora - t0) / 1000, pontos: pontosCPU(amostras / ((agora - t0) / 1000)), pontosAgora: pontosCPU(porSegundo.at(-1) || 0), erros});
        }
        const acabou = (agora - t0) / 1000 >= segundos || (sinal && sinal.aborted) || (pararSe && pararSe({erros}));
        if (acabou) fim = true;
        if (fim) { if (emVoo === 0) resolver(); }
        else despachar(w);
      };
      for (let f = 0; f < FILA; f++) despachar(w);
    });
  }).finally(() => ws.forEach(w => w.terminate()));
  desenhar();
  if (sinal && sinal.aborted) throw interrompido();
  const s = (performance.now() - t0) / 1000;
  return {pontos: pontosCPU(amostras / s), amostrasSeg: Math.round(amostras / s), segundos: s, erros, conferidos: assin.size,
          porSegundo: porSegundo.map(pontosCPU)};
}
const pontosCPU = amostrasSeg => Math.round(amostrasSeg / 1000);

// ================================================================== CPU para jogos
export async function jogos({segundos = 60, canvas, aoAndar, sinal}) {
  const w = novoWorker();
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (canvas) { canvas.width = 1200; canvas.height = 700; }
  const ajudantes = Math.max(1, Math.min(15, THREADS - 1));
  const parar = () => w.postMessage({tipo: 'parar'});
  sinal && sinal.addEventListener('abort', parar);
  try {
    return await new Promise((ok, falha) => {
      w.onmessage = e => {
        const m = e.data;
        if (m.tipo === 'erro') return falha(new Error(m.erro));
        if (m.tipo === 'andamento') {
          if (ctx) {
            ctx.fillStyle = '#120B1C'; ctx.fillRect(0, 0, 1200, 700);
            ctx.strokeStyle = 'rgba(255,255,255,.04)';
            for (let x = 0; x < 1200; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 700); ctx.stroke(); }
            for (let y = 0; y < 700; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
            const a = m.amostra;
            for (let k = 0; k < a.length; k += 3) { ctx.fillStyle = a[k + 2] ? '#B57CFF' : '#FFE500'; ctx.fillRect(a[k] - 1.5, a[k + 1] - 1.5, 3, 3); }
          }
          aoAndar && aoAndar({segundos: m.segundos, sps: m.sps, spsAgora: m.spsAgora});
        }
        if (m.tipo === 'fim') ok(m);
      };
      w.postMessage({tipo: 'jogo', segundos, ajudantes});
    });
  } finally {
    w.terminate(); sinal && sinal.removeEventListener('abort', parar);
    if (sinal && sinal.aborted) throw interrompido();
  }
}

// ================================================================== memória
function rodarWorker(msg) {
  const w = novoWorker();
  return new Promise((ok, falha) => {
    w.onmessage = e => { w.terminate(); e.data.tipo === 'erro' ? falha(new Error(e.data.erro)) : ok(e.data); };
    w.postMessage(msg);
  });
}

export async function memoria({aoAndar, sinal}) {
  const n = Math.max(1, Math.min(THREADS, 8)), res = {};
  const etapas = [['ler', 'leitura', 'Lendo'], ['gravar', 'gravacao', 'Gravando'], ['copiar', 'copia', 'Copiando']];
  for (let i = 0; i < etapas.length; i++) {
    const [modo, chave, nome] = etapas[i];
    if (sinal && sinal.aborted) throw interrompido();
    aoAndar && aoAndar({etapa: `${nome} na memória (${n} núcleos)`, pct: i * 25, parcial: res});
    const r = await Promise.all(Array.from({length: n}, () => rodarWorker({tipo: 'banda', modo, segundos: 4, mb: 64})));
    res[chave] = Math.round(r.reduce((s, x) => s + x.gbs, 0) * 10) / 10;
  }
  if (sinal && sinal.aborted) throw interrompido();
  aoAndar && aoAndar({etapa: 'Medindo o tempo de acesso (latência)', pct: 75, parcial: res});
  const l = await rodarWorker({tipo: 'latencia', mb: 256, segundos: 3});
  res.latencia = Math.round(l.ns * 10) / 10;
  aoAndar && aoAndar({etapa: 'Pronto', pct: 100, parcial: res});
  return res;
}

// ================================================================== Arquitetura · modelagem BIM e pranchas
export async function modelagem({aoAndar, sinal, alteracoes = 30}) {
  const w = novoWorker();
  const parar = () => w.postMessage({tipo: 'parar'});
  sinal && sinal.addEventListener('abort', parar);
  try {
    const r = await new Promise((ok, falha) => {
      w.onmessage = e => {
        const m = e.data;
        if (m.tipo === 'erro') return falha(new Error(m.erro));
        if (m.tipo === 'andamento') aoAndar && aoAndar({feitas: m.feitas, total: alteracoes, ultimo: m.ultimo});
        if (m.tipo === 'fim') ok(m);
      };
      w.postMessage({tipo: 'bim', alteracoes});
    });
    if (sinal && sinal.aborted) throw interrompido();
    const ord = [...r.tempos].sort((a, b) => a - b);
    return {bim_s: Math.round(ord[Math.floor(ord.length / 2)] * 1000) / 1000, ...r};
  } finally { w.terminate(); sinal && sinal.removeEventListener('abort', parar); }
}

export async function pranchas({aoAndar, sinal, total = 40}) {
  const n = Math.max(1, Math.min(THREADS, 8)), ws = Array.from({length: n}, novoWorker);
  let feitas = 0;
  const t0 = performance.now();
  try {
    await Promise.all(ws.map((w, k) => new Promise((ok, falha) => {
      const numeros = []; for (let i = k; i < total; i += n) numeros.push(i);
      const parar = () => w.postMessage({tipo: 'parar'});
      sinal && sinal.addEventListener('abort', parar);
      w.onmessage = e => {
        const m = e.data;
        if (m.tipo === 'erro') return falha(new Error(m.erro));
        if (m.tipo === 'andamento') { feitas++; aoAndar && aoAndar({feitas, total}); }
        if (m.tipo === 'fim') ok(m);
      };
      w.postMessage({tipo: 'pranchas', numeros});
    })));
  } finally { ws.forEach(w => w.terminate()); }
  if (sinal && sinal.aborted) throw interrompido();
  return {pranchas_s: Math.round((performance.now() - t0) / 100) / 10, pranchas: total, nucleos: n};
}

// ================================================================== veredito do perfil Arquitetura
// Régua revisada em 28/10/2026 com o Acer Nitro V15 (Ryzen 7 7735HS, 16 GB) e o Legion 7 (Ultra 9 275HX, 32 GB):
// a faixa da modelagem estava larga no topo (os dois empatavam em 5 estrelas) e a memória não entrava na nota do Revit.
// Conferida também com o Aorus Master 16 (9955HX3D, 5090) e o Helios 16 (5070 Ti).
const NIVEIS = ['Fraco', 'Regular', 'Bom', 'Muito bom', 'Ótimo'];
// estrelas de 1 a 5 com meia estrela: o nível de um programa é o do fator mais fraco (0 a 4);
// se os outros fatores estão bem acima dele, ganha meia estrela.
const nMin = (...xs) => {
  const v = xs.filter(x => x != null && !isNaN(x)); if (!v.length) return 2;
  const m = Math.min(...v), media = v.reduce((a, b) => a + b, 0) / v.length;
  return m < 4 && v.length > 1 && media - m >= .75 ? m + .5 : m;
};
const comEstrelas = p => { const n = p.nivel ?? 1, i = Math.max(0, Math.min(4, Math.floor(n))); return {...p, nivel: i, estrelas: Math.min(5, 1 + n), rotulo: NIVEIS[i]}; };

const faixa = (v, limites, menorMelhor) => {      // limites do melhor para o pior
  for (let i = 0; i < limites.length; i++) if (menorMelhor ? v <= limites[i] : v >= limites[i]) return 4 - i;
  return 0;
};

export function veredito(r, info) {
  const ram = (info.ram && info.ram.gb) || 0, vram = (info.gpu && info.gpu.vram) || 0;
  const cpu = r.bim_s != null ? faixa(r.bim_s, [.16, .2, .3, .5], true) : 2;
  const exp = r.pranchas_s != null ? faixa(r.pranchas_s, [6, 10, 16, 26], true) : 2;
  const navS = r.nav_sombreado != null ? faixa(r.nav_sombreado, [90, 50, 30, 15]) : 2;
  const navR = r.nav_realista != null ? faixa(r.nav_realista, [60, 35, 20, 10]) : 2;
  const navA = r.nav_arestas != null ? faixa(r.nav_arestas, [90, 50, 30, 15]) : 2;
  const ren = r.render_s != null ? faixa(r.render_s, [45, 100, 200, 360], true) : 2;
  const vE = faixa(vram, [12, 10, 8, 6]), vL = faixa(vram, [16, 12, 8, 6]);
  const maxProjMB = Math.round(ram * 18.75 / 50) * 50;                 // 16 GB → ~300 MB, 32 GB → ~600 MB, 64 GB → ~1.200 MB
  const prog = [
    {nome: 'Revit', nivel: nMin(cpu, navS, Math.round((cpu + exp) / 2), faixa(ram, [64, 32, 16, 8])),
     texto: `${navS < cpu ? `Navegação 3D ${['com travamentos', 'pesada', 'adequada', 'fluida', 'fluida'][navS]}` : `Modelagem ${['lenta', 'adequada', 'boa', 'rápida', 'muito rápida'][cpu]}`} · projetos até ~${maxProjMB.toLocaleString('pt-BR')} MB com ${ram} GB`},
    {nome: 'SketchUp', nivel: nMin(cpu, Math.max(navS, 1)), texto: cpu >= 4 ? 'Depende de um núcleo rápido, e este processador está entre os mais rápidos' : cpu >= 2 ? 'Depende de um núcleo rápido, e este processador atende bem' : 'Depende de um núcleo rápido; neste notebook, ele é o limite'},
    {nome: 'AutoCAD', nivel: nMin(cpu, Math.max(navA, 1)), texto: cpu >= 2 ? '2D e 3D sem travamentos' : 'Desenhos grandes podem demorar a regenerar'},
    {nome: 'Enscape · Twinmotion', nivel: nMin(ren, vE, Math.max(navR, 1)), texto: `Tempo real com ray tracing · ${vram} GB de vídeo${vram < 12 ? '; cenas pesadas exigem 12 GB' : ''}`},
    {nome: 'Lumion', nivel: nMin(ren, vL), texto: vram >= 16 ? 'Qualidade máxima disponível' : `Funciona bem · a qualidade máxima exige 16 GB de vídeo`},
  ].map(comEstrelas);
  const base = Math.min(prog[0].nivel, prog[1].nivel);
  let titulo;
  if (base >= 3 && ram >= 64) titulo = 'Pronto para projetos grandes';
  else if (base >= 2 && ram >= 32) titulo = 'Pronto para projetos de médio porte';
  else if (base >= 2 && ram >= 16) titulo = 'Bom para estudantes e projetos pequenos';
  else titulo = 'Atende ao básico, mas perde desempenho em modelos pesados';
  const limite = ram < 32 ? 'memória' : vram < 8 ? 'vídeo' : cpu < 2 ? 'processador' : ram < 64 ? 'memória' : null;
  const frase = [
    cpu >= 3 ? 'Modela rápido' : cpu >= 2 ? 'Modela bem' : 'A modelagem é o ponto fraco',
    navS >= 3 ? 'e navega com fluidez em modelos grandes' : navS >= 2 ? 'e navega bem no 3D' : 'e o 3D fica pesado em modelos grandes',
  ].join(' ') + '.' + (limite === 'memória' ? ` O que limita é a memória: projetos Revit acima de ~${maxProjMB.toLocaleString('pt-BR')} MB exigem ${ram < 32 ? 32 : 64} GB de RAM.`
    : limite === 'vídeo' ? ` O que limita é a memória de vídeo (${vram} GB) para render em tempo real.` : limite === 'processador' ? ' O que limita é o processador.' : '');
  const selos = [
    {txt: 'Estudante', ok: base >= 1 && ram >= 16},
    {txt: 'Escritório, projetos médios', ok: base >= 2 && ram >= 32},
    {txt: base >= 3 && ram < 64 ? 'Projetos grandes · com mais RAM' : 'Projetos grandes', ok: base >= 3 && ram >= 64, quase: base >= 3 && ram < 64},
  ];
  return {titulo, frase, programas: prog, selos, maxProjMB, niveis: {cpu, exp, navS, navR, navA, ren, vE, vL}};
}
