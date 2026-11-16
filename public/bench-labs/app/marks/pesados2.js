/* Bench Marks · testes pesados de Engenharia, Programação, Design gráfico e Edição de vídeo (aba Testes pesados)
 *
 * Mesmo formato dos testes de Arquitetura e Odontologia (pesados.js): cerca de 10 minutos em 4 etapas, com o
 * desempenho ao longo do teste. A interface passa o mesmo objeto `ui` e, aqui, também `api` (o lado Python).
 * As réguas dos vereditos são provisórias: calibrar com os programas de verdade nos notebooks da bancada.
 */
import {THREADS} from './testes.js';
import {rodarPool, taxaPorSegundo, faixa, nMin, minN, comEstrelas, fmt, milhoes, fps, mmss, tempoTxt, media, gpuNivel} from './pesados.js';
import {MontagemCAD, FluidoLBM, FotoGPU, DenoiseIA, VideoNR, NOMES_FILTROS} from './prof_gpu.js';
import {FORMATOS, carregarClipe, suporte, quadrosOrigem, bandaVideo, calculoIA, bandaTeorica, quemLe, meiaPrecisao} from './perfis.js';
import {nomeArquivo} from './prof_worker.js';

const URL_PROF = new URL('./prof_worker.js', import.meta.url);
const interrompido = () => new Error('interrompido');
const ver = s => { if (s && s.aborted) throw interrompido(); };
const r1 = v => v == null ? null : Math.round(v * 10) / 10;
const espera = ms => new Promise(r => setTimeout(r, ms));
const canal = new MessageChannel(); let filaRespirar = [];
canal.port1.onmessage = () => { const f = filaRespirar; filaRespirar = []; f.forEach(r => r()); };
const respirar = () => new Promise(r => { filaRespirar.push(r); canal.port2.postMessage(0); });
// Memória: os workers rodam todos dentro do processo da janela do Bench Labs, e o motor do Edge limita a memória de
// JavaScript desse processo a cerca de 4 GB, somando todos os workers, qualquer que seja a memória do notebook.
// A compilação cria muitos objetos (perto de 150 a 200 MB por thread): com 32 threads (i9-14900HX) passava do limite e a
// janela fechava com "Out of Memory"; com 24 (Core Ultra 9 275HX) roda sem problema. Por isso a compilação usa no máximo
// 24 threads. Os ambientes e as fotos usam memória fora desse limite (ArrayBuffer) e ficam só presos à memória do
// notebook: cada etapa usa no máximo cerca de 30% dela.
const MAX_COMPILAR = 24;
const porMemoria = (info, mbCada) => Math.max(2, Math.floor((((info && info.ram) || {}).gb || 8) * 1024 * .3 / mbCada));

export const PASSOS2 = {
  p_engenharia: ['Montagem CAD de 4.000 peças', 'Simulação de estrutura', 'Simulação de fluido na placa', 'Cálculo de matrizes em precisão dupla'],
  p_programacao: ['Compilar 5.000 arquivos', '50 mil arquivos pequenos', 'Ambientes rodando juntos', 'IA para programar'],
  p_design: ['Filtros numa foto de 100 MP', 'Exportar 200 fotos e remover ruído com IA', 'Ilustração com 100 mil formas', 'Cores e brilho da tela'],
  p_video: ['Exportar 30 minutos de 4K', 'Redução de ruído e efeitos', 'Vídeos 4:2:2 10-bit da câmera', 'Timeline multicâmera'],
};

const W2 = 1200, H2 = 700;
function tela2d(ui) {
  const cv = ui.cv2d, ctx = cv ? cv.getContext('2d') : null;
  if (cv) { cv.width = W2; cv.height = H2; }
  return ctx;
}
/** Miniatura (para o fundo do resultado) a partir de uma tela 2D. */
function mini2d(cv, w = 800) {
  if (!cv) return null;
  const p = document.createElement('canvas'); p.width = w; p.height = Math.round(w * cv.height / cv.width);
  p.getContext('2d').drawImage(cv, 0, 0, p.width, p.height);
  return p.toDataURL('image/jpeg', .82);
}
function fundo(ctx) {
  ctx.fillStyle = '#120B1C'; ctx.fillRect(0, 0, W2, H2);
}
function texto(ctx, t, x, y, {cor = '#C9BFD6', tam = 15, peso = 600, alinhar = 'left'} = {}) {
  ctx.fillStyle = cor; ctx.font = `${peso} ${tam}px "Segoe UI", sans-serif`; ctx.textAlign = alinhar; ctx.fillText(t, x, y);
}
const ESCALA_CORES = ['#2F5BD3', '#2E8FE0', '#27C2D8', '#5FD38D', '#E5E04A', '#FFA544', '#FF5A5A'];

/** Repete uma cena da placa medindo os quadros/s e guardando a curva. */
async function cenaGPU(ui, sinal, Classe, opcoes, segundos, rotulo, txt, etiqueta, fator = 1) {
  const m = new Classe();
  try {
    await m.iniciar(ui.CV(ui.cvgpu), opcoes);
    ui.visual(['#cvgpu'], typeof etiqueta === 'function' ? etiqueta(m) : etiqueta);
    ui.metrica(rotulo, '—', 'Preparando');
    let ultS = -1;
    const x = await m.rodar(segundos, p => {
      if (!p.porSegundo.length) return;                              // o primeiro segundo ainda não terminou
      const s = Math.floor(p.segundos); if (s !== ultS && s > 0) { ultS = s; ui.curva.ponto(p.fpsAgora); }
      ui.metrica(null, fps(p.fpsAgora * fator), typeof txt === 'function' ? txt(m) : txt);
    }, sinal);
    let mini = null;
    try { mini = ui.miniatura(await m.capturar()); } catch (e) { /* sem miniatura */ }
    return {fps: x.fps, m, mini};
  } finally { m.destruir(); }
}

// ================================================================== ENGENHARIA
function desenharFEA(ctx, v, casos) {
  fundo(ctx);
  const [nx, ny, nz, NX, NY] = v.malha, X0 = 150, Y0 = 170, E = 11;
  // deslocamento da camada do meio, exagerado para dar para ver
  const kz = nz >> 1, u = v.uy;
  let mx = 1e-12; for (let i = 0; i < u.length; i++) mx = Math.max(mx, Math.abs(u[i]));
  const fator = 40 / mx;
  const pos = (i, j) => { const n = (kz * NY + j) * NX + i; return [X0 + i * E + u[n * 2] * fator, Y0 + (ny - j) * E - u[n * 2 + 1] * fator]; };
  // maior tensão de cada coluna (vista de lado)
  const col = new Float32Array(nx * ny);
  for (let e = 0; e < v.vm.length; e++) { const i = v.els[e * 3], j = v.els[e * 3 + 1], k = j * nx + i; if (v.vm[e] > col[k]) col[k] = v.vm[e]; }
  const ord = [...col].filter(x => x > 0).sort((a, b) => a - b), ref = ord[Math.floor(ord.length * .97)] || 1;
  ctx.fillStyle = '#2A1F38'; ctx.fillRect(X0 - 36, Y0 - 40, 36, ny * E + 80);
  ctx.strokeStyle = '#43355A'; ctx.lineWidth = 2;
  for (let y = Y0 - 40; y < Y0 + ny * E + 40; y += 20) { ctx.beginPath(); ctx.moveTo(X0 - 36, y + 20); ctx.lineTo(X0, y); ctx.stroke(); }
  ctx.lineWidth = .6; ctx.strokeStyle = 'rgba(14,9,22,.6)';
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const s = col[j * nx + i]; if (!s) continue;
    const a = pos(i, j), b = pos(i + 1, j), c = pos(i + 1, j + 1), d = pos(i, j + 1);
    ctx.fillStyle = ESCALA_CORES[Math.min(6, Math.floor(Math.pow(Math.min(1, s / ref), .8) * 7))];
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  const caso = ['Carga para baixo', 'Para baixo e de lado', 'Torção', 'Puxando e para baixo'][casos % 4];
  texto(ctx, `Caso de carga ${casos % 4 + 1} · ${caso}`, X0, 70, {cor: '#F5F2F9', tam: 18, peso: 700});
  texto(ctx, v.it < 0 ? 'Resolvido' : `Calculando · ${fmt(v.it)} rodadas`, X0 + 470, 70, {cor: v.it < 0 ? '#5FD38D' : '#FFE500', tam: 15, peso: 700});
  texto(ctx, `${fmt(v.vm.length)} elementos de 8 nós · ${casos + (v.it < 0 ? 1 : 0)} ${casos + (v.it < 0 ? 1 : 0) === 1 ? 'caso resolvido' : 'casos resolvidos'} · deformação ampliada para facilitar a visualização`, X0, 96);
  const gx = 840, gy = 620;
  const g = ctx.createLinearGradient(gx, 0, gx + 300, 0); ESCALA_CORES.forEach((c, i) => g.addColorStop(i / 6, c));
  ctx.fillStyle = g; ctx.fillRect(gx, gy, 300, 12);
  texto(ctx, 'Pouco esforço', gx, gy - 8, {tam: 13}); texto(ctx, 'Muito', gx + 300, gy - 8, {tam: 13, alinhar: 'right'});
}

function desenharMatriz(ctx, est) {
  fundo(ctx);
  const n = 28, T = 20, X0 = 90, Y0 = 70;
  const cores = ['#FFE500', '#B57CFF', '#5FD38D', '#62D2FF', '#FFA544', '#FF7A7A', '#E5E04A', '#C9BFD6'];
  for (let k = 0; k < n * n; k++) {
    const w = est.dono[k];
    ctx.fillStyle = w < 0 ? '#21172F' : cores[w % cores.length];
    ctx.globalAlpha = w < 0 ? 1 : .35 + .65 * (((k * 2654435761) >>> 0) % 100) / 100;
    ctx.fillRect(X0 + (k % n) * T, Y0 + Math.floor(k / n) * T, T - 2, T - 2);
  }
  ctx.globalAlpha = 1;
  texto(ctx, 'C = A × B · blocos de 384 × 384 em precisão dupla (64 bits)', X0, 50, {cor: '#F5F2F9', peso: 700});
  texto(ctx, `Cada cor é um núcleo do processador (${est.n} ao todo)`, X0, Y0 + n * T + 30);
  texto(ctx, `${fmt(est.gflops, 1)}`, 820, 200, {cor: '#FFE500', tam: 64, peso: 800});
  texto(ctx, 'GFLOPS · bilhões de operações por segundo', 820, 236);
  texto(ctx, `${fmt(est.total)} multiplicações de matriz`, 820, 290, {cor: '#F5F2F9'});
}

export async function engenhariaPesado(ui, sinal) {
  const {curva, escala = 1, peq = 1, info} = ui, seg = s => Math.max(3, s * escala), dev = peq < 1;
  const r = {threads: THREADS};
  // ---- 1. montagem CAD (uma chamada de desenho por peça, como o SolidWorks)
  ui.passo(0); ui.etapa('Montagem CAD de 4.000 peças'); curva.etapa('Montagem CAD');
  const cad = await cenaGPU(ui, sinal, MontagemCAD, {largura: 1920 * peq, altura: 1080 * peq}, seg(150), 'Quadros/s',
    m => `${fmt(m.n)} peças · ${milhoes(m.triangulos / 1e6)} de triângulos · sombreado com arestas`, m => `1 de 4 · Montagem CAD · ${fmt(m.n)} peças, como no SolidWorks e no Inventor`);
  r.cad_fps = r1(cad.fps); r.cad_pecas = cad.m.n; r.cad_tri = Math.round(cad.m.triangulos); r.miniatura = cad.mini;
  // ---- 2. simulação de estrutura (elementos finitos, todos os núcleos)
  ver(sinal);
  ui.passo(1); ui.etapa('Simulação de estrutura'); curva.etapa('Simulação de estrutura');
  ui.visual(['#cv2d'], `2 de 4 · Simulação de estrutura · elementos finitos em ${THREADS} threads, como no SolidWorks Simulation e no ANSYS`);
  ui.metrica('Rodadas de cálculo por segundo', '—', 'Montando a malha do suporte');
  const ctx = tela2d(ui), tf = taxaPorSegundo(curva, taxa => ui.metrica(null, fmt(taxa), `${fmt(taxa / THREADS, 1)} por thread · gradiente conjugado, um caso de carga atrás do outro`));
  try {
    const res = await rodarPool({url: URL_PROF, n: THREADS, sinal, msg: {tipo: 'fea', segundos: seg(180)}, aoMsg: (i, m) => {
      if (m.tipo === 'andamento') tf.atual[i] = m.iteracoes;
      if (m.tipo === 'visual' && ctx) desenharFEA(ctx, m, m.casos);
    }});
    const it = res.reduce((s, x) => s + x.iteracoes, 0), segs = Math.max(...res.map(x => x.segundos));
    r.fea_it_s = Math.round(it / segs); r.fea_casos = res.reduce((s, x) => s + x.casos, 0); r.fea_elementos = res[0].elementos; r.fea_graus = res[0].graus;
  } finally { tf.parar(); }
  // ---- 3. simulação de fluido na placa
  ver(sinal);
  ui.passo(2); ui.etapa('Simulação de fluido na placa'); curva.etapa('Fluido');
  const W = dev ? 512 : 2048, H = dev ? 192 : 768;
  const flu = await cenaGPU(ui, sinal, FluidoLBM, {largura: 1920 * peq, altura: 720 * peq, W, H}, seg(150), 'Milhões de células por segundo',
    'Ar passando por uma asa: cores mostram os redemoinhos (Boltzmann em rede)', `3 de 4 · Simulação de fluido · ${milhoes(W * H / 1e6)} de células`, W * H * 10 / 1e6);
  r.lbm_mlups = Math.round(flu.fps * W * H * 10 / 1e6); r.lbm_celulas = W * H; r.mini_fluido = flu.mini;
  // ---- 4. contas de matriz em precisão dupla
  ver(sinal);
  ui.passo(3); ui.etapa('Cálculo de matrizes em precisão dupla'); curva.etapa('Matrizes');
  ui.visual(['#cv2d'], `4 de 4 · Cálculo de matrizes em precisão dupla · ${THREADS} threads, como o MATLAB e o NumPy`);
  ui.metrica('GFLOPS', '—', 'Multiplicação de matrizes de 384 × 384 (64 bits)');
  const ctx2 = tela2d(ui), est = {dono: new Int16Array(28 * 28).fill(-1), prox: 0, total: 0, gflops: 0, n: THREADS}, feitas = [];
  const tm = taxaPorSegundo(curva, taxa => { est.gflops = taxa; ui.metrica(null, fmt(taxa, 1), `${fmt(taxa / THREADS, 2)} por thread · bilhões de operações por segundo`); });
  try {
    const res = await rodarPool({url: URL_PROF, n: THREADS, sinal, msg: {tipo: 'dgemm', segundos: seg(120)}, aoMsg: (i, m) => {
      if (m.tipo !== 'andamento') return;
      tm.atual[i] = m.gflop;
      const novas = m.feitas - (feitas[i] || 0); feitas[i] = m.feitas;
      for (let k = 0; k < novas; k++) { est.dono[est.prox] = i; est.prox = (est.prox + 1) % est.dono.length; est.total++; if (est.prox === 0) est.dono.fill(-1); }
      if (ctx2) desenharMatriz(ctx2, est);
    }});
    r.dgemm_gflops = r1(res.reduce((s, x) => s + x.gflops, 0));
  } finally { tm.parar(); }
  const c = curva.resumo();
  r.curva = c.serie; r.curva_etapas = c.etapas; r.curva_total = c.total;
  r.fim_gpu = minN(curva.fimDe('Montagem CAD'), curva.fimDe('Fluido')); r.fim_cpu = minN(curva.fimDe('Simulação de estrutura'), curva.fimDe('Matrizes'));
  r.ram_gb = (info.ram || {}).gb; r.vram_gb = (info.gpu || {}).vram;
  r.veredito = vereditoEngenharia(r, info);
  return r;
}

// ================================================================== PROGRAMAÇÃO
const TOTAL_ARQ = 5000;
/** Compila os 5.000 arquivos espalhados por todos os núcleos (uma fila de lotes, como o MSBuild e o Ninja).
 *  Ao terminar, começa de novo do zero (build limpo), até completar `segundos`. */
function compilarProjeto({segundos, sinal, aoAndar, n = THREADS}) {
  const ws = Array.from({length: n}, () => new Worker(URL_PROF, {type: 'module'}));
  const t0 = performance.now(), builds = [], estado = new Uint8Array(TOTAL_ARQ), log = [], ociosos = new Set();
  let prox = 0, feitos = 0, ini = t0, total = 0, encerrar = false, ocupados = 0;
  return new Promise((ok, falha) => {
    const fim = () => { ws.forEach(w => w.terminate()); if (sinal) sinal.removeEventListener('abort', abortar); };
    const abortar = () => { fim(); falha(interrompido()); };
    if (sinal) { if (sinal.aborted) return abortar(); sinal.addEventListener('abort', abortar, {once: true}); }
    const pedir = w => {
      if (encerrar || prox >= TOTAL_ARQ) { ociosos.add(w); return; }
      const de = prox, ate = Math.min(TOTAL_ARQ, prox + 6); prox = ate;
      for (let i = de; i < ate; i++) estado[i] = 1;
      ocupados++; w.postMessage({tipo: 'compilar', de, ate});
    };
    ws.forEach(w => {
      w.onerror = e => { fim(); falha(new Error(e.message || 'Erro na compilação.')); };
      w.onmessage = e => {
        const m = e.data;
        if (m.tipo === 'erro') { fim(); falha(new Error(m.erro)); return; }
        ocupados--;
        for (let i = m.de; i < m.ate; i++) { estado[i] = 2; log.push(nomeArquivo(i)); }
        if (log.length > 14) log.splice(0, log.length - 14);
        feitos += m.ate - m.de; total += m.ate - m.de;
        if (feitos >= TOTAL_ARQ) {                                   // compilação completa: recomeça do zero (build limpo)
          builds.push((performance.now() - ini) / 1000);
          feitos = 0; prox = 0; estado.fill(0); ini = performance.now();
        }
        if ((performance.now() - t0) / 1000 >= segundos) encerrar = true;
        aoAndar && aoAndar({feitos, total, estado, log, builds, ocupados});
        if (encerrar) {
          if (!ocupados) { fim(); ok({builds, parcial: {feitos, segundos: (performance.now() - ini) / 1000}, total, segundos: (performance.now() - t0) / 1000}); }
          return;
        }
        pedir(w);
        if (prox < TOTAL_ARQ && ociosos.size) { const parados = [...ociosos]; ociosos.clear(); parados.forEach(x => { pedir(x); pedir(x); }); }
      };
      pedir(w); pedir(w);                                            // dois lotes por núcleo: nunca fica esperando
    });
  });
}

function desenharBuild(ctx, est) {
  fundo(ctx);
  const COLS = 30, PASSO = 19, X0 = 40, Y0 = 70, grupo = Math.ceil(TOTAL_ARQ / (COLS * 14));
  for (let t = 0; t < COLS * 14; t++) {
    let s = 0, c = 0;
    for (let i = t * grupo; i < Math.min(TOTAL_ARQ, (t + 1) * grupo); i++) { s = Math.max(s, est.estado[i] === 1 ? 3 : 0); c += est.estado[i] === 2 ? 1 : 0; }
    ctx.fillStyle = s === 3 ? '#FFE500' : c === grupo ? 'rgba(95,211,141,.55)' : c ? 'rgba(95,211,141,.3)' : '#2A1F38';
    ctx.fillRect(X0 + (t % COLS) * PASSO, Y0 + Math.floor(t / COLS) * PASSO, 17, 17);
  }
  texto(ctx, `Cada quadrado = ${grupo} arquivos · verde: compilado · amarelo: compilando agora`, X0, 50);
  const pct = est.feitos / TOTAL_ARQ;
  ctx.fillStyle = '#2A1F38'; ctx.fillRect(X0, 360, 570, 10); ctx.fillStyle = '#FFE500'; ctx.fillRect(X0, 360, 570 * pct, 10);
  texto(ctx, `${fmt(est.feitos)} de ${fmt(TOTAL_ARQ)} arquivos${est.builds.length ? ` · compilação completa em ${fmt(est.builds.at(-1), 1)} s` : ''}`, X0, 400, {cor: '#F5F2F9', peso: 700});
  // saída do compilador
  ctx.fillStyle = '#0B0712'; ctx.fillRect(660, 40, 500, 620);
  texto(ctx, 'SAÍDA DO COMPILADOR', 680, 72, {cor: '#8E809F', tam: 12});
  ctx.font = '500 14px "Cascadia Mono", Consolas, monospace'; ctx.textAlign = 'left';
  est.log.forEach((l, i) => { ctx.fillStyle = '#C9BFD6'; ctx.fillText(`[${fmt(est.total - est.log.length + i + 1)}] ${l}`, 680, 104 + i * 26); });
  ctx.fillStyle = '#FFE500'; ctx.fillText(`${THREADS} ${THREADS > 1 ? 'núcleos compilando' : 'núcleo compilando'} ▍`, 680, 104 + est.log.length * 26 + 10);
}

function desenharPastas(ctx, e) {
  fundo(ctx);
  const fases = ['Criando', 'Lendo', 'Listando', 'Apagando'], i = Math.max(0, fases.indexOf(e.fase)), pct = e.total ? e.feitos / e.total : 0;
  const COLS = 25, ROWS = 20, PASSO = 21, X0 = 40, Y0 = 90, n = COLS * ROWS;
  for (let k = 0; k < n; k++) {
    const feito = k / n < pct;
    const cor = e.fase === 'Apagando' ? (feito ? '#21172F' : 'rgba(95,211,141,.5)') : feito ? ['rgba(95,211,141,.5)', '#62D2FF', '#B57CFF', '#21172F'][i] : i === 0 ? '#21172F' : ['rgba(95,211,141,.5)', 'rgba(95,211,141,.5)', '#62D2FF', '#B57CFF'][i];
    ctx.fillStyle = cor; ctx.fillRect(X0 + (k % COLS) * PASSO, Y0 + Math.floor(k / COLS) * PASSO, 18, 15);
  }
  texto(ctx, '500 pastas com 100 arquivos pequenos cada (como o node_modules e um repositório git)', X0, 66);
  texto(ctx, `${e.fase || 'Preparando'}…`, 640, 140, {cor: '#F5F2F9', tam: 30, peso: 800});
  texto(ctx, `${fmt(e.feitos || 0)} de ${fmt(e.total || 50000)} arquivos · rodada ${(e.ciclo || 0) + 1}`, 640, 176);
  const t = e.tempos || {};
  [['Criar', t.criar], ['Ler', t.ler], ['Listar', t.listar], ['Apagar', t.apagar]].forEach(([nome, v], k) => {
    texto(ctx, nome, 640, 250 + k * 40, {cor: '#8E809F'}); texto(ctx, v != null ? `${fmt(v, 1)} s` : '—', 820, 250 + k * 40, {cor: '#F5F2F9', peso: 700});
  });
  texto(ctx, 'O antivírus do Windows confere cada arquivo novo:', 640, 450, {tam: 13}); texto(ctx, 'isso também entra na conta, como no dia a dia.', 640, 470, {tam: 13});
}

function desenharAmbientes(ctx, e) {
  fundo(ctx);
  texto(ctx, `${e.n} ${e.n > 1 ? 'ambientes rodando juntos' : 'ambiente rodando'} · cada um com 128 MB de memória em uso`, 40, 56, {cor: '#F5F2F9', tam: 18, peso: 700});
  const cols = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(e.n * 2)))), w = (1120 - (cols - 1) * 12) / cols, h = Math.min(130, w * .6);
  const vel = e.base ? Math.min(1, (e.porAmbiente || 0) / e.base) : null;
  for (let k = 0; k < e.n; k++) {
    const x = 40 + (k % cols) * (w + 12), y = 90 + Math.floor(k / cols) * (h + 12);
    ctx.fillStyle = '#21172F'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#43355A'; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    texto(ctx, ['api', 'banco', 'cache', 'web', 'fila', 'testes', 'worker', 'busca'][k % 8] + `-${k + 1}`, x + 12, y + 26, {tam: 14, cor: '#F5F2F9'});
    texto(ctx, '128 MB', x + w - 12, y + 26, {tam: 12, cor: '#8E809F', alinhar: 'right'});
    ctx.fillStyle = '#2A1F38'; ctx.fillRect(x + 12, y + h - 26, w - 24, 10);
    if (vel != null) { ctx.fillStyle = vel > .7 ? '#5FD38D' : vel > .45 ? '#FFC861' : '#FF7A7A'; ctx.fillRect(x + 12, y + h - 26, (w - 24) * vel, 10); }
    else { ctx.fillStyle = '#5FD38D'; ctx.fillRect(x + 12, y + h - 26, (w - 24) * (.3 + .7 * ((performance.now() / 900 + k * .37) % 1)), 10); }
  }
  texto(ctx, vel != null ? `Velocidade de cada ambiente: ${fmt(100 * vel)}% da velocidade de um ambiente sozinho` : 'Medindo a velocidade de um ambiente sozinho (a referência)', 40, 660);
}

const CODIGO = ['async function carregarPedidos(cliente) {', '  const resposta = await api.get(`/clientes/${cliente.id}/pedidos`);', '  if (!resposta.ok) throw new Error(\'Falha ao carregar\');', '  const pedidos = await resposta.json();', '', '  // agrupa os pedidos por mês e soma o total de cada um', ''];
const SUGESTAO = '  const porMes = new Map();\n  for (const p of pedidos) {\n    const mes = p.data.slice(0, 7);\n    porMes.set(mes, (porMes.get(mes) ?? 0) + p.total);\n  }\n  return [...porMes].sort(([a], [b]) => a.localeCompare(b));\n}';
function desenharEditor(ctx, e) {
  fundo(ctx);
  ctx.fillStyle = '#0B0712'; ctx.fillRect(30, 30, 760, 640);
  ctx.font = '500 16px "Cascadia Mono", Consolas, monospace'; ctx.textAlign = 'left';
  const linhas = [...CODIGO, ...SUGESTAO.slice(0, e.chars).split('\n')];
  linhas.forEach((l, i) => {
    ctx.fillStyle = '#5A4D6B'; ctx.fillText(String(i + 1).padStart(2, ' '), 44, 74 + i * 28);
    ctx.fillStyle = i >= CODIGO.length ? '#8E809F' : l.trim().startsWith('//') ? '#5FD38D' : '#E8E2F0'; ctx.fillText(l, 84, 74 + i * 28);
  });
  if (e.chars < SUGESTAO.length) { ctx.fillStyle = '#FFE500'; ctx.fillRect(84 + (linhas.at(-1).length) * 9.6, 58 + (linhas.length - 1) * 28, 9, 20); }
  texto(ctx, 'Sugestão da IA (cinza) aparecendo na velocidade estimada para este notebook', 44, 660, {tam: 13});
  texto(ctx, 'IA PARA PROGRAMAR', 830, 70, {cor: '#8E809F', tam: 12});
  texto(ctx, e.etapa || 'Medindo', 830, 104, {cor: '#F5F2F9', tam: 18, peso: 700});
  (e.modelos || []).forEach((m, i) => {
    texto(ctx, m.nome, 830, 160 + i * 64, {cor: '#C9BFD6'});
    texto(ctx, m.tokens_s != null ? `${fmt(m.tokens_s)} tokens/s` : '—', 830, 186 + i * 64, {cor: m.cabe ? '#5FD38D' : '#FFC861', peso: 800, tam: 20});
  });
}

const CODERS = [{nome: 'Qwen2.5-Coder 7B', gb: 4.7, b: 7.6}, {nome: 'Qwen2.5-Coder 14B', gb: 9, b: 14.7}, {nome: 'Qwen2.5-Coder 32B', gb: 19.9, b: 32.8}];
function estimarCoders(banda, tflops, info) {
  const vram = info.gpu && info.gpu.vram ? Math.max(info.gpu.vram - .8, info.gpu.vram_livre ?? 0) : 2;
  const ramBw = (info.ram && /DDR5/.test(info.ram.tipo || '') ? 60 : 38);
  return CODERS.map(m => {
    const cabe = m.gb + .8 <= vram, naPlaca = cabe ? m.gb : Math.max(0, vram - .8), fora = m.gb - naPlaca;
    const tps = 1 / (naPlaca / banda + fora / (ramBw * .6));
    const leitura = tflops ? 25000 / (tflops * 1e12 * .3 / (2 * m.b * 1e9)) * (cabe ? 1 : 4) : null;   // ler ~2.000 linhas de código (25 mil tokens)
    return {...m, cabe, tokens_s: Math.round(tps * 10) / 10, leitura_s: leitura ? Math.round(leitura * 10) / 10 : null};
  });
}

export async function programacaoPesado(ui, sinal) {
  const {curva, escala = 1, info, api} = ui, seg = s => Math.max(3, s * escala);
  const r = {threads: THREADS};
  // ---- 1. compilar 5.000 arquivos
  const nC = Math.min(THREADS, MAX_COMPILAR, porMemoria(info, 200));
  r.build_threads = nC; r.build_max = MAX_COMPILAR;
  ui.passo(0); ui.etapa('Compilar 5.000 arquivos'); curva.etapa('Compilação');
  ui.visual(['#cv2d'], `1 de 4 · Compilar 5.000 arquivos · ${nC < THREADS ? `${nC} de ${THREADS}` : nC} threads, como um build no Visual Studio`);
  ui.metrica('Arquivos por segundo', '—', 'Lendo, analisando, otimizando e gerando o código de cada arquivo');
  const ctx = tela2d(ui), tc = taxaPorSegundo(curva, taxa => ui.metrica(null, fmt(taxa), `${fmt(taxa / nC, 1)} por thread`));
  let desenho = 0;
  try {
    const b = await compilarProjeto({segundos: seg(180), sinal, n: nC, aoAndar: e => {
      tc.atual[0] = e.total;
      const t = performance.now(); if (ctx && t - desenho > 120) { desenho = t; desenharBuild(ctx, e); }
    }});
    r.builds = b.builds.length;
    r.build_s = b.builds.length ? r1(media(b.builds)) : r1(b.parcial.segundos * TOTAL_ARQ / Math.max(1, b.parcial.feitos));
    r.build_estimado = !b.builds.length;
    r.arquivos_s = Math.round(b.total / b.segundos);
  } finally { tc.parar(); }
  // ---- 2. 50 mil arquivos pequenos (no SSD, pelo lado Python)
  ver(sinal);
  ui.passo(1); ui.etapa('50 mil arquivos pequenos'); curva.etapa('Arquivos pequenos');
  ui.visual(['#cv2d'], '2 de 4 · 50 mil arquivos pequenos · criar, ler, listar e apagar no SSD (npm install, git)');
  ui.metrica('Arquivos por segundo', '—', 'Preparando a pasta de teste');
  const ctx2 = tela2d(ui);
  await api.arquivos_iniciar(50000, seg(120));
  let ant = {n: 0, t: performance.now()}, est;
  for (;;) {
    if (sinal && sinal.aborted) { await api.arquivos_cancelar(); throw interrompido(); }
    await espera(400);
    est = await api.arquivos_estado();
    const tot = est.total || 50000, n = (est.ciclo || 0) * tot * 4 + ({Criando: 0, Lendo: 1, Listando: 2, Apagando: 3}[est.fase] ?? 0) * tot + (est.feitos || 0), t = performance.now();
    if (t - ant.t >= 1000) { const taxa = (n - ant.n) * 1000 / (t - ant.t); if (taxa > 0) { curva.ponto(taxa); ui.metrica(null, fmt(taxa), `${est.fase || ''} · rodada ${(est.ciclo || 0) + 1}`); } ant = {n, t}; }
    if (ctx2) desenharPastas(ctx2, est);
    if (est.fim) break;
  }
  if (est.erro) throw new Error(est.erro === 'interrompido' ? 'interrompido' : est.erro);
  const tp = est.primeiro || est.tempos || {};
  r.arq_criar_s = r1(tp.criar); r.arq_ler_s = r1(tp.ler); r.arq_listar_s = r1(tp.listar); r.arq_apagar_s = r1(tp.apagar);
  r.arq_ciclo_s = r1((tp.criar || 0) + (tp.ler || 0) + (tp.listar || 0) + (tp.apagar || 0)); r.arq_ciclos = est.ciclos_completos ?? est.ciclo;
  // ---- 3. ambientes rodando juntos (contêineres, serviços, bancos de dados)
  ver(sinal);
  ui.passo(2); ui.etapa('Ambientes rodando juntos'); curva.etapa('Ambientes');
  ui.visual(['#cv2d'], '3 de 4 · Ambientes rodando juntos · cada um com a própria memória, como contêineres do Docker');
  const ctx3 = tela2d(ui), maxN = Math.min(THREADS, 32, porMemoria(info, 150)), fases = [1, 2, 4, 8, 12, 16, 24, 32].filter(n => n <= maxN);
  if (fases.at(-1) !== maxN) fases.push(maxN);
  const segF = Math.max(3, seg(120) / fases.length), pontos = [];
  let base = null;
  for (const n of fases) {
    ver(sinal);
    const e = {n, base, porAmbiente: base};
    ui.metrica('Ambientes juntos', String(n), 'Medindo a velocidade de cada um');
    if (ctx3) desenharAmbientes(ctx3, e);
    const conta = [];
    let t0 = performance.now(), ultimo = 0;
    const res = await rodarPool({url: URL_PROF, n, sinal, msg: {tipo: 'ambiente', segundos: segF, mb: 128}, aoMsg: (i, m) => {
      if (m.tipo !== 'andamento') return;
      conta[i] = m.ops;
      const t = performance.now();
      if (t - ultimo > 300) { ultimo = t; const tot = conta.reduce((s, x) => s + (x || 0), 0); e.porAmbiente = tot / ((t - t0) / 1000) / n; if (ctx3) desenharAmbientes(ctx3, e); }
    }});
    const porAmb = res.reduce((s, x) => s + x.ops / x.segundos, 0) / n;
    if (base == null) base = porAmb;
    pontos.push([n, Math.round(100 * porAmb / base)]);
    await espera(1000);                                              // dá tempo de o Windows liberar a memória da fase anterior
  }
  r.ambientes_curva = pontos;
  r.ambientes_ok = Math.max(...pontos.filter(([, p]) => p >= 70).map(([n]) => n));
  r.ambientes_ram = Math.max(0, Math.floor((((info.ram || {}).gb || 8) - 8) / 2));      // contêineres de ~2 GB, com o editor e o navegador abertos
  // ---- 4. IA para programar (memória e cálculo da placa)
  ver(sinal);
  ui.passo(3); ui.etapa('IA para programar'); curva.etapa('IA');
  ui.visual(['#cv2d'], '4 de 4 · IA para programar no notebook · memória de vídeo e força de cálculo, como o LM Studio e o Ollama');
  const ctx4 = tela2d(ui), ed = {chars: 0, modelos: [], etapa: 'Velocidade da memória de vídeo'}, bandas = [], tfs = [];
  const fimIA = performance.now() + seg(180) * 1000;
  let digitar = null;
  if (ctx4) {                                                        // a sugestão aparece na velocidade estimada do modelo de 7B
    desenharEditor(ctx4, ed);
    digitar = setInterval(() => { const tps = (ed.modelos[0] || {}).tokens_s || 8; ed.chars = (ed.chars + Math.max(1, Math.round(tps * 3.5 / 10))) % (SUGESTAO.length + 40); desenharEditor(ctx4, ed); }, 100);
  }
  try {
    while (performance.now() < fimIA) {
      ver(sinal);
      ed.etapa = 'Velocidade da memória de vídeo'; ui.metrica('Memória de vídeo', '—', 'Medindo (é o que limita a velocidade das respostas)');
      const bw = await bandaVideo({sinal, segundos: Math.max(1.5, Math.min(10, (fimIA - performance.now()) / 2000))});
      bandas.push(bw); curva.ponto(bw); ui.metrica(null, `${fmt(bw)} GB/s`);
      ed.etapa = 'Força de cálculo (matrizes)';
      const c = await calculoIA({sinal, segundos: Math.max(1.5, Math.min(10, (fimIA - performance.now()) / 1000))});
      tfs.push(c.f16 || !meiaPrecisao(info) ? c.tflops : c.tflops * 2); r.ia_f16 = c.f16;   // sem FP16 no WebGPU, os programas ainda usam FP16
      const bt = bandaTeorica(info.gpu && info.gpu.nome), bm = media(bandas), banda = bt && bm < bt * .6 ? bt * .75 : bm;
      ed.modelos = estimarCoders(banda, media(tfs), info);
    }
  } finally { if (digitar) clearInterval(digitar); }
  if (ctx4) { ed.chars = SUGESTAO.length; ed.etapa = 'Resultado'; desenharEditor(ctx4, ed); r.miniatura = mini2d(ui.cv2d); }
  const bt = bandaTeorica(info.gpu && info.gpu.nome), bm = media(bandas);
  r.ia_banda = Math.round(bm); r.ia_tflops = r1(media(tfs)); r.ia_banda_usada = Math.round(bt && bm < bt * .6 ? bt * .75 : bm);
  r.ia_modelos = estimarCoders(r.ia_banda_usada, r.ia_tflops, info);
  const c = curva.resumo();
  r.curva = c.serie; r.curva_etapas = c.etapas; r.curva_total = c.total;
  r.fim_cpu = curva.fimDe('Compilação'); r.fim_gpu = curva.fimDe('IA');
  r.ram_gb = (info.ram || {}).gb; r.vram_gb = (info.gpu || {}).vram;
  r.veredito = vereditoProgramacao(r, info);
  return r;
}

// ================================================================== DESIGN GRÁFICO
function desenharExport(ctx, est) {
  fundo(ctx);
  texto(ctx, `Revelando e exportando 200 fotos de 24 megapixels em JPEG · ${est.n} threads · rodada ${est.rodada + 1}`, 40, 56, {cor: '#F5F2F9', tam: 18, peso: 700});
  for (let k = 0; k < 200; k++) {
    const x = 40 + (k % 20) * 56, y = 80 + Math.floor(k / 20) * 44, f = est.feitas.has(k);
    ctx.fillStyle = f ? `hsl(${(k * 37) % 360},45%,${38 + (k % 5) * 6}%)` : '#21172F'; ctx.fillRect(x, y, 50, 36);
    if (f) { ctx.fillStyle = 'rgba(255,229,0,.85)'; ctx.fillRect(x + 4, y + 26, 42 * ((k % 7) + 3) / 10, 4); }
  }
  texto(ctx, `${est.feitas.size} de 200 fotos · ${fmt(est.mb, 0)} MB gravados`, 40, 560, {cor: '#C9BFD6'});
}
function desenharDenoise(ctx, est) {
  fundo(ctx);
  texto(ctx, 'Remover ruído com IA · rede neural na placa de vídeo, como o Lightroom (Denoise)', 40, 56, {cor: '#F5F2F9', tam: 18, peso: 700});
  if (est.recorte) {
    if (!est.cvA) { est.cvA = document.createElement('canvas'); est.cvB = document.createElement('canvas'); est.cvA.width = est.cvA.height = est.cvB.width = est.cvB.height = 256; }
    est.cvA.getContext('2d').putImageData(est.recorte.antes, 0, 0); est.cvB.getContext('2d').putImageData(est.recorte.depois, 0, 0);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(est.cvA, 40, 90, 500, 500); ctx.drawImage(est.cvB, 620, 90, 500, 500);
    texto(ctx, 'Antes · ISO alto', 40, 620); texto(ctx, 'Depois da IA', 620, 620);
  } else texto(ctx, 'Processando a primeira foto…', 40, 120);
  texto(ctx, `${est.fotos} ${est.fotos === 1 ? 'foto' : 'fotos'} de 24 megapixels`, 40, 660, {cor: '#C9BFD6'});
}

/** Ilustração com 100 mil formas: uma paisagem de floresta em vetor (morros, árvores com folhas uma a uma, flores e
 *  frutas), redesenhada a cada quadro com zoom e movimento, como ao navegar num arquivo pesado do Illustrator. */
const PAL_V = ['#1F3B2D', '#2D5A3D', '#3F7A4A', '#5E9A4E', '#86B65A', '#B9D36C',          // 0-5 folhas
  '#F2C14E', '#F78154', '#E84A5F', '#FFFFFF', '#C9A7EB', '#FF9FB2',                         // 6-11 flores
  '#D7263D', '#F46036',                                                                       // 12-13 frutas
  '#5B3A29', '#7A5236',                                                                       // 14-15 troncos
  '#9CC5A1', '#7FB08A', '#5E9C76', '#3F7F5F', '#2B6448'];                                     // 16-20 morros (longe → perto)
function criarIlustracao(n, r) {
  const L = [];                                                      // [profundidade, tipo, x, y, s, a, cor, contorno, grad]
  const add = (d, tipo, x, y, sz, a, cor, cont = 0, gr = 0) => L.push([d, tipo, x, y, sz, a, cor, cont, gr]);
  for (let k = 0; k < 5; k++) add(560 + k * 110, 3, 0, 560 + k * 110, 50 + k * 18, k * 1.7 + .4, 16 + k);   // morros
  const nArv = Math.max(12, Math.round(n / 330)), porArv = Math.round(n * .74 / nArv);
  for (let t = 0; t < nArv; t++) {
    const by = 640 + Math.pow(r(), 1.25) * 820, esc = .35 + (by - 640) / 900 * 1.25, bx = -500 + r() * 3000;
    const alt = (120 + r() * 90) * esc, raio = (60 + r() * 45) * esc, cx = bx, cy = by - alt, tom = Math.floor(r() * 4);
    add(by, 4, bx, by, 9 * esc, alt * .75, 14 + (t % 2));                                           // tronco
    for (let k = 0; k < porArv; k++) {
      const ang = r() * 6.283, rr = raio * Math.sqrt(r()), lx = cx + Math.cos(ang) * rr * 1.15, ly = cy + Math.sin(ang) * rr * .9;
      const luz = (cy - ly) / raio;                                   // em cima, folhas mais claras
      add(by + k * 1e-4, 0, lx, ly, (5 + r() * 7) * esc, ang + r(), Math.max(0, Math.min(5, tom + Math.round(luz * 1.5 + r()))), r() < .12 ? 1 : 0, r() < .04 ? 1 : 0);
    }
    for (let k = 0; k < porArv * .035; k++) {                         // frutas
      const ang = r() * 6.283, rr = raio * Math.sqrt(r()) * .9;
      add(by + .5, 2, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * .85, 4.5 * esc, 0, 12 + (k % 2), 1);
    }
  }
  const resto = n - L.length;
  for (let k = 0; k < resto; k++) {                                   // flores em canteiros
    const grupo = Math.floor(k / 60), gr = (s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; })(grupo * 7919 + 13);
    const gx = -500 + gr() * 3000, gy = 700 + Math.pow(gr(), .6) * 850, esc = .35 + (gy - 640) / 900 * 1.25, ang = r() * 6.283, rr = 70 * esc * Math.sqrt(r());
    add(gy + rr * Math.sin(ang) * .4, 1, gx + Math.cos(ang) * rr, gy + Math.sin(ang) * rr * .4, (4 + r() * 4) * esc, r() * 6.283, 6 + (grupo % 6), r() < .2 ? 1 : 0);
  }
  L.sort((a, b) => a[0] - b[0]);
  const f = new Float32Array(L.length * 8);
  L.forEach((x, i) => f.set(x.slice(1), i * 8));
  return f;
}
function desenharIlustracao(ctx, formas, t, gradientes) {
  const W = ctx.canvas.width, H = ctx.canvas.height, z = (1 + .55 * Math.sin(t * .35)) * W / 1920;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ceu = ctx.createLinearGradient(0, 0, 0, H); ceu.addColorStop(0, '#FBD3A5'); ceu.addColorStop(.55, '#F6E7C8'); ceu.addColorStop(1, '#DDEBC4');
  ctx.fillStyle = ceu; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(z, 0, 0, z, W / 2 - (1000 + 260 * Math.sin(t * .2)) * z, H / 2 - (700 + 120 * Math.cos(t * .17)) * z);
  ctx.fillStyle = '#FFF4D6'; ctx.beginPath(); ctx.arc(1550, 360, 120, 0, 6.283); ctx.fill();
  ctx.lineWidth = 1.1; ctx.strokeStyle = 'rgba(20,30,20,.55)';
  for (let i = 0, n = formas.length / 8; i < n; i++) {
    const o = i * 8, tipo = formas[o], x = formas[o + 1], y = formas[o + 2], s = formas[o + 3], a = formas[o + 4], c = formas[o + 5] | 0;
    ctx.beginPath();
    if (tipo === 0) {                                                // folha (duas curvas de Bézier)
      const ca = Math.cos(a) * s, sa = Math.sin(a) * s;
      ctx.moveTo(x - ca, y - sa); ctx.bezierCurveTo(x - sa * .5, y + ca * .5, x + sa * .2, y + ca * .5, x + ca, y + sa); ctx.bezierCurveTo(x + sa * .5, y - ca * .5, x - sa * .2, y - ca * .5, x - ca, y - sa);
    } else if (tipo === 1) {                                         // flor (estrela de 5 pontas)
      for (let k = 0; k < 10; k++) { const rr = k % 2 ? s * .45 : s, aa = a + k * Math.PI / 5; k ? ctx.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr) : ctx.moveTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); }
      ctx.closePath();
    } else if (tipo === 2) ctx.arc(x, y, s, 0, 6.283);               // fruta
    else if (tipo === 3) {                                           // morro
      ctx.moveTo(-700, 2000);
      for (let k = 0; k <= 48; k++) { const xx = -700 + k * 75; ctx.lineTo(xx, y - s * (Math.sin(xx / 260 + a) + .5 * Math.sin(xx / 97 + a * 2))); }
      ctx.lineTo(2800, 2000); ctx.closePath();
    } else { ctx.moveTo(x - s * .5, y); ctx.lineTo(x - s * .3, y - a); ctx.lineTo(x + s * .3, y - a); ctx.lineTo(x + s * .5, y); ctx.closePath(); }   // tronco
    ctx.fillStyle = formas[o + 7] ? gradientes[c % gradientes.length] : PAL_V[c];
    ctx.fill();
    if (formas[o + 6]) ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const SRGB = [[.64, .33], [.3, .6], [.15, .06]], P3 = [[.68, .32], [.265, .69], [.15, .06]], ADOBE = [[.64, .33], [.21, .71], [.15, .06]];
function desenharCIE(ctx, t) {
  fundo(ctx);
  const X0 = 70, Y0 = 640, E = 680, px = ([x, y]) => [X0 + x * E, Y0 - y * E];
  // contorno das cores que o olho enxerga (aproximado, com os pontos do lugar espectral)
  const LOC = [[.1741, .005], [.144, .0297], [.1241, .0578], [.0913, .1327], [.0454, .295], [.0082, .5384], [.0139, .7502], [.0743, .8338], [.1547, .8059], [.2296, .7543], [.3016, .6923], [.3731, .6245], [.4441, .5547], [.5125, .4866], [.5752, .4242], [.6270, .3725], [.6658, .3340], [.6915, .3083], [.7347, .2653]];
  ctx.strokeStyle = '#43355A'; ctx.lineWidth = 1;
  for (let v = 0; v <= .8; v += .1) { ctx.beginPath(); ctx.moveTo(...px([v, 0])); ctx.lineTo(...px([v, .9])); ctx.stroke(); ctx.beginPath(); ctx.moveTo(...px([0, v])); ctx.lineTo(...px([.8, v])); ctx.stroke(); }
  ctx.beginPath(); LOC.forEach((p, i) => i ? ctx.lineTo(...px(p)) : ctx.moveTo(...px(p))); ctx.closePath();
  const g = ctx.createLinearGradient(...px([.1, .1]), ...px([.6, .7])); g.addColorStop(0, 'rgba(98,120,255,.22)'); g.addColorStop(.5, 'rgba(95,211,141,.22)'); g.addColorStop(1, 'rgba(255,120,90,.22)');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#8E809F'; ctx.stroke();
  const tri = (p, cor, larg, tracejado) => { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(...px(q)) : ctx.moveTo(...px(q))); ctx.closePath(); ctx.setLineDash(tracejado ? [6, 6] : []); ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.stroke(); ctx.setLineDash([]); };
  tri(SRGB, '#F5F2F9', 1.5, true); tri(P3, '#62D2FF', 1.5, true); tri(ADOBE, '#B57CFF', 1.2, true);
  const generico = !!(t && t.cores && t.cores.generico);
  const pr = !generico && t && t.cores && t.cores.primarias;
  if (pr) tri([pr.r || pr.R || pr.vermelho, pr.g || pr.G || pr.verde, pr.b || pr.B || pr.azul].filter(Boolean), '#FFE500', 3, false);
  texto(ctx, 'sRGB', ...px([.66, .33]), {cor: '#F5F2F9', tam: 13}); texto(ctx, 'DCI-P3', ...px([.27, .72]), {cor: '#62D2FF', tam: 13});
  texto(ctx, 'Adobe RGB', ...px([.12, .74]), {cor: '#B57CFF', tam: 13}); if (pr) texto(ctx, 'Esta tela', 640, 120, {cor: '#FFE500', tam: 15, peso: 700});
  const cob = t && t.cores && t.cores.cobertura;
  const linhas = !t ? ['A ficha da tela ainda não foi lida.', 'Abra o Raio-X e a Ficha uma vez para o teste usar as cores e o brilho da tela.']
    : [`${t.largura_px && t.altura_px ? `${t.largura_px} × ${t.altura_px}` : '—'}${t.hz_max ? ` · ${t.hz_max} Hz` : ''}${t.polegadas ? ` · ${t.polegadas}"` : ''}`,
       t.tipo ? `Painel ${t.tipo}` : 'Tipo de painel não informado',
       generico ? 'Cores: a tela informa os valores padrão do sRGB, sem medir' : cob ? `${Math.round(cob.srgb.xy)}% do sRGB · ${Math.round(cob.p3.xy)}% do DCI-P3` : 'Cores não informadas pela tela',
       t.brilho_max ? `Brilho máximo ${t.brilho_max} nits` : t.brilho_hdr ? `HDR até ${t.brilho_hdr} nits` : 'Brilho não informado'];
  texto(ctx, 'CORES E BRILHO DA TELA', 640, 170, {cor: '#8E809F', tam: 12});
  linhas.forEach((l, i) => texto(ctx, l, 640, 210 + i * 36, {cor: i === 2 ? '#FFE500' : '#F5F2F9', tam: i === 2 ? 19 : 16, peso: i === 2 ? 800 : 600}));
  texto(ctx, 'Dados que a própria tela informa ao Windows (EDID).', 640, 400, {tam: 13}); texto(ctx, 'Para medir de verdade, só com colorímetro.', 640, 420, {tam: 13});
}

export async function designPesado(ui, sinal) {
  const {curva, escala = 1, peq = 1, info, api} = ui, seg = s => Math.max(3, s * escala), dev = peq < 1;
  const r = {threads: THREADS};
  // ---- 1. filtros numa foto de 100 megapixels
  ui.passo(0); ui.etapa('Filtros numa foto de 100 MP'); curva.etapa('Filtros');
  ui.visual(['#disco-vis']); ui.texto('Abrindo a foto de 100 megapixels na placa', 0, '12 blocos de 2880 × 2880 pixels (cerca de 400 MB), como o Photoshop com a placa de vídeo ligada.');
  const foto = new FotoGPU(), tempos = {};
  try {
    await foto.iniciar(ui.CV(ui.cvgpu), dev ? {largura: 480, altura: 360, lado: 512, colunas: 2, linhas: 2} : {largura: 1440, altura: 1080});
    r.foto_mp = foto.megapixels;
    ui.visual(['#cvgpu'], `1 de 4 · Filtros numa foto de ${fmt(foto.megapixels, 1)} megapixels · à esquerda da linha, a foto original`);
    const fim = performance.now() + seg(200) * 1000;
    let cadeias = 0;
    while (performance.now() < fim) {
      ver(sinal);
      await foto.aplicar('gerar');                                  // abre a foto de novo a cada rodada
      for (const [k, nome] of NOMES_FILTROS) {
        ver(sinal);
        const s = await foto.aplicar(k);
        (tempos[k] = tempos[k] || []).push(s);
        curva.ponto(tempos[k][0] / s);                               // velocidade de cada filtro em relação à primeira vez
        foto.mostrarPrevia(.35 + .3 * Math.sin(performance.now() / 2500));
        ui.metrica(`${nome}`, `${fmt(s, s < 10 ? 2 : 1)} s`, `Rodada ${cadeias + 1} · ${NOMES_FILTROS.map(([kk, n]) => tempos[kk] ? `${n.split(' ')[0]} ${fmt(media(tempos[kk]), 1)} s` : null).filter(Boolean).join(' · ')}`);
        await respirar();
        if (performance.now() > fim && cadeias > 0) break;
      }
      cadeias++;
    }
    try { r.miniatura = ui.miniatura(await foto.capturar()); } catch (e) { /* sem miniatura */ }
  } finally { foto.destruir(); }
  r.filtros = NOMES_FILTROS.map(([k, nome]) => ({nome, s: tempos[k] ? Math.round(1000 * media(tempos[k].length > 1 ? tempos[k].slice(1) : tempos[k])) / 1000 : null}));
  r.filtro_medio_s = Math.round(1000 * media(r.filtros.filter(f => f.s != null).map(f => f.s))) / 1000;
  // ---- 2. exportar 200 fotos (processador) e remover ruído com IA (placa)
  ver(sinal);
  ui.passo(1); ui.etapa('Exportar 200 fotos'); curva.etapa('Exportar fotos');
  const nJ = Math.max(1, Math.min(THREADS, 8, porMemoria(info, 350)));
  ui.visual(['#cv2d'], `2 de 4 · Exportar 200 fotos de 24 megapixels · revelar e gravar em JPEG em ${nJ} threads, como o Lightroom`);
  ui.metrica('Fotos por minuto', '—', 'Preparando as fotos');
  const ctx = tela2d(ui), ex = {feitas: new Set(), mb: 0, n: nJ, rodada: 0}, mbs = [];
  const tj = taxaPorSegundo(curva, taxa => ui.metrica(null, fmt(taxa * 60), `${ex.feitas.size} de 200 fotos`));
  const segJ = seg(100);
  try {
    const res = await rodarPool({url: URL_PROF, n: nJ, sinal, msg: {tipo: 'jpeg', segundos: segJ, total: dev ? 40 : 200, n: nJ}, aoMsg: (i, m) => {
      if (m.tipo !== 'andamento') return;
      tj.atual[i] = m.feitas; mbs[i] = (mbs[i] || 0) + m.mb; ex.mb = mbs.reduce((s, x) => s + (x || 0), 0);
      if (ex.feitas.size >= (dev ? 40 : 200)) { ex.feitas.clear(); ex.rodada++; }
      ex.feitas.add(m.foto);
      if (ctx) desenharExport(ctx, ex);
    }});
    const feitas = res.reduce((s, x) => s + x.feitas, 0), segs = Math.max(...res.map(x => x.segundos));
    r.jpeg_fotos_min = Math.round(feitas / segs * 60); r.jpeg_200_s = Math.round(200 / (feitas / segs)); r.jpeg_feitas = feitas; r.jpeg_threads = nJ;
  } finally { tj.parar(); }
  ver(sinal);
  ui.etapa('Remover ruído com IA'); curva.etapa('Remover ruído');
  ui.visual(['#cv2d'], '2 de 4 · Remover ruído com IA · rede neural numa foto de 24 megapixels, na placa de vídeo');
  ui.metrica('Segundos por foto', '—', 'Carregando a rede neural');
  const ia = new DenoiseIA(), dn = {fotos: 0, recorte: null}, temposIA = [];
  try {
    await ia.iniciar(dev ? {fw: 1500, fh: 800, tw: 750, th: 400} : {});
    const fim = performance.now() + seg(100) * 1000;
    if (ctx) desenharDenoise(ctx, dn);
    while (performance.now() < fim || !temposIA.length) {
      ver(sinal);
      const x = await ia.foto(sinal, !dn.recorte || dn.fotos % 3 === 0);
      if (x.recorte) dn.recorte = x.recorte;
      dn.fotos++; temposIA.push(x.segundos); curva.ponto(60 / x.segundos);
      ui.metrica(null, fmt(x.segundos, x.segundos < 10 ? 1 : 0), `${dn.fotos} ${dn.fotos === 1 ? 'foto' : 'fotos'} · ${fmt(60 / media(temposIA), 1)} fotos por minuto`);
      if (ctx) desenharDenoise(ctx, dn);
    }
  } finally { ia.destruir(); }
  r.ia_foto_s = r1(media(temposIA.length > 1 ? temposIA.slice(1) : temposIA)); r.ia_fotos = temposIA.length;
  // ---- 3. ilustração com 100 mil formas (Illustrator)
  ver(sinal);
  ui.passo(2); ui.etapa('Ilustração com 100 mil formas'); curva.etapa('Vetores');
  const nF = dev ? 15000 : 100000;
  ui.visual(['#cv2d'], `3 de 4 · Ilustração com ${fmt(nF)} formas · redesenho a cada zoom, como no Illustrator`);
  ui.metrica('Redesenhos por segundo', '—', 'Criando a ilustração');
  const cv = ui.cv2d;
  if (cv) { cv.width = 1920 * (dev ? .5 : 1); cv.height = 1080 * (dev ? .5 : 1); }
  const vctx = cv ? cv.getContext('2d') : null, formas = criarIlustracao(nF, (s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; })(42));
  const grads = Array.from({length: 6}, (_, k) => { const g = vctx ? vctx.createLinearGradient(-400, 0, 2400, 1600) : null; if (g) { g.addColorStop(0, PAL_V[k]); g.addColorStop(1, PAL_V[Math.min(5, k + 2)]); } return g; });
  const fimV = performance.now() + seg(180) * 1000, tq = [];
  let ultS = performance.now(), qS = 0;
  while (performance.now() < fimV) {
    ver(sinal);
    const t0 = performance.now();
    if (vctx) desenharIlustracao(vctx, formas, t0 / 1000, grads);
    await respirar();
    const dt = performance.now() - t0; tq.push(dt); qS++;
    if (performance.now() - ultS >= 1000) { const f = qS * 1000 / (performance.now() - ultS); curva.ponto(f); ui.metrica(null, fmt(f, f < 10 ? 1 : 0), `${fmt(media(tq.slice(-10)))} ms para redesenhar ${fmt(nF)} formas`); ultS = performance.now(); qS = 0; }
  }
  const tqm = media(tq.length > 3 ? tq.slice(2) : tq);
  r.vetor_formas = nF; r.vetor_ms = Math.round(tqm); r.vetor_fps = r1(1000 / tqm);
  // ---- 4. cores e brilho da tela
  ver(sinal);
  ui.passo(3); ui.etapa('Cores e brilho da tela'); curva.etapa('Tela');
  ui.visual(['#cv2d'], '4 de 4 · Cores e brilho da tela · o que a tela informa ao Windows (EDID)');
  let t = null;
  try { t = await api.tela_info(); } catch (e) { t = null; }
  const ctx4 = tela2d(ui);
  if (ctx4) desenharCIE(ctx4, t);
  const cob = t && t.cores && t.cores.cobertura;
  const gen = !!(t && t.cores && t.cores.generico);
  ui.metrica('Cores da tela', cob && !gen ? `${Math.round(cob.srgb.xy)}% sRGB` : '—', gen ? 'A tela informa os valores padrão do sRGB, sem medir o painel' : cob ? `${Math.round(cob.p3.xy)}% do DCI-P3` : 'A ficha da tela ainda não foi lida no Raio-X');
  await espera(seg(20) * 1000);
  r.tela = t ? {tipo: t.tipo || null, srgb: cob ? Math.round(cob.srgb.xy) : null, p3: cob ? Math.round(cob.p3.xy) : null, brilho: t.brilho_max || null, hdr: t.brilho_hdr || null,
    generico: !!(t.cores && t.cores.generico),
    resolucao: t.largura_px ? `${t.largura_px} × ${t.altura_px}` : null, hz: t.hz_max || t.hz || null, primarias: (t.cores || {}).primarias || null} : null;
  const c = curva.resumo();
  r.curva = c.serie; r.curva_etapas = c.etapas; r.curva_total = c.total;
  r.fim_gpu = curva.fimDe('Filtros'); r.fim_cpu = curva.fimDe('Exportar fotos');
  r.ram_gb = (info.ram || {}).gb; r.vram_gb = (info.gpu || {}).vram;
  r.veredito = vereditoDesign(r, info);
  return r;
}

// ================================================================== EDIÇÃO DE VÍDEO
/** Exporta 4K H.264 pela placa (codificador do Edge) até `segundos` ou 30 minutos de vídeo. */
async function exportarLongo({segundos, sinal, quadrosAlvo = 54000, aoAndar}) {
  const W = 3840, H = 2160;
  let cfg = null;
  for (const hw of ['prefer-hardware']) {
    const t = {codec: 'avc1.640033', width: W, height: H, bitrate: 45e6, framerate: 30, hardwareAcceleration: hw, latencyMode: 'quality', avc: {format: 'annexb'}};
    try { if ((await VideoEncoder.isConfigSupported(t)).supported) cfg = t; } catch (e) { /* sem codificador */ }
  }
  if (!cfg) return null;
  const base = await quadrosOrigem(W, H);
  let saidas = 0, erro = null;
  const enc = new VideoEncoder({output: () => { saidas++; }, error: e => { erro = e; }});
  try {
    enc.configure(cfg);
    let k = 0, ultimo = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < segundos * 1000 && saidas < quadrosAlvo && !erro) {
      ver(sinal);
      while (enc.encodeQueueSize > 6) await new Promise(r => enc.addEventListener('dequeue', r, {once: true}));
      const f = new VideoFrame(base[k % base.length], {timestamp: k * 33333});
      enc.encode(f, {keyFrame: k % 60 === 0}); f.close(); k++;
      const t = performance.now();
      if (aoAndar && t - ultimo > 250) { ultimo = t; aoAndar({quadros: saidas, segundos: (t - t0) / 1000, base}); }
    }
    await enc.flush();
    if (erro) return null;
    return {quadros: saidas, segundos: (performance.now() - t0) / 1000};
  } catch (e) { if (String(e).includes('interrompido')) throw e; return null; }
  finally { try { enc.close(); } catch (e) { /**/ } base.forEach(f => f.close()); }
}

function desenharLinhaTempo(ctx, est) {
  fundo(ctx);
  if (est.base) { try { ctx.drawImage(est.base[Math.floor(performance.now() / 300) % est.base.length], 40, 40, 640, 360); } catch (e) { /* quadro fechado */ } }
  else { ctx.fillStyle = '#0B0712'; ctx.fillRect(40, 40, 640, 360); }
  ctx.fillStyle = 'rgba(14,9,22,.75)'; ctx.fillRect(40, 364, 210, 36);
  const s = est.quadros / 30;
  texto(ctx, `${mmss(s)} de 30:00`, 52, 389, {cor: '#F5F2F9', tam: 17, peso: 700});
  texto(ctx, `${est.via || 'Pela placa de vídeo'}`, 720, 70, {cor: '#8E809F', tam: 13});
  texto(ctx, est.x ? `${fmt(est.x, 1)}×` : '—', 720, 140, {cor: '#FFE500', tam: 56, peso: 800});
  texto(ctx, 'o tempo real do vídeo', 720, 172);
  texto(ctx, est.x ? `30 minutos em ~${tempoTxt(1800 / est.x)}` : '', 720, 220, {cor: '#F5F2F9'});
  const X0 = 60, LW = 1080, px = t => X0 + LW * t / 1800;
  ctx.strokeStyle = '#43355A'; for (let m = 0; m <= 30; m += 5) { ctx.beginPath(); ctx.moveTo(px(m * 60), 470); ctx.lineTo(px(m * 60), 478); ctx.stroke(); texto(ctx, `${m}:00`, px(m * 60), 462, {cor: '#8E809F', tam: 12, alinhar: 'center'}); }
  const cores = ['#3D5A9E', '#4E7A5A', '#7A4E6B'];
  for (let t = 0, k = 0; t < 1800; k++) { const d = 40 + ((k * 97) % 120); ctx.fillStyle = cores[k % 3]; ctx.fillRect(px(t), 500, Math.max(1, px(Math.min(1800, t + d)) - px(t) - 1), 34); t += d; }
  for (let x = X0; x < X0 + LW; x += 4) { const h = 6 + ((x * 7919) % 22); ctx.fillStyle = 'rgba(95,211,141,.6)'; ctx.fillRect(x, 575 - h / 2, 2, h); }
  ctx.fillStyle = 'rgba(14,9,22,.62)'; ctx.fillRect(px(Math.min(1800, s)), 490, X0 + LW - px(Math.min(1800, s)), 110);
  ctx.fillStyle = '#FFE500'; ctx.fillRect(px(Math.min(1800, s)) - 1, 480, 2, 125);
}

/** Decodifica `n` cópias do clipe e desenha o quadro mais recente de cada uma numa grade. */
async function decodificarVer({clipe, n, segundos, hw, sinal, ctx, grade, aoSegundo}) {
  let erro = null;
  const contas = Array(n).fill(0), ultimos = Array(n).fill(null);
  const decs = Array.from({length: n}, (_, i) => {
    const d = new VideoDecoder({output: f => { contas[i]++; if (ultimos[i]) ultimos[i].close(); ultimos[i] = f; }, error: e => { erro = e; }});
    d.configure({codec: clipe.codec, codedWidth: clipe.largura, codedHeight: clipe.altura, hardwareAcceleration: hw, optimizeForLatency: false});
    return d;
  });
  const fim = performance.now() + segundos * 1000, t0 = performance.now();
  const desenho = setInterval(() => {
    if (!ctx) return;
    const [cols, rows, X0, Y0, w, h] = grade(n);
    ultimos.forEach((f, i) => { const x = X0 + (i % cols) * (w + 8), y = Y0 + Math.floor(i / cols) * (h + 8); if (f) { try { ctx.drawImage(f, x, y, w, h); } catch (e) { /**/ } } else { ctx.fillStyle = '#21172F'; ctx.fillRect(x, y, w, h); } });
  }, 120);
  let ant = contas.slice(), tAnt = performance.now();
  const seg = setInterval(() => { const t = performance.now(), d = contas.map((c, i) => (c - ant[i]) * 1000 / (t - tAnt)); ant = contas.slice(); tAnt = t; aoSegundo && aoSegundo(d); }, 1000);
  const alimentar = async (d) => {
    let ts = 0;
    try {
      while (performance.now() < fim && !erro && !(sinal && sinal.aborted)) {
        for (const q of clipe.dados) {
          if (performance.now() >= fim || erro || d.state === 'closed') return;
          while (d.decodeQueueSize > 6 && d.state !== 'closed') await new Promise(r => { d.addEventListener('dequeue', r, {once: true}); setTimeout(r, 500); });
          if (d.state === 'closed') return;
          d.decode(new EncodedVideoChunk({type: q.key ? 'key' : 'delta', timestamp: ts, duration: 33333, data: q.dados}));
          ts += 33333;
        }
      }
    } catch (e) { erro = erro || e; }
  };
  try { await Promise.all(decs.map(alimentar)); }
  finally {
    clearInterval(desenho); clearInterval(seg);
    decs.forEach(d => { try { d.close(); } catch (e) { /**/ } });
    ultimos.forEach(f => f && f.close());
  }
  ver(sinal);
  if (erro && !contas.some(c => c > 0)) throw erro;                 // não decodificou nada
  const s = (performance.now() - t0) / 1000;
  return contas.map(c => c / s);
}

export async function videoPesado(ui, sinal) {
  const {curva, escala = 1, peq = 1, info, api} = ui, seg = s => Math.max(3, s * escala), dev = peq < 1;
  const r = {threads: THREADS};
  // ---- 1. exportar 30 minutos de 4K
  ui.passo(0); ui.etapa('Exportar 30 minutos de 4K'); curva.etapa('Exportação');
  ui.visual(['#cv2d'], '1 de 4 · Exportar 30 minutos de 4K H.264 (45 Mb/s) pelo codificador da placa, como no Premiere e no DaVinci');
  ui.metrica('Velocidade', '—', 'Abrindo o codificador da placa de vídeo');
  const ctx = tela2d(ui), lt = {quadros: 0, x: null, base: null};
  let ultS = -1, antQ = 0, antT = performance.now();
  const segE = seg(240);
  let ex = await exportarLongo({segundos: segE, sinal, quadrosAlvo: dev ? 1800 : 54000, aoAndar: p => {
    lt.quadros = p.quadros; lt.base = p.base; lt.x = p.quadros / Math.max(.1, p.segundos) / 30;
    const s = Math.floor(p.segundos);
    if (s !== ultS && s > 0) { ultS = s; const t = performance.now(), f = (p.quadros - antQ) * 1000 / (t - antT); antQ = p.quadros; antT = t; if (f > 0 && s > 2) curva.ponto(f); }
    ui.metrica(null, `${fmt(lt.x, 1)}×`, `${fmt(p.quadros)} quadros · ${mmss(p.quadros / 30)} de 30:00 exportados`);
    if (ctx) desenharLinhaTempo(ctx, lt);
  }});
  if (ex) { r.export_via = 'edge'; }
  else {
    // sem codificador no motor do Edge: exporta direto pela placa (FFmpeg), como na Edição de vídeo da aba Testes
    lt.base = null; lt.via = 'Direto pelo codificador da placa (FFmpeg)';
    await api.exportar_iniciar('longo', segE);
    let e;
    for (;;) {
      await espera(500);
      if (sinal.aborted) { await api.exportar_cancelar(); throw interrompido(); }
      e = await api.exportar_estado();
      if (e.quadros != null) {
        const t = performance.now(); lt.quadros = e.quadros; lt.x = e.fps_medio ? e.fps_medio / 30 : null;
        if (t - antT >= 1000) { const f = (e.quadros - antQ) * 1000 / (t - antT); if (f > 0 && antQ > 0) curva.ponto(f); antQ = e.quadros; antT = t; }
        ui.metrica(null, lt.x ? `${fmt(lt.x, 1)}×` : '—', e.txt || ''); if (ctx) desenharLinhaTempo(ctx, lt);
      } else if (e.txt) ui.metrica(null, null, e.txt);
      if (e.fim) break;
    }
    if (e.erro || !(e.resultado && e.resultado.quadros)) throw new Error(e.erro || (e.resultado && e.resultado.erro) || 'A placa de vídeo não exportou.');
    ex = e.resultado; r.export_via = 'ffmpeg'; r.export_codificador = ex.codificador;
  }
  const fpsE = ex.quadros / ex.segundos;
  r.export_fps = r1(fpsE); r.export_x = r1(fpsE / 30); r.export_30min_s = Math.round(54000 / fpsE); r.export_quadros = ex.quadros;
  // ---- 2. redução de ruído e efeitos (DaVinci)
  ver(sinal);
  ui.passo(1); ui.etapa('Redução de ruído e efeitos'); curva.etapa('Redução de ruído');
  const nr = await cenaGPU(ui, sinal, VideoNR, dev ? {largura: 480, altura: 270, W: 960, H: 540} : {largura: 1920, altura: 1080}, seg(120), 'Quadros/s em 4K',
    'Redução de ruído temporal e espacial, correção de cor e brilho nas luzes', '2 de 4 · Redução de ruído e efeitos em 4K · à esquerda da linha, o vídeo com ruído');
  r.nr_fps = r1(nr.fps); r.miniatura = nr.mini;
  // ---- 3. vídeos 4:2:2 10-bit da câmera
  ver(sinal);
  ui.passo(2); ui.etapa('Vídeos 4:2:2 10-bit da câmera'); curva.etapa('4:2:2 10-bit');
  ui.visual(['#cv2d'], '3 de 4 · Vídeos 4:2:2 10-bit (Sony A7 IV, FX3, Canon R6 II) · reprodução contínua');
  ui.metrica('Quadros/s', '—', 'Conferindo quem decodifica este formato');
  const ctx3 = tela2d(ui), F422 = FORMATOS.find(f => f.id === 'hevc422'), clipe422 = await carregarClipe(F422.arq);
  const hw422 = await suporte(clipe422, 'prefer-hardware'), sw422 = hw422 ? false : await suporte(clipe422, 'prefer-software');
  r.c422_via = hw422 ? 'placa' : sw422 ? 'processador' : null;
  if (!r.c422_via) {
    // O motor do Edge (WebView2) não abre HEVC 4:2:2 em vários notebooks, mesmo quando a placa decodifica esse formato
    // (RTX 50, vídeo integrado Intel). Nesse caso vale o que se sabe de cada chip, como no teste de Edição de vídeo da aba Testes.
    const q = quemLe('hevc422', false, info);
    if (q.ok) { r.c422_via = 'previsto'; r.c422_quem = q.quem.replace(/ \(.*\)/, ''); }
  }
  if (ctx3) {
    fundo(ctx3);
    if (hw422) texto(ctx3, 'Decodificado pela placa de vídeo', 40, 660, {cor: '#5FD38D'});
    else if (sw422) texto(ctx3, 'Decodificado pelo processador (a placa não lê este formato)', 40, 660, {cor: '#FFC861'});
    else {
      const linhas = r.c422_via === 'previsto'
        ? ['O motor do Windows usado no teste não abre vídeo 4:2:2 10-bit.', `Pelo modelo do chip, este notebook decodifica o formato no hardware (${r.c422_quem}).`, 'É assim que o Premiere e o DaVinci leem os vídeos da Sony e da Canon.']
        : ['O motor do Windows usado no teste não abre vídeo 4:2:2 10-bit,', 'e a placa deste notebook não decodifica este formato no hardware.', 'No Premiere e no DaVinci, quem lê é o processador: use proxy.'];
      linhas.forEach((l, i) => texto(ctx3, l, 40, 300 + i * 34, {cor: i ? '#C9BFD6' : '#F5F2F9', tam: i ? 16 : 19, peso: i ? 600 : 700}));
      ui.metrica('Quem decodifica', r.c422_via === 'previsto' ? 'A placa' : 'Processador', r.c422_via === 'previsto' ? `${r.c422_quem} · pelo modelo` : 'sem decodificação na placa');
    }
  }
  if (r.c422_via === 'placa' || r.c422_via === 'processador') {
    try {
      const v = await decodificarVer({clipe: clipe422, n: 2, segundos: seg(90), hw: hw422 ? 'prefer-hardware' : 'prefer-software', sinal, ctx: ctx3,
        grade: () => [2, 1, 40, 60, 550, 309], aoSegundo: d => { const m = Math.min(...d); if (m > 0) { curva.ponto(m); ui.metrica(null, fmt(m), `Dois vídeos 4:2:2 10-bit ao mesmo tempo · ${r.c422_via === 'placa' ? 'pela placa de vídeo' : 'pelo processador'}`); } }});
      r.c422_fps = r1(Math.min(...v));
    } catch (e) { if (String(e).includes('interrompido')) throw e; r.c422_via = null; r.c422_fps = null; r.c422_erro = String(e.message || e).slice(0, 160); }
  } else { await espera(6000); r.c422_fps = null; }
  r.c422_resolucao = `${clipe422.largura} × ${clipe422.altura}`;
  // ---- 4. timeline multicâmera
  ver(sinal);
  ui.passo(3); ui.etapa('Timeline multicâmera'); curva.etapa('Multicâmera');
  ui.visual(['#cv2d'], '4 de 4 · Timeline multicâmera · vários vídeos 4K tocando juntos, como na edição de um podcast ou casamento');
  const ctx4 = tela2d(ui), FH = FORMATOS.find(f => f.id === 'h264'), clipe = await carregarClipe(FH.arq);
  const hwH = await suporte(clipe, 'prefer-hardware'), swH = hwH || await suporte(clipe, 'prefer-software');
  const fases = swH ? [1, 2, 4, 6, 9] : [], segF = Math.max(3, seg(150) / 5), res4 = [];
  if (!swH && ctx4) { fundo(ctx4); texto(ctx4, 'Este computador não decodificou vídeo H.264 pelo motor do Windows.', 40, 60, {cor: '#FFC861'}); await espera(3000); }
  for (const n of fases) {
    ver(sinal);
    if (ctx4) { fundo(ctx4); texto(ctx4, `${n} ${n > 1 ? 'câmeras' : 'câmera'} ao mesmo tempo`, 40, 40, {cor: '#F5F2F9', tam: 18, peso: 700}); }
    let v;
    try {
      v = await decodificarVer({clipe, n, segundos: segF, hw: hwH ? 'prefer-hardware' : 'prefer-software', sinal, ctx: ctx4,
        grade: k => { const cols = k <= 1 ? 1 : k <= 4 ? 2 : 3, rows = Math.ceil(k / cols), w = Math.min(1100 / cols, 600 / rows * 16 / 9) - 8; return [cols, rows, 40, 60, w, w * 9 / 16]; },
        aoSegundo: d => { const m = Math.min(...d); ui.metrica('Câmeras juntas', String(n), `A mais lenta a ${fmt(m)} quadros/s (30 = sem travar)`); }});
    } catch (e) { if (String(e).includes('interrompido')) throw e; v = [0]; }
    const pior = Math.min(...v);
    res4.push([n, r1(pior)]);
    if (pior < 20) break;                                            // já travando: não adianta pôr mais câmeras
  }
  r.multicam_fases = res4; r.multicam = Math.max(0, ...res4.filter(([, f]) => f >= 29).map(([n]) => n)); r.multicam_via = hwH ? 'placa' : 'processador';
  const c = curva.resumo();
  r.curva = c.serie; r.curva_etapas = c.etapas; r.curva_total = c.total;
  r.fim_gpu = minN(curva.fimDe('Exportação'), curva.fimDe('Redução de ruído')); r.fim_cpu = null;
  r.ram_gb = (info.ram || {}).gb; r.vram_gb = (info.gpu || {}).vram;
  r.veredito = vereditoVideo(r, info);
  return r;
}

// ================================================================== vereditos (réguas provisórias)
const fraseSust = fim => fim == null ? '' : fim >= 95 ? 'Manteve o desempenho durante os 10 minutos.' : `Depois de alguns minutos, perdeu até ${100 - fim}% da velocidade com o calor.`;

export function vereditoEngenharia(r, info) {
  const ram = (info.ram && info.ram.gb) || 0, vram = (info.gpu && info.gpu.vram) || 0;
  const cad = faixa(r.cad_fps, [60, 40, 25, 12]), fea = faixa(r.fea_it_s, [2500, 1600, 900, 450]), lbm = faixa(r.lbm_mlups, [2000, 1200, 600, 250]);
  const mat = faixa(r.dgemm_gflops, [40, 25, 14, 7]), mem = faixa(ram, [64, 32, 16, 8]);
  const prog = [
    {nome: 'SolidWorks · Inventor', nivel: nMin(cad, mem), texto: `Montagem de ${fmt(r.cad_pecas)} peças a ${fps(r.cad_fps)} quadros/s${ram < 32 ? ' · montagens grandes pedem 32 GB' : ''}`},
    {nome: 'Simulação (ANSYS, SW Simulation)', nivel: nMin(fea, mem), texto: `${fmt(r.fea_it_s)} rodadas de cálculo por segundo em ${r.threads} threads${ram < 64 ? ` · modelos com milhões de elementos pedem 64 GB` : ''}`},
    {nome: 'Fluidos na placa (CFD)', nivel: nMin(lbm, faixa(vram, [12, 8, 6, 4])), texto: `${milhoes(r.lbm_mlups, 0)} de células por segundo · ${vram} GB de vídeo`},
    {nome: 'MATLAB · Python (NumPy)', nivel: nMin(mat, mem), texto: `${fmt(r.dgemm_gflops, 1)} GFLOPS em precisão dupla`},
  ].map(comEstrelas);
  const base = Math.min(...prog.map(p => p.nivel));
  const titulo = base >= 3 ? 'Pronto para projetos e simulações pesadas' : base >= 2 ? 'Bom para projetos e simulações médias' : 'Atende a projetos, mas simulações grandes ficam lentas';
  const frase = `${(fea ?? 2) >= 3 ? 'Resolve simulações rápido' : 'As simulações são o ponto mais lento'}. ${fraseSust(minN(r.fim_cpu, r.fim_gpu))}`.trim();
  const selos = [{txt: 'Estudante de engenharia', ok: base >= 1}, {txt: 'Projeto mecânico (CAD)', ok: (cad ?? 0) >= 2}, {txt: 'Simulação', ok: (fea ?? 0) >= 2 && ram >= 32, quase: (fea ?? 0) >= 2 && ram < 32}];
  return {titulo, frase, programas: prog, selos};
}

export function vereditoProgramacao(r, info) {
  const ram = (info.ram && info.ram.gb) || 0, vram = (info.gpu && info.gpu.vram) || 0;
  const bld = faixa(r.build_s, [25, 40, 65, 110], true), arq = faixa(r.arq_ciclo_s, [20, 35, 60, 120], true), amb = faixa(r.ambientes_ok, [16, 8, 4, 2]);
  const m7 = (r.ia_modelos || [])[0] || {}, m14 = (r.ia_modelos || [])[1] || {};
  const ia = faixa(m14.cabe ? m14.tokens_s : m7.cabe ? m7.tokens_s * .6 : (m7.tokens_s || 0) * .3, [40, 25, 12, 5]);
  const prog = [
    {nome: 'Visual Studio · compiladores', nivel: nMin(bld, faixa(ram, [32, 16, 16, 8])), texto: `5.000 arquivos compilados em ${fmt(r.build_s, 1)} s${r.build_estimado ? ' (estimado)' : ''} · ${r.build_threads || r.threads} threads`},
    {nome: 'Node · Git (arquivos pequenos)', nivel: arq ?? 2, texto: `50 mil arquivos criados, lidos, listados e apagados em ${fmt(r.arq_ciclo_s, 1)} s`},
    {nome: 'Docker · máquinas virtuais', nivel: nMin(amb, faixa(ram, [64, 32, 16, 8])), texto: `${r.ambientes_ok} ambientes juntos sem perder velocidade · cabem ~${r.ambientes_ram} contêineres de 2 GB com ${ram} GB`},
    {nome: 'IA para programar (local)', nivel: ia ?? 1, texto: `${m7.nome || 'Modelo de 7B'} a ${fmt(m7.tokens_s)} tokens/s${m14.cabe ? ` · o de 14B cabe (${fmt(m14.tokens_s)} tokens/s)` : ` · o de 14B não cabe nos ${vram} GB de vídeo`}`},
  ].map(comEstrelas);
  const base = Math.min(prog[0].nivel, prog[2].nivel);
  const titulo = base >= 3 ? 'Pronto para projetos grandes e vários ambientes' : base >= 2 ? 'Bom para desenvolvimento no dia a dia' : 'Atende a projetos pequenos';
  const frase = `${(bld ?? 2) >= 3 ? 'Compila rápido' : 'Compilar projetos grandes leva tempo'}. ${fraseSust(r.fim_cpu)}`.trim();
  const selos = [{txt: 'Web e apps', ok: (bld ?? 0) >= 1}, {txt: 'Projetos grandes (C++, jogos)', ok: (bld ?? 0) >= 3 && ram >= 32, quase: (bld ?? 0) >= 3 && ram < 32}, {txt: 'IA local', ok: (ia ?? 0) >= 2}];
  return {titulo, frase, programas: prog, selos};
}

export function vereditoDesign(r, info) {
  const ram = (info.ram && info.ram.gb) || 0, t = r.tela || {};
  const fil = faixa(r.filtro_medio_s, [.6, 1.2, 2.5, 5], true), exp = faixa(r.jpeg_200_s, [15, 25, 40, 70], true), ia = faixa(r.ia_foto_s, [3, 6, 12, 25], true);
  const vet = faixa(r.vetor_fps, [10, 6, 3.5, 2]), tela = t.srgb == null || t.generico ? null : t.srgb >= 99 && (t.p3 || 0) >= 95 ? 4 : t.srgb >= 98 ? 3 : t.srgb >= 90 ? 2 : t.srgb >= 70 ? 1 : 0;
  const prog = [
    {nome: 'Photoshop', nivel: nMin(fil, faixa(ram, [64, 32, 16, 8])), texto: `Filtros na foto de 100 MP em ${fmt(r.filtro_medio_s, 1)} s em média${ram < 32 ? ' · fotos grandes com muitas camadas pedem 32 GB' : ''}`},
    {nome: 'Lightroom Classic', nivel: nMin(exp, ia), texto: `200 fotos exportadas em ~${tempoTxt(r.jpeg_200_s)} · remover ruído com IA: ${fmt(r.ia_foto_s, 1)} s por foto`},
    {nome: 'Illustrator', nivel: vet ?? 2, texto: `${fmt(r.vetor_fps, 1)} redesenhos por segundo com ${fmt(r.vetor_formas)} formas`},
    {nome: 'Tela (cores)', nivel: tela ?? 1, texto: t.generico ? 'A tela informa só os valores padrão do sRGB, sem medir o painel: as cores reais só com colorímetro' : t.srgb == null ? 'Abra a Ficha no Raio-X para o teste ler as cores da tela' : `${t.srgb}% do sRGB · ${t.p3 ?? '—'}% do DCI-P3${t.tipo ? ` · ${t.tipo}` : ''}`},
  ].map(comEstrelas);
  const base = Math.min(prog[0].nivel, prog[1].nivel);
  const titulo = base >= 3 && (tela ?? 0) >= 3 ? 'Pronto para foto e design profissional' : base >= 3 ? 'Rápido para foto e design · a tela limita' : base >= 2 ? 'Bom para foto e design no dia a dia' : 'Atende a trabalhos leves de foto e design';
  const frase = `${(tela ?? 0) >= 3 ? 'A tela mostra as cores com fidelidade.' : t.generico ? 'As cores da tela não puderam ser conferidas (o painel não informa as próprias medidas).' : t.srgb != null ? 'A tela mostra menos cores do que o ideal para quem trabalha com cor.' : ''} ${fraseSust(minN(r.fim_gpu, r.fim_cpu))}`.trim();
  const selos = [{txt: 'Redes sociais', ok: base >= 1}, {txt: 'Fotografia', ok: (exp ?? 0) >= 2 && (ia ?? 0) >= 2}, {txt: 'Trabalho com cor', ok: (tela ?? 0) >= 3, quase: (tela ?? 0) === 2}];
  return {titulo, frase, programas: prog, selos};
}

export function vereditoVideo(r, info) {
  const vram = (info.gpu && info.gpu.vram) || 0;
  const ex = faixa(r.export_30min_s, [300, 450, 720, 1200], true), nr = faixa(r.nr_fps, [60, 30, 18, 10]), mc = faixa(r.multicam, [9, 6, 4, 2]);
  const c422 = r.c422_via === 'placa' ? (r.c422_fps >= 29 ? 4 : 2) : r.c422_via === 'previsto' ? 3 : r.c422_via === 'processador' ? (r.c422_fps >= 29 ? 2 : 1) : 1;
  const prog = [
    {nome: 'Premiere Pro', nivel: nMin(ex, mc), texto: `30 minutos de 4K exportados em ~${tempoTxt(r.export_30min_s)} · ${r.multicam ? `${r.multicam} ${r.multicam === 1 ? 'câmera' : 'câmeras'} 4K sem travar` : 'nenhuma câmera 4K sem travar'}`},
    {nome: 'DaVinci Resolve', nivel: nMin(nr, faixa(vram, [12, 8, 6, 4])), texto: `Redução de ruído e efeitos em 4K a ${fps(r.nr_fps)} quadros/s · ${vram} GB de vídeo`},
    {nome: 'Câmeras 4:2:2 10-bit', nivel: c422, texto: r.c422_via === 'placa' ? `A placa decodifica · ${fmt(r.c422_fps)} quadros/s` : r.c422_via === 'previsto' ? `Decodificado no hardware (${r.c422_quem}), como no Premiere · velocidade não medida` : r.c422_via === 'processador' ? `Só o processador decodifica · ${fmt(r.c422_fps)} quadros/s: use proxy` : 'A placa não decodifica 4:2:2: o processador lê e a timeline fica pesada (use proxy)'},
    {nome: 'Multicâmera', nivel: mc ?? 0, texto: r.multicam ? `${r.multicam} ${r.multicam === 1 ? 'vídeo' : 'vídeos'} 4K juntos a 30 quadros/s (${r.multicam_via === 'placa' ? 'pela placa' : 'pelo processador'})` : (r.multicam_fases || []).length ? 'Nem um vídeo 4K chegou a 30 quadros/s' : 'O motor do Windows não decodificou H.264 neste computador'},
  ].map(comEstrelas);
  const base = Math.min(prog[0].nivel, prog[1].nivel);
  const titulo = base >= 3 ? 'Pronto para edição 4K profissional' : base >= 2 ? 'Bom para editar em 4K' : 'Edita em 4K com proxy';
  const frase = `${r.export_x ? `Exporta ${fmt(r.export_x, 1)}× mais rápido que o tempo real.` : ''} ${fraseSust(r.fim_gpu)}`.trim();
  const selos = [{txt: 'YouTube e Reels', ok: (ex ?? 0) >= 1}, {txt: 'Câmeras profissionais 4:2:2', ok: c422 >= 3, quase: c422 === 2}, {txt: 'Multicâmera', ok: (mc ?? 0) >= 2}];
  return {titulo, frase, programas: prog, selos};
}
export {criarIlustracao, desenharIlustracao};   // para conferência visual
