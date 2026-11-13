#!/usr/bin/env node
/*
  ┌──────────────────────────────────────────────────────────────┐
  │  BENCH CHAT — overlay do chat do YouTube para o OBS          │
  │  Arquivo único, sem dependências. Precisa só do Node 18+.    │
  └──────────────────────────────────────────────────────────────┘

  Rodar:      node bench-chat.js
  Opções:     PORTA=3500  SENHA=uma-senha-forte  node bench-chat.js

  Painel:     http://SEU-SERVIDOR:3500/painel   (aba "Ao vivo" e aba "Aparência")
  OBS:        http://SEU-SERVIDOR:3500/overlay  (Fonte de navegador 1920×1080)

  Funciona atrás de proxy reverso em qualquer caminho
  (ex.: benchpromos.com/livechat/painel e /livechat/overlay).
  No nginx, use "proxy_buffering off" nesse caminho.

  Fonte Lemon Milk: coloque o arquivo (ex.: LEMONMILK-Bold.otf) na mesma
  pasta deste arquivo e ela é usada automaticamente no overlay.

  Como o chat é lido: o servidor faz o mesmo que a janela de chat do
  YouTube faz no navegador — abre /live_chat da live e consulta o endpoint
  interno get_live_chat a cada 1–5 s. Não usa a API oficial, então não tem
  cota diária nem precisa de chave, mas pode precisar de ajuste se o
  YouTube mudar o formato.
*/
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = parseInt(process.env.PORTA || process.env.PORT || '3500', 10);
const SENHA = process.env.SENHA || '';
const YT = (process.env.YT_BASE || 'https://www.youtube.com').replace(/\/$/, ''); // só para testes
const DIR = __dirname;
const ARQ_CONFIG = path.join(DIR, 'bench-chat-config.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/* ───────────────────────── aparência ───────────────────────── */

const POS9 = ['sup-esq', 'sup-centro', 'sup-dir', 'meio-esq', 'meio-centro', 'meio-dir', 'inf-esq', 'inf-centro', 'inf-dir'];
const FONTES_LISTA = ['Lemon Milk', 'Montserrat', 'Inter', 'Poppins', 'Bebas Neue', 'Oswald', 'Archivo Black', 'Space Grotesk', 'DM Sans', 'Roboto', 'Rajdhani', 'Orbitron'];

const LAYOUTS = ['cartao', 'classico', 'bolha', 'faixa', 'texto'];

const ESTILO_PADRAO = {
  layout: 'cartao',
  posicao: 'inf-esq', margemX: 64, margemY: 56,
  escala: 100, largura: 1056, tamMsg: 33, tamNome: 17, tamAvatar: 74, linhasMax: 4,
  raio: 18, bordaLateral: 6, avatarForma: 'circulo', sombra: true,
  corAcento: '#FFE500', corFundo1: '#21172F', corFundo2: '#170F23', opacidade: 97,
  corTexto: '#F5F2F9', corNome: '#FFE500', corAbaFundo: '#30243D', corAbaTexto: '#F5F2F9',
  corPalavras: '#FFE500', corEspecial: '#FFE500',
  corEtiqueta: '#FFE500', corEtiquetaTexto: '#170F23', corAnel: '#4A3D5C',
  fonteTitulo: 'Lemon Milk', fonteTexto: 'Inter', pesoMsg: 600, nomeCaixaAlta: true,
  mostrarAvatar: true, mostrarAba: true, mostrarMarca: true, mostrarSelos: true, mostrarBarra: true,
  abaTexto: 'Chat ao vivo', marcaTexto: 'BENCH PROMOS', logoUrl: '',
  animacao: 'wipe', velocidade: 100,
  posFeed: 'igual', larguraFeed: 544, feedMax: 6, espacoFeed: 9,
};

const ESQUEMA_ESTILO = {
  layout: { e: LAYOUTS },
  corEtiqueta: { c: 1 }, corEtiquetaTexto: { c: 1 }, corAnel: { c: 1 },
  posicao: { e: POS9 }, margemX: { n: [0, 900] }, margemY: { n: [0, 900] },
  escala: { n: [40, 220] }, largura: { n: [300, 1900] }, tamMsg: { n: [12, 96] }, tamNome: { n: [8, 48] },
  tamAvatar: { n: [24, 200] }, linhasMax: { n: [1, 10] },
  raio: { n: [0, 60] }, bordaLateral: { n: [0, 30] }, avatarForma: { e: ['circulo', 'arredondado', 'quadrado'] }, sombra: { b: 1 },
  corAcento: { c: 1 }, corFundo1: { c: 1 }, corFundo2: { c: 1 }, opacidade: { n: [0, 100] },
  corTexto: { c: 1 }, corNome: { c: 1 }, corAbaFundo: { c: 1 }, corAbaTexto: { c: 1 }, corPalavras: { c: 1 }, corEspecial: { c: 1 },
  fonteTitulo: { e: FONTES_LISTA }, fonteTexto: { e: FONTES_LISTA }, pesoMsg: { n: [300, 900] }, nomeCaixaAlta: { b: 1 },
  mostrarAvatar: { b: 1 }, mostrarAba: { b: 1 }, mostrarMarca: { b: 1 }, mostrarSelos: { b: 1 }, mostrarBarra: { b: 1 },
  abaTexto: { s: 40 }, marcaTexto: { s: 40 }, logoUrl: { s: 500 },
  animacao: { e: ['wipe', 'deslizar', 'subir', 'fade', 'pop', 'nenhuma'] }, velocidade: { n: [40, 250] },
  posFeed: { e: ['igual', ...POS9] }, larguraFeed: { n: [240, 1400] }, feedMax: { n: [1, 15] }, espacoFeed: { n: [0, 48] },
};

const ESTILOS_PRONTOS = {
  'Bench': {},
  'Clássico (como hoje)': {
    layout: 'classico', corEtiqueta: '#1FC9AA', corEtiquetaTexto: '#FFFFFF', corAnel: '#1FC9AA', corAcento: '#1FC9AA',
    corFundo1: '#0B0B0C', corFundo2: '#0B0B0C', opacidade: 90, corTexto: '#FFFFFF', corNome: '#FFFFFF',
    corPalavras: '#1FC9AA', corEspecial: '#E6B84A', fonteTitulo: 'Roboto', fonteTexto: 'Roboto', pesoMsg: 700,
    nomeCaixaAlta: false, raio: 0, tamMsg: 30, tamNome: 21, tamAvatar: 88, mostrarBarra: false, animacao: 'deslizar',
  },
  'Clássico Bench': { layout: 'classico', corAnel: '#FFE500', raio: 10, tamAvatar: 84, tamNome: 18, tamMsg: 30 },
  'Bolha': { layout: 'bolha', corAnel: '#FFE500', raio: 26, tamMsg: 30, animacao: 'pop' },
  'Faixa TV': { layout: 'faixa', raio: 6, tamMsg: 28, tamNome: 20, tamAvatar: 66, linhasMax: 2, largura: 1600, animacao: 'deslizar' },
  'Só texto': { layout: 'texto', bordaLateral: 4, tamMsg: 34, corAnel: '#FFE500', animacao: 'subir' },
  'Bench contido': { corNome: '#F5F2F9', bordaLateral: 3, tamMsg: 30, corEspecial: '#FFE500' },
  'Roxo vivo': { corFundo1: '#3B2A57', corFundo2: '#21172F', corAbaFundo: '#FFE500', corAbaTexto: '#170F23', raio: 28, opacidade: 98 },
  'Grafite': { corFundo1: '#1C1C20', corFundo2: '#0F0F12', corAbaFundo: '#2A2A30', corNome: '#F5F2F9', bordaLateral: 4 },
  'Minimal claro': {
    corFundo1: '#FFFFFF', corFundo2: '#F5F2F9', opacidade: 100, corTexto: '#170F23', corNome: '#30243D',
    corAbaFundo: '#170F23', corAbaTexto: '#FFE500', corPalavras: '#7A4DD8', corEspecial: '#170F23',
  },
  'Faixa compacta': {
    posicao: 'inf-centro', largura: 1500, tamMsg: 26, tamNome: 14, tamAvatar: 50, linhasMax: 2, raio: 8,
    mostrarAba: false, animacao: 'subir', margemY: 40,
  },
};

function validarEstilo(entrada, destino) {
  for (const [k, v] of Object.entries(entrada || {})) {
    const r = ESQUEMA_ESTILO[k];
    if (!r) continue;
    if (r.e) { if (r.e.includes(v)) destino[k] = v; }
    else if (r.n) { const x = Number(v); if (Number.isFinite(x)) destino[k] = Math.round(Math.min(r.n[1], Math.max(r.n[0], x))); }
    else if (r.c) { if (/^#[0-9a-f]{6}$/i.test(v)) destino[k] = String(v).toUpperCase(); }
    else if (r.b) destino[k] = !!v;
    else if (r.s) destino[k] = String(v == null ? '' : v).slice(0, r.s);
  }
  return destino;
}

/* ───────────────────────── sons ───────────────────────── */

const SONS_IDS = ['sininho', 'sino-duplo', 'sino-triplo', 'plim', 'notificacao', 'moeda', 'caixa', 'bolha', 'pop', 'fanfarra', 'level-up', 'brilho', 'whoosh', 'alerta'];
const EVENTOS_SOM = ['texto', 'superchat', 'membro', 'presente'];
const DIR_SONS = path.join(DIR, 'bench-chat-sons');   // seus arquivos de som enviados pelo painel
const EXT_SOM = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', webm: 'audio/webm' };
const SONS_PADRAO = { ativo: true, volume: 70, feed: false, texto: 'plim', superchat: 'caixa', membro: 'sininho', presente: 'fanfarra' };

function listarSons() {
  try { return fs.readdirSync(DIR_SONS).filter(f => /^[a-z0-9_-]+\.(mp3|wav|ogg|m4a|webm)$/.test(f)).sort(); } catch { return []; }
}
function validarSons(entrada, destino) {
  const arquivos = listarSons();
  for (const [k, v] of Object.entries(entrada || {})) {
    if (k === 'ativo' || k === 'feed') destino[k] = !!v;
    else if (k === 'volume') { const x = Number(v); if (Number.isFinite(x)) destino[k] = Math.round(Math.min(100, Math.max(0, x))); }
    else if (EVENTOS_SOM.includes(k)) {
      if (v === 'nenhum' || SONS_IDS.includes(v) || (typeof v === 'string' && v.startsWith('arquivo:') && arquivos.includes(v.slice(8)))) destino[k] = v;
    }
  }
  return destino;
}

/* ───────────────────────── configuração ───────────────────────── */

const PADRAO = {
  fonte: '',              // @canal, link da live ou ID do vídeo
  modo: 'destaque',       // 'destaque' (você clica) | 'feed' (chat corrido)
  autoOcultar: 15,        // segundos (0 = só some quando você clicar)
  nome: 'completo',       // 'completo' | 'primeiro'
  palavras: 'cupom, promo, bench',
  autoSuperChat: true,    // Super Chat / membro aparece sozinho
  sons: { ...SONS_PADRAO },
  estilo: { ...ESTILO_PADRAO },
  predefinicoes: {},      // estilos salvos por você
};
const TIPOS_CONFIG = {
  modo: ['destaque', 'feed'], autoOcultar: 'num', nome: ['completo', 'primeiro'],
  palavras: 'str', autoSuperChat: 'bool',
};

let config = { ...PADRAO, sons: { ...SONS_PADRAO }, estilo: { ...ESTILO_PADRAO }, predefinicoes: {} };
try {
  const salvo = JSON.parse(fs.readFileSync(ARQ_CONFIG, 'utf8'));
  // migra a versão anterior (tamanho/posição/logo soltos)
  const antigo = {};
  if (salvo.tamanho) antigo.escala = { P: 80, M: 100, G: 120 }[salvo.tamanho] || 100;
  if (salvo.posicao) antigo.posicao = salvo.posicao;
  if (salvo.logoUrl) antigo.logoUrl = salvo.logoUrl;
  if (salvo.feedMax) antigo.feedMax = salvo.feedMax;
  for (const k of ['fonte', ...Object.keys(TIPOS_CONFIG)]) if (k in salvo) config[k] = salvo[k];
  config.estilo = validarEstilo({ ...antigo, ...(salvo.estilo || {}) }, { ...ESTILO_PADRAO });
  config.sons = validarSons(salvo.sons || {}, { ...SONS_PADRAO });
  for (const [nome, est] of Object.entries(salvo.predefinicoes || {})) config.predefinicoes[nome] = validarEstilo(est, { ...ESTILO_PADRAO });
} catch { /* primeira vez */ }

function salvarConfig() {
  try { fs.writeFileSync(ARQ_CONFIG, JSON.stringify(config, null, 2)); }
  catch (e) { console.warn('[config] não consegui salvar:', e.message); }
}

/* ───────────────────────── estado + tempo real ───────────────────────── */

let mensagens = [];
let destaque = null;
let timerOcultar = null;
let status = { estado: 'desconectado', texto: 'Desconectado', videoId: null, titulo: null, canal: null };
const idsVistos = new Set();
const clientes = { overlay: new Set(), painel: new Set() };

function enviar(res, ev, dados) { res.write('event: ' + ev + '\ndata: ' + JSON.stringify(dados) + '\n\n'); }
function transmitir(lado, ev, dados) { for (const r of clientes[lado]) enviar(r, ev, dados); }
function todos(ev, dados) { transmitir('overlay', ev, dados); transmitir('painel', ev, dados); }
setInterval(() => { for (const s of Object.values(clientes)) for (const r of s) r.write(': ping\n\n'); }, 20000);

function avisarConfig(origem) { todos('config', { ...config, sonsArquivos: listarSons(), _origem: origem || null }); }

function setStatus(estado, texto, extra = {}) {
  status = { ...status, estado, texto, ...extra };
  transmitir('painel', 'status', status);
  console.log('[status]', estado, '—', texto);
}

function mostrar(msg) {
  destaque = msg;
  clearTimeout(timerOcultar);
  if (config.autoOcultar > 0) timerOcultar = setTimeout(ocultar, config.autoOcultar * 1000);
  todos('mostrar', { msg, duracao: config.autoOcultar });
}
function ocultar() {
  clearTimeout(timerOcultar);
  if (!destaque) return;
  destaque = null;
  todos('ocultar', {});
}

/* ── apoios: Super Chat, sticker, membros e presentes, com histórico e totais próprios ── */
let apoios = [];
let totais = novoTotais();
let videoDosApoios = null;
function novoTotais() { return { superchats: 0, valores: {}, membros: 0, presentes: 0, assinaturas: 0 }; }
function valorNumerico(txt) {
  const t = String(txt || '').trim();
  const moeda = t.replace(/[\d.,\s\u00a0]/g, '') || '?';
  let n = (t.match(/[\d.,]+/) || [''])[0];
  if (!n) return null;
  const v = n.lastIndexOf(','), p = n.lastIndexOf('.');
  if (v > -1 && p > -1) n = v > p ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, '');
  else if (v > -1) n = /,\d{1,2}$/.test(n) ? n.replace(/\./g, '').replace(',', '.') : n.replace(/,/g, '');
  else if (p > -1 && !/\.\d{1,2}$/.test(n)) n = n.replace(/\./g, '');
  const x = parseFloat(n);
  return Number.isFinite(x) ? { moeda, valor: x } : null;
}
function contarApoio(m) {
  if (m.teste) return;
  if (m.tipo === 'superchat' || m.tipo === 'sticker') {
    totais.superchats++;
    const v = valorNumerico(m.valor);
    if (v) totais.valores[v.moeda] = Math.round(((totais.valores[v.moeda] || 0) + v.valor) * 100) / 100;
  } else if (m.tipo === 'membro') totais.membros++;
  else if (m.tipo === 'presente') {
    totais.presentes++;
    totais.assinaturas += parseInt((String(m.titulo || '').match(/\d+/) || ['1'])[0], 10) || 1;
  }
}
function zerarApoios() {
  apoios = []; totais = novoTotais();
  transmitir('painel', 'apoios', { apoios, totais });
}

function adicionar(msg, { historico = false, auto = true } = {}) {
  if (!msg || !msg.id || idsVistos.has(msg.id)) return;
  idsVistos.add(msg.id);
  if (idsVistos.size > 5000) { idsVistos.clear(); for (const m of mensagens.concat(apoios)) idsVistos.add(m.id); }
  mensagens.push(msg);
  if (mensagens.length > 300) mensagens.splice(0, mensagens.length - 300);
  if (msg.tipo !== 'texto') {
    apoios.push(msg);
    if (apoios.length > 500) apoios.splice(0, apoios.length - 500);
    contarApoio(msg);
    transmitir('painel', 'totais', totais);
  }
  transmitir('painel', 'msg', msg);
  if (historico) return;
  transmitir('overlay', 'msg', msg);
  if (auto && config.autoSuperChat && msg.tipo !== 'texto') mostrar(msg);
}

function remover(filtro) {
  const ids = [...new Set(mensagens.concat(apoios).filter(filtro).map(m => m.id))];
  if (!ids.length) return;
  mensagens = mensagens.filter(m => !ids.includes(m.id));
  apoios = apoios.filter(m => !ids.includes(m.id));
  todos('remover', { ids });
  if (destaque && ids.includes(destaque.id)) ocultar();
}

/* ───────────────────────── leitura do chat do YouTube ───────────────────────── */

const espera = ms => new Promise(r => setTimeout(r, ms));

async function baixar(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    return await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        'user-agent': UA,
        'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
        cookie: 'SOCS=CAI; CONSENT=YES+1',
        ...(opts.headers || {}),
      },
    });
  } finally { clearTimeout(t); }
}

// Aceita: @canal, link do canal, link da live/vídeo, youtu.be, ID do vídeo, ID do canal (UC…)
function interpretarFonte(f) {
  f = (f || '').trim();
  if (!f) throw new Error('Informe o @ do canal ou o link da live');
  if (f.startsWith('@')) return { canal: YT + '/' + f.split(/[/?#]/)[0] };
  if (/^UC[\w-]{22}$/.test(f)) return { canal: YT + '/channel/' + f };
  // ID de vídeo tem 11 caracteres e quase sempre maiúscula/número/-/_ (evita confundir com um @ sem arroba)
  if (/^[\w-]{11}$/.test(f) && /[A-Z0-9_-]/.test(f)) return { video: f };
  let u;
  try { u = new URL(/^https?:\/\//i.test(f) ? f : 'https://' + f); }
  catch { return { canal: YT + '/@' + f }; }
  const host = u.hostname.replace(/^(www|m)\./, '');
  if (!/\./.test(host)) return { canal: YT + '/@' + f };
  if (host === 'youtu.be') return { video: u.pathname.slice(1, 12) };
  if (!/(^|\.)youtube\.com$/.test(host)) throw new Error('Esse link não é do YouTube');
  const v = u.searchParams.get('v');
  if (v) return { video: v };
  const m = u.pathname.match(/^\/(?:live|shorts|embed)\/([\w-]{11})/);
  if (m) return { video: m[1] };
  const c = u.pathname.match(/^\/(@[^/]+|channel\/UC[\w-]{22}|c\/[^/]+|user\/[^/]+)/);
  if (c) return { canal: YT + '/' + c[1] };
  throw new Error('Não entendi esse link');
}

async function videoDoCanal(canalUrl) {
  const r = await baixar(canalUrl + '/live');
  if (r.status === 404) throw new Error('Canal não encontrado');
  const html = await r.text();
  const m = html.match(/<link rel="canonical" href="https?:\/\/[^"]*\/watch\?v=([\w-]{11})"/);
  if (!m) { const e = new Error('Nenhuma live no ar agora'); e.semLive = true; throw e; }
  return m[1];
}

function extrairJSON(html, marcadores) {
  for (const mk of marcadores) {
    const i = html.indexOf(mk);
    if (i < 0) continue;
    const ini = html.indexOf('{', i);
    let prof = 0, emStr = false, esc = false;
    for (let j = ini; j < html.length; j++) {
      const c = html[j];
      if (emStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') emStr = false;
        continue;
      }
      if (c === '"') emStr = true;
      else if (c === '{') prof++;
      else if (c === '}' && --prof === 0) return JSON.parse(html.slice(ini, j + 1));
    }
  }
  return null;
}

function lerContinuacao(c) {
  const d = c && (c.invalidationContinuationData || c.timedContinuationData || c.reloadContinuationData || c.liveChatReplayContinuationData);
  return d ? { token: d.continuation, timeout: d.timeoutMs } : null;
}

async function abrirChat(videoId) {
  const r = await baixar(YT + '/live_chat?is_popout=1&v=' + encodeURIComponent(videoId));
  if (!r.ok) throw new Error('YouTube respondeu ' + r.status + ' ao abrir o chat');
  const html = await r.text();
  const pega = re => (html.match(re) || [])[1];
  const ctx = {
    videoId,
    chave: pega(/"INNERTUBE_API_KEY":"([^"]+)"/),
    versao: pega(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/) || pega(/"clientVersion":"([^"]+)"/) || '2.20261101.00.00',
    visitante: pega(/"VISITOR_DATA":"([^"]+)"/),
  };
  const dados = extrairJSON(html, ['window["ytInitialData"] = ', 'var ytInitialData = ', 'ytInitialData = ']);
  const lcr = dados && dados.contents && dados.contents.liveChatRenderer;
  if (!lcr) {
    const aviso = dados && dados.contents && dados.contents.messageRenderer;
    throw new Error(aviso ? texto(aviso.text) || 'Chat indisponível' : 'Essa live não tem chat ativo');
  }
  // Prefere "Chat ao vivo" (todas as mensagens) em vez de "Principais mensagens"
  let cont = null;
  try {
    const itens = lcr.header.liveChatHeaderRenderer.viewSelector.sortFilterSubMenuRenderer.subMenuItems;
    cont = lerContinuacao(itens[itens.length - 1].continuation);
  } catch { /* sem seletor */ }
  if (!cont) cont = lerContinuacao((lcr.continuations || [])[0]);
  if (!cont) throw new Error('Não achei o chat dessa live');
  ctx.continuacao = cont.token;
  ctx.iniciais = lcr.actions || [];
  return ctx;
}

async function pegarChat(ctx, token) {
  const url = YT + '/youtubei/v1/live_chat/get_live_chat?prettyPrint=false' + (ctx.chave ? '&key=' + ctx.chave : '');
  const r = await baixar(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://www.youtube.com',
      'x-youtube-client-name': '1',
      'x-youtube-client-version': ctx.versao,
    },
    body: JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion: ctx.versao, hl: 'pt', gl: 'BR', visitorData: ctx.visitante } },
      continuation: token,
    }),
  });
  if (!r.ok) throw new Error('YouTube respondeu ' + r.status + ' no chat');
  const j = await r.json();
  const lcc = j.continuationContents && j.continuationContents.liveChatContinuation;
  if (!lcc) return { acoes: [], prox: null };
  return { acoes: lcc.actions || [], prox: lerContinuacao((lcc.continuations || [])[0]) };
}

/* ── tradução do formato do YouTube para mensagens simples ── */

function texto(o) {
  if (!o) return '';
  if (o.simpleText != null) return o.simpleText;
  return (o.runs || []).map(x => x.text != null ? x.text : (x.emoji ? (x.emoji.isCustomEmoji ? '' : x.emoji.emojiId || '') : '')).join('');
}
function imagem(o, tamanho) {
  const t = o && o.thumbnails;
  if (!t || !t.length) return '';
  let u = t[t.length - 1].url || '';
  if (u.startsWith('//')) u = 'https:' + u;
  if (tamanho) u = u.replace(/=s\d+-/, '=s' + tamanho + '-');
  return /^https:\/\//.test(u) ? u : '';
}
function partes(o) {
  if (!o) return [];
  if (o.simpleText != null) return [{ t: o.simpleText }];
  return (o.runs || []).map(x => {
    if (x.text != null) return { t: x.text };
    if (x.emoji && !x.emoji.isCustomEmoji && x.emoji.emojiId) return { t: x.emoji.emojiId }; // emoji comum vira texto
    if (x.emoji) return { e: imagem(x.emoji.image), alt: (x.emoji.shortcuts && x.emoji.shortcuts[0]) || '' };
    return null;
  }).filter(Boolean);
}
function selos(lista) {
  const s = new Set();
  for (const b of lista || []) {
    const r = b.liveChatAuthorBadgeRenderer;
    if (!r) continue;
    const ic = r.icon && r.icon.iconType;
    if (ic === 'OWNER') s.add('dono');
    else if (ic === 'MODERATOR') s.add('mod');
    else if (ic === 'VERIFIED') s.add('verificado');
    else if (r.customThumbnail) s.add('membro');
  }
  return [...s];
}
function lerItem(item) {
  const tipo = Object.keys(item || {})[0];
  const r = item[tipo];
  if (!r) return null;
  const base = {
    id: r.id,
    autor: texto(r.authorName),
    foto: imagem(r.authorPhoto, 128),
    canalId: r.authorExternalChannelId || '',
    ts: Number(r.timestampUsec) / 1000 || Date.now(),
    selos: selos(r.authorBadges),
  };
  switch (tipo) {
    case 'liveChatTextMessageRenderer':
      return { ...base, tipo: 'texto', partes: partes(r.message) };
    case 'liveChatPaidMessageRenderer':
      return { ...base, tipo: 'superchat', valor: texto(r.purchaseAmountText), partes: partes(r.message) };
    case 'liveChatPaidStickerRenderer':
      return { ...base, tipo: 'sticker', valor: texto(r.purchaseAmountText), sticker: imagem(r.sticker), partes: [] };
    case 'liveChatMembershipItemRenderer':
      return { ...base, tipo: 'membro', titulo: texto(r.headerPrimaryText) || texto(r.headerSubtext), partes: partes(r.message) };
    case 'liveChatSponsorshipsGiftPurchaseAnnouncementRenderer': {
      const h = (r.header && r.header.liveChatSponsorshipsHeaderRenderer) || {};
      return {
        ...base, tipo: 'presente', autor: texto(h.authorName), foto: imagem(h.authorPhoto, 128),
        selos: selos(h.authorBadges), titulo: texto(h.primaryText), partes: [],
      };
    }
    default:
      return null; // avisos do sistema, enquetes etc.
  }
}
function processar(acoes, opts) {
  for (const a of acoes) {
    const ac = a.replayChatItemAction ? a.replayChatItemAction.actions[0] : a;
    if (ac.addChatItemAction) adicionar(lerItem(ac.addChatItemAction.item), opts);
    else if (ac.removeChatItemAction) remover(m => m.id === ac.removeChatItemAction.targetItemId);
    else if (ac.markChatItemAsDeletedAction) remover(m => m.id === ac.markChatItemAsDeletedAction.targetItemId);
    else if (ac.removeChatItemByAuthorAction) remover(m => m.canalId === ac.removeChatItemByAuthorAction.externalChannelId);
    else if (ac.markChatItemsByAuthorAsDeletedAction) remover(m => m.canalId === ac.markChatItemsByAuthorAsDeletedAction.externalChannelId);
  }
}

async function tituloDoVideo(id) {
  try {
    const r = await baixar(YT + '/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id));
    if (!r.ok) return {};
    const j = await r.json();
    return { titulo: j.title || null, canal: j.author_name || null };
  } catch { return {}; }
}

const leitor = {
  geracao: 0,
  iniciar(fonte) { const g = ++this.geracao; this.rodar(fonte, g); },
  parar() { this.geracao++; },
  async rodar(fonte, g) {
    while (g === this.geracao) {
      let alvo;
      try { alvo = interpretarFonte(fonte); }
      catch (e) { setStatus('erro', e.message); return; }
      try {
        setStatus('buscando', alvo.canal ? 'Procurando live no canal…' : 'Abrindo o chat…', { videoId: null, titulo: null, canal: null });
        const videoId = alvo.video || await videoDoCanal(alvo.canal);
        if (g !== this.geracao) return;
        const ctx = await abrirChat(videoId);
        if (g !== this.geracao) return;
        const info = await tituloDoVideo(videoId);
        if (videoId !== videoDosApoios) { videoDosApoios = videoId; zerarApoios(); }   // live nova, apoios do zero
        setStatus('conectado', 'Conectado ao chat', { videoId, ...info });
        processar(ctx.iniciais, { historico: true });
        let token = ctx.continuacao, falhas = 0;
        while (g === this.geracao && token) {
          try {
            const { acoes, prox } = await pegarChat(ctx, token);
            if (g !== this.geracao) return;
            processar(acoes);
            falhas = 0;
            token = prox && prox.token;
            await espera(Math.min(Math.max((prox && prox.timeout) || 3000, 1200), 5000));
          } catch (e) {
            if (++falhas >= 5) throw e;
            await espera(2000 * falhas);
          }
        }
        if (g !== this.geracao) return;
        setStatus('aguardando', 'O chat terminou — verificando de novo a cada 30 s');
      } catch (e) {
        if (g !== this.geracao) return;
        setStatus('aguardando', (e.semLive ? 'Nenhuma live no ar' : e.message) + ' — verificando de novo a cada 30 s');
      }
      for (let i = 0; i < 30 && g === this.geracao; i++) await espera(1000);
    }
  },
};

/* ───────────────────────── mensagens de teste ───────────────────────── */

const TESTES = {
  texto: { tipo: 'texto', autor: '@leitor_do_bench', selos: [], partes: [{ t: 'Esse notebook roda CS2 liso? Tô de olho no cupom que vocês passaram!' }] },
  superchat: { tipo: 'superchat', autor: 'Marina Costa', valor: 'R$ 50,00', selos: ['membro'], partes: [{ t: 'Valeu pelas promos, Jean! Peguei o notebook com o cupom da live 🔥' }] },
  membro: { tipo: 'membro', autor: '@gabriel.tech', titulo: 'Novo membro do canal', selos: ['membro'], partes: [{ t: 'Bem-vindo ao Bench Promos!' }] },
  presente: { tipo: 'presente', autor: '@Lucas_Lap', titulo: 'Enviou 10 assinaturas de presente do canal Bench Promos', selos: ['membro'], partes: [] },
  mod: { tipo: 'texto', autor: 'Equipe Bench', selos: ['mod'], partes: [{ t: 'Link da promo fixado no chat — corre que o estoque tá acabando' }] },
};

/* ───────────────────────── HTTP ───────────────────────── */

function autorizado(req, url) {
  if (!SENHA) return true;
  const s = req.headers['x-senha'] || url.searchParams.get('senha') || '';
  const a = crypto.createHash('sha256').update(String(s)).digest();
  const b = crypto.createHash('sha256').update(SENHA).digest();
  return crypto.timingSafeEqual(a, b);
}
function lerCorpo(req, limite = 65536) {
  return new Promise((ok, falha) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > limite) { falha(new Error('grande demais')); req.destroy(); } });
    req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch (e) { falha(e); } });
  });
}
function json(res, cod, obj) {
  res.writeHead(cod, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function pagina(res, html) {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
}
function arquivoFonte() {
  try { return fs.readdirSync(DIR).find(f => /lemon.?milk.*\.(otf|ttf|woff2?)$/i.test(f)) || null; } catch { return null; }
}
function estadoPublico(lado) {
  const e = { config, destaque, temFonte: !!arquivoFonte() };
  if (lado === 'painel') {
    e.status = status;
    e.mensagens = mensagens.slice(-200);
    e.apoios = apoios;
    e.totais = totais;
    e.estiloPadrao = ESTILO_PADRAO;
    e.estilosProntos = ESTILOS_PRONTOS;
    e.sonsArquivos = listarSons();
  }
  return e;
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const fim = s => p === s || p.endsWith(s);   // funciona em qualquer subcaminho (proxy)

  try {
    /* API do painel */
    const api = p.match(/\/api\/([a-z]+)$/);
    if (api) {
      if (!autorizado(req, url)) return json(res, 401, { erro: 'senha' });
      const acao = api[1];
      if (req.method === 'GET' && acao === 'estado') return json(res, 200, estadoPublico('painel'));
      if (req.method !== 'POST') return json(res, 405, { erro: 'método' });
      const b = await lerCorpo(req, acao === 'som' ? 6 * 1024 * 1024 : 65536);
      switch (acao) {
        case 'conectar':
          config.fonte = String(b.fonte || '').trim(); salvarConfig();
          avisarConfig();
          leitor.iniciar(config.fonte);
          return json(res, 200, { ok: true });
        case 'desconectar':
          config.fonte = ''; salvarConfig(); leitor.parar();
          avisarConfig();
          setStatus('desconectado', 'Desconectado', { videoId: null, titulo: null, canal: null });
          return json(res, 200, { ok: true });
        case 'mostrar': {
          const m = mensagens.find(x => x.id === b.id);
          if (!m) return json(res, 404, { erro: 'mensagem não encontrada' });
          mostrar(m); return json(res, 200, { ok: true });
        }
        case 'ocultar':
          ocultar(); return json(res, 200, { ok: true });
        case 'config':
          for (const [k, v] of Object.entries(b)) {
            const t = TIPOS_CONFIG[k];
            if (!t) continue;
            if (t === 'str') config[k] = String(v).slice(0, 500);
            else if (t === 'num') config[k] = Math.max(0, Math.min(600, Number(v) || 0));
            else if (t === 'bool') config[k] = !!v;
            else if (Array.isArray(t) && t.includes(v)) config[k] = v;
          }
          if (b.estiloCompleto) config.estilo = validarEstilo(b.estiloCompleto, { ...ESTILO_PADRAO });
          if (b.estilo) validarEstilo(b.estilo, config.estilo);
          if (b.sons) validarSons(b.sons, config.sons);
          salvarConfig(); avisarConfig(b.origem);
          return json(res, 200, { ok: true });
        case 'predefinicao': {
          const nome = String(b.nome || '').trim().slice(0, 40);
          if (!nome) return json(res, 400, { erro: 'Dê um nome' });
          if (b.acao === 'salvar') {
            if (!config.predefinicoes[nome] && Object.keys(config.predefinicoes).length >= 30) return json(res, 400, { erro: 'Limite de 30 estilos salvos' });
            config.predefinicoes[nome] = { ...config.estilo };
          } else if (b.acao === 'excluir') delete config.predefinicoes[nome];
          salvarConfig(); avisarConfig();
          return json(res, 200, { ok: true });
        }
        case 'teste': {
          const modelo = TESTES[b.tipo] || TESTES.texto;
          const m = { ...modelo, id: 'teste-' + Date.now(), foto: '', canalId: 'teste', ts: Date.now(), teste: true };
          adicionar(m, { auto: false }); mostrar(m);
          return json(res, 200, { ok: true });
        }
        case 'som': {
          if (b.acao === 'excluir') {
            const f = String(b.nome || '');
            if (listarSons().includes(f)) {
              fs.unlinkSync(path.join(DIR_SONS, f));
              for (const k of EVENTOS_SOM) if (config.sons[k] === 'arquivo:' + f) config.sons[k] = 'nenhum';
            }
            salvarConfig(); avisarConfig();
            return json(res, 200, { ok: true });
          }
          const original = String(b.nome || 'som');
          const ext = ((original.match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();
          if (!EXT_SOM[ext]) return json(res, 400, { erro: 'Use um arquivo MP3, WAV, OGG, M4A ou WEBM' });
          const dados = Buffer.from(String(b.dados || '').replace(/^data:[^,]*,/, ''), 'base64');
          if (!dados.length) return json(res, 400, { erro: 'Arquivo vazio' });
          if (dados.length > 3 * 1024 * 1024) return json(res, 400, { erro: 'Arquivo maior que 3 MB' });
          const base = original.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            .replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'som';
          const nome = base + '.' + ext;
          fs.mkdirSync(DIR_SONS, { recursive: true });
          fs.writeFileSync(path.join(DIR_SONS, nome), dados);
          avisarConfig();
          return json(res, 200, { ok: true, nome });
        }
        case 'tocar':
          transmitir('overlay', 'tocar', { som: String(b.som || '').slice(0, 80) });
          return json(res, 200, { ok: true });
        case 'agradecer': {
          const m = apoios.find(x => x.id === b.id);
          if (!m) return json(res, 404, { erro: 'apoio não encontrado' });
          m.agradecido = !!b.valor;
          transmitir('painel', 'agradecido', { id: m.id, valor: m.agradecido });
          return json(res, 200, { ok: true });
        }
        case 'zerar':
          zerarApoios();
          return json(res, 200, { ok: true });
        case 'limpar':
          mensagens = []; transmitir('painel', 'limpo', {});
          return json(res, 200, { ok: true });
      }
      return json(res, 404, { erro: 'ação desconhecida' });
    }

    /* Tempo real (Server-Sent Events) */
    if (fim('/eventos')) {
      const lado = url.searchParams.get('lado') === 'painel' ? 'painel' : 'overlay';
      if (lado === 'painel' && !autorizado(req, url)) { res.writeHead(401); return res.end(); }
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no',
      });
      res.write('retry: 2000\n\n');
      clientes[lado].add(res);
      enviar(res, 'estado', estadoPublico(lado));
      req.on('close', () => clientes[lado].delete(res));
      return;
    }

    const somArq = p.match(/\/sons\/([a-z0-9_-]+\.(mp3|wav|ogg|m4a|webm))$/);
    if (somArq && listarSons().includes(somArq[1])) {
      res.writeHead(200, { 'content-type': EXT_SOM[somArq[2]], 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' });
      return fs.createReadStream(path.join(DIR_SONS, somArq[1])).pipe(res);
    }

    if (fim('/overlay')) return pagina(res, HTML_OVERLAY);
    if (fim('/painel')) return pagina(res, HTML_PAINEL);

    if (fim('/fonte/lemonmilk')) {
      const f = arquivoFonte();
      if (!f) { res.writeHead(404); return res.end(); }
      const ext = path.extname(f).slice(1).toLowerCase();
      res.writeHead(200, { 'content-type': 'font/' + ext, 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' });
      return fs.createReadStream(path.join(DIR, f)).pipe(res);
    }

    if (p === '/') { res.writeHead(302, { location: 'painel' }); return res.end(); }
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  } catch (e) {
    json(res, 500, { erro: e.message });
  }
});

/* ───────────────────────── páginas ───────────────────────── */

// Efeitos sonoros gerados no navegador (Web Audio) — não precisam de arquivo
const SONS_JS = String.raw`var BenchSons=(function(){
  var ctx=null;
  function ac(){ if(!ctx){ var C=window.AudioContext||window.webkitAudioContext; ctx=new C(); } if(ctx.state==='suspended') ctx.resume(); return ctx; }
  function env(g,t,a,pico,dur){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(pico,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); }
  function osc(c,out,tipo,f,t,dur,pico,a){ var o=c.createOscillator(), g=c.createGain(); o.type=tipo; o.frequency.setValueAtTime(f,t); env(g,t,a||0.005,pico,dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur+0.05); return o; }
  function sino(c,out,f,t,dur,vol){ [[1,1],[2.76,.45],[5.4,.22],[8.93,.1]].forEach(function(p){ osc(c,out,'sine',f*p[0],t,dur/(1+p[0]*0.35),vol*p[1],0.002); }); }
  function ruido(c,dur){ var b=c.createBuffer(1,Math.floor(c.sampleRate*dur),c.sampleRate), d=b.getChannelData(0); for(var i=0;i<d.length;i++) d[i]=Math.random()*2-1; var s=c.createBufferSource(); s.buffer=b; return s; }
  function filtrado(c,out,t,dur,tipo,f1,f2,q,pico,a){ var n=ruido(c,dur), f=c.createBiquadFilter(), g=c.createGain(); f.type=tipo; f.Q.value=q; f.frequency.setValueAtTime(f1,t); if(f2) f.frequency.exponentialRampToValueAtTime(f2,t+dur*.8); env(g,t,a,pico,dur); n.connect(f); f.connect(g); g.connect(out); n.start(t); }
  var SONS={
    'sininho':function(c,o,t){ sino(c,o,1568,t,1.8,.38); },
    'sino-duplo':function(c,o,t){ sino(c,o,1319,t,1.3,.32); sino(c,o,1047,t+.24,1.8,.32); },
    'sino-triplo':function(c,o,t){ sino(c,o,1047,t,1,.26); sino(c,o,1319,t+.14,1,.26); sino(c,o,1568,t+.28,1.8,.3); },
    'plim':function(c,o,t){ var x=osc(c,o,'sine',1200,t,.4,.32,.004); x.frequency.exponentialRampToValueAtTime(2100,t+.08); osc(c,o,'sine',2400,t+.03,.28,.07); },
    'notificacao':function(c,o,t){ osc(c,o,'sine',660,t,.28,.26,.015); osc(c,o,'sine',990,t+.11,.4,.26,.015); },
    'moeda':function(c,o,t){ osc(c,o,'square',1046,t,.07,.11,.002); osc(c,o,'square',1568,t+.07,.5,.11,.002); },
    'caixa':function(c,o,t){ filtrado(c,o,t,.13,'bandpass',3200,0,1.1,.4,.003); sino(c,o,2093,t+.1,1.2,.22); sino(c,o,2637,t+.17,1.4,.2); },
    'bolha':function(c,o,t){ var x=osc(c,o,'sine',360,t,.15,.45,.003); x.frequency.exponentialRampToValueAtTime(1000,t+.07); },
    'fanfarra':function(c,o,t){ [523,659,784,1047].forEach(function(f,i){ var d=i===3?.8:.17; osc(c,o,'triangle',f,t+i*.11,d,.24,.01); osc(c,o,'sine',f*2,t+i*.11,d*.8,.06,.01); }); },
    'brilho':function(c,o,t){ [1568,1760,2093,2349,2637,3136].forEach(function(f,i){ osc(c,o,'sine',f,t+i*.055,.45,.12,.003); }); },
    'whoosh':function(c,o,t){ filtrado(c,o,t,.6,'bandpass',300,4200,2,.4,.15); },
    'pop':function(c,o,t){ var x=osc(c,o,'triangle',900,t,.09,.4,.002); x.frequency.exponentialRampToValueAtTime(220,t+.08); },
    'level-up':function(c,o,t){ [392,523,659,784,1047,1319].forEach(function(f,i){ osc(c,o,'square',f,t+i*.06,i===5?.5:.08,.07,.002); }); },
    'alerta':function(c,o,t){ for(var i=0;i<3;i++){ osc(c,o,'sawtooth',880,t+i*.16,.11,.08,.004); osc(c,o,'sine',1760,t+i*.16,.11,.08,.004); } }
  };
  var LISTA=[['sininho','Sininho'],['sino-duplo','Ding-dong'],['sino-triplo','Sino triplo'],['plim','Plim'],['notificacao','Notificação'],['moeda','Moeda'],
    ['caixa','Caixa registradora'],['bolha','Bolha'],['pop','Pop'],['fanfarra','Fanfarra'],['level-up','Level up'],['brilho','Brilho'],['whoosh','Whoosh'],['alerta','Alerta']];
  function tocar(id,volume,base){
    if(!id||id==='nenhum') return;
    var v=Math.max(0,Math.min(100,volume==null?70:volume))/100;
    if(id.indexOf('arquivo:')===0){ try{ var a=new Audio((base||'')+'sons/'+encodeURIComponent(id.slice(8))); a.volume=v; a.play().catch(function(){}); }catch(e){} return; }
    var fn=SONS[id]; if(!fn) return;
    try{ var c=ac(), g=c.createGain(); g.gain.value=v*1.5; g.connect(c.destination); fn(c,g,c.currentTime+0.03); }catch(e){}
  }
  return {lista:LISTA,tocar:tocar};
})();`;

const FONTES = String.raw`
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
<style>
@font-face{font-family:'Lemon Milk';src:local('LEMON MILK Bold'),local('LEMONMILK-Bold'),local('Lemon Milk Bold'),local('LEMON MILK'),url('fonte/lemonmilk');font-weight:700;font-display:swap}
:root{--roxo-0:#170F23;--roxo-1:#21172F;--roxo-2:#30243D;--amarelo:#FFE500;--off:#F5F2F9;
--titulo:'Lemon Milk','Montserrat',system-ui,sans-serif;--texto:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif}
</style>`;

const HTML_OVERLAY = String.raw`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Bench Chat · Overlay</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
${FONTES}
<link id="gf" rel="stylesheet" href="">
<style>
:root{--acento:#FFE500;--f1:rgba(33,23,47,.97);--f2:rgba(23,15,35,.97);--f2-solido:#170F23;--cor-texto:#F5F2F9;--cor-texto-suave:rgba(245,242,249,.7);
--cor-texto-08:rgba(245,242,249,.08);--cor-texto-12:rgba(245,242,249,.12);--cor-texto-18:rgba(245,242,249,.18);--cor-texto-55:rgba(245,242,249,.55);
--cor-nome:#FFE500;--nome-10:rgba(255,229,0,.1);--nome-32:rgba(255,229,0,.32);--nome-contraste:#170F23;
--aba-fundo:#30243D;--aba-texto:#F5F2F9;--cor-palavras:#FFE500;--especial:#FFE500;--especial-claro:#FFF07F;--especial-texto:#170F23;
--especial-40:rgba(255,229,0,.4);--especial-12:rgba(255,229,0,.12);--acento-55:rgba(255,229,0,.55);
--etiqueta:#FFE500;--etiqueta-texto:#170F23;--anel:#4A3D5C;
--raio:1.125em;--borda:.375em;--largura:66em;--msg:2.0625em;--nome:1.0625em;--av:4.625em;--av-raio:50%;
--linhas:4;--peso:600;--caixa:uppercase;--vel:1;--dir:-1;--mx:64px;--my:56px;--larg-feed:34rem;--espaco-feed:.5625rem}
html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}
html{font-size:16px}
body{font-family:var(--texto);color:var(--cor-texto);-webkit-font-smoothing:antialiased}
body.previa{background:#1b1b1f url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='24' height='24' fill='%23232329'/%3E%3Crect x='24' y='24' width='24' height='24' fill='%23232329'/%3E%3C/svg%3E")}
body.previa[data-fundo="escuro"]{background:radial-gradient(120% 90% at 70% 20%,#2b2140,#0c0911 70%)}
body.previa[data-fundo="claro"]{background:linear-gradient(160deg,#eceaf1,#c9c4d3)}
body.previa[data-fundo="jogo"]{background:linear-gradient(180deg,#5f86b3 0%,#a7c0d6 38%,#55613d 39%,#34402a 62%,#24291f 100%)}
#palco{position:fixed;inset:0}

/* posição: grade 3×3 dentro da área com margens */
.slot{position:absolute;inset:0;padding:var(--my) var(--mx);display:grid;grid-template:1fr/1fr;pointer-events:none;box-sizing:border-box}
.slot>*{grid-area:1/1}
.slot[data-pos^="sup"]{align-items:start}
.slot[data-pos^="meio"]{align-items:center}
.slot[data-pos^="inf"]{align-items:end}
.slot[data-pos$="esq"]{justify-items:start}
.slot[data-pos$="centro"]{justify-items:center}
.slot[data-pos$="dir"]{justify-items:end}

/* ═════════ peças comuns ═════════ */
.card{font-size:1rem;max-width:min(var(--largura),100%);box-sizing:border-box;position:relative}
.card.mini{font-size:.58rem;max-width:100%}
.topo{display:none}
.corpo{position:relative;display:flex;align-items:center;gap:1.4em}
.av-wrap{position:relative;flex:none}
.av{width:var(--av);height:var(--av);border-radius:var(--av-raio);overflow:hidden;background:linear-gradient(var(--cor-texto-12),var(--cor-texto-12)),var(--f2-solido);display:grid;place-items:center;
  box-shadow:0 0 0 .2em var(--f2-solido),0 0 0 .32em var(--anel)}
.av img{width:100%;height:100%;object-fit:cover;display:block}
.av span{font:700 calc(var(--av) * .33)/1 var(--titulo);color:var(--cor-nome)}
.badge{display:none;position:absolute;left:50%;bottom:-.7em;transform:translateX(-50%);white-space:nowrap;z-index:3;
  font:700 calc(var(--nome) * .62)/1 var(--titulo);letter-spacing:.08em;text-transform:uppercase;padding:.45em .8em .38em;border-radius:.45em;
  background:linear-gradient(180deg,var(--especial-claro),var(--especial));color:var(--especial-texto);box-shadow:0 .25em .7em rgba(0,0,0,.45)}
.conteudo{min-width:0}
.linha-nome{display:flex;align-items:center;gap:.6em;margin-bottom:.45em;flex-wrap:wrap}
.nome{font:700 var(--nome)/1.1 var(--titulo);letter-spacing:.06em;text-transform:var(--caixa);color:var(--cor-nome)}
.selo{font:700 calc(var(--nome) * .57)/1 var(--titulo);letter-spacing:.12em;padding:.55em .8em .5em;border-radius:.35em;
  color:var(--cor-nome);background:var(--nome-10);border:1px solid var(--nome-32)}
.selo.dono{background:var(--cor-nome);color:var(--nome-contraste);border-color:var(--cor-nome)}
.selo.verificado{color:var(--cor-texto);background:var(--cor-texto-08);border-color:var(--cor-texto-18)}
.valor-feed{display:none;font:700 calc(var(--nome) * .72)/1 var(--titulo);letter-spacing:.04em;color:var(--especial-texto);background:var(--especial);padding:.4em .6em .32em;border-radius:.3em}
.caixa{min-width:0}
.titulo-extra{font:600 calc(var(--msg) * .48)/1.3 var(--texto);color:var(--cor-texto-suave);margin-bottom:.3em}
.msg{font:var(--peso) var(--msg)/1.28 var(--texto);color:var(--cor-texto);overflow-wrap:anywhere;
  display:-webkit-box;-webkit-line-clamp:var(--linhas);-webkit-box-orient:vertical;overflow:hidden;letter-spacing:-.005em}
.msg img.emoji{height:1.15em;width:auto;vertical-align:-.22em;margin:0 .04em}
.msg mark{background:none;color:var(--cor-palavras);font-weight:800}
.sticker{height:calc(var(--av) * 1.2);width:auto;display:block}
.barra{position:absolute;left:0;right:0;bottom:0;height:.22em;background:var(--cor-texto-08)}
.barra i{display:block;height:100%;background:var(--acento);opacity:.85;transform-origin:left;animation:encolher linear forwards}
.mini .topo,.mini .barra{display:none!important}

/* elementos ligáveis */
.sem-avatar .av-wrap{display:none}
.sem-selos .selo{display:none}
.sem-barra .barra{display:none}
.sem-sombra .corpo,.sem-sombra .caixa,.sem-sombra .conteudo{box-shadow:none!important}
.sem-avatar .valor-feed{display:inline-block}
.card.t-superchat .av,.card.t-sticker .av,.card.t-presente .av{box-shadow:0 0 0 .2em var(--f2-solido),0 0 0 .34em var(--especial)}

/* ═════════ layout: Cartão (Bench) ═════════ */
.l-cartao .topo{display:flex;align-items:flex-end;justify-content:space-between;gap:1em;padding:0 .2em 0 calc(var(--borda) + 1em)}
.aba{display:inline-flex;align-items:center;gap:.55em;padding:.62em 1.2em .58em;border-radius:calc(var(--raio) * .6) calc(var(--raio) * .6) 0 0;
  background:var(--aba-fundo);color:var(--aba-texto);font:700 calc(var(--nome) * .74)/1 var(--titulo);letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.aba .ponto{width:.62em;height:.62em;border-radius:50%;background:var(--acento);animation:pulso 1.8s infinite}
.aba .valor{color:var(--acento)}
.marca{font:700 calc(var(--nome) * .66)/1 var(--titulo);letter-spacing:.22em;color:var(--cor-texto-55);padding-bottom:.55em;white-space:nowrap;margin-left:auto}
.marca b{color:var(--cor-texto);font-weight:700}
.marca img{display:block;height:calc(var(--nome) * 1.6);width:auto;margin-bottom:-.15em}
.sem-aba .aba,.sem-marca .marca{display:none}
.l-cartao.sem-aba.sem-marca .topo{display:none}
.l-cartao .corpo{padding:1.3em 2.2em 1.45em calc(var(--borda) + 1.2em);border-radius:0 var(--raio) var(--raio) var(--raio);
  background:linear-gradient(135deg,var(--f1),var(--f2));border:1px solid var(--cor-texto-08);box-shadow:0 1.4em 3.2em rgba(8,4,14,.55);overflow:hidden}
.l-cartao .corpo::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--borda);background:var(--acento)}
.l-cartao.sem-aba .corpo,.l-cartao .mini .corpo{border-radius:var(--raio)}
.l-cartao .barra{left:var(--borda)}
.l-cartao.sem-aba .valor-feed,.l-cartao .mini .valor-feed{display:inline-block}
.l-cartao .t-superchat .aba,.l-cartao .t-sticker .aba,.l-cartao .t-presente .aba{background:var(--especial);color:var(--especial-texto)}
.l-cartao .t-superchat .aba .valor,.l-cartao .t-sticker .aba .valor{color:var(--especial-texto)}
.l-cartao .t-superchat .aba .ponto,.l-cartao .t-sticker .aba .ponto,.l-cartao .t-presente .aba .ponto{background:var(--especial-texto);animation:none}
.l-cartao .t-superchat .corpo,.l-cartao .t-sticker .corpo,.l-cartao .t-presente .corpo{border-color:var(--especial-40);
  background:radial-gradient(120% 140% at 0% 0%,var(--especial-12),transparent 55%),linear-gradient(135deg,var(--f1),var(--f2))}
.l-cartao .t-superchat .corpo::before,.l-cartao .t-sticker .corpo::before,.l-cartao .t-presente .corpo::before{background:var(--especial)}
.l-cartao .t-membro .aba{color:var(--acento)}

/* ═════════ layout: Clássico (etiqueta + barra) ═════════ */
.l-classico .corpo{display:grid;grid-template-columns:auto minmax(0,auto);grid-template-rows:auto auto;gap:0;justify-content:start}
.l-classico .conteudo{display:contents}
.l-classico .av-wrap{grid-column:1;grid-row:1/3;align-self:center;z-index:2;margin-right:calc(var(--av) * -.5)}
.l-classico .av{box-shadow:0 0 0 .2em var(--anel),0 .3em .9em rgba(0,0,0,.35)}
.l-classico .badge,.l-bolha .badge{display:block}
.l-classico .linha-nome{grid-column:2;grid-row:1;justify-self:start;margin:0 0 0 calc(var(--av) * .5 + .15em);padding:.34em .75em .3em;gap:.45em;
  background:var(--etiqueta);border-radius:calc(var(--raio) * .5) calc(var(--raio) * .5) 0 0;flex-wrap:nowrap}
.l-classico .nome,.l-faixa .nome{color:var(--etiqueta-texto);letter-spacing:.01em}
.l-classico .selo,.l-faixa .selo{color:var(--etiqueta-texto);background:transparent;border-color:currentColor;opacity:.85}
.l-classico .caixa{grid-column:2;grid-row:2;justify-self:start;position:relative;box-sizing:border-box;overflow:hidden;
  padding:.5em 1.25em .55em calc(var(--av) * .5 + .8em);min-height:calc(var(--av) * .62);display:flex;flex-direction:column;justify-content:center;
  background:linear-gradient(135deg,var(--f1),var(--f2));border-radius:0 var(--raio) var(--raio) var(--raio);box-shadow:0 .8em 2em rgba(0,0,0,.4)}
.l-classico.sem-avatar .linha-nome{margin-left:0}
.l-classico.sem-avatar .caixa{padding-left:1.25em}
.l-classico .t-superchat .caixa,.l-classico .t-sticker .caixa,.l-classico .t-presente .caixa{box-shadow:inset 0 0 0 .12em var(--especial-40),0 .8em 2em rgba(0,0,0,.4)}
.l-classico .card.t-superchat .av,.l-classico .card.t-sticker .av,.l-classico .card.t-presente .av{box-shadow:0 0 0 .2em var(--especial),0 .3em .9em rgba(0,0,0,.35)}

/* ═════════ layout: Bolha ═════════ */
.l-bolha .corpo{gap:1.1em}
.l-bolha .av{box-shadow:0 0 0 .2em var(--anel),0 .3em .9em rgba(0,0,0,.35)}
.l-bolha .card.t-superchat .av,.l-bolha .card.t-sticker .av,.l-bolha .card.t-presente .av{box-shadow:0 0 0 .2em var(--especial),0 .3em .9em rgba(0,0,0,.35)}
.l-bolha .conteudo{position:relative;background:linear-gradient(135deg,var(--f1),var(--f2));border-radius:max(var(--raio),.6em);
  padding:.85em 1.45em 1em;box-shadow:0 1em 2.4em rgba(8,4,14,.45);border:1px solid var(--cor-texto-08)}
.l-bolha .conteudo::before{content:"";position:absolute;left:-.5em;top:50%;width:1em;height:1em;background:var(--f1);
  transform:translateY(-50%) rotate(45deg);border-left:1px solid var(--cor-texto-08);border-bottom:1px solid var(--cor-texto-08)}
.l-bolha.sem-avatar .conteudo::before{display:none}
.l-bolha .barra{left:max(var(--raio),.6em);right:max(var(--raio),.6em);border-radius:.2em}
.l-bolha .t-superchat .conteudo,.l-bolha .t-sticker .conteudo,.l-bolha .t-presente .conteudo{border-color:var(--especial-40);
  background:radial-gradient(120% 140% at 0% 0%,var(--especial-12),transparent 55%),linear-gradient(135deg,var(--f1),var(--f2))}

/* ═════════ layout: Faixa (estilo TV) ═════════ */
.l-faixa .corpo{align-items:stretch;gap:0;border-radius:var(--raio);overflow:hidden;box-shadow:0 1em 2.4em rgba(8,4,14,.5)}
.l-faixa .conteudo{display:contents}
.l-faixa .av-wrap{display:flex;align-items:center;padding:.6em 0 .6em .75em;background:var(--etiqueta)}
.l-faixa .av{width:calc(var(--av) * .72);height:calc(var(--av) * .72);box-shadow:none}
.l-faixa .card .av{box-shadow:none!important}
.l-faixa .linha-nome{position:relative;z-index:1;flex:none;max-width:42%;margin:0;padding:0 1.9em 0 .9em;flex-wrap:nowrap;
  background:var(--etiqueta);clip-path:polygon(0 0,100% 0,calc(100% - .9em) 100%,0 100%)}
.l-faixa .nome{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l-faixa .valor-feed{display:inline-block;background:var(--etiqueta-texto);color:var(--etiqueta)}
.l-faixa .av span{color:var(--etiqueta)}
.l-faixa .caixa{position:relative;flex:1 1 auto;min-width:0;margin-left:-.9em;padding:.7em 1.6em .75em 2.1em;
  display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,var(--f1),var(--f2))}
.l-faixa.sem-avatar .linha-nome{padding-left:1.2em}

/* ═════════ layout: Só texto ═════════ */
.l-texto .corpo{align-items:flex-start;gap:.9em}
.l-texto .av{width:calc(var(--av) * .62);height:calc(var(--av) * .62);box-shadow:0 0 0 .14em var(--anel),0 .3em .8em rgba(0,0,0,.5)}
.l-texto .conteudo{border-left:var(--borda) solid var(--acento);padding-left:.8em}
.l-texto .t-superchat .conteudo,.l-texto .t-sticker .conteudo,.l-texto .t-presente .conteudo{border-left-color:var(--especial)}
.l-texto .nome,.l-texto .msg,.l-texto .titulo-extra,.l-texto .selo{text-shadow:0 .08em .14em rgba(0,0,0,.95),0 0 .6em rgba(0,0,0,.7)}
.l-texto .valor-feed{display:inline-block}
.l-texto .barra{display:none}

/* ═════════ animações ═════════ */
.anim-wipe #slot-card .card .corpo{animation:abrir calc(.6s / var(--vel)) cubic-bezier(.2,.8,.2,1) both}
.anim-wipe #slot-card .card .aba{animation:subir calc(.4s / var(--vel)) calc(.18s / var(--vel)) cubic-bezier(.2,.8,.2,1) both}
.anim-wipe #slot-card .card .marca{animation:aparecer calc(.4s / var(--vel)) calc(.3s / var(--vel)) both}
.anim-wipe #slot-card .card .av{animation:pop calc(.45s / var(--vel)) calc(.2s / var(--vel)) cubic-bezier(.3,1.4,.5,1) both}
.anim-wipe #slot-card .card .badge{animation:aparecer calc(.35s / var(--vel)) calc(.45s / var(--vel)) both}
.anim-deslizar #slot-card .card{animation:entrarLado calc(.55s / var(--vel)) cubic-bezier(.2,.8,.2,1) both}
.anim-subir #slot-card .card{animation:entrarBaixo calc(.5s / var(--vel)) cubic-bezier(.2,.8,.2,1) both}
.anim-fade #slot-card .card{animation:aparecer calc(.5s / var(--vel)) ease both}
.anim-pop #slot-card .card{animation:entrarPop calc(.5s / var(--vel)) cubic-bezier(.3,1.35,.5,1) both}
#feed .card{animation:entrarFeed calc(.4s / var(--vel)) cubic-bezier(.2,.8,.2,1) both}
.card.sair{animation:sair calc(.38s / var(--vel)) cubic-bezier(.5,0,.8,.3) forwards!important}
.anim-nenhuma .card.sair{animation:none!important;opacity:0}
.estatico *,.estatico .card{animation:none!important}
.estatico .aba .ponto{animation:pulso 1.8s infinite!important}
@keyframes abrir{from{clip-path:inset(-50% 100% -50% -50%)}to{clip-path:inset(-50% -50% -50% -50%)}}
@keyframes subir{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
@keyframes aparecer{from{opacity:0}to{opacity:1}}
@keyframes pop{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}}
@keyframes entrarLado{from{transform:translateX(calc(var(--dir) * 5rem));opacity:0}to{transform:none;opacity:1}}
@keyframes entrarBaixo{from{transform:translateY(2.5rem);opacity:0}to{transform:none;opacity:1}}
@keyframes entrarPop{from{transform:scale(.82);opacity:0}to{transform:none;opacity:1}}
@keyframes entrarFeed{from{transform:translateY(.8rem);opacity:0}to{transform:none;opacity:1}}
@keyframes sair{to{opacity:0;translate:0 1.2rem}}
@keyframes encolher{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes pulso{0%{box-shadow:0 0 0 0 var(--acento-55)}70%{box-shadow:0 0 0 .45em transparent}100%{box-shadow:0 0 0 0 transparent}}

/* ═════════ chat corrido ═════════ */
#feed{width:min(var(--larg-feed),100%);display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;gap:var(--espaco-feed);transition:opacity .3s}
.slot[data-pos$="centro"] #feed{align-items:center}
.slot[data-pos$="dir"] #feed{align-items:flex-end}
.l-classico #feed,.l-bolha #feed,.l-texto #feed{align-items:flex-start}
.l-classico #feed .card,.l-bolha #feed .card{margin-bottom:.35rem}
.com-destaque.feed-junto #feed{opacity:0}
</style></head>
<body>
<div id="palco">
  <div class="slot" id="slot-feed" data-pos="inf-esq"><div id="feed" style="display:none"></div></div>
  <div class="slot" id="slot-card" data-pos="inf-esq"></div>
</div>
<script>${SONS_JS}</script>
<script>
(function(){
var Q=location.search;
var previa=/[?&]previa=1/.test(Q), amostra=/[?&]amostra=1/.test(Q);
if(previa) document.body.classList.add('previa');
var palco=document.getElementById('palco'), slotCard=document.getElementById('slot-card'), slotFeed=document.getElementById('slot-feed'), feed=document.getElementById('feed');
var cfg={estilo:{}}, est={}, atual=null, cardEl=null, regex=null, controlado=false, tipoAmostra='superchat';
var NOME_SELO={dono:'DONO',mod:'MOD',membro:'MEMBRO',verificado:'VERIFICADO'};
var GF={'Montserrat':'Montserrat:wght@400;500;600;700;800;900','Inter':'Inter:wght@400;500;600;700;800;900','Poppins':'Poppins:wght@400;500;600;700;800;900',
'Bebas Neue':'Bebas+Neue','Oswald':'Oswald:wght@400;500;600;700','Archivo Black':'Archivo+Black','Space Grotesk':'Space+Grotesk:wght@400;500;600;700',
'DM Sans':'DM+Sans:wght@400;500;600;700;800','Roboto':'Roboto:wght@400;500;700;900','Rajdhani':'Rajdhani:wght@500;600;700','Orbitron':'Orbitron:wght@500;600;700;800;900'};

function el(tag,cls,txt){var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e;}
function esc(s){return s.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');}
function rgb(h){ var n=parseInt((h||'#000000').slice(1),16); return [n>>16&255,n>>8&255,n&255]; }
function rgba(h,a){ return 'rgba('+rgb(h).join(',')+','+a+')'; }
function clarear(h,t){ var c=rgb(h).map(function(x){ return Math.round(x+(255-x)*t); }); return 'rgb('+c.join(',')+')'; }
function contraste(h){ var c=rgb(h).map(function(x){ x/=255; return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4); }); return (.2126*c[0]+.7152*c[1]+.0722*c[2])>.4?'#170F23':'#F5F2F9'; }
function vel(){ return (est.velocidade||100)/100; }

function fontes(){
  var fam={}; fam[est.fonteTitulo]=1; fam[est.fonteTexto]=1;
  var specs=Object.keys(fam).filter(function(f){return GF[f];}).map(function(f){return 'family='+GF[f];});
  var href=specs.length?'https://fonts.googleapis.com/css2?'+specs.join('&')+'&display=swap':'';
  var l=document.getElementById('gf'); if(l.getAttribute('href')!==href) l.setAttribute('href',href);
  document.documentElement.style.setProperty('--titulo',"'"+(est.fonteTitulo||'Lemon Milk')+"','Montserrat',system-ui,sans-serif");
  document.documentElement.style.setProperty('--texto',"'"+(est.fonteTexto||'Inter')+"',system-ui,'Segoe UI',sans-serif");
}

function aplicar(c){
  if(c) cfg=c;
  est=cfg.estilo||{};
  var R=document.documentElement;
  function v(n,x){ R.style.setProperty(n,x); }
  function em(px){ return (px/16)+'em'; }
  R.style.fontSize=(16*(est.escala||100)/100)+'px';
  var op=(est.opacidade==null?97:est.opacidade)/100;
  v('--acento',est.corAcento); v('--acento-55',rgba(est.corAcento,.55));
  v('--f1',rgba(est.corFundo1,op)); v('--f2',rgba(est.corFundo2,op)); v('--f2-solido',est.corFundo2);
  v('--cor-texto',est.corTexto); v('--cor-texto-suave',rgba(est.corTexto,.7)); v('--cor-texto-08',rgba(est.corTexto,.08));
  v('--cor-texto-12',rgba(est.corTexto,.12)); v('--cor-texto-18',rgba(est.corTexto,.18)); v('--cor-texto-55',rgba(est.corTexto,.55));
  v('--cor-nome',est.corNome); v('--nome-10',rgba(est.corNome,.1)); v('--nome-32',rgba(est.corNome,.32)); v('--nome-contraste',contraste(est.corNome));
  v('--aba-fundo',est.corAbaFundo); v('--aba-texto',est.corAbaTexto); v('--cor-palavras',est.corPalavras);
  v('--especial',est.corEspecial); v('--especial-claro',clarear(est.corEspecial,.35)); v('--especial-texto',contraste(est.corEspecial));
  v('--especial-40',rgba(est.corEspecial,.4)); v('--especial-12',rgba(est.corEspecial,.12));
  v('--etiqueta',est.corEtiqueta); v('--etiqueta-texto',est.corEtiquetaTexto); v('--anel',est.corAnel);
  v('--raio',em(est.raio)); v('--borda',em(est.bordaLateral)); v('--largura',em(est.largura));
  v('--msg',em(est.tamMsg)); v('--nome',em(est.tamNome)); v('--av',em(est.tamAvatar));
  v('--av-raio',{circulo:'50%',arredondado:'24%',quadrado:'.35em'}[est.avatarForma]||'50%');
  v('--linhas',String(est.linhasMax||4)); v('--peso',String(est.pesoMsg||600)); v('--caixa',est.nomeCaixaAlta?'uppercase':'none');
  v('--vel',String(vel())); v('--mx',est.margemX+'px'); v('--my',est.margemY+'px');
  v('--larg-feed',(est.larguraFeed/16)+'rem'); v('--espaco-feed',(est.espacoFeed/16)+'rem');
  var posFeed=est.posFeed==='igual'?est.posicao:est.posFeed;
  v('--dir',/dir$/.test(est.posicao)?'1':'-1');
  slotCard.setAttribute('data-pos',est.posicao||'inf-esq'); slotFeed.setAttribute('data-pos',posFeed||'inf-esq');
  var cls=['l-'+(est.layout||'cartao'),'anim-'+(est.animacao||'wipe')];
  if(!est.mostrarAvatar) cls.push('sem-avatar'); if(!est.mostrarAba) cls.push('sem-aba'); if(!est.mostrarMarca) cls.push('sem-marca');
  if(!est.mostrarSelos) cls.push('sem-selos'); if(!est.mostrarBarra) cls.push('sem-barra'); if(!est.sombra) cls.push('sem-sombra');
  if(posFeed===est.posicao) cls.push('feed-junto');
  if(cardEl) cls.push('com-destaque');
  if(palco.classList.contains('estatico')) cls.push('estatico');
  palco.className=cls.join(' ');
  fontes();
  var pal=(cfg.palavras||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  regex=pal.length? new RegExp('([\\p{L}\\d]*(?:'+pal.map(esc).join('|')+')[\\p{L}\\d]*)','giu') : null;
  if(!amostra){ if(cfg.modo==='feed') feed.style.display=''; else { feed.style.display='none'; feed.innerHTML=''; } }
}

function nomeDe(m){
  var n=m.autor||'';
  if(cfg.nome==='primeiro' && n.charAt(0)!=='@') n=n.split(/\s+/)[0];
  return n;
}
function avatar(m){
  var a=el('div','av');
  var vazio=function(){ a.innerHTML=''; a.appendChild(el('span',null,(m.autor||'?').replace(/^@/,'').charAt(0).toUpperCase())); };
  if(m.foto){ var i=el('img'); i.referrerPolicy='no-referrer'; i.src=m.foto; i.onerror=vazio; a.appendChild(i); } else vazio();
  return a;
}
function preencher(alvo,partes){
  (partes||[]).forEach(function(p){
    if(p.e){
      if(/^https:\/\//.test(p.e)){ var i=el('img','emoji'); i.src=p.e; i.alt=''; i.referrerPolicy='no-referrer'; i.onerror=function(){ this.remove(); }; alvo.appendChild(i); }
      return;
    }
    var t=p.t||'';
    if(!regex){ alvo.appendChild(document.createTextNode(t)); return; }
    t.split(regex).forEach(function(pedaco,idx){
      if(!pedaco) return;
      alvo.appendChild(idx%2===1? el('mark',null,pedaco) : document.createTextNode(pedaco));
    });
  });
}
function textoAba(m){
  if(m.tipo==='superchat') return 'Super Chat';
  if(m.tipo==='sticker') return 'Super Sticker';
  if(m.tipo==='membro') return 'Membro';
  if(m.tipo==='presente') return 'Presente';
  return est.abaTexto||'Chat ao vivo';
}
function textoBadge(m){
  if(m.tipo==='superchat'||m.tipo==='sticker') return m.valor||'Super Chat';
  if(m.tipo==='presente') return 'Presente';
  if(m.tipo==='membro') return 'Membro';
  return '';
}

/* uma marcação só para todos os layouts; o CSS de cada layout organiza as peças */
function criarCard(m,dur,mini){
  var c=el('div','card t-'+m.tipo+(mini?' mini':''));
  if(m.id) c.setAttribute('data-id',m.id);
  var topo=el('div','topo');
  var aba=el('div','aba'); aba.appendChild(el('span','ponto')); aba.appendChild(el('span',null,textoAba(m)));
  if(m.valor){ aba.appendChild(el('span',null,'·')); aba.appendChild(el('span','valor',m.valor)); }
  topo.appendChild(aba);
  var marca=el('div','marca');
  if(est.logoUrl && /^https?:\/\//.test(est.logoUrl)){ var lg=el('img'); lg.src=est.logoUrl; lg.alt=''; marca.appendChild(lg); }
  else {
    var palavras=(est.marcaTexto||'').trim().split(/\s+/);
    if(palavras[0]){ marca.appendChild(el('b',null,palavras[0])); if(palavras.length>1) marca.appendChild(document.createTextNode(' '+palavras.slice(1).join(' '))); }
  }
  topo.appendChild(marca);
  c.appendChild(topo);

  var corpo=el('div','corpo');
  var aw=el('div','av-wrap'); aw.appendChild(avatar(m));
  var bt=textoBadge(m); if(bt) aw.appendChild(el('div','badge',bt));
  corpo.appendChild(aw);
  var ct=el('div','conteudo');
  var ln=el('div','linha-nome');
  ln.appendChild(el('span','nome',nomeDe(m)));
  (m.selos||[]).forEach(function(s){ if(NOME_SELO[s]) ln.appendChild(el('span','selo '+s,NOME_SELO[s])); });
  if(m.valor) ln.appendChild(el('span','valor-feed',m.valor));
  ct.appendChild(ln);
  var cx=el('div','caixa'), temMsg=m.partes && m.partes.length;
  if(m.titulo && temMsg) cx.appendChild(el('div','titulo-extra',m.titulo));
  if(m.sticker){ var s=el('img','sticker'); s.src=m.sticker; cx.appendChild(s); }
  var msg=el('div','msg');
  if(temMsg) preencher(msg,m.partes); else if(m.titulo) preencher(msg,[{t:m.titulo}]);
  if(msg.childNodes.length) cx.appendChild(msg);
  if(dur!==0 && !mini){
    var b=el('div','barra'), i=el('i');
    if(dur>0) i.style.animationDuration=dur+'s'; else { i.style.animation='none'; i.style.transform='scaleX(.62)'; }
    b.appendChild(i); cx.appendChild(b);
  }
  ct.appendChild(cx);
  corpo.appendChild(ct);
  c.appendChild(corpo);
  return c;
}

function tirar(no,ms){ no.classList.add('sair'); setTimeout(function(){ no.remove(); }, ms/vel()+60); }
function mostrar(m,dur,semSom){
  if(cardEl) tirar(cardEl,400);
  atual=m; cardEl=criarCard(m,dur);
  slotCard.appendChild(cardEl);
  palco.classList.add('com-destaque');
  if(!semSom) tocarMsg(m);
}
function ocultar(){
  if(!cardEl) return;
  var c=cardEl; cardEl=null; atual=null;
  palco.classList.remove('com-destaque');
  tirar(c,420);
}
function addFeed(m){
  if(cfg.modo!=='feed') return;
  var it=criarCard(m,0,true);
  feed.appendChild(it);
  while(feed.children.length>(est.feedMax||6)) feed.removeChild(feed.firstChild);
  if(cfg.autoOcultar>0) setTimeout(function(){ tirar(it,350); }, cfg.autoOcultar*1000+3000);
  if(cfg.sons && cfg.sons.feed) tocarMsg(m,true);
}

/* ── modo amostra (prévia da aba Aparência) ── */
var AMOSTRAS={
  texto:{id:'a1',tipo:'texto',autor:'@leitor_do_bench',selos:['mod'],partes:[{t:'Esse notebook roda CS2 liso? Tô de olho no cupom que vocês passaram!'}]},
  superchat:{id:'a2',tipo:'superchat',autor:'Marina Costa',valor:'R$ 50,00',selos:['membro'],partes:[{t:'Valeu pelas promos, Jean! Peguei o notebook com o cupom da live 🔥'}]},
  membro:{id:'a3',tipo:'membro',autor:'@gabriel.tech',titulo:'Novo membro do canal',selos:['membro'],partes:[{t:'Bem-vindo ao Bench Promos!'}]},
  presente:{id:'a4',tipo:'presente',autor:'@Lucas_Lap',titulo:'Enviou 10 assinaturas de presente do canal Bench Promos',selos:['membro'],partes:[]}
};
var AMOSTRA_FEED=[
  {id:'f1',tipo:'texto',autor:'Ana Paula',selos:[],partes:[{t:'Tem cupom pro Acer Nitro?'}]},
  {id:'f2',tipo:'texto',autor:'@lucas_rtx',selos:['mod'],partes:[{t:'Esse preço tá bom demais 🔥'}]},
  {id:'f3',tipo:'superchat',autor:'Rafael Souza',valor:'R$ 20,00',selos:[],partes:[{t:'Valeu pelas promos!'}]},
  {id:'f4',tipo:'texto',autor:'Fernanda Lima',selos:['membro'],partes:[{t:'Qual a melhor RTX até 3 mil?'}]},
  {id:'f5',tipo:'texto',autor:'@pedrohw',selos:[],partes:[{t:'promo top demais, comprei!'}]},
  {id:'f6',tipo:'texto',autor:'Carlos Mendes',selos:[],partes:[{t:'Chegou o meu ontem, recomendo'}]}
];
function renderAmostra(animar){
  palco.classList.toggle('estatico',!animar);
  slotCard.innerHTML=''; feed.innerHTML=''; cardEl=null; palco.classList.remove('com-destaque');
  if(tipoAmostra==='feed'){
    feed.style.display='';
    for(var i=0;i<Math.min(est.feedMax||6,12);i++){ var m=AMOSTRA_FEED[i%AMOSTRA_FEED.length]; feed.appendChild(criarCard({id:m.id+i,tipo:m.tipo,autor:m.autor,selos:m.selos,valor:m.valor,partes:m.partes},0,true)); }
  } else {
    feed.style.display='none';
    cardEl=criarCard(AMOSTRAS[tipoAmostra]||AMOSTRAS.superchat,-1);
    slotCard.appendChild(cardEl); palco.classList.add('com-destaque');
  }
}
window.addEventListener('message',function(e){
  if(e.origin!==location.origin || !amostra) return;
  var d=e.data||{};
  if(d.tipo==='config'){
    var antes=[est.animacao,est.velocidade,est.layout].join();
    controlado=true; aplicar(d.config);
    renderAmostra(antes!==[est.animacao,est.velocidade,est.layout].join());
  }
  else if(d.tipo==='amostra'){ tipoAmostra=d.valor; renderAmostra(true); }
  else if(d.tipo==='replay'){ renderAmostra(true); }
  else if(d.tipo==='fundo'){ document.body.setAttribute('data-fundo',d.valor); }
});

/* ── sons ── */
var ultimoSom=0, ultimoIdSom=null;
function somDe(tipo){
  var x=cfg.sons||{};
  if(tipo==='superchat'||tipo==='sticker') return x.superchat;
  if(tipo==='membro') return x.membro;
  if(tipo==='presente') return x.presente;
  return x.texto;
}
function tocarMsg(m,doFeed){
  var x=cfg.sons||{};
  if(previa||!x.ativo) return;
  if(m.id && m.id===ultimoIdSom) return;            // não toca duas vezes a mesma mensagem
  var agora=Date.now();
  if(doFeed && agora-ultimoSom<1200) return;        // chat corrido: no máximo 1 som a cada 1,2 s
  ultimoIdSom=m.id; ultimoSom=agora;
  BenchSons.tocar(somDe(m.tipo),x.volume);
}

var es=new EventSource('eventos?lado=overlay');
function ouvir(ev,fn){ es.addEventListener(ev,function(e){ fn(JSON.parse(e.data)); }); }
if(amostra){
  ouvir('estado',function(d){ if(!controlado){ aplicar(d.config); renderAmostra(true); } });
  ouvir('config',function(d){ if(!controlado){ aplicar(d); renderAmostra(false); } });
} else {
  ouvir('estado',function(d){ aplicar(d.config); if(d.destaque){ if(!atual||atual.id!==d.destaque.id) mostrar(d.destaque,0,true); } else ocultar(); });
  ouvir('config',function(d){ aplicar(d); });
  ouvir('mostrar',function(d){ mostrar(d.msg,d.duracao); });
  ouvir('ocultar',ocultar);
  ouvir('msg',addFeed);
  ouvir('tocar',function(d){ if(!previa) BenchSons.tocar(d.som,(cfg.sons||{}).volume); });
  ouvir('remover',function(d){ d.ids.forEach(function(id){ var n=feed.querySelector('[data-id="'+CSS.escape(id)+'"]'); if(n) n.remove(); }); });
}
})();
</script>
</body></html>`;

const HTML_PAINEL = String.raw`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Bench Chat · Painel</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
${FONTES}
<style>
*{box-sizing:border-box}
[hidden]{display:none!important}
html,body{margin:0;height:100%}
body{background:var(--roxo-0);color:var(--off);font:500 14px/1.4 var(--texto);-webkit-font-smoothing:antialiased;display:flex;flex-direction:column}
button,input,select{font:inherit;color:inherit}
header{display:flex;align-items:center;gap:18px;padding:12px 20px;border-bottom:1px solid var(--roxo-2);background:var(--roxo-1)}
.logo{font:700 15px/1 var(--titulo);letter-spacing:.14em;white-space:nowrap}
.logo b{color:var(--amarelo);font-weight:700}
.abas{display:flex;gap:4px;background:var(--roxo-0);border:1px solid var(--roxo-2);border-radius:10px;padding:3px}
.abas button{border:0;background:transparent;border-radius:7px;padding:7px 14px;font-weight:700;font-size:13px;cursor:pointer;color:rgba(245,242,249,.65)}
.abas button.on{background:var(--roxo-2);color:var(--amarelo)}
.status{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:99px;background:var(--roxo-0);border:1px solid var(--roxo-2);font-weight:600;font-size:13px;white-space:nowrap;max-width:40vw;overflow:hidden;text-overflow:ellipsis}
.status i{flex:none;width:8px;height:8px;border-radius:50%;background:#7d7389}
.status.conectado i{background:#3ddc84;box-shadow:0 0 0 3px rgba(61,220,132,.18)}
.status.buscando i,.status.aguardando i{background:var(--amarelo)}
.status.erro i{background:#ff5a5f}
#titulo-live{color:rgba(245,242,249,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
#titulo-live a{color:inherit;text-decoration:none}
#titulo-live a:hover{color:var(--off)}
.tela{flex:1;display:grid;min-height:0}
#tela-vivo{grid-template-columns:minmax(0,1fr) 400px}
#tela-aparencia{grid-template-columns:minmax(0,1fr) 440px}
.chat{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--roxo-2);position:relative}
.chat-topo{display:flex;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--roxo-2)}
.chat-topo input{flex:1;max-width:280px}
.dica{color:rgba(245,242,249,.5);font-size:12.5px;flex:1;text-align:right}
#lista{flex:1;overflow-y:auto;padding:8px 8px 16px}
.vazio{color:rgba(245,242,249,.45);text-align:center;padding:60px 20px;line-height:1.6}
.item{display:flex;gap:11px;align-items:flex-start;padding:9px 12px;border-radius:10px;cursor:pointer;position:relative;border:1px solid transparent;transition:background .12s}
.item:hover{background:var(--roxo-1);border-color:var(--roxo-2)}
.item .av{flex:none;width:32px;height:32px;border-radius:50%;overflow:hidden;background:var(--roxo-2);display:grid;place-items:center;font:700 12px var(--titulo);color:var(--amarelo)}
.item .av img{width:100%;height:100%;object-fit:cover}
.item .cx{min-width:0;flex:1}
.item .ln{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.item .nm{font-weight:700;color:rgba(245,242,249,.72)}
.item .sl{font:700 9px/1 var(--titulo);letter-spacing:.1em;padding:3px 5px;border-radius:4px;color:var(--amarelo);border:1px solid rgba(255,229,0,.35)}
.item .sl.dono{background:var(--amarelo);color:var(--roxo-0)}
.item .hr{font-size:11.5px;color:rgba(245,242,249,.35);margin-left:auto}
.item .vl{font:700 10px/1 var(--titulo);letter-spacing:.06em;background:var(--amarelo);color:var(--roxo-0);padding:4px 6px 3px;border-radius:4px}
.item .ex{color:rgba(245,242,249,.6);font-size:13px}
.item .tx{color:var(--off);font-size:15px;overflow-wrap:anywhere;margin-top:1px}
.item .tx img{height:1.25em;vertical-align:-.25em}
.item .tx mark{background:none;color:var(--amarelo);font-weight:700}
.item.especial{background:linear-gradient(90deg,rgba(255,229,0,.08),transparent 70%);border-left:3px solid var(--amarelo)}
#lista.v-chat .item.especial{display:none!important}
.chat-topo .seg{flex:none}
.contador{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;margin-left:4px;border-radius:99px;background:var(--amarelo);color:var(--roxo-0);font-size:11px;font-weight:800}
#painel-apoios{flex:1;display:flex;flex-direction:column;min-height:0}
.totais{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:10px;padding:12px 16px;border-bottom:1px solid var(--roxo-2);align-items:stretch}
.total{background:var(--roxo-1);border:1px solid var(--roxo-2);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:2px;min-width:0}
.total small{font:700 10px/1 var(--titulo);letter-spacing:.14em;color:rgba(245,242,249,.5);text-transform:uppercase}
.total b{font-size:22px;font-weight:800;line-height:1.15;color:var(--amarelo);font-variant-numeric:tabular-nums}
.total span{font-size:12.5px;color:rgba(245,242,249,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acoes-apoios{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;gap:8px}
.acoes-apoios .tog{margin:0;font-size:12.5px;white-space:nowrap}
#lista-apoios{flex:1;overflow-y:auto;padding:8px 8px 16px}
#lista-apoios .item{border-left:3px solid var(--amarelo);background:linear-gradient(90deg,rgba(255,229,0,.06),transparent 70%);margin-bottom:4px;padding-right:130px}
#lista-apoios .item.t-membro,#lista-apoios .item.t-presente{border-left-color:#B18CFF;background:linear-gradient(90deg,rgba(177,140,255,.09),transparent 70%)}
#lista-apoios .item .tipo-apoio{font:700 9px/1 var(--titulo);letter-spacing:.12em;padding:4px 6px 3px;border-radius:4px;background:var(--roxo-2);color:var(--off)}
#lista-apoios .item.ok{opacity:.5}
#lista-apoios.pendentes .item.ok{display:none!important}
.agradecer{position:absolute;right:10px;top:50%;transform:translateY(-50%);border:1px solid var(--roxo-2);background:var(--roxo-0);color:var(--off);border-radius:8px;padding:7px 10px;font-weight:700;font-size:12.5px;cursor:pointer;white-space:nowrap}
.agradecer:hover{border-color:var(--amarelo)}
.item.ok .agradecer{background:#1f3a2c;border-color:#3ddc84;color:#9ff0c3}
#lista-apoios .item .noar{right:130px}
@media (max-width:1100px){.totais{grid-template-columns:repeat(3,minmax(0,1fr))}.acoes-apoios{grid-column:1/-1;flex-direction:row;align-items:center}}
.item.teste .nm::after{content:" · teste";color:rgba(245,242,249,.35);font-weight:500}
.item .noar{display:none;position:absolute;right:10px;top:50%;transform:translateY(-50%);font:700 10px/1 var(--titulo);letter-spacing:.14em;background:var(--amarelo);color:var(--roxo-0);padding:6px 9px 5px;border-radius:6px}
.item.ativo{background:rgba(255,229,0,.07);border-color:var(--amarelo)}
.item.ativo .noar{display:block}
.item.ativo .hr{visibility:hidden}
#novas{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);border:0;border-radius:99px;padding:9px 16px;background:var(--amarelo);color:var(--roxo-0);font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4)}
aside{overflow-y:auto;padding:4px 0 32px;background:var(--roxo-1);min-height:0}
.bloco{padding:16px 20px;border-bottom:1px solid var(--roxo-2)}
h2{margin:0 0 12px;font:700 11px/1 var(--titulo);letter-spacing:.16em;color:rgba(245,242,249,.55);text-transform:uppercase}
.linha{display:flex;gap:8px}
.linha+.linha{margin-top:8px}
input[type=text],input:not([type]),input[type=password],select{width:100%;min-width:0;background:var(--roxo-0);border:1px solid var(--roxo-2);border-radius:9px;padding:9px 11px;outline:0}
input:focus,select:focus{border-color:rgba(255,229,0,.6)}
input[readonly]{color:rgba(245,242,249,.75)}
button.b,label.b{flex:none;border:1px solid var(--roxo-2);background:var(--roxo-2);border-radius:9px;padding:9px 13px;font-weight:700;cursor:pointer;white-space:nowrap}
button.b:hover,label.b:hover{border-color:rgba(245,242,249,.25)}
button.pri{background:var(--amarelo);border-color:var(--amarelo);color:var(--roxo-0)}
button.pri:hover{border-color:var(--amarelo);filter:brightness(1.06)}
button.leve{background:transparent}
.nota{margin:8px 0 0;font-size:12.5px;color:rgba(245,242,249,.5)}
.nota.alerta{color:var(--amarelo)}
.previa{position:relative;aspect-ratio:16/9;border-radius:10px;overflow:hidden;border:1px solid var(--roxo-2);background:#1b1b1f}
.previa iframe{position:absolute;top:0;left:0;width:1920px;height:1080px;border:0;transform-origin:0 0;pointer-events:none}
#caixa-previa{margin-bottom:10px}
.campo{display:grid;grid-template-columns:132px 1fr;align-items:center;gap:10px;margin-bottom:11px}
.campo:last-child{margin-bottom:0}
.campo>span{color:rgba(245,242,249,.72);font-size:13px;line-height:1.25;cursor:default}
.campo>span[title]{cursor:help}
.seg{display:flex;background:var(--roxo-0);border:1px solid var(--roxo-2);border-radius:9px;padding:3px;gap:3px}
.seg button{flex:1;border:0;background:transparent;border-radius:6px;padding:6px 8px;font-weight:600;font-size:13px;cursor:pointer;color:rgba(245,242,249,.7);white-space:nowrap}
.seg button.on{background:var(--roxo-2);color:var(--amarelo)}
.tog{display:flex;align-items:center;gap:10px;cursor:pointer;margin:10px 0 0;font-size:13.5px;color:rgba(245,242,249,.85)}
.tog input{display:none}
.tog span{flex:none;width:36px;height:20px;border-radius:99px;background:var(--roxo-2);position:relative;transition:.15s}
.tog span::after{content:"";position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:var(--off);transition:.15s}
.tog input:checked+span{background:var(--amarelo)}
.tog input:checked+span::after{left:19px;background:var(--roxo-0)}

/* aba Aparência */
.palco-prev{display:flex;flex-direction:column;gap:12px;padding:18px 20px;min-height:0;overflow-y:auto;border-right:1px solid var(--roxo-2)}
.ferramentas{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.ferramentas .seg{flex:none}
.ferramentas .espaco{flex:1}
.previa.grande{width:100%;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.faixa{display:flex;align-items:center;gap:10px}
.faixa input[type=range]{flex:1;accent-color:var(--amarelo);min-width:0;height:20px}
.faixa output{flex:none;min-width:58px;text-align:right;font-variant-numeric:tabular-nums;color:rgba(245,242,249,.8);font-size:12.5px}
.cor{display:flex;gap:8px;align-items:center}
.cor input[type=color]{flex:none;width:38px;height:34px;padding:2px;border:1px solid var(--roxo-2);border-radius:8px;background:var(--roxo-0);cursor:pointer}
.cor input[type=color]::-webkit-color-swatch-wrapper{padding:0}
.cor input[type=color]::-webkit-color-swatch{border:0;border-radius:5px}
.cor input[type=text]{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;text-transform:uppercase}
.grade{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;width:150px;aspect-ratio:16/9;background:var(--roxo-0);border:1px solid var(--roxo-2);border-radius:9px;padding:4px}
.grade button{border:0;border-radius:5px;background:transparent;cursor:pointer;display:grid;place-items:center;padding:0}
.grade button i{width:14px;height:6px;border-radius:2px;background:rgba(245,242,249,.25)}
.grade button:hover{background:var(--roxo-1)}
.grade button.on{background:var(--roxo-2)}
.grade button.on i{background:var(--amarelo)}
.layouts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.layouts button{display:flex;flex-direction:column;align-items:center;gap:6px;border:1px solid var(--roxo-2);background:var(--roxo-0);border-radius:10px;padding:8px 6px 7px;cursor:pointer;color:rgba(245,242,249,.75);font-size:12px;font-weight:600}
.layouts button svg{width:100%;height:auto;display:block;color:rgba(245,242,249,.85)}
.layouts button:hover{border-color:rgba(245,242,249,.25)}
.layouts button.on{border-color:var(--amarelo);color:var(--amarelo);background:rgba(255,229,0,.06)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--roxo-2);background:var(--roxo-0);border-radius:99px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer}
.chip:hover{border-color:rgba(255,229,0,.5)}
.chip .bolinhas{display:inline-flex}
.chip .bolinhas i{width:10px;height:10px;border-radius:50%;margin-left:-3px;border:1px solid rgba(0,0,0,.35)}
.chip .bolinhas i:first-child{margin-left:0}
.chip .x{opacity:.5;padding:0 0 0 4px;font-size:15px;line-height:1}
.chip .x:hover{opacity:1;color:#ff8a8d}
.chip.meu{border-style:dashed}
.subtitulo{font-size:12px;color:rgba(245,242,249,.45);margin:12px 0 7px}
.grupo h2{display:flex;align-items:center;justify-content:space-between}
.grupo h2 button{font:600 11px var(--texto);letter-spacing:0;text-transform:none;color:rgba(245,242,249,.45);background:none;border:0;cursor:pointer;padding:0}
.grupo h2 button:hover{color:var(--amarelo)}
#tela-sons{display:block;overflow-y:auto}
.sons-wrap{max-width:860px;margin:0 auto;padding:24px 20px 60px;display:grid;gap:16px}
.cartao-sons{background:var(--roxo-1);border:1px solid var(--roxo-2);border-radius:14px;padding:18px 20px}
.cartao-sons>.tog:first-of-type{margin-top:0}
.linha-som{display:grid;grid-template-columns:minmax(0,1fr) 230px auto auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--roxo-2)}
.linha-som:last-child{border-bottom:0}
.rot-som b{display:block;font-weight:700}
.rot-som small{color:rgba(245,242,249,.5);font-size:12px}
.biblioteca,#meus-sons{display:flex;flex-wrap:wrap;gap:8px}
.som-chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--roxo-2);background:var(--roxo-0);border-radius:99px;padding:6px 14px 6px 6px;font-size:13px;font-weight:600;cursor:pointer;color:var(--off)}
.som-chip:hover{border-color:rgba(255,229,0,.5)}
.som-chip .play,.som-chip .play-b{flex:none;width:24px;height:24px;border-radius:50%;background:var(--amarelo);color:var(--roxo-0);display:grid;place-items:center;font-size:9px;border:0;cursor:pointer;padding:0 0 0 2px}
.som-chip.meu{cursor:default}
.som-chip .x{background:none;border:0;color:inherit;opacity:.5;cursor:pointer;font-size:16px;padding:0 0 0 4px}
.som-chip .x:hover{opacity:1;color:#ff8a8d}
.upload{display:inline-flex;margin-top:14px;cursor:pointer}
@media (max-width:700px){.linha-som{grid-template-columns:1fr auto auto}.linha-som .rot-som{grid-column:1/-1}}
#toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:var(--off);color:var(--roxo-0);font-weight:700;padding:10px 16px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.4);z-index:20}
#modal{position:fixed;inset:0;background:rgba(10,6,16,.8);display:grid;place-items:center;z-index:9}
#modal form{background:var(--roxo-1);border:1px solid var(--roxo-2);border-radius:14px;padding:24px;width:min(360px,90vw)}
#modal p{margin:0 0 14px;color:rgba(245,242,249,.7)}
@media (max-width:1000px){
  .tela{grid-template-columns:1fr!important;overflow-y:auto}
  #tela-vivo{grid-template-rows:55vh auto}
  .chat,.palco-prev{border-right:0;border-bottom:1px solid var(--roxo-2)}
  .dica{display:none}
}
</style></head>
<body>
<header>
  <div class="logo"><b>BENCH</b> CHAT</div>
  <nav class="abas"><button data-tela="vivo" class="on">Ao vivo</button><button data-tela="aparencia">Aparência</button><button data-tela="sons">Sons</button></nav>
  <div id="status" class="status"><i></i><span>Carregando…</span></div>
  <div id="titulo-live"></div>
</header>

<main class="tela" id="tela-vivo">
  <section class="chat">
    <div class="chat-topo">
      <div class="seg" id="seg-vista"><button data-v="tudo">Tudo</button><button data-v="chat">Chat</button><button data-v="apoios">Apoios <span class="contador" id="contador-apoios" hidden>0</span></button></div>
      <input id="busca" placeholder="Filtrar por nome ou texto">
      <span class="dica">Clique numa mensagem para pôr na live · clique de novo ou Esc para tirar</span>
    </div>
    <div id="lista"><div class="vazio">As mensagens do chat aparecem aqui.<br>Conecte a live no painel ao lado.</div></div>
    <div id="painel-apoios" hidden>
      <div class="totais">
        <div class="total"><small>Super Chats</small><b id="t-sc">0</b><span id="t-valor">—</span></div>
        <div class="total"><small>Novos membros</small><b id="t-membros">0</b><span>na live</span></div>
        <div class="total"><small>Presentes</small><b id="t-presentes">0</b><span id="t-assinaturas">0 assinaturas</span></div>
        <div class="acoes-apoios">
          <label class="tog"><input type="checkbox" id="so-pendentes"><span></span>Só quem falta agradecer</label>
          <button class="b leve" id="btn-zerar" type="button">Zerar</button>
        </div>
      </div>
      <div id="lista-apoios"><div class="vazio">Super Chats, Super Stickers, membros e presentes aparecem aqui,<br>separados do chat e com o mais recente no topo.</div></div>
    </div>
    <button id="novas" hidden>Novas mensagens ↓</button>
  </section>
  <aside>
    <div class="bloco">
      <h2>Live</h2>
      <div class="linha"><input id="fonte" placeholder="@benchpromos ou link da live"><button class="b pri" id="btn-conectar">Conectar</button></div>
      <p class="nota">Com o @ do canal, o overlay entra sozinho quando a live começar e fica esperando a próxima.</p>
    </div>
    <div class="bloco">
      <h2>Link para o OBS</h2>
      <div class="linha"><input id="link-obs" readonly><button class="b" id="btn-copiar">Copiar</button></div>
      <p class="nota">Fonte de navegador · largura 1920 · altura 1080</p>
      <p class="nota alerta" id="aviso-fonte" hidden>Lemon Milk não encontrada no servidor — usando Montserrat. Coloque o arquivo .otf da Lemon Milk ao lado do bench-chat.js.</p>
    </div>
    <div class="bloco">
      <h2>No ar agora</h2>
      <div class="previa" id="caixa-previa"><iframe id="previa" title="O que está no OBS"></iframe></div>
      <div class="linha">
        <select id="sel-teste">
          <option value="texto">Mensagem comum</option>
          <option value="superchat">Super Chat</option>
          <option value="membro">Novo membro</option>
          <option value="presente">Presente</option>
          <option value="mod">Moderador</option>
        </select>
        <button class="b" id="btn-teste">Testar</button>
        <button class="b" id="btn-ocultar">Ocultar</button>
      </div>
    </div>
    <div class="bloco">
      <h2>Comportamento</h2>
      <div class="campo"><span>Modo</span><div class="seg" data-chave="modo"><button data-v="destaque">Destaque</button><button data-v="feed">Chat corrido</button></div></div>
      <div class="campo"><span>Nome</span><div class="seg" data-chave="nome"><button data-v="completo">Completo</button><button data-v="primeiro">Primeiro</button></div></div>
      <div class="campo"><span>Some após</span><select data-chave="autoOcultar" data-num>
        <option value="0">Só quando eu tirar</option><option value="8">8 segundos</option><option value="15">15 segundos</option>
        <option value="30">30 segundos</option><option value="60">1 minuto</option></select></div>
      <div class="campo"><span>Palavras em destaque</span><input data-chave="palavras" placeholder="cupom, promo, bench"></div>
      <label class="tog"><input type="checkbox" data-chave="autoSuperChat"><span></span>Super Chat e membros aparecem sozinhos</label>
      <p class="nota">Cores, tamanhos, posição e fontes ficam na aba <b>Aparência</b>; sininhos e efeitos na aba <b>Sons</b>.</p>
    </div>
  </aside>
</main>

<main class="tela" id="tela-aparencia" hidden>
  <section class="palco-prev">
    <div class="ferramentas">
      <div class="seg" id="seg-amostra"><button data-v="texto">Mensagem</button><button data-v="superchat" class="on">Super Chat</button><button data-v="membro">Membro</button><button data-v="presente">Presente</button><button data-v="feed">Chat corrido</button></div>
      <div class="seg" id="seg-fundo"><button data-v="xadrez" class="on">Xadrez</button><button data-v="escuro">Escuro</button><button data-v="claro">Claro</button><button data-v="jogo">Cena</button></div>
      <span class="espaco"></span>
      <button class="b leve" id="btn-replay">▶ Ver animação</button>
      <button class="b" id="btn-na-live">Testar na live</button>
    </div>
    <div class="previa grande" id="caixa-previa2"><iframe id="previa2" title="Prévia da aparência"></iframe></div>
    <p class="nota">Cada ajuste vai direto para o OBS e fica salvo no servidor. Dica: dois cliques num controle deslizante voltam ao padrão.</p>
  </section>
  <aside id="controles">
    <div class="bloco">
      <h2>Estilos</h2>
      <div class="chips" id="prontos"></div>
      <div class="subtitulo" id="tit-meus" hidden>Meus estilos</div>
      <div class="chips" id="meus"></div>
      <div class="linha" style="margin-top:12px"><input id="nome-estilo" placeholder="Nome para salvar este visual"><button class="b pri" id="btn-salvar-estilo">Salvar</button></div>
      <div class="linha"><button class="b leve" id="btn-copiar-codigo" style="flex:1">Copiar código do visual</button><button class="b leve" id="btn-colar-codigo" style="flex:1">Colar código</button></div>
    </div>
    <div id="grupos"></div>
  </aside>
</main>

<main class="tela" id="tela-sons" hidden>
  <div class="sons-wrap">
    <section class="cartao-sons">
      <h2>Sons no OBS</h2>
      <label class="tog"><input type="checkbox" id="som-ativo"><span></span>Tocar sons quando algo aparece na tela</label>
      <div class="campo" style="margin-top:14px"><span>Volume</span><div class="faixa"><input type="range" id="som-volume" min="0" max="100"><output id="som-volume-v"></output></div></div>
      <p class="nota">No OBS, abra as propriedades da Fonte de navegador e marque <b>Controlar áudio pelo OBS</b>. Assim o som aparece no mixer e vai para a live.</p>
    </section>
    <section class="cartao-sons">
      <h2>Qual som para cada coisa</h2>
      <div id="linhas-som"></div>
      <label class="tog"><input type="checkbox" id="som-feed"><span></span>No chat corrido, tocar a cada mensagem nova (no máximo 1 a cada 1,2 s)</label>
    </section>
    <section class="cartao-sons">
      <h2>Biblioteca</h2>
      <p class="nota" style="margin:0 0 12px">Clique para ouvir. São gerados na hora pelo navegador, sem arquivo.</p>
      <div class="biblioteca" id="biblioteca"></div>
      <h2 style="margin-top:22px">Meus sons</h2>
      <div id="meus-sons"></div>
      <label class="b upload">Enviar arquivo de som<input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm" id="arquivo-som" hidden></label>
      <p class="nota">MP3, WAV, OGG ou M4A de até 3 MB. Ficam guardados no servidor e aparecem nas listas acima.</p>
    </section>
  </div>
</main>

<div id="toast" hidden></div>
<div id="modal" hidden><form id="form-senha"><h2>Senha do painel</h2><p>Digite a senha definida no servidor.</p><div class="linha"><input id="campo-senha" type="password" autocomplete="current-password"><button class="b pri">Entrar</button></div></form></div>
<script>${SONS_JS}</script>
<script>
(function(){
var $=function(s){return document.querySelector(s);};
var $$=function(s,raiz){return [].slice.call((raiz||document).querySelectorAll(s));};
var senha=''; try{ senha=localStorage.getItem('benchchat-senha')||''; }catch(e){}
var ORIGEM=Math.random().toString(36).slice(2);
var lista=$('#lista'), mapa={}, cfg={estilo:{},predefinicoes:{}}, destaqueId=null, es=null;
var padrao={}, prontos={}, controles={}, pendente={}, tSalvar=null, amostraAtual='superchat', fundoAtual='xadrez';
var NOME_SELO={dono:'DONO',mod:'MOD',membro:'MEMBRO',verificado:'VERIFICADO'};

$('#link-obs').value=new URL('overlay',location.href).href.split('?')[0];
$('#previa').src='overlay?previa=1';
$('#previa2').src='overlay?previa=1&amostra=1';

function api(caminho,corpo){
  return fetch('api/'+caminho,{method:corpo?'POST':'GET',headers:{'content-type':'application/json','x-senha':senha},body:corpo?JSON.stringify(corpo):undefined})
  .then(function(r){ if(r.status===401){ pedirSenha(); throw new Error('senha'); } return r.json().then(function(j){ if(!r.ok){ toast(j.erro||'Erro'); throw new Error(j.erro); } return j; }); });
}
function pedirSenha(){ $('#modal').hidden=false; $('#campo-senha').focus(); }
$('#form-senha').addEventListener('submit',function(e){
  e.preventDefault(); senha=$('#campo-senha').value; try{ localStorage.setItem('benchchat-senha',senha); }catch(_){}
  $('#modal').hidden=true; iniciar();
});
var tToast; function toast(t){ var n=$('#toast'); n.textContent=t; n.hidden=false; clearTimeout(tToast); tToast=setTimeout(function(){ n.hidden=true; },1800); }

/* ── abas ── */
function irPara(tela){
  $$('.abas button').forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-tela')===tela); });
  $$('.tela').forEach(function(t){ t.hidden=t.id!=='tela-'+tela; });
  try{ localStorage.setItem('benchchat-tela',tela); }catch(e){}
  escalar();
}
$$('.abas button').forEach(function(b){ b.addEventListener('click',function(){ irPara(b.getAttribute('data-tela')); }); });

/* ── chat ── */
function el(tag,cls,txt){var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e;}
function hora(ts){ var d=new Date(ts); return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2); }
function regexPalavras(){
  var p=(cfg.palavras||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  return p.length? new RegExp('([\\p{L}\\d]*(?:'+p.map(function(s){return s.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');}).join('|')+')[\\p{L}\\d]*)','giu') : null;
}
function textoPlano(m){ return ((m.autor||'')+' '+(m.partes||[]).map(function(p){return p.t||p.alt||'';}).join('')).toLowerCase(); }

function criarItem(m){
  var it=el('div','item t-'+m.tipo+(m.tipo!=='texto'?' especial':'')+(m.teste?' teste':''));
  it.setAttribute('data-id',m.id);
  var av=el('div','av');
  var inicial=function(){ av.textContent=(m.autor||'?').replace(/^@/,'').charAt(0).toUpperCase(); };
  if(m.foto){ var im=el('img'); im.referrerPolicy='no-referrer'; im.src=m.foto; im.onerror=inicial; av.appendChild(im); } else inicial();
  it.appendChild(av);
  var cx=el('div','cx'), ln=el('div','ln');
  ln.appendChild(el('span','nm',m.autor||'(sem nome)'));
  (m.selos||[]).forEach(function(s){ if(NOME_SELO[s]) ln.appendChild(el('span','sl '+s,NOME_SELO[s])); });
  if(m.valor) ln.appendChild(el('span','vl',m.valor));
  ln.appendChild(el('span','hr',hora(m.ts)));
  cx.appendChild(ln);
  if(m.titulo) cx.appendChild(el('div','ex',m.titulo));
  var tx=el('div','tx'), rx=regexPalavras();
  (m.partes||[]).forEach(function(p){
    if(p.e){ if(/^https:\/\//.test(p.e)){ var i=el('img'); i.src=p.e; i.alt=''; i.referrerPolicy='no-referrer'; i.onerror=function(){ this.remove(); }; tx.appendChild(i);} return; }
    if(!rx){ tx.appendChild(document.createTextNode(p.t)); return; }
    p.t.split(rx).forEach(function(s,i){ if(s) tx.appendChild(i%2? el('mark',null,s) : document.createTextNode(s)); });
  });
  if(m.sticker) tx.appendChild(document.createTextNode('[Super Sticker]'));
  cx.appendChild(tx);
  it.appendChild(cx);
  it.appendChild(el('span','noar','NO AR'));
  if(m.id===destaqueId) it.classList.add('ativo');
  it.addEventListener('click',function(){ api(it.classList.contains('ativo')?'ocultar':'mostrar',{id:m.id}).catch(function(){}); });
  aplicarFiltro(it,m);
  return it;
}
function aplicarFiltro(it,m){ var q=$('#busca').value.trim().toLowerCase(); it.style.display=!q||textoPlano(m).indexOf(q)>=0?'':'none'; }
function noFim(){ return lista.scrollHeight-lista.scrollTop-lista.clientHeight<60; }
function addMsg(m,rolar){
  if(mapa[m.id]) return;
  var vazio=lista.querySelector('.vazio'); if(vazio) vazio.remove();
  var estavaNoFim=noFim();
  mapa[m.id]=m; lista.appendChild(criarItem(m));
  while(lista.children.length>300){ var p=lista.firstChild; delete mapa[p.getAttribute('data-id')]; p.remove(); }
  if(rolar!==false){ if(estavaNoFim) lista.scrollTop=lista.scrollHeight; else $('#novas').hidden=false; }
}
lista.addEventListener('scroll',function(){ if(noFim()) $('#novas').hidden=true; });
$('#novas').addEventListener('click',function(){ lista.scrollTop=lista.scrollHeight; $('#novas').hidden=true; });
$('#busca').addEventListener('input',function(){
  $$('.item',lista).forEach(function(it){ aplicarFiltro(it,mapa[it.getAttribute('data-id')]); });
  $$('.item',listaApoios).forEach(function(it){ aplicarFiltro(it,mapaApoios[it.getAttribute('data-id')]); });
});

/* ── Tudo / Chat / Apoios ── */
var listaApoios=$('#lista-apoios'), mapaApoios={}, vista='tudo', naoVistos=0;
var NOME_APOIO={superchat:'SUPER CHAT',sticker:'STICKER',membro:'MEMBRO',presente:'PRESENTE'};
function setVista(v){
  vista=v;
  $$('#seg-vista button').forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-v')===v); });
  lista.classList.toggle('v-chat',v==='chat');
  lista.hidden=v==='apoios'; $('#painel-apoios').hidden=v!=='apoios';
  if(v==='apoios'){ naoVistos=0; atualizarContador(); $('#novas').hidden=true; }
  else lista.scrollTop=lista.scrollHeight;
  try{ localStorage.setItem('benchchat-vista',v); }catch(e){}
}
$$('#seg-vista button').forEach(function(b){ b.addEventListener('click',function(){ setVista(b.getAttribute('data-v')); }); });
function atualizarContador(){ var c=$('#contador-apoios'); c.textContent=naoVistos>99?'99+':naoVistos; c.hidden=!naoVistos; }
function addApoio(m,novo){
  if(mapaApoios[m.id]) return;
  var vazio=listaApoios.querySelector('.vazio'); if(vazio) vazio.remove();
  mapaApoios[m.id]=m;
  var it=criarItem(m);
  var tp=el('span','tipo-apoio',NOME_APOIO[m.tipo]||''); it.querySelector('.ln').insertBefore(tp,it.querySelector('.nm'));
  var bt=el('button','agradecer'); bt.type='button';
  function pinta(){ it.classList.toggle('ok',!!m.agradecido); bt.textContent=m.agradecido?'✓ Agradecido':'Agradecer'; }
  bt.addEventListener('click',function(e){ e.stopPropagation(); m.agradecido=!m.agradecido; pinta(); api('agradecer',{id:m.id,valor:m.agradecido}).catch(function(){}); });
  it._pinta=pinta; it.appendChild(bt); pinta();
  listaApoios.insertBefore(it,listaApoios.firstChild);
  while(listaApoios.children.length>500){ var u=listaApoios.lastChild; delete mapaApoios[u.getAttribute('data-id')]; u.remove(); }
  if(novo && vista!=='apoios'){ naoVistos++; atualizarContador(); }
}
function carregarApoios(lst){
  listaApoios.innerHTML=''; mapaApoios={};
  if(!lst.length){ listaApoios.appendChild(el('div','vazio','Super Chats, Super Stickers, membros e presentes aparecem aqui, separados do chat e com o mais recente no topo.')); return; }
  lst.forEach(function(m){ addApoio(m,false); });
}
function fmtValor(n){ return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function setTotais(t){
  $('#t-sc').textContent=t.superchats;
  var v=Object.keys(t.valores||{}).map(function(m){ return m+' '+fmtValor(t.valores[m]); });
  $('#t-valor').textContent=v.length?v.join(' + '):'—';
  $('#t-valor').title=v.join(' + ');
  $('#t-membros').textContent=t.membros;
  $('#t-presentes').textContent=t.presentes;
  $('#t-assinaturas').textContent=t.assinaturas+(t.assinaturas===1?' assinatura':' assinaturas');
}
$('#so-pendentes').addEventListener('change',function(){ listaApoios.classList.toggle('pendentes',this.checked); });
$('#btn-zerar').addEventListener('click',function(){ if(confirm('Zerar a lista de apoios e os totais desta live?')) api('zerar',{}).catch(function(){}); });

function marcar(id){
  destaqueId=id;
  $$('.item.ativo').forEach(function(n){ n.classList.remove('ativo'); });
  if(id) $$('[data-id="'+CSS.escape(id)+'"]').forEach(function(n){ if(n.classList.contains('item')) n.classList.add('ativo'); });
}
function setStatus(s){
  var b=$('#status'); b.className='status '+s.estado; b.querySelector('span').textContent=s.texto;
  var t=$('#titulo-live'); t.textContent='';
  if(s.videoId){ var a=el('a',null,(s.titulo||s.videoId)+(s.canal?' — '+s.canal:'')); a.href='https://www.youtube.com/watch?v='+s.videoId; a.target='_blank'; a.rel='noopener'; t.appendChild(a); }
  var ligado=s.estado!=='desconectado' && s.estado!=='erro';
  $('#btn-conectar').textContent=ligado?'Desconectar':'Conectar';
  $('#btn-conectar').classList.toggle('pri',!ligado);
}

/* ── comportamento (aba Ao vivo) ── */
function setComportamento(){
  if(document.activeElement!==$('#fonte')) $('#fonte').value=cfg.fonte||'';
  $$('#tela-vivo [data-chave]').forEach(function(n){
    var k=n.getAttribute('data-chave'), v=cfg[k];
    if(n.classList.contains('seg')) $$('button',n).forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-v')===v); });
    else if(n.type==='checkbox') n.checked=!!v;
    else if(document.activeElement!==n) n.value=v==null?'':String(v);
  });
}
$$('#tela-vivo [data-chave]').forEach(function(n){
  var k=n.getAttribute('data-chave');
  function manda(v){ var o={origem:ORIGEM}; o[k]=v; cfg[k]=v; setComportamento(); enviarPrevia(); api('config',o).catch(function(){}); }
  if(n.classList.contains('seg')) n.addEventListener('click',function(e){ var b=e.target.closest('button'); if(b) manda(b.getAttribute('data-v')); });
  else if(n.type==='checkbox') n.addEventListener('change',function(){ manda(n.checked); });
  else if(n.tagName==='SELECT') n.addEventListener('change',function(){ manda(n.hasAttribute('data-num')?Number(n.value):n.value); });
  else { n.addEventListener('change',function(){ manda(n.value); }); n.addEventListener('keydown',function(e){ if(e.key==='Enter') n.blur(); }); }
});

$('#btn-conectar').addEventListener('click',function(){
  if($('#btn-conectar').textContent==='Desconectar') api('desconectar',{}).catch(function(){});
  else api('conectar',{fonte:$('#fonte').value}).catch(function(){});
});
$('#fonte').addEventListener('keydown',function(e){ if(e.key==='Enter') api('conectar',{fonte:$('#fonte').value}).catch(function(){}); });
$('#btn-copiar').addEventListener('click',function(){
  var i=$('#link-obs'); i.select();
  (navigator.clipboard? navigator.clipboard.writeText(i.value) : Promise.reject()).catch(function(){ document.execCommand('copy'); });
  toast('Link copiado');
});
$('#btn-teste').addEventListener('click',function(){ api('teste',{tipo:$('#sel-teste').value}).catch(function(){}); });
$('#btn-ocultar').addEventListener('click',function(){ api('ocultar',{}).catch(function(){}); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) api('ocultar',{}).catch(function(){}); });

/* ── aparência ── */
var POS=[['sup-esq','Superior esquerda'],['sup-centro','Superior centro'],['sup-dir','Superior direita'],['meio-esq','Meio esquerda'],['meio-centro','Centro'],['meio-dir','Meio direita'],['inf-esq','Inferior esquerda'],['inf-centro','Inferior centro'],['inf-dir','Inferior direita']];
var FONTES=['Lemon Milk','Montserrat','Inter','Poppins','Bebas Neue','Oswald','Archivo Black','Space Grotesk','DM Sans','Roboto','Rajdhani','Orbitron'].map(function(f){return [f,f];});
var ICONES={
 cartao:'<svg viewBox="0 0 64 36"><rect x="9" y="8" width="15" height="5" rx="1.5" fill="currentColor" opacity=".45"/><rect x="6" y="13" width="52" height="17" rx="3" fill="currentColor" opacity=".22"/><rect x="6" y="13" width="2.5" height="17" fill="#FFE500"/><circle cx="16" cy="21.5" r="4.5" fill="currentColor" opacity=".7"/><rect x="24" y="18" width="16" height="2.6" rx="1" fill="#FFE500"/><rect x="24" y="23" width="28" height="2.6" rx="1" fill="currentColor" opacity=".8"/></svg>',
 classico:'<svg viewBox="0 0 64 36"><rect x="17" y="10" width="17" height="6" fill="#1FC9AA"/><rect x="11" y="16" width="47" height="11" fill="currentColor" opacity=".22"/><rect x="21" y="20" width="30" height="2.6" rx="1" fill="currentColor" opacity=".85"/><circle cx="12" cy="20" r="7" fill="currentColor" opacity=".55" stroke="#1FC9AA" stroke-width="1.6"/><rect x="7" y="26" width="10" height="3.4" rx="1" fill="#E6B84A"/></svg>',
 bolha:'<svg viewBox="0 0 64 36"><circle cx="12" cy="18" r="6" fill="currentColor" opacity=".6" stroke="#FFE500" stroke-width="1.4"/><rect x="22" y="8" width="36" height="20" rx="7" fill="currentColor" opacity=".22"/><path d="M22.5 15.5 L19 18 L22.5 20.5Z" fill="currentColor" opacity=".22"/><rect x="27" y="13" width="14" height="2.6" rx="1" fill="#FFE500"/><rect x="27" y="18" width="25" height="2.6" rx="1" fill="currentColor" opacity=".8"/></svg>',
 faixa:'<svg viewBox="0 0 64 36"><rect x="4" y="12" width="22" height="12" fill="#FFE500"/><path d="M26 12 L30 12 L26 24Z" fill="#FFE500"/><rect x="26" y="12" width="34" height="12" fill="currentColor" opacity=".22"/><circle cx="10" cy="18" r="3.6" fill="#170F23" opacity=".6"/><rect x="15" y="16.8" width="9" height="2.4" rx="1" fill="#170F23" opacity=".75"/><rect x="32" y="16.8" width="22" height="2.4" rx="1" fill="currentColor" opacity=".85"/></svg>',
 texto:'<svg viewBox="0 0 64 36"><circle cx="12" cy="16" r="4.5" fill="currentColor" opacity=".6"/><rect x="20" y="11" width="2" height="16" fill="#FFE500"/><rect x="25" y="12" width="15" height="2.6" rx="1" fill="#FFE500"/><rect x="25" y="17" width="30" height="3" rx="1" fill="currentColor" opacity=".9"/><rect x="25" y="22" width="22" height="3" rx="1" fill="currentColor" opacity=".9"/></svg>'
};
var NOMES_LAYOUT=[['cartao','Cartão'],['classico','Clássico'],['bolha','Bolha'],['faixa','Faixa'],['texto','Só texto']];
var GRUPOS=[
 {titulo:'Layout',campos:[{k:'layout',tipo:'layout'}]},
 {titulo:'Posição',campos:[
   {k:'posicao',tipo:'grade',rot:'Onde aparece'},
   {k:'margemX',tipo:'faixa',rot:'Distância da lateral',min:0,max:600,un:'px'},
   {k:'margemY',tipo:'faixa',rot:'Distância de cima/baixo',min:0,max:600,un:'px'}]},
 {titulo:'Tamanho',campos:[
   {k:'escala',tipo:'faixa',rot:'Escala geral',min:50,max:200,un:'%',dica:'Aumenta ou diminui tudo junto'},
   {k:'largura',tipo:'faixa',rot:'Largura máxima',min:400,max:1800,passo:10,un:'px'},
   {k:'tamMsg',tipo:'faixa',rot:'Texto da mensagem',min:14,max:80,un:'px'},
   {k:'tamNome',tipo:'faixa',rot:'Nome',min:9,max:40,un:'px'},
   {k:'tamAvatar',tipo:'faixa',rot:'Foto',min:28,max:160,un:'px'},
   {k:'linhasMax',tipo:'faixa',rot:'Máximo de linhas',min:1,max:8}]},
 {titulo:'Cores',campos:[
   {k:'corAcento',tipo:'cor',rot:'Destaque',dica:'Barra lateral, barra de tempo e ponto da aba'},
   {k:'corFundo1',tipo:'cor',rot:'Fundo (início)'},
   {k:'corFundo2',tipo:'cor',rot:'Fundo (fim)'},
   {k:'opacidade',tipo:'faixa',rot:'Opacidade do fundo',min:0,max:100,un:'%'},
   {k:'corTexto',tipo:'cor',rot:'Texto'},
   {k:'corNome',tipo:'cor',rot:'Nome'},
   {k:'corAbaFundo',tipo:'cor',rot:'Aba (fundo)',so:['cartao']},
   {k:'corAbaTexto',tipo:'cor',rot:'Aba (texto)',so:['cartao']},
   {k:'corPalavras',tipo:'cor',rot:'Palavras em destaque'},
   {k:'corEspecial',tipo:'cor',rot:'Super Chat / presente',dica:'Selo, aba, borda e brilho de Super Chat, sticker, presentes e membros'},
   {k:'corEtiqueta',tipo:'cor',rot:'Etiqueta do nome',so:['classico','faixa']},
   {k:'corEtiquetaTexto',tipo:'cor',rot:'Texto da etiqueta',so:['classico','faixa']},
   {k:'corAnel',tipo:'cor',rot:'Anel da foto',so:['cartao','classico','bolha','texto']}]},
 {titulo:'Formato',campos:[
   {k:'raio',tipo:'faixa',rot:'Cantos arredondados',min:0,max:48,un:'px'},
   {k:'bordaLateral',tipo:'faixa',rot:'Barra lateral',min:0,max:24,un:'px',so:['cartao','texto']},
   {k:'avatarForma',tipo:'seg',rot:'Foto',op:[['circulo','Círculo'],['arredondado','Arredond.'],['quadrado','Quadrada']]},
   {k:'sombra',tipo:'tog',rot:'Sombra'}]},
 {titulo:'Fontes',campos:[
   {k:'fonteTitulo',tipo:'sel',rot:'Nome e aba',op:FONTES},
   {k:'fonteTexto',tipo:'sel',rot:'Mensagem',op:FONTES},
   {k:'pesoMsg',tipo:'seg',rot:'Peso da mensagem',num:1,op:[[400,'Normal'],[600,'Semi'],[700,'Negrito'],[800,'Extra']]},
   {k:'nomeCaixaAlta',tipo:'tog',rot:'Nome em CAIXA ALTA'}]},
 {titulo:'Elementos',campos:[
   {k:'mostrarAvatar',tipo:'tog',rot:'Foto de quem comentou'},
   {k:'mostrarAba',tipo:'tog',rot:'Aba em cima do card',so:['cartao']},
   {k:'abaTexto',tipo:'txt',rot:'Texto da aba',ph:'Chat ao vivo',so:['cartao']},
   {k:'mostrarMarca',tipo:'tog',rot:'Marca no canto',so:['cartao']},
   {k:'marcaTexto',tipo:'txt',rot:'Texto da marca',ph:'BENCH PROMOS',so:['cartao']},
   {k:'logoUrl',tipo:'txt',rot:'Logo (URL)',ph:'Vazio = usa o texto acima',so:['cartao']},
   {k:'mostrarSelos',tipo:'tog',rot:'Selos (MOD, MEMBRO…)'},
   {k:'mostrarBarra',tipo:'tog',rot:'Barra de tempo',so:['cartao','classico','bolha','faixa']}]},
 {titulo:'Animação',campos:[
   {k:'animacao',tipo:'sel',rot:'Entrada',op:[['wipe','Abrir (Bench)'],['deslizar','Deslizar'],['subir','Subir'],['fade','Aparecer'],['pop','Pop'],['nenhuma','Sem animação']]},
   {k:'velocidade',tipo:'faixa',rot:'Velocidade',min:40,max:250,passo:5,un:'%'}]},
 {titulo:'Chat corrido',campos:[
   {k:'posFeed',tipo:'sel',rot:'Posição',op:[['igual','Igual ao destaque']].concat(POS)},
   {k:'larguraFeed',tipo:'faixa',rot:'Largura',min:240,max:1200,passo:4,un:'px'},
   {k:'feedMax',tipo:'faixa',rot:'Mensagens na tela',min:1,max:12},
   {k:'espacoFeed',tipo:'faixa',rot:'Espaço entre elas',min:0,max:40,un:'px'}]}
];

function mudar(k,v,animar){
  cfg.estilo[k]=v; pendente[k]=v;
  if(controles[k]) controles[k].set(v);
  enviarPrevia();
  clearTimeout(tSalvar); tSalvar=setTimeout(salvarEstilo,160);
}
function salvarEstilo(){
  var d=pendente; pendente={};
  if(Object.keys(d).length) api('config',{estilo:d,origem:ORIGEM}).catch(function(){});
}
function enviarPrevia(){
  var f=$('#previa2'); if(f.contentWindow) f.contentWindow.postMessage({tipo:'config',config:cfg},location.origin);
}
function postPrevia(msg){ var f=$('#previa2'); if(f.contentWindow) f.contentWindow.postMessage(msg,location.origin); }
$('#previa2').addEventListener('load',function(){ enviarPrevia(); postPrevia({tipo:'amostra',valor:amostraAtual}); postPrevia({tipo:'fundo',valor:fundoAtual}); });

function criarCampo(c){
  var wrap, set;
  if(c.tipo==='tog'){
    wrap=el('label','tog'); var cb=el('input'); cb.type='checkbox'; wrap.appendChild(cb); wrap.appendChild(el('span')); wrap.appendChild(document.createTextNode(c.rot));
    cb.addEventListener('change',function(){ mudar(c.k,cb.checked); });
    set=function(v){ cb.checked=!!v; };
    return {no:wrap,set:set};
  }
  wrap=el('div','campo');
  var rot=el('span',null,c.rot); if(c.dica) rot.title=c.dica; wrap.appendChild(rot);
  if(c.tipo==='faixa'){
    var f=el('div','faixa'), r=el('input'), o=el('output');
    r.type='range'; r.min=c.min; r.max=c.max; r.step=c.passo||1;
    var fmt=function(v){ o.textContent=v+(c.un?' '+c.un:''); };
    r.addEventListener('input',function(){ fmt(r.value); mudar(c.k,Number(r.value)); });
    r.addEventListener('dblclick',function(){ if(padrao[c.k]!=null){ r.value=padrao[c.k]; fmt(r.value); mudar(c.k,padrao[c.k]); } });
    f.appendChild(r); f.appendChild(o); wrap.appendChild(f);
    set=function(v){ if(document.activeElement!==r) r.value=v; fmt(v); };
  } else if(c.tipo==='cor'){
    var cx=el('div','cor'), pk=el('input'), tx=el('input');
    pk.type='color'; tx.type='text'; tx.maxLength=7; tx.spellcheck=false;
    pk.addEventListener('input',function(){ tx.value=pk.value.toUpperCase(); mudar(c.k,pk.value.toUpperCase()); });
    tx.addEventListener('input',function(){ var v=tx.value.trim(); if(v.charAt(0)!=='#') v='#'+v; if(/^#[0-9a-f]{6}$/i.test(v)){ pk.value=v; mudar(c.k,v.toUpperCase()); } });
    cx.appendChild(pk); cx.appendChild(tx); wrap.appendChild(cx);
    set=function(v){ pk.value=(v||'#000000').toLowerCase(); if(document.activeElement!==tx) tx.value=v||''; };
  } else if(c.tipo==='seg'){
    var sg=el('div','seg');
    c.op.forEach(function(o){ var b=el('button',null,o[1]); b.type='button'; b.setAttribute('data-v',o[0]); b.addEventListener('click',function(){ mudar(c.k,o[0]); }); sg.appendChild(b); });
    wrap.appendChild(sg);
    set=function(v){ $$('button',sg).forEach(function(b){ b.classList.toggle('on',String(b.getAttribute('data-v'))===String(v)); }); };
  } else if(c.tipo==='sel'){
    var s=el('select');
    c.op.forEach(function(o){ var op=el('option',null,o[1]); op.value=o[0]; s.appendChild(op); });
    s.addEventListener('change',function(){ mudar(c.k,s.value); });
    wrap.appendChild(s);
    set=function(v){ s.value=v; };
  } else if(c.tipo==='txt'){
    var t=el('input'); t.type='text'; t.placeholder=c.ph||'';
    t.addEventListener('input',function(){ mudar(c.k,t.value); });
    wrap.appendChild(t);
    set=function(v){ if(document.activeElement!==t) t.value=v||''; };
  } else if(c.tipo==='layout'){
    wrap=el('div','layouts');
    NOMES_LAYOUT.forEach(function(l){
      var b=el('button'); b.type='button'; b.setAttribute('data-v',l[0]);
      b.innerHTML=ICONES[l[0]]; b.appendChild(el('span',null,l[1]));
      b.addEventListener('click',function(){ mudar('layout',l[0]); });
      wrap.appendChild(b);
    });
    set=function(v){ $$('button',wrap).forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-v')===v); }); visibilidade(); };
    return {no:wrap,set:set};
  } else if(c.tipo==='grade'){
    var g=el('div','grade');
    POS.forEach(function(p){ var b=el('button'); b.type='button'; b.title=p[1]; b.setAttribute('data-v',p[0]); b.appendChild(el('i')); b.addEventListener('click',function(){ mudar(c.k,p[0]); }); g.appendChild(b); });
    wrap.appendChild(g);
    set=function(v){ $$('button',g).forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-v')===v); }); };
  }
  return {no:wrap,set:set};
}
GRUPOS.forEach(function(gr){
  var b=el('div','bloco grupo'), h=el('h2',null,gr.titulo);
  var reset=el('button',null,'Restaurar'); reset.type='button'; reset.title='Volta só este grupo ao padrão do Bench';
  reset.addEventListener('click',function(){ gr.campos.forEach(function(c){ if(padrao[c.k]!==undefined) mudar(c.k,padrao[c.k]); }); enviarPrevia(); postPrevia({tipo:'replay'}); });
  h.appendChild(reset); b.appendChild(h);
  gr.campos.forEach(function(c){ var x=criarCampo(c); controles[c.k]=x; b.appendChild(x.no); });
  $('#grupos').appendChild(b);
});
function preencherControles(){ Object.keys(controles).forEach(function(k){ controles[k].set(cfg.estilo[k]); }); visibilidade(); }
function visibilidade(){
  var L=cfg.estilo.layout||'cartao';
  GRUPOS.forEach(function(gr){ gr.campos.forEach(function(c){ if(c.so && controles[c.k]) controles[c.k].no.style.display=c.so.indexOf(L)>=0?'':'none'; }); });
}

function aplicarEstiloCompleto(est,nome){
  cfg.estilo=JSON.parse(JSON.stringify(est)); pendente={}; clearTimeout(tSalvar);
  preencherControles(); enviarPrevia(); postPrevia({tipo:'replay'});
  api('config',{estiloCompleto:cfg.estilo,origem:ORIGEM}).then(function(){ if(nome) toast('Estilo "'+nome+'" aplicado'); }).catch(function(){});
}
function bolinhas(est){ var s=el('span','bolinhas'); [est.corFundo1,est.corAcento,est.corNome].forEach(function(c){ var i=el('i'); i.style.background=c; s.appendChild(i); }); return s; }
function chipsEstilos(){
  var p=$('#prontos'); p.innerHTML='';
  Object.keys(prontos).forEach(function(nome){
    var est=Object.assign({},padrao,prontos[nome]);
    var c=el('button','chip'); c.type='button'; c.appendChild(bolinhas(est)); c.appendChild(document.createTextNode(nome));
    c.addEventListener('click',function(){
      var manter={}; ['posicao','margemX','margemY','posFeed'].forEach(function(k){ manter[k]=cfg.estilo[k]; });
      aplicarEstiloCompleto(Object.assign({},padrao,manter,prontos[nome]),nome);
    });
    p.appendChild(c);
  });
  var m=$('#meus'); m.innerHTML='';
  var meus=Object.keys(cfg.predefinicoes||{});
  $('#tit-meus').hidden=!meus.length;
  meus.forEach(function(nome){
    var est=Object.assign({},padrao,cfg.predefinicoes[nome]);
    var c=el('button','chip meu'); c.type='button'; c.appendChild(bolinhas(est)); c.appendChild(document.createTextNode(nome));
    var x=el('span','x','×'); x.title='Excluir';
    x.addEventListener('click',function(e){ e.stopPropagation(); if(confirm('Excluir o estilo "'+nome+'"?')) api('predefinicao',{acao:'excluir',nome:nome}).catch(function(){}); });
    c.appendChild(x);
    c.addEventListener('click',function(){ aplicarEstiloCompleto(est,nome); });
    m.appendChild(c);
  });
}
$('#btn-salvar-estilo').addEventListener('click',function(){
  var nome=$('#nome-estilo').value.trim(); if(!nome){ $('#nome-estilo').focus(); return; }
  salvarEstilo();
  setTimeout(function(){ api('predefinicao',{acao:'salvar',nome:nome}).then(function(){ $('#nome-estilo').value=''; toast('Estilo salvo'); }).catch(function(){}); },200);
});
$('#nome-estilo').addEventListener('keydown',function(e){ if(e.key==='Enter') $('#btn-salvar-estilo').click(); });
$('#btn-copiar-codigo').addEventListener('click',function(){
  var cod=JSON.stringify(cfg.estilo);
  (navigator.clipboard? navigator.clipboard.writeText(cod) : Promise.reject()).then(function(){ toast('Código copiado'); }).catch(function(){ prompt('Copie o código:',cod); });
});
$('#btn-colar-codigo').addEventListener('click',function(){
  var cod=prompt('Cole o código do visual:'); if(!cod) return;
  try{ var est=JSON.parse(cod); if(!est||typeof est!=='object') throw 0; aplicarEstiloCompleto(Object.assign({},padrao,est),'colado'); }
  catch(e){ toast('Código inválido'); }
});

function segLocal(id,cb){
  $$('#'+id+' button').forEach(function(b){ b.addEventListener('click',function(){
    $$('#'+id+' button').forEach(function(x){ x.classList.toggle('on',x===b); }); cb(b.getAttribute('data-v'));
  }); });
}
segLocal('seg-amostra',function(v){ amostraAtual=v; postPrevia({tipo:'amostra',valor:v}); });
segLocal('seg-fundo',function(v){ fundoAtual=v; postPrevia({tipo:'fundo',valor:v}); });
$('#btn-replay').addEventListener('click',function(){ postPrevia({tipo:'replay'}); });
$('#btn-na-live').addEventListener('click',function(){
  salvarEstilo();
  api('teste',{tipo:amostraAtual==='feed'?'texto':amostraAtual}).then(function(){ toast('Mostrando no OBS'); }).catch(function(){});
});

function escalar(){ ['#caixa-previa','#caixa-previa2'].forEach(function(s){ var c=$(s), f=c.querySelector('iframe'); if(c.clientWidth) f.style.transform='scale('+(c.clientWidth/1920)+')'; }); }
var ro=new ResizeObserver(escalar); ro.observe($('#caixa-previa')); ro.observe($('#caixa-previa2')); escalar();

/* ── sons ── */
var EVENTOS_SOM=[['texto','Mensagem que você mostra','Quando você clica numa mensagem do chat'],['superchat','Super Chat e Super Sticker',''],['membro','Novo membro',''],['presente','Presente de assinaturas','']];
var arquivosSom=[], tVolume=null;
function volumeAtual(){ return (cfg.sons||{}).volume; }
function mudarSom(k,v){ cfg.sons=cfg.sons||{}; cfg.sons[k]=v; var o={}; o[k]=v; api('config',{sons:o,origem:ORIGEM}).catch(function(){}); }
function opcoesSom(sel,valor){
  sel.innerHTML='';
  var n=el('option',null,'Nenhum'); n.value='nenhum'; sel.appendChild(n);
  var g1=el('optgroup'); g1.label='Biblioteca';
  BenchSons.lista.forEach(function(x){ var o=el('option',null,x[1]); o.value=x[0]; g1.appendChild(o); }); sel.appendChild(g1);
  if(arquivosSom.length){ var g2=el('optgroup'); g2.label='Meus sons'; arquivosSom.forEach(function(f){ var o=el('option',null,f); o.value='arquivo:'+f; g2.appendChild(o); }); sel.appendChild(g2); }
  sel.value=valor||'nenhum';
}
EVENTOS_SOM.forEach(function(ev){
  var l=el('div','linha-som'); l.setAttribute('data-ev',ev[0]);
  var r=el('div','rot-som'); r.appendChild(el('b',null,ev[1])); if(ev[2]) r.appendChild(el('small',null,ev[2])); l.appendChild(r);
  var sel=el('select'); sel.addEventListener('change',function(){ mudarSom(ev[0],sel.value); BenchSons.tocar(sel.value,volumeAtual()); }); l.appendChild(sel);
  var pl=el('button','b','▶ Ouvir'); pl.type='button'; pl.addEventListener('click',function(){ BenchSons.tocar(sel.value,volumeAtual()); }); l.appendChild(pl);
  var ob=el('button','b leve','No OBS'); ob.type='button'; ob.title='Toca agora no overlay do OBS';
  ob.addEventListener('click',function(){ api('tocar',{som:sel.value}).then(function(){ toast('Tocando no OBS'); }).catch(function(){}); }); l.appendChild(ob);
  $('#linhas-som').appendChild(l);
});
BenchSons.lista.forEach(function(x){
  var b=el('button','som-chip'); b.type='button'; b.appendChild(el('span','play','▶')); b.appendChild(document.createTextNode(x[1]));
  b.addEventListener('click',function(){ BenchSons.tocar(x[0],volumeAtual()); }); $('#biblioteca').appendChild(b);
});
function setSons(){
  var x=cfg.sons||{};
  $('#som-ativo').checked=!!x.ativo; $('#som-feed').checked=!!x.feed;
  if(document.activeElement!==$('#som-volume')) $('#som-volume').value=x.volume; $('#som-volume-v').textContent=x.volume+' %';
  $$('#linhas-som .linha-som').forEach(function(l){ opcoesSom(l.querySelector('select'),x[l.getAttribute('data-ev')]); });
  var m=$('#meus-sons'); m.innerHTML='';
  if(!arquivosSom.length) m.appendChild(el('p','nota','Nenhum arquivo enviado ainda.'));
  arquivosSom.forEach(function(f){
    var c=el('div','som-chip meu'), pl=el('button','play-b','▶'); pl.type='button'; pl.title='Ouvir';
    pl.addEventListener('click',function(){ BenchSons.tocar('arquivo:'+f,volumeAtual()); });
    c.appendChild(pl); c.appendChild(el('span',null,f));
    var xb=el('button','x','×'); xb.type='button'; xb.title='Excluir';
    xb.addEventListener('click',function(){ if(confirm('Excluir o som "'+f+'"?')) api('som',{acao:'excluir',nome:f}).catch(function(){}); });
    c.appendChild(xb); m.appendChild(c);
  });
}
$('#som-ativo').addEventListener('change',function(){ mudarSom('ativo',this.checked); });
$('#som-feed').addEventListener('change',function(){ mudarSom('feed',this.checked); });
$('#som-volume').addEventListener('input',function(){
  var v=Number(this.value); $('#som-volume-v').textContent=v+' %'; cfg.sons.volume=v;
  clearTimeout(tVolume); tVolume=setTimeout(function(){ mudarSom('volume',v); },200);
});
$('#som-volume').addEventListener('change',function(){ BenchSons.tocar('plim',Number(this.value)); });
$('#arquivo-som').addEventListener('change',function(){
  var f=this.files[0]; this.value=''; if(!f) return;
  if(f.size>3*1024*1024){ toast('Arquivo maior que 3 MB'); return; }
  var r=new FileReader();
  r.onload=function(){ toast('Enviando…'); api('som',{acao:'enviar',nome:f.name,dados:r.result}).then(function(j){ toast('Som "'+j.nome+'" enviado'); }).catch(function(){}); };
  r.readAsDataURL(f);
});

/* ── conexão ── */
function receberConfig(c){
  var proprio=c._origem===ORIGEM; delete c._origem;
  var preds=c.predefinicoes;
  if(c.sonsArquivos) arquivosSom=c.sonsArquivos;
  if(proprio){ cfg.predefinicoes=preds; chipsEstilos(); return; }
  var meuEstilo=cfg.estilo;
  cfg=c;
  if(Object.keys(pendente).length) cfg.estilo=Object.assign({},c.estilo,pendente); // não desfaz o que você está mexendo
  setComportamento(); preencherControles(); chipsEstilos(); setSons(); enviarPrevia();
}
function iniciar(){
  api('estado').then(function(){
    if(es) es.close();
    es=new EventSource('eventos?lado=painel&senha='+encodeURIComponent(senha));
    function ouvir(ev,fn){ es.addEventListener(ev,function(e){ fn(JSON.parse(e.data)); }); }
    ouvir('estado',function(d){
      padrao=d.estiloPadrao; prontos=d.estilosProntos;
      arquivosSom=d.sonsArquivos||[];
      cfg=d.config; setComportamento(); preencherControles(); chipsEstilos(); setSons(); enviarPrevia();
      setStatus(d.status);
      $('#aviso-fonte').hidden=!!d.temFonte;
      destaqueId=d.destaque?d.destaque.id:null;
      if(d.mensagens.length){ lista.innerHTML=''; mapa={}; d.mensagens.forEach(function(m){ addMsg(m,false); }); lista.scrollTop=lista.scrollHeight; }
      carregarApoios(d.apoios||[]); setTotais(d.totais||{superchats:0,valores:{},membros:0,presentes:0,assinaturas:0});
    });
    ouvir('status',setStatus);
    ouvir('config',receberConfig);
    ouvir('msg',function(m){ addMsg(m); if(m.tipo!=='texto') addApoio(m,true); });
    ouvir('totais',setTotais);
    ouvir('apoios',function(d){ carregarApoios(d.apoios); setTotais(d.totais); naoVistos=0; atualizarContador(); });
    ouvir('agradecido',function(d){ var m=mapaApoios[d.id]; if(!m) return; m.agradecido=d.valor; var n=listaApoios.querySelector('[data-id="'+CSS.escape(d.id)+'"]'); if(n&&n._pinta) n._pinta(); });
    ouvir('mostrar',function(d){ marcar(d.msg.id); });
    ouvir('ocultar',function(){ marcar(null); });
    ouvir('remover',function(d){ d.ids.forEach(function(id){ $$('[data-id="'+CSS.escape(id)+'"]').forEach(function(n){ if(n.classList.contains('item')) n.remove(); }); delete mapa[id]; delete mapaApoios[id]; }); });
    ouvir('limpo',function(){ lista.innerHTML=''; mapa={}; });
  }).catch(function(){});
}
var telaSalva='vivo'; try{ telaSalva=localStorage.getItem('benchchat-tela')||'vivo'; }catch(e){}
irPara(['aparencia','sons'].indexOf(telaSalva)>=0?telaSalva:'vivo');
var vistaSalva='tudo'; try{ vistaSalva=localStorage.getItem('benchchat-vista')||'tudo'; }catch(e){}
setVista(['tudo','chat','apoios'].indexOf(vistaSalva)>=0?vistaSalva:'tudo');
iniciar();
})();
</script>
</body></html>`;

/* ───────────────────────── início ───────────────────────── */

servidor.listen(PORTA, () => {
  console.log('');
  console.log('  BENCH CHAT rodando na porta ' + PORTA);
  console.log('  Painel:  http://localhost:' + PORTA + '/painel');
  console.log('  OBS:     http://localhost:' + PORTA + '/overlay');
  if (!SENHA) console.log('  ⚠  Sem senha: defina SENHA=... para proteger o painel num servidor público.');
  console.log('');
  if (config.fonte) leitor.iniciar(config.fonte);
});
