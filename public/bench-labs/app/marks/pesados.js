/* Bench Marks · testes pesados por profissão (aba Testes pesados)
 *
 * Cada teste dura cerca de 10 minutos, em 4 etapas, e mede também se o desempenho se mantém do começo ao fim
 * (o "desempenho ao longo dos 10 minutos"): notebooks que esquentam perdem velocidade no meio do trabalho.
 *
 *   Arquitetura · navegação em 3 tamanhos de projeto, ray tracing em tempo real, regenerar o modelo depois de mover
 *                 uma parede (um núcleo, como o Revit) e render final no processador (como o V-Ray e o Corona).
 *   Odontologia · tomografia 3D (CBCT) na placa, escaneamento intraoral ao vivo no processador, prótese com
 *                 10 milhões de triângulos (exocad) e fatias da tomografia. No fim, confere os requisitos oficiais.
 *
 * A interface passa um objeto `ui` com: passo(i), visual(lista, etiqueta), metrica(rot, valor, texto), etapa(nome),
 * miniatura(imagem), curva (Curva), cv2d, cvgpu, CV, escala, peq e info.
 * As réguas dos vereditos são provisórias: calibrar com os programas de verdade nos notebooks da bancada.
 */
import {THREADS, cpuRender} from './testes.js';
import {Navegacao, montarModelo} from './viewport.js';
import {Render} from './pathtracer.js';
import {VolumeCBCT, ProteseGPU} from './odonto_gpu.js';
import {DENTES} from './odonto_anatomia.js';

const URL_CPU = new URL('./cpu_worker.js', import.meta.url), URL_ODONTO = new URL('./odonto_worker.js', import.meta.url);
const interrompido = () => new Error('interrompido');
const ver = s => { if (s && s.aborted) throw interrompido(); };
const media = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const r1 = v => v == null ? null : Math.round(v * 10) / 10;
const fmt = (n, d = 0) => n == null || isNaN(n) ? '—' : Number(n).toLocaleString('pt-BR', {maximumFractionDigits: d, minimumFractionDigits: d});
const milhoes = (n, d = 1) => `${fmt(n, d)} ${Math.abs(+Number(n).toFixed(d)) < 2 ? 'milhão' : 'milhões'}`;  // 1,6 milhão · 2,4 milhões
const triTxt = n => n < 1e6 ? `${fmt(n / 1e3)} mil triângulos` : `${milhoes(n / 1e6)} de triângulos`;
const fps = v => !(v > 0) || !isFinite(v) ? '—' : fmt(v, v < 10 ? 1 : 0);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const PASSOS = {
  p_arquitetura: ['Navegação em 3 tamanhos', 'Ray tracing em tempo real', 'Regenerar depois de mover parede', 'Render final no processador'],
  p_odonto: ['Tomografia 3D (CBCT)', 'Escaneamento ao vivo', 'Prótese com 10 milhões de triângulos', 'Fatias da tomografia'],
};

// ================================================================== desempenho ao longo do teste
/** Guarda a velocidade de cada segundo e compara com o começo de cada etapa (100% = segundos 3 a 12). */
export class Curva {
  constructor() { this.t0 = performance.now(); this.etapas = []; this.atual = null; }
  get tempo() { return (performance.now() - this.t0) / 1000; }
  etapa(nome) { this.atual = {nome, ini: this.tempo, amostras: []}; this.etapas.push(this.atual); return this.atual; }
  ponto(v) { if (this.atual && v > 0 && isFinite(v)) this.atual.amostras.push([this.tempo, v]); }
  static base(e) {
    const jan = e.amostras.filter(([t]) => t - e.ini >= 3 && t - e.ini <= 12);
    const xs = (jan.length >= 3 ? jan : e.amostras.slice(0, Math.max(1, Math.ceil(e.amostras.length * .3)))).map(x => x[1]);
    return media(xs) || null;
  }
  fim(e) {
    const b = Curva.base(e);
    if (!b || e.amostras.length < 6) return null;
    const n = Math.max(2, Math.floor(e.amostras.length / 4));
    return Math.min(100, Math.round(100 * media(e.amostras.slice(-n).map(x => x[1])) / b));
  }
  serie() {
    const out = [];
    this.etapas.forEach((e, i) => { const b = Curva.base(e); if (b) e.amostras.forEach(([t, v]) => out.push([Math.round(t * 10) / 10, Math.round(1000 * v / b) / 10, i])); });
    return out;
  }
  resumo() {
    // no resultado, um ponto a cada 2 s basta
    const s = this.serie(), comp = [];
    for (let i = 0; i < s.length;) {
      let j = i; const g = s[i][2], t0 = Math.floor(s[i][0] / 2);
      while (j < s.length && s[j][2] === g && Math.floor(s[j][0] / 2) === t0) j++;
      comp.push([s[i][0], Math.round(10 * media(s.slice(i, j).map(x => x[1]))) / 10, g]);
      i = j;
    }
    return {etapas: this.etapas.map(e => ({nome: e.nome, ini: Math.round(e.ini), fim_pct: this.fim(e)})), serie: comp, total: Math.round(this.tempo)};
  }
  fimDe(nome) { const e = this.etapas.find(x => x.nome === nome); return e ? this.fim(e) : null; }
}

/** Gráfico da curva: 100% = o começo de cada etapa; abaixo de 100%, o notebook perdeu velocidade. */
export function curvaSVG(serie, etapas, total, {altura = 150, minimo = 60} = {}) {
  const W = 1000, H = altura, X = t => Math.max(0, Math.min(W, t / Math.max(total, 1) * W)), Y = v => H - (Math.max(minimo, Math.min(110, v)) - minimo) / (110 - minimo) * H;
  let svg = '';
  for (const v of [100, 90, 80, 70]) if (v >= minimo) svg += `<line x1="0" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,${v === 100 ? .2 : .07})" vector-effect="non-scaling-stroke"/>`;
  (etapas || []).forEach((e, i) => { if (i) svg += `<line x1="${X(e.ini)}" x2="${X(e.ini)}" y1="0" y2="${H}" stroke="rgba(255,255,255,.12)" stroke-dasharray="4 5" vector-effect="non-scaling-stroke"/>`; });
  let d = '', g = -1;
  for (const [t, v, k] of serie || []) { d += `${k !== g ? 'M' : 'L'}${X(t).toFixed(1)} ${Y(v).toFixed(1)} `; g = k; }
  if (d) svg += `<path d="${d}" fill="none" stroke="var(--destaque,#FFE500)" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Desempenho ao longo do teste">${svg}</svg>`;
}

// ================================================================== workers
/** Vários workers com a mesma tarefa. Cancela encerrando todos. */
function rodarPool({url, n, msg, sinal, aoMsg, folga = 90}) {
  const ws = Array.from({length: n}, () => new Worker(url, {type: 'module'}));
  let fim = false;
  const encerrar = () => { if (!fim) { fim = true; ws.forEach(w => w.terminate()); } };
  return new Promise((ok, falha) => {
    const res = new Array(n);
    let prontos = 0;
    const abortar = () => { encerrar(); falha(interrompido()); };
    if (sinal) { if (sinal.aborted) return abortar(); sinal.addEventListener('abort', abortar, {once: true}); }
    const vigia = setTimeout(() => { encerrar(); falha(new Error('O processador parou de responder durante o teste.')); }, ((msg.segundos || 60) + folga) * 1000);
    ws.forEach((w, i) => {
      w.onmessage = e => {
        const m = e.data;
        if (m.tipo === 'erro') { clearTimeout(vigia); encerrar(); falha(new Error(m.erro)); return; }
        if (m.tipo === 'fim') {
          res[i] = m;
          if (++prontos === n) { clearTimeout(vigia); encerrar(); if (sinal) sinal.removeEventListener('abort', abortar); ok(res); }
          return;
        }
        aoMsg && aoMsg(i, m);
      };
      w.onerror = e => { clearTimeout(vigia); encerrar(); falha(new Error(e.message || 'Erro no processamento.')); };
      w.postMessage({...msg, id: i, fase: i / n, visual: i === 0});
    });
  });
}

/** Mede a taxa total por segundo (soma dos workers) a partir de contadores acumulados. */
function taxaPorSegundo(curva, aoTaxa) {
  const atual = [], ant = {v: 0, t: performance.now()};
  const int = setInterval(() => {
    const tot = atual.reduce((s, x) => s + (x || 0), 0), t = performance.now();
    const taxa = (tot - ant.v) * 1000 / (t - ant.t);
    ant.v = tot; ant.t = t;
    if (taxa > 0) { curva.ponto(taxa); aoTaxa && aoTaxa(taxa, tot); }
  }, 1000);
  return {atual, parar: () => clearInterval(int)};
}

// ================================================================== ARQUITETURA
/** Regenerar depois de mover parede, repetindo até completar `segundos` (um núcleo, como o Revit). */
function regenerarTempo({segundos, sinal, canvas, aoAndar}) {
  const w = new Worker(URL_CPU, {type: 'module'});
  const ctx = canvas ? canvas.getContext('2d') : null;
  if (canvas) { canvas.width = 1200; canvas.height = 700; }
  const tempos = [];
  return new Promise((ok, falha) => {
    const abortar = () => { w.terminate(); falha(interrompido()); };
    if (sinal) sinal.addEventListener('abort', abortar, {once: true});
    w.onmessage = e => {
      const m = e.data;
      if (m.tipo === 'erro') { w.terminate(); falha(new Error(m.erro)); return; }
      if (m.tipo === 'andamento') { tempos.push(m.ultimo); if (ctx) desenharPlanta(ctx, m.feitas, tempos); aoAndar && aoAndar({feitas: m.feitas, ultimo: m.ultimo}); }
      if (m.tipo === 'fim') { w.terminate(); if (sinal) sinal.removeEventListener('abort', abortar); ok(m); }
    };
    if (ctx) desenharPlanta(ctx, 0, tempos);
    w.postMessage({tipo: 'bim', alteracoes: 1e6, segundos});
  });
}

/** Planta de um andar com a parede que se move, as cotas e as áreas recalculadas, e o tempo de cada regeneração. */
function desenharPlanta(ctx, k, tempos) {
  const E = 12.5, X0 = 90, Y0 = 110, mx = x => X0 + x * E, my = y => Y0 + y * E;
  const desloc = k % 2 ? 1.2 : 0;                                       // a parede vai e volta a cada alteração
  const xs = [0, 16, 32 + desloc, 48, 64];
  ctx.fillStyle = '#120B1C'; ctx.fillRect(0, 0, 1200, 700);
  ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
  for (let x = 0; x <= 1200; x += 25) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 700); ctx.stroke(); }
  for (let y = 0; y <= 700; y += 25) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
  // ambientes (hachura leve) e áreas
  ctx.font = '600 15px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
  const nomes = [['Sala', 'Cozinha', 'Escritório', 'Suíte'], ['Quarto', 'Banho', 'Quarto', 'Varanda']];
  for (let fila = 0; fila < 2; fila++) for (let i = 0; i < 4; i++) {
    const y0 = fila ? 22 : 0, y1 = fila ? 40 : 18, x0 = xs[i], x1 = xs[i + 1], area = (x1 - x0) * (y1 - y0);
    const destaque = i === 1 || i === 2;
    ctx.fillStyle = destaque ? 'rgba(255,229,0,.06)' : 'rgba(255,255,255,.025)'; ctx.fillRect(mx(x0), my(y0), (x1 - x0) * E, (y1 - y0) * E);
    ctx.fillStyle = '#C9BFD6'; ctx.fillText(nomes[fila][i], mx((x0 + x1) / 2), my((y0 + y1) / 2) - 4);
    ctx.fillStyle = destaque ? '#FFE500' : '#8E809F'; ctx.font = '500 13px "Segoe UI", sans-serif';
    ctx.fillText(`${area.toLocaleString('pt-BR', {maximumFractionDigits: 1})} m²`, mx((x0 + x1) / 2), my((y0 + y1) / 2) + 16);
    ctx.font = '600 15px "Segoe UI", sans-serif';
  }
  ctx.fillStyle = '#8E809F'; ctx.fillText('Circulação', mx(8), my(20) + 5);
  // paredes externas, internas e o corredor
  ctx.strokeStyle = '#F5F2F9'; ctx.lineWidth = 6; ctx.strokeRect(mx(0), my(0), 64 * E, 40 * E);
  ctx.lineWidth = 3.5;
  for (const y of [18, 22]) { ctx.beginPath(); ctx.moveTo(mx(0), my(y)); ctx.lineTo(mx(64), my(y)); ctx.stroke(); }
  for (const [i, x] of xs.entries()) {
    if (i === 0 || i === 4) continue;
    ctx.strokeStyle = i === 2 ? '#FFE500' : '#F5F2F9'; ctx.lineWidth = i === 2 ? 5 : 3.5;
    for (const [a, b] of [[0, 18], [22, 40]]) { ctx.beginPath(); ctx.moveTo(mx(x), my(a)); ctx.lineTo(mx(x), my(b)); ctx.stroke(); }
  }
  // portas (giro) e janelas
  ctx.strokeStyle = '#8E809F'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) for (const fila of [0, 1]) {
    const x = (xs[i] + xs[i + 1]) / 2 - 1.5, y = fila ? 22 : 18, r = 2.4 * E;
    ctx.beginPath(); ctx.arc(mx(x), my(y), r, fila ? 0 : Math.PI * 1.5, fila ? Math.PI * .5 : Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = '#62D2FF'; ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) for (const y of [0, 40]) { const x = (xs[i] + xs[i + 1]) / 2; ctx.beginPath(); ctx.moveTo(mx(x - 3), my(y)); ctx.lineTo(mx(x + 3), my(y)); ctx.stroke(); }
  // cotas dos dois ambientes vizinhos da parede
  ctx.strokeStyle = '#FFE500'; ctx.fillStyle = '#FFE500'; ctx.lineWidth = 1.2; ctx.font = '700 14px "Segoe UI", sans-serif';
  for (const [a, b] of [[xs[1], xs[2]], [xs[2], xs[3]]]) {
    const y = my(-3);
    ctx.beginPath(); ctx.moveTo(mx(a), y); ctx.lineTo(mx(b), y); ctx.moveTo(mx(a), y - 6); ctx.lineTo(mx(a), y + 6); ctx.moveTo(mx(b), y - 6); ctx.lineTo(mx(b), y + 6); ctx.stroke();
    ctx.fillText(`${(b - a).toLocaleString('pt-BR', {maximumFractionDigits: 1})} m`, mx((a + b) / 2), y - 8);
  }
  ctx.textAlign = 'left'; ctx.fillStyle = '#C9BFD6'; ctx.font = '600 15px "Segoe UI", sans-serif';
  ctx.fillText(`Alteração ${k} · mover a parede amarela e regenerar o prédio de 20 andares`, X0, 670);
  // tempo de cada regeneração (últimas 30)
  const ult = tempos.slice(-30), mxT = Math.max(...ult, .05);
  ctx.fillStyle = '#8E809F'; ctx.font = '600 12px "Segoe UI", sans-serif'; ctx.fillText('TEMPO DE CADA REGENERAÇÃO', 960, 120);
  ult.forEach((t, i) => { const h = 380 * t / mxT; ctx.fillStyle = i === ult.length - 1 ? '#FFE500' : 'rgba(255,229,0,.35)'; ctx.fillRect(960 + i * 7, 520 - h, 5, h); });
  ctx.fillStyle = '#F5F2F9'; ctx.font = '800 30px "Segoe UI", sans-serif';
  if (ult.length) ctx.fillText(`${ult.at(-1).toLocaleString('pt-BR', {maximumFractionDigits: 2, minimumFractionDigits: 2})} s`, 960, 570);
}

export async function arquiteturaPesado(ui, sinal) {
  const {curva, escala = 1, peq = 1, CV} = ui, seg = s => Math.max(3, s * escala);
  const r = {threads: THREADS};
  // ---- 1. navegação em 3 tamanhos de projeto (como a janela 3D do Revit e do SketchUp, faces com arestas)
  ui.passo(0);
  const dev = peq < 1;                                                 // conferência no navegador sem placa: projetos menores
  const TAM = [['casa', 'Casa', {linhas: 1, colunas: 2}, .4, 'duas casas com jardim'], ['condominio', 'Condomínio', dev ? {linhas: 4, colunas: 6} : {linhas: 24, colunas: 32}, 1, '768 casas completas'],
               ['bairro', 'Bairro', dev ? {linhas: 6, colunas: 8} : {linhas: 48, colunas: 64}, 1.7, '3.072 casas completas']];
  for (const [k, nome, cfg, cam, desc] of TAM) {
    ver(sinal);
    ui.etapa(`Navegação · ${nome}`); curva.etapa(nome);
    ui.metrica('Quadros/s', '—', `Abrindo o projeto: ${desc}`);
    const nav = new Navegacao();
    await nav.iniciar(CV(ui.cvgpu), {largura: 1920 * peq, altura: 1080 * peq, modelo: montarModelo(cfg), camera: cam});
    const tri = nav.modelo.triangulos;
    ui.visual(['#cvgpu'], `1 de 4 · Navegação · ${nome} · ${triTxt(tri)}`);
    try {
      let ultS = -1;
      const x = await nav.rodar('sombreado', seg(60), p => {
        const s = Math.floor(p.segundos); if (s !== ultS && s > 0) { ultS = s; curva.ponto(p.fpsAgora); }
        ui.metrica(null, fps(p.fpsAgora), `${nome} · ${desc} · ${triTxt(tri)}`);
      }, sinal);
      r[`nav_${k}`] = r1(x.fps); r[`tri_${k}`] = tri;
      if (k === 'condominio') { try { r.miniatura = ui.miniatura(await nav.capturar()); } catch (e) { /* sem miniatura */ } }
    } finally { nav.destruir(); }
  }
  // ---- 2. ray tracing em tempo real (Enscape, Twinmotion, D5 Render)
  ver(sinal);
  ui.passo(1); ui.etapa('Ray tracing em tempo real'); curva.etapa('Ray tracing');
  const ren = new Render();
  await ren.iniciar(CV(ui.cvgpu), {largura: 1920 * peq, altura: 1080 * peq});
  ui.visual(['#cvgpu'], '2 de 4 · Ray tracing em tempo real · Full HD · luz do sol e reflexos a cada quadro');
  ui.metrica('Quadros/s com ray tracing', '—', 'Preparando a cena');
  try {
    let ultS = -1;
    const x = await ren.tempoReal(seg(120), p => {
      const s = Math.floor(p.segundos); if (s !== ultS && s > 0) { ultS = s; curva.ponto(p.fpsAgora); }
      ui.metrica('Quadros/s com ray tracing', fps(p.fpsAgora), 'A câmera passeia pela sala; luz e reflexos calculados a cada quadro, como no Enscape e no Twinmotion');
    }, sinal);
    r.rt_fps = r1(x.fps);
  } finally { ren.destruir(); }
  // ---- 3. regenerar depois de mover parede (um núcleo, como o Revit)
  ver(sinal);
  ui.passo(2); ui.etapa('Regenerar depois de mover parede'); curva.etapa('Regenerar');
  ui.visual(['#cv2d'], '3 de 4 · Regenerar depois de mover parede · um núcleo, como no Revit');
  ui.metrica('Segundos por alteração', '—', 'Paredes, aberturas, ambientes, cotas e tabelas recalculados a cada alteração');
  const reg = await regenerarTempo({segundos: seg(120), sinal, canvas: ui.cv2d, aoAndar: q => {
    curva.ponto(1 / Math.max(q.ultimo, 1e-3));
    ui.metrica(null, fmt(q.ultimo, 2), `${q.feitas} alterações · paredes, aberturas, ambientes, cotas e tabelas recalculados`);
  }});
  const ord = [...reg.tempos].sort((a, b) => a - b);
  r.regen_s = ord.length ? Math.round(ord[Math.floor(ord.length / 2)] * 1000) / 1000 : null;
  r.regen_alteracoes = reg.tempos.length; r.bim_tri = reg.triangulos;
  // ---- 4. render final no processador (V-Ray, Corona)
  ver(sinal);
  ui.passo(3); ui.etapa('Render final no processador'); curva.etapa('Render no processador');
  ui.visual(['#cv2d'], `4 de 4 · Render final no processador · ${THREADS} threads, como o V-Ray e o Corona`);
  const segR = seg(180);
  let ultS = -1;
  const m = await cpuRender({segundos: segR, threads: THREADS, canvas: ui.cv2d, sinal, aoAndar: p => {
    const s = Math.floor(p.segundos); if (s !== ultS && s > 0) { ultS = s; curva.ponto(p.pontosAgora); }
    ui.metrica('Pontos · todos os núcleos', p.pontosAgora > 0 ? fmt(p.pontosAgora) : '—', `${mmss(p.segundos)} de ${mmss(segR)} · ${THREADS} threads · os mesmos pontos do teste de CPU, sustentados por 3 minutos`);
  }});
  r.cpu_pontos = m.pontos;
  r.render4k_s = Math.round(3840 * 2160 * 2048 / Math.max(1, m.amostrasSeg));      // imagem 4K com 2.048 amostras por pixel
  // ---- resumo
  const c = curva.resumo();
  r.curva = c.serie; r.curva_etapas = c.etapas; r.curva_total = c.total;
  r.fim_gpu = minN(curva.fimDe('Bairro'), curva.fimDe('Ray tracing'));
  r.fim_cpu = curva.fimDe('Render no processador'); r.fim_regen = curva.fimDe('Regenerar');
  r.ram_gb = (ui.info.ram || {}).gb; r.vram_gb = (ui.info.gpu || {}).vram;
  r.veredito = vereditoArquitetura(r, ui.info);
  return r;
}

// ================================================================== ODONTOLOGIA
const W2 = 1200, H2 = 700;
function desenharScan(ctx, est, n) {
  const E = 680, mx = x => 600 + x * E, mz = z => 70 + (.72 - z) * E;
  ctx.fillStyle = '#120B1C'; ctx.fillRect(0, 0, W2, H2);
  // cobertura já escaneada (fusão em voxels), da ponteira principal
  const v = est.visual;
  if (v && v.cobertura) {
    const [gx, gz, x0, z0, c] = v.grade;
    if (!est.img || est.img.width !== gx) { est.img = new ImageData(gx, gz); est.cv = document.createElement('canvas'); est.cv.width = gx; est.cv.height = gz; }
    // relevo sombreado da superfície montada: dentes em tom de gesso, gengiva rosada (como a tela dos scanners)
    const d = est.img.data, h = v.cobertura, L = [-.45, .75, .48];
    for (let j = 0; j < gz; j++) for (let i = 0; i < gx; i++) {
      const k = j * gx + i, o = k * 4, y = h[k];
      if (!(y === y)) { d[o + 3] = 0; continue; }
      const hx1 = h[k + 1], hx0 = h[k - 1], hz1 = h[k + gx], hz0 = h[k - gx];
      const dx = (i > 0 && i < gx - 1 && hx1 === hx1 && hx0 === hx0) ? (hx1 - hx0) / (2 * c) : 0;
      const dz = (j > 0 && j < gz - 1 && hz1 === hz1 && hz0 === hz0) ? (hz1 - hz0) / (2 * c) : 0;
      const il = 1 / Math.sqrt(dx * dx + 1 + dz * dz), luz = Math.max(0, (-dx * L[0] + L[1] - dz * L[2]) * il);
      const sh = .3 + .75 * luz, dente = y > -.09;
      d[o] = Math.min(255, (dente ? 236 : 212) * sh); d[o + 1] = Math.min(255, (dente ? 229 : 132) * sh); d[o + 2] = Math.min(255, (dente ? 214 : 146) * sh); d[o + 3] = 255;
    }
    est.cv.getContext('2d').putImageData(est.img, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = true;
    ctx.translate(mx(x0), mz(z0)); ctx.scale(c * E, -c * E); ctx.drawImage(est.cv, 0, 0); ctx.restore();
  }
  // contorno dos dentes de baixo
  ctx.strokeStyle = 'rgba(245,242,249,.35)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 16; i++) { const D = DENTES[i]; ctx.beginPath(); ctx.ellipse(mx(D.x), mz(D.z), D.rw * E, D.rd * E, -Math.atan2(D.tz, D.tx), 0, Math.PI * 2); ctx.stroke(); }
  // pontos da imagem atual e as ponteiras
  if (v && v.pontos) { ctx.fillStyle = '#5FD38D'; for (let i = 0; i < v.pontos.length; i += 2) ctx.fillRect(mx(v.pontos[i]) - 1, mz(v.pontos[i + 1]) - 1, 2, 2); }
  est.sondas.forEach((s, i) => {
    if (!s) return;
    const [cx, cz, a] = s;
    ctx.save(); ctx.translate(mx(cx), mz(cz)); ctx.rotate(-a);
    ctx.strokeStyle = i ? 'rgba(181,124,255,.45)' : '#FFE500'; ctx.lineWidth = i ? 1.2 : 2.5;
    ctx.strokeRect(-.075 * E, -.055 * E, .15 * E, .11 * E);
    if (!i) { ctx.fillStyle = 'rgba(255,229,0,.12)'; ctx.fillRect(-.075 * E, -.055 * E, .15 * E, .11 * E); }
    ctx.restore();
  });
  ctx.fillStyle = '#C9BFD6'; ctx.font = '600 15px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`${n} ${n > 1 ? 'escaneamentos ao mesmo tempo, um por thread' : 'escaneamento'} · em amarelo, a ponteira principal; em relevo, a arcada que ela já montou`, 40, 670);
}

function desenharFatias(ctx, prev) {
  ctx.fillStyle = '#120B1C'; ctx.fillRect(0, 0, W2, H2);
  const painel = (qual, x, y, w, h) => {
    const p = prev[qual];
    ctx.fillStyle = '#0B0712'; ctx.fillRect(x, y, w, h);
    if (p) {
      if (!p.cv) { p.cv = document.createElement('canvas'); p.cv.width = 160; p.cv.height = 160; const im = new ImageData(160, 160); for (let i = 0; i < 25600; i++) { const g = p.img[i]; im.data[i * 4] = g; im.data[i * 4 + 1] = g; im.data[i * 4 + 2] = g * .96; im.data[i * 4 + 3] = 255; } p.cv.getContext('2d').putImageData(im, 0, 0); }
      ctx.imageSmoothingEnabled = true; ctx.drawImage(p.cv, x, y, w, h);
    }
    ctx.strokeStyle = '#30243D'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    ctx.fillStyle = '#C9BFD6'; ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(['AXIAL', 'CORONAL', 'SAGITAL', 'TRANSVERSAL (IMPLANTE)', 'PANORÂMICA'][qual], x, y - 8);
  };
  painel(0, 90, 82, 270, 270); painel(1, 465, 82, 270, 270); painel(2, 840, 82, 270, 270);
  painel(4, 90, 400, 645, 270); painel(3, 840, 400, 270, 270);
}

export async function odontoPesado(ui, sinal) {
  const {curva, escala = 1, peq = 1, CV, info} = ui, seg = s => Math.max(3, s * escala);
  const r = {threads: THREADS};
  // ---- 1. tomografia 3D (CBCT) na placa de vídeo
  ui.passo(0); ui.etapa('Tomografia 3D (CBCT)'); curva.etapa('Tomografia 3D');
  ui.visual(['#disco-vis']); ui.texto('Montando a tomografia na memória de vídeo', 0, 'Volume de 512 × 512 × 448 voxels (cerca de 115 MB), como o arquivo de um tomógrafo odontológico.');
  ui.metrica('Montando', '0%', 'Tomografia 3D (CBCT)');
  const dim = peq < 1 ? [256, 256, 224] : [512, 512, 448];
  const vol = new VolumeCBCT();
  try {
    await vol.iniciar(CV(ui.cvgpu), {largura: 1920 * peq, altura: 1080 * peq, dim, aoMontar: p => { ui.texto(null, p); ui.metrica(null, `${p}%`); ver(sinal); }});
    r.cbct_montagem_s = r1(vol.montagem_s); r.cbct_mb = vol.mb;
    ui.visual(['#cvgpu'], `1 de 4 · Tomografia 3D (CBCT) · ${dim.join(' × ')} voxels · renderização de volume em Full HD`);
    let ultS = -1;
    const x = await vol.rodar(seg(180), p => {
      const s = Math.floor(p.segundos); if (s !== ultS && s > 0) { ultS = s; curva.ponto(p.fpsAgora); }
      ui.metrica('Quadros/s', fps(p.fpsAgora), 'Girando a tomografia com pele, osso e dentes, como no Romexis e no Blue Sky Plan');
    }, sinal);
    r.cbct_fps = r1(x.fps);
    try { r.miniatura = ui.miniatura(await vol.capturar()); } catch (e) { /* sem miniatura */ }
  } finally { vol.destruir(); }
  // ---- 2. escaneamento intraoral ao vivo, no processador
  ver(sinal);
  ui.passo(1); ui.etapa('Escaneamento ao vivo'); curva.etapa('Escaneamento');
  ui.visual(['#cv2d'], `2 de 4 · Escaneamento ao vivo · cada imagem 3D é alinhada e somada à malha · ${THREADS} threads`);
  ui.metrica('Imagens 3D por segundo', '—', 'Alinhando as imagens da ponteira e montando a arcada');
  const cv = ui.cv2d, ctx = cv ? cv.getContext('2d') : null;
  if (cv) { cv.width = W2; cv.height = H2; }
  const est = {sondas: [], visual: null};
  const segS = seg(180), tx = taxaPorSegundo(curva, (taxa) => ui.metrica(null, fmt(taxa), `${fmt(taxa / THREADS)} por thread · 23 mil pontos por imagem · alinhamento (ICP) e fusão em voxels`));
  let desenho = 0;
  try {
    const res = await rodarPool({url: URL_ODONTO, n: THREADS, sinal, msg: {tipo: 'scan', segundos: segS}, aoMsg: (i, m) => {
      if (m.tipo !== 'andamento') return;
      tx.atual[i] = m.quadros; est.sondas[i] = m.sonda;
      if (m.cobertura) est.visual = m;
      const t = performance.now();
      if (ctx && t - desenho > 150) { desenho = t; desenharScan(ctx, est, THREADS); }
    }});
    const quadros = res.reduce((s, x) => s + x.quadros, 0), segundos = Math.max(...res.map(x => x.segundos));
    r.scan_ips = Math.round(quadros / segundos);
    r.scan_erro_um = Math.round(media(res.map(x => x.erro_medio || 0)) * 39000);     // 1 unidade da boca ≈ 39 mm
    r.scan_pontos = res[0].pontos_por_imagem;
  } finally { tx.parar(); }
  // ---- 3. prótese com 10 milhões de triângulos (exocad), na placa
  ver(sinal);
  ui.passo(2); ui.etapa('Prótese com 10 milhões de triângulos'); curva.etapa('Prótese');
  const pro = new ProteseGPU();
  try {
    await pro.iniciar(CV(ui.cvgpu), {largura: 1920 * peq, altura: 1080 * peq, grade: peq < 1 ? 160 : 580});
    r.protese_tri = pro.triangulos;
    ui.visual(['#cvgpu'], `3 de 4 · Prótese · ${triTxt(pro.triangulos)} · coroa com a margem em amarelo`);
    ui.metrica('Quadros/s', '—', 'Preparando a malha');
    let ultS = -1;
    const x = await pro.rodar(seg(120), p => {
      const s = Math.floor(p.segundos); if (s !== ultS && s > 0) { ultS = s; curva.ponto(p.fpsAgora); }
      ui.metrica('Quadros/s', fps(p.fpsAgora), 'Girando o modelo da arcada com a coroa, como no exocad');
    }, sinal);
    r.protese_fps = r1(x.fps);
    try { r.mini_protese = ui.miniatura(await pro.capturar()); } catch (e) { /* sem miniatura */ }
  } finally { pro.destruir(); }
  // ---- 4. fatias da tomografia, no processador
  ver(sinal);
  ui.passo(3); ui.etapa('Fatias da tomografia'); curva.etapa('Fatias');
  ui.visual(['#cv2d'], `4 de 4 · Fatias da tomografia · axial, coronal, sagital, transversal e panorâmica · ${THREADS} threads`);
  ui.metrica('Fatias por segundo', '—', 'Abrindo a tomografia em cada thread');
  const prev = {}, segF = seg(120);
  if (cv) { cv.width = W2; cv.height = H2; desenharFatias(ctx, prev); }
  const tf = taxaPorSegundo(curva, (taxa) => ui.metrica(null, fmt(taxa), 'Cortes com espessura e panorâmica, como no planejamento de implantes'));
  try {
    const res = await rodarPool({url: URL_ODONTO, n: THREADS, sinal, msg: {tipo: 'fatias', segundos: segF}, aoMsg: (i, m) => {
      if (m.tipo === 'andamento') tf.atual[i] = m.fatias;
      if (m.tipo === 'previa') { prev[m.qual] = {img: m.img}; if (ctx) desenharFatias(ctx, prev); }
    }});
    const n = res.reduce((s, x) => s + x.fatias, 0), segundos = Math.max(...res.map(x => x.segundos));
    r.fatias_s = Math.round(n / segundos);
    r.fatias_preparo_s = r1(media(res.map(x => x.preparo_s)));
  } finally { tf.parar(); }
  // ---- resumo, requisitos oficiais e veredito
  const c = curva.resumo();
  r.curva = c.serie; r.curva_etapas = c.etapas; r.curva_total = c.total;
  r.fim_gpu = curva.fimDe('Tomografia 3D'); r.fim_cpu = curva.fimDe('Escaneamento');
  r.ram_gb = (info.ram || {}).gb; r.vram_gb = (info.gpu || {}).vram;
  r.requisitos = requisitosOdonto(info);
  r.veredito = vereditoOdonto(r, info);
  return r;
}

// ================================================================== requisitos oficiais (Odontologia)
/** Lê o processador pelo nome e devolve um número de comparação (geração equivalente, classe e sufixo). */
export function cpuNivel(nome) {
  const n = String(nome || '');
  let m, classe = null, ger = null, suf = '', marca = /intel/i.test(n) ? 'intel' : /amd|ryzen/i.test(n) ? 'amd' : '';
  if ((m = n.match(/Ultra\s*([3579])\s*(\d)(\d{2})\s*([A-Z]*)/i))) { marca = 'intel'; classe = +m[1]; ger = m[2] === '1' ? 14 : 15; suf = m[4]; }
  else if ((m = n.match(/i([3579])[- ]?(\d{4,5})\s*([A-Z]*)/i))) { marca = 'intel'; classe = +m[1]; ger = m[2].length === 5 ? +m[2].slice(0, 2) : +m[2][0]; suf = m[3]; }
  else if ((m = n.match(/Core\s*(?:\(TM\)\s*)?([357])\s+(\d)(\d{2})\s*([A-Z]*)/i))) { marca = 'intel'; classe = +m[1]; ger = m[2] === '1' ? 13 : 14; suf = m[4]; }
  else if ((m = n.match(/Ryzen\s*AI\s*(?:MAX\+?\s*)?([3579])\s*(?:PRO\s*)?(?:HX\s*)?(\d{3})/i))) { marca = 'amd'; classe = +m[1]; ger = 15; suf = /HX/i.test(n) ? 'HX' : 'H'; }
  else if ((m = n.match(/Ryzen\s*([3579])\s*(?:PRO\s*)?(\d)(\d)(\d)(\d)\s*([A-Z]*)/i))) {
    marca = 'amd'; classe = +m[1]; suf = m[6];
    const s = +m[2], a = +m[4];
    ger = s <= 3 ? 8 : s === 4 ? 10 : s === 5 ? 11 : s === 6 ? 12 : s === 7 ? (a === 2 ? 10 : a === 3 ? (+m[5] === 5 ? 12 : 11) : 13) : s === 8 ? 13 : 15;
  }
  if (classe == null) return null;
  const ajuste = /HX/i.test(suf) ? .5 : /^(U|V|P)/i.test(suf) ? -1.5 : 0;
  return {marca, classe, ger, suf, pontos: ger + (classe - 5) + ajuste};
}

const GPU_PONTOS = {'GTX 1050': 12, 'GTX 1060': 20, 'GTX 1650': 18, 'GTX 1660': 23, 'RTX 2050': 20, 'RTX 2060': 30, 'RTX 2070': 36, 'RTX 2080': 42,
  'RTX 3050': 26, 'RTX 3060': 36, 'RTX 3070': 44, 'RTX 3080': 50, 'RTX 4050': 34, 'RTX 4060': 42, 'RTX 4070': 50, 'RTX 4080': 64, 'RTX 4090': 74,
  'RTX 5050': 38, 'RTX 5060': 48, 'RTX 5070': 56, 'RTX 5080': 72, 'RTX 5090': 84, 'RTX A1000': 26, 'RTX A2000': 30, 'RTX A3000': 40, 'RTX A4000': 46,
  'RTX A4500': 48, 'RTX A5000': 52, 'RTX A5500': 56, 'RTX 2000 Ada': 42, 'RTX 3000 Ada': 50, 'RTX 3500 Ada': 56, 'RTX 4000 Ada': 60, 'RTX 5000 Ada': 70,
  'RTX PRO 1000': 38, 'RTX PRO 2000': 48, 'RTX PRO 3000': 56, 'RTX PRO 4000': 66, 'RTX PRO 5000': 78};
/** Placa de vídeo: marca, modelo e um número de comparação. */
export function gpuNivel(g) {
  const nome = String((g && g.nome) || ''), vram = (g && g.vram) || 0;
  const nvidia = /nvidia|geforce|rtx|gtx|quadro/i.test(nome), amd = !nvidia && /radeon|amd/i.test(nome), intel = !nvidia && !amd && /intel|arc|iris|uhd/i.test(nome);
  let modelo = null, pontos = null, m;
  if ((m = nome.match(/RTX\s*PRO\s*(\d{4})/i))) modelo = `RTX PRO ${m[1]}`;
  else if ((m = nome.match(/RTX\s*(\d{4})\s*Ada/i))) modelo = `RTX ${m[1]} Ada`;
  else if ((m = nome.match(/(RTX|GTX)\s*(A?\d{3,4})/i))) modelo = `${m[1].toUpperCase()} ${m[2].toUpperCase()}`;
  if (modelo) pontos = GPU_PONTOS[modelo] ?? null;
  if (pontos != null && /\bTi\b/i.test(nome)) pontos += 4;
  return {nome, vram, nvidia, amd, intel, modelo, pontos};
}

const REF = {i5_13500H: 13, i7_13700H: 15, i7_11700H: 13, i7_12700H: 14};
const it = (nome, exigido, aqui, ok, quase = false) => ({nome, exigido, aqui, ok: !!ok, quase: !ok && !!quase});

/**
 * Compara este notebook com os requisitos publicados (pesquisa de novembro de 2026):
 *   Medit Scan for Clinics (support.medit.com / medit.document360.io) · Shining 3D (support.shining3ddental.com)
 *   3Shape TRIOS (catálogo de PCs aprovados; NVIDIA, 16 GB e processador com AVX2) · exocad (wiki.exocad.com)
 *   Planmeca Romexis 6 (planmeca.com)
 */
export function requisitosOdonto(info) {
  const c = cpuNivel((info.cpu || {}).nome), g = gpuNivel(info.gpu), ram = (info.ram || {}).gb || 0;
  const cpuTxt = (info.cpu || {}).nome || '—', gpuTxt = `${g.modelo || g.nome || '—'}${g.vram ? ` · ${g.vram} GB` : ''}`, ramTxt = `${ram} GB`;
  const cpuOk = ref => c ? c.pontos >= ref - .01 : null, cpuQuase = ref => c ? c.pontos >= ref - 1.01 : false;
  const gpuOk = (min, vram) => g.nvidia && g.pontos != null && g.pontos >= min && g.vram >= vram;
  const lista = [];
  // Medit
  {
    const min = [it('Processador', 'Core i5-13500H, Core Ultra 5 125H ou Ryzen 5 7640H', cpuTxt, cpuOk(REF.i5_13500H), cpuQuase(REF.i5_13500H)),
      it('Placa de vídeo', 'NVIDIA RTX 4050, RTX 3060 ou RTX A2000 · 6 GB', gpuTxt, gpuOk(30, 6), g.nvidia && g.vram >= 4),
      it('Memória', '16 GB', ramTxt, ram >= 16)];
    const rec = [it('Processador', 'Core i7-13700H, Core Ultra 7 155H ou Ryzen 7 7735H', cpuTxt, cpuOk(REF.i7_13700H), cpuQuase(REF.i7_13700H)),
      it('Placa de vídeo', 'NVIDIA RTX 4060, RTX 5060, RTX 3070 ou RTX A3000 · 8 GB', gpuTxt, gpuOk(40, 8), gpuOk(30, 6)),
      it('Memória', '32 GB', ramTxt, ram >= 32, ram >= 24)];
    lista.push({produto: 'Medit · i700 e i900', programa: 'Medit Scan for Clinics', minimo: min, recomendado: rec, nota: 'Placas AMD Radeon não são suportadas.'});
  }
  // Shining 3D
  {
    const fora = /\b(3050|4050|5050)\b/.test(g.nome);
    const min = [it('Processador', 'Intel Core i7-11700H ou superior (apenas Intel)', cpuTxt, c && c.marca === 'intel' && cpuOk(REF.i7_11700H), c && c.marca === 'intel' && cpuQuase(REF.i7_11700H)),
      it('Placa de vídeo', 'NVIDIA RTX 3060 ou superior (não RTX 3050, 4050 ou 5050)', gpuTxt, gpuOk(36, 6) && !fora, g.nvidia && !fora),
      it('Memória', '32 GB', ramTxt, ram >= 32, ram >= 24)];
    const rec = [it('Processador', 'Intel Core i7-12700H ou superior; Core Ultra 7 e 9', cpuTxt, c && c.marca === 'intel' && cpuOk(REF.i7_12700H), c && c.marca === 'intel' && cpuQuase(REF.i7_12700H)),
      min[1], it('Memória', '32 GB em dois pentes, acima de 4.800 MT/s', `${ramTxt}${(info.ram || {}).mhz ? ` · ${info.ram.mhz} MT/s` : ''}${(info.ram || {}).canais ? ` · ${info.ram.canais.texto}` : ''}`,
        ram >= 32 && (!(info.ram || {}).mhz || info.ram.mhz > 4800) && (!(info.ram || {}).canais || info.ram.canais.modo !== 'single'), ram >= 32)];
    lista.push({produto: 'Shining 3D · Aoralscan', programa: 'IntraoralScan', minimo: min, recomendado: rec, nota: 'Pede também duas portas USB 3.0 tipo A e SSD de 256 GB.'});
  }
  // 3Shape TRIOS
  {
    const min = [it('Processador', 'Intel Core i7 com AVX2 (a partir de 2013)', cpuTxt, c && (c.marca === 'intel' ? c.classe >= 7 || c.pontos >= 14 : c.pontos >= 13), !!c),
      it('Placa de vídeo', 'NVIDIA GeForce RTX', gpuTxt, g.nvidia && g.pontos != null && g.pontos >= 30, g.nvidia),
      it('Memória', '16 GB', ramTxt, ram >= 16)];
    lista.push({produto: '3Shape · TRIOS', programa: 'TRIOS / Unite', minimo: min, recomendado: null, conferir: true,
      nota: 'A 3Shape homologa notebooks pelo catálogo de PCs aprovados: confira se este modelo está na lista antes de comprar.'});
  }
  // exocad
  {
    const min = [it('Placa de vídeo', 'NVIDIA GTX ou AMD Radeon · 1 GB (o vídeo integrado Intel não atende)', gpuTxt, (g.nvidia || g.amd) && g.vram >= 1, false),
      it('Memória', '4 GB', ramTxt, ram >= 4)];
    const rec = [it('Processador', 'Core i9-11900K ou Ryzen 9 5900X (estação completa)', cpuTxt, c && c.pontos >= 14, c && c.pontos >= 13),
      it('Placa de vídeo', 'NVIDIA RTX 2060 6 GB, RTX 3070 ou Radeon RX 6700 XT', gpuTxt, (g.nvidia && g.pontos != null && g.pontos >= 30 && g.vram >= 6) || (g.amd && g.vram >= 6), g.vram >= 4 && !g.intel),
      it('Memória', '16 GB', ramTxt, ram >= 16)];
    lista.push({produto: 'exocad · DentalCAD', programa: 'DentalCAD', minimo: min, recomendado: rec, nota: 'O PartialCAD pede 4 GB de vídeo NVIDIA ou AMD.'});
  }
  // Romexis
  {
    const min = [it('Processador', 'Intel Core i5 de 6ª geração ou equivalente', cpuTxt, c && c.pontos >= 6),
      it('Placa de vídeo', 'NVIDIA ou AMD dedicada, ou Intel UHD 630 ou superior', gpuTxt, true),
      it('Memória', '16 GB (ProMax 3D Plus, Mid, Max; Viso G1, G3)', ramTxt, ram >= 16)];
    const rec = [it('Processador', 'Intel Core i7 (estação de trabalho)', cpuTxt, c && c.pontos >= 12, c && c.pontos >= 10),
      it('Placa de vídeo', 'NVIDIA com 4 GB (Romexis Smart)', gpuTxt, g.nvidia && g.vram >= 4, !g.intel && g.vram >= 4),
      it('Memória', '32 GB (Viso G5, G7 e módulo de cirurgia)', ramTxt, ram >= 32, ram >= 24)];
    lista.push({produto: 'Planmeca · Romexis 6', programa: 'Tomografia 3D', minimo: min, recomendado: rec, nota: '20 GB são recomendados para guia de implante e sobreposição.'});
  }
  for (const p of lista) {
    const okMin = p.minimo.every(x => x.ok), okRec = p.recomendado ? p.recomendado.every(x => x.ok) : okMin;
    const quaseMin = p.minimo.every(x => x.ok || x.quase);
    p.status = okRec && !p.conferir ? 'recomendado' : okMin ? (p.conferir ? 'conferir' : 'minimo') : quaseMin ? 'quase' : 'abaixo';
  }
  return lista;
}

// ================================================================== vereditos (réguas provisórias)
const NIVEIS = ['Fraco', 'Regular', 'Bom', 'Muito bom', 'Ótimo'];
const faixa = (v, limites, menorMelhor) => {
  if (v == null || isNaN(v)) return null;
  for (let i = 0; i < limites.length; i++) if (menorMelhor ? v <= limites[i] : v >= limites[i]) return 4 - i;
  return 0;
};
const minN = (...xs) => { const v = xs.filter(x => x != null && !isNaN(x)); return v.length ? Math.min(...v) : null; };
const nMin = (...xs) => {
  const v = xs.filter(x => x != null && !isNaN(x)); if (!v.length) return 2;
  const m = Math.min(...v), md = v.reduce((a, b) => a + b, 0) / v.length;
  return m < 4 && v.length > 1 && md - m >= .75 ? m + .5 : m;
};
const comEstrelas = p => { const n = p.nivel ?? 1, i = Math.max(0, Math.min(4, Math.floor(n))); return {...p, nivel: i, estrelas: Math.min(5, 1 + n), rotulo: NIVEIS[i]}; };
const tempoTxt = s => s == null ? '—' : s < 60 ? `${fmt(s, s < 10 ? 1 : 0)} s` : s < 3600 ? `${Math.floor(s / 60)} min${Math.round(s % 60) ? ` ${Math.round(s % 60)} s` : ''}` : `${Math.floor(s / 3600)} h ${Math.round(s % 3600 / 60)} min`;
const fraseFim = (pct, quem) => pct == null ? '' : pct >= 95 ? `${quem} manteve o desempenho até o fim (${pct}%).` : `${quem} terminou com ${pct}% do desempenho do começo: perdeu velocidade com o calor ou o limite de energia.`;

export function vereditoArquitetura(r, info) {
  const ram = (info.ram && info.ram.gb) || 0, vram = (info.gpu && info.gpu.vram) || 0;
  const reg = faixa(r.regen_s, [.16, .2, .3, .5], true), navC = faixa(r.nav_condominio, [90, 50, 30, 15]), navB = faixa(r.nav_bairro, [60, 35, 20, 10]);
  const rt = faixa(r.rt_fps, [45, 20, 10, 5.5]), cpuR = faixa(r.render4k_s, [300, 600, 1200, 2400], true), fimC = faixa(r.fim_cpu, [95, 88, 80, 70]);
  const vE = faixa(vram, [12, 10, 8, 6]), vL = faixa(vram, [16, 12, 8, 6]), mem = faixa(ram, [64, 32, 16, 8]);
  const maxProjMB = Math.round(ram * 18.75 / 50) * 50;
  const prog = [
    {nome: 'Revit', nivel: nMin(reg, navC, mem), texto: `${navC != null && navC < (reg ?? 4) ? `Navegação 3D ${['com travamentos', 'pesada', 'adequada', 'fluida', 'fluida'][navC]}` : `Regenera ${['devagar', 'em tempo adequado', 'bem', 'rápido', 'muito rápido'][reg ?? 2]}`} · projetos até ~${maxProjMB.toLocaleString('pt-BR')} MB com ${ram} GB`},
    {nome: 'SketchUp', nivel: nMin(reg, navB), texto: (reg ?? 2) >= 3 ? 'Depende de um núcleo rápido, e este processador está entre os mais rápidos' : (reg ?? 2) >= 2 ? 'Depende de um núcleo rápido, e este processador atende bem' : 'Depende de um núcleo rápido; neste notebook, ele é o limite'},
    {nome: 'Enscape · Twinmotion · D5', nivel: nMin(rt, vE), texto: `Ray tracing em tempo real a ${fmt(r.rt_fps, r.rt_fps < 10 ? 1 : 0)} quadros/s em Full HD · ${vram} GB de vídeo${vram < 12 ? '; cenas pesadas exigem 12 GB' : ''}`},
    {nome: 'Lumion', nivel: nMin(rt, vL), texto: vram >= 16 ? 'Qualidade máxima disponível' : 'Funciona bem · a qualidade máxima exige 16 GB de vídeo'},
    {nome: 'V-Ray · Corona (processador)', nivel: nMin(cpuR, fimC), texto: `Imagem 4K em ~${tempoTxt(r.render4k_s)} · ${r.fim_cpu != null ? `terminou com ${r.fim_cpu}% da velocidade` : ''}`},
  ].map(comEstrelas);
  const base = Math.min(prog[0].nivel, prog[1].nivel);
  const titulo = base >= 3 && ram >= 64 ? 'Pronto para projetos grandes' : base >= 2 && ram >= 32 ? 'Pronto para projetos de médio porte' : base >= 2 && ram >= 16 ? 'Bom para estudantes e projetos pequenos' : 'Atende ao básico, mas perde desempenho em modelos pesados';
  const fim = minN(r.fim_cpu, r.fim_gpu);
  const frase = [(reg ?? 2) >= 3 ? 'Regenera rápido' : (reg ?? 2) >= 2 ? 'Regenera bem' : 'Regenerar o modelo é o ponto fraco',
    (navB ?? 2) >= 3 ? 'e navega com fluidez até no bairro inteiro' : (navC ?? 2) >= 2 ? 'e navega bem no condomínio' : 'e o 3D fica pesado em projetos grandes'].join(' ') + '. ' +
    (fim == null ? '' : fim >= 95 ? 'Manteve o desempenho durante os 10 minutos.' : `Depois de alguns minutos, perdeu até ${100 - fim}% da velocidade com o calor.`);
  const selos = [
    {txt: 'Estudante', ok: base >= 1 && ram >= 16},
    {txt: 'Escritório, projetos médios', ok: base >= 2 && ram >= 32},
    {txt: base >= 3 && ram < 64 ? 'Projetos grandes · com mais RAM' : 'Projetos grandes', ok: base >= 3 && ram >= 64, quase: base >= 3 && ram < 64},
    {txt: 'Render em tempo real', ok: (rt ?? 0) >= 2 && vram >= 8},
  ];
  return {titulo, frase, programas: prog, selos, maxProjMB};
}

export function vereditoOdonto(r, info) {
  const ram = (info.ram && info.ram.gb) || 0, vram = (info.gpu && info.gpu.vram) || 0, req = r.requisitos || [];
  const st = p => (req.find(x => x.produto.startsWith(p)) || {}).status;
  const nivelReq = s => ({recomendado: 4, conferir: 3, minimo: 2.5, quase: 1, abaixo: 0})[s] ?? 2;
  const scanReq = Math.max(nivelReq(st('Medit')), nivelReq(st('Shining')), Math.min(3, nivelReq(st('3Shape'))));
  const scan = faixa(r.scan_ips, [2000, 1300, 800, 400]), cb = faixa(r.cbct_fps, [60, 40, 25, 12]), pr = faixa(r.protese_fps, [60, 40, 25, 12]);
  const fa = faixa(r.fatias_s, [700, 450, 280, 150]), mem = faixa(ram, [32, 24, 16, 8]), vr = faixa(vram, [8, 6, 4, 2]);
  const g = gpuNivel(info.gpu);
  const prog = [
    {nome: 'Scanner intraoral', nivel: nMin(scanReq, scan, Math.min(4, (pr ?? 2) + 1)), texto: !g.nvidia ? 'Os scanners Medit, TRIOS e Shining 3D exigem placa de vídeo NVIDIA' : st('Medit') === 'recomendado' ? 'Atende ao recomendado da Medit · montagem da arcada sem atraso' : st('Medit') === 'minimo' ? 'Atende ao mínimo da Medit; abaixo do recomendado' : 'Abaixo do mínimo de algum fabricante · confira a tabela'},
    {nome: 'Tomografia 3D', nivel: nMin(cb, mem), texto: `Romexis, CS 3D Imaging, Blue Sky Plan · ${fmt(r.cbct_fps, r.cbct_fps < 10 ? 1 : 0)} quadros/s girando a tomografia${ram < 16 ? ' · 16 GB são o mínimo' : ''}`},
    {nome: 'exocad', nivel: nMin(pr, vr), texto: `Prótese com 10 milhões de triângulos a ${fmt(r.protese_fps, r.protese_fps < 10 ? 1 : 0)} quadros/s · ${vram} GB de vídeo`},
    {nome: 'Planejamento de implantes', nivel: nMin(fa, cb, mem), texto: `${fmt(r.fatias_s)} fatias por segundo · tomografia e guia cirúrgico${ram < 32 ? ' · 32 GB recomendados para cirurgia guiada' : ''}`},
  ].map(comEstrelas);
  const base = Math.min(...prog.map(p => p.nivel));
  const titulo = base >= 3 ? 'Pronto para a clínica digital completa' : base >= 2 ? 'Bom para o consultório digital' : prog[0].nivel < 2 ? 'Bom para tomografia, mas fraco para o scanner' : 'Atende ao básico da odontologia digital';
  const limite = !g.nvidia ? ' O que limita é a placa de vídeo: os scanners intraorais exigem NVIDIA.' : ram < 16 ? ' O que limita é a memória: 16 GB são o mínimo dos fabricantes.' : vram < 6 ? ` O que limita é a memória de vídeo (${vram} GB): os scanners pedem 6 GB ou mais.` : ram < 32 ? ' Com 32 GB de memória, atenderia também ao recomendado dos scanners.' : '';
  const fim = minN(r.fim_cpu, r.fim_gpu);
  const frase = (fim == null ? '' : fim >= 95 ? 'Manteve o desempenho durante os 10 minutos.' : `Depois de alguns minutos, perdeu até ${100 - fim}% da velocidade com o calor.`) + limite;
  const selos = [
    {txt: 'Tomografia 3D', ok: (cb ?? 0) >= 2 && ram >= 16},
    {txt: 'Scanner intraoral', ok: prog[0].nivel >= 2},
    {txt: 'Prótese no exocad', ok: prog[2].nivel >= 2},
    {txt: 'Clínica completa', ok: base >= 3, quase: base >= 2 && base < 3},
  ];
  return {titulo, frase: frase.trim(), programas: prog, selos};
}

// usados também pelos testes de Engenharia, Programação, Design e Vídeo (pesados2.js)
export {rodarPool, taxaPorSegundo, faixa, nMin, minN, comEstrelas, fmt, milhoes, fps, mmss, tempoTxt, triTxt, media, fraseFim};
