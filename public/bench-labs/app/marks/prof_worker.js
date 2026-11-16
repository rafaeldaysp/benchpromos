/* Bench Marks · testes pesados de Engenharia, Programação e Design no processador. Roda em workers, um por núcleo.
 *
 *   fea       · simulação de estrutura por elementos finitos (como o SolidWorks Simulation e o ANSYS): um suporte de aço
 *               dividido em 15 mil cubinhos de 8 nós, resolvido por gradiente conjugado, um caso de carga atrás do outro
 *   dgemm     · multiplicação de matrizes em precisão dupla (como o MATLAB e o NumPy)
 *   compilar  · compila arquivos de código de verdade: leitura, análise, otimização e geração do código (como um build)
 *   ambiente  · um "ambiente" (contêiner, serviço, banco de dados) com a própria memória, acessada o tempo todo
 *   jpeg      · exporta fotos de 24 megapixels em JPEG (como o Lightroom), pelo codificador do próprio Windows/Edge
 *
 * Tudo é determinístico: o mesmo trabalho dá o mesmo resultado em qualquer computador.
 */
const agora = () => performance.now();
let PARAR = false;

// ================================================================== elementos finitos (cubo de 8 nós)
function matrizHex8(nu = .3) {
  const lam = nu / ((1 + nu) * (1 - 2 * nu)), mu = 1 / (2 * (1 + nu));
  const D = [[lam + 2 * mu, lam, lam, 0, 0, 0], [lam, lam + 2 * mu, lam, 0, 0, 0], [lam, lam, lam + 2 * mu, 0, 0, 0], [0, 0, 0, mu, 0, 0], [0, 0, 0, 0, mu, 0], [0, 0, 0, 0, 0, mu]];
  const nos = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const K = new Float64Array(576), g = 1 / Math.sqrt(3);
  const matB = (xi, eta, zeta) => {
    const B = Array.from({length: 6}, () => new Float64Array(24));
    nos.forEach(([a, b, c], i) => {
      const dx = a * (1 + eta * b) * (1 + zeta * c) / 8 * 2, dy = b * (1 + xi * a) * (1 + zeta * c) / 8 * 2, dz = c * (1 + xi * a) * (1 + eta * b) / 8 * 2;
      B[0][i * 3] = dx; B[1][i * 3 + 1] = dy; B[2][i * 3 + 2] = dz;
      B[3][i * 3] = dy; B[3][i * 3 + 1] = dx; B[4][i * 3 + 1] = dz; B[4][i * 3 + 2] = dy; B[5][i * 3] = dz; B[5][i * 3 + 2] = dx;
    });
    return B;
  };
  for (const xi of [-g, g]) for (const eta of [-g, g]) for (const zeta of [-g, g]) {
    const B = matB(xi, eta, zeta), DB = Array.from({length: 6}, (_, r) => { const o = new Float64Array(24); for (let k = 0; k < 6; k++) if (D[r][k]) for (let j = 0; j < 24; j++) o[j] += D[r][k] * B[k][j]; return o; });
    for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) { let s = 0; for (let r = 0; r < 6; r++) s += B[r][i] * DB[r][j]; K[i * 24 + j] += s / 8; }
  }
  return {K, D, Bc: matB(0, 0, 0)};
}

/** Malha do suporte: viga afunilada presa na parede, com um furo de alívio. */
function malhaSuporte(nx = 72, ny = 18, nz = 12) {
  const ativo = new Uint8Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const h = ny * (1 - .5 * i / nx), cy = ny / 2, x = i + .5, y = j + .5;
    let a = Math.abs(y - cy) < h / 2;
    if (Math.hypot(x - nx * .38, y - cy) < ny * .17) a = false;
    if (Math.hypot(x - nx * .68, y - cy) < ny * .11) a = false;
    ativo[(k * ny + j) * nx + i] = a ? 1 : 0;
  }
  const NX = nx + 1, NY = ny + 1, nNos = NX * NY * (nz + 1), els = [];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (ativo[(k * ny + j) * nx + i]) els.push([i, j, k]);
  const dof = new Int32Array(els.length * 24);
  const no = (i, j, k) => (k * NY + j) * NX + i;
  els.forEach(([i, j, k], e) => {
    const ns = [no(i, j, k), no(i + 1, j, k), no(i + 1, j + 1, k), no(i, j + 1, k), no(i, j, k + 1), no(i + 1, j, k + 1), no(i + 1, j + 1, k + 1), no(i, j + 1, k + 1)];
    ns.forEach((n, a) => { dof[e * 24 + a * 3] = n * 3; dof[e * 24 + a * 3 + 1] = n * 3 + 1; dof[e * 24 + a * 3 + 2] = n * 3 + 2; });
  });
  return {nx, ny, nz, NX, NY, nNos, els, dof, ativo};
}

function fea({segundos = 60, id = 0, visual = false}, avisar) {
  const {K, D, Bc} = matrizHex8(), m = malhaSuporte(), n = m.nNos * 3, ne = m.els.length, dof = m.dof;
  const livre = new Uint8Array(n), diag = new Float64Array(n);
  for (let e = 0; e < ne; e++) for (let a = 0; a < 24; a++) { const d = dof[e * 24 + a]; livre[d] = 1; diag[d] += K[a * 25]; }
  for (let k = 0; k <= m.nz; k++) for (let j = 0; j <= m.ny; j++) { const nn = (k * m.NY + j) * m.NX; livre[nn * 3] = livre[nn * 3 + 1] = livre[nn * 3 + 2] = 0; }   // presa na parede (x = 0)
  const u = new Float64Array(n), r = new Float64Array(n), z = new Float64Array(n), p = new Float64Array(n), q = new Float64Array(n), f = new Float64Array(n), pe = new Float64Array(24);
  const Kp = (src, dst) => {
    dst.fill(0);
    for (let e = 0; e < ne; e++) {
      const b = e * 24;
      for (let a = 0; a < 24; a++) pe[a] = src[dof[b + a]];
      for (let a = 0; a < 24; a++) { let s = 0; const kr = a * 24; for (let c = 0; c < 24; c++) s += K[kr + c] * pe[c]; dst[dof[b + a]] += s; }
    }
    for (let i = 0; i < n; i++) if (!livre[i]) dst[i] = 0;
  };
  const vonMises = () => {
    const vm = new Float32Array(ne), eps = new Float64Array(6);
    for (let e = 0; e < ne; e++) {
      eps.fill(0);
      for (let rr = 0; rr < 6; rr++) { let s = 0; for (let a = 0; a < 24; a++) s += Bc[rr][a] * u[dof[e * 24 + a]]; eps[rr] = s; }
      const s = D.map(lin => lin.reduce((acc, v, k) => acc + v * eps[k], 0));
      vm[e] = Math.sqrt(.5 * ((s[0] - s[1]) ** 2 + (s[1] - s[2]) ** 2 + (s[2] - s[0]) ** 2) + 3 * (s[3] ** 2 + s[4] ** 2 + s[5] ** 2));
    }
    return vm;
  };
  const enviarVisual = (casos, it) => {
    if (!visual) return;
    const vm = vonMises(), uy = new Float32Array(m.nNos * 2);
    for (let i = 0; i < m.nNos; i++) { uy[i * 2] = u[i * 3]; uy[i * 2 + 1] = u[i * 3 + 1]; }
    const els = new Int16Array(ne * 3); m.els.forEach(([a, b, c], e) => { els[e * 3] = a; els[e * 3 + 1] = b; els[e * 3 + 2] = c; });
    avisar({tipo: 'visual', vm, uy, els, malha: [m.nx, m.ny, m.nz, m.NX, m.NY], casos, it}, [vm.buffer, uy.buffer, els.buffer]);
  };
  const t0 = agora();
  let iteracoes = 0, casos = 0, ultimo = t0, ultimoVis = t0;
  while (agora() - t0 < segundos * 1000 && !PARAR) {
    // um caso de carga atrás do outro: para baixo, para baixo e de lado, torção e puxando
    const caso = (id + casos) % 4;
    f.fill(0);
    for (let k = 0; k <= m.nz; k++) for (let j = 0; j <= m.ny; j++) {
      const nn = ((k * m.NY + j) * m.NX + m.nx) * 3;
      if (!livre[nn + 1]) continue;
      const yc = j - m.ny / 2, zc = k - m.nz / 2;
      if (caso === 0) f[nn + 1] = -1;
      else if (caso === 1) { f[nn + 1] = -1; f[nn + 2] = .5; }
      else if (caso === 2) { f[nn + 1] = -zc * .2; f[nn + 2] = yc * .2; }
      else { f[nn] = .6; f[nn + 1] = -.6; }
    }
    // gradiente conjugado com pré-condicionador de Jacobi
    u.fill(0);
    let fn = 0, rz = 0;
    for (let i = 0; i < n; i++) { r[i] = livre[i] ? f[i] : 0; fn += r[i] * r[i]; z[i] = livre[i] && diag[i] ? r[i] / diag[i] : 0; p[i] = z[i]; rz += r[i] * z[i]; }
    fn = Math.sqrt(fn);
    for (let it = 0; it < 3000; it++) {
      Kp(p, q);
      let pq = 0; for (let i = 0; i < n; i++) pq += p[i] * q[i];
      const al = rz / (pq || 1e-30);
      let rn = 0, rz2 = 0;
      for (let i = 0; i < n; i++) { u[i] += al * p[i]; r[i] -= al * q[i]; rn += r[i] * r[i]; z[i] = livre[i] && diag[i] ? r[i] / diag[i] : 0; rz2 += r[i] * z[i]; }
      const be = rz2 / (rz || 1e-30); rz = rz2;
      for (let i = 0; i < n; i++) p[i] = z[i] + be * p[i];
      iteracoes++;
      const t = agora();
      if (t - ultimo > 400) { ultimo = t; avisar({tipo: 'andamento', iteracoes, casos, residuo: Math.sqrt(rn) / fn}); }
      if (visual && t - ultimoVis > 1200) { ultimoVis = t; enviarVisual(casos, it); }
      if (Math.sqrt(rn) < 1e-6 * fn || t - t0 > segundos * 1000 || PARAR) break;
    }
    casos++;
    if (visual) { ultimoVis = agora(); enviarVisual(casos - 1, -1); }      // caso resolvido
  }
  return {tipo: 'fim', iteracoes, casos, segundos: (agora() - t0) / 1000, elementos: ne, graus: n};
}

// ================================================================== matrizes em precisão dupla
function dgemm({segundos = 60, id = 0, N = 384}, avisar) {
  const A = new Float64Array(N * N), B = new Float64Array(N * N), C = new Float64Array(N * N);
  let s = 1 + id;
  for (let i = 0; i < N * N; i++) { s = (s * 16807) % 2147483647; A[i] = s / 2147483647 - .5; s = (s * 16807) % 2147483647; B[i] = s / 2147483647 - .5; }
  const t0 = agora();
  let feitas = 0, ultimo = t0, assin = 0;
  while (agora() - t0 < segundos * 1000 && !PARAR) {
    C.fill(0);
    for (let i = 0; i < N; i += 2) {                                  // duas linhas por vez: menos leituras de B
      const c0 = i * N, c1 = c0 + N;
      for (let k = 0; k < N; k++) {
        const a0 = A[c0 + k], a1 = A[c1 + k], bk = k * N;
        for (let j = 0; j < N; j++) { const b = B[bk + j]; C[c0 + j] += a0 * b; C[c1 + j] += a1 * b; }
      }
    }
    assin = C[(feitas * 7919) % (N * N)];
    feitas++;
    const t = agora();
    if (t - ultimo > 300) { ultimo = t; avisar({tipo: 'andamento', feitas, gflop: feitas * 2 * N ** 3 / 1e9}); }
  }
  const seg = (agora() - t0) / 1000;
  return {tipo: 'fim', feitas, segundos: seg, gflops: feitas * 2 * N ** 3 / 1e9 / seg, N, assinatura: assin};
}

// ================================================================== compilador (de verdade, em miniatura)
function rng(s) { s = (s >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const PASTAS = ['render', 'fisica', 'audio', 'rede', 'ui', 'dados', 'core', 'ia', 'jogo', 'ferramentas'];
const NOMES = ['sombra', 'malha', 'colisao', 'mixer', 'conexao', 'lista', 'indice', 'alocador', 'fila', 'janela', 'editor', 'cache', 'textura', 'animacao', 'particulas', 'camera', 'luz', 'shader', 'parser', 'timer'];
export const nomeArquivo = i => `${PASTAS[i % PASTAS.length]}/${NOMES[(i * 7) % NOMES.length]}_${String(i).padStart(4, '0')}.cpp`;

function gerarFonte(idx) {
  const r = rng(idx * 2654435761 + 7), L = [], nf = 10 + Math.floor(r() * 8);
  const vars = ['a', 'b', 'c', 'd', 'n', 'i', 'k', 'total', 'conta', 'valor'];
  const expr = (d) => {
    if (d <= 0 || r() < .25) return r() < .5 ? String(Math.floor(r() * 100)) : vars[Math.floor(r() * vars.length)];
    const ops = ['+', '-', '*', '/', '%', '<', '>', '==', '&&', '||'];
    if (r() < .12) return `f${Math.floor(r() * nf)}(${expr(d - 1)}, ${expr(d - 1)})`;
    return `(${expr(d - 1)} ${ops[Math.floor(r() * ops.length)]} ${expr(d - 1)})`;
  };
  const bloco = (d, ind) => {
    const n = 2 + Math.floor(r() * 5);
    for (let s = 0; s < n; s++) {
      const q = r();
      if (q < .4 || d <= 0) L.push(`${ind}let ${vars[Math.floor(r() * vars.length)]} = ${expr(4)};`);
      else if (q < .65) { L.push(`${ind}if (${expr(3)}) {`); bloco(d - 1, ind + '  '); L.push(`${ind}} else {`); bloco(d - 1, ind + '  '); L.push(`${ind}}`); }
      else if (q < .85) { L.push(`${ind}while (${expr(2)}) {`); bloco(d - 1, ind + '  '); L.push(`${ind}}`); }
      else L.push(`${ind}${vars[Math.floor(r() * vars.length)]} = ${vars[Math.floor(r() * vars.length)]} + ${expr(3)};`);
    }
  };
  for (let f = 0; f < nf; f++) {
    L.push(`fn f${f}(a, b) {`, '  let c = 0; let d = 1; let n = 10; let i = 0; let k = 2; let total = 0; let conta = 0; let valor = 3;');
    bloco(3, '  ');
    L.push(`  return ${expr(3)};`, '}');
  }
  return L.join('\n');
}

// tokens: 1 número, 2 nome, 3 palavra-chave, 4 símbolo
const PALAVRAS = new Set(['fn', 'let', 'if', 'else', 'while', 'return']);
function lexer(src) {
  const tipos = [], vals = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src.charCodeAt(i);
    if (c <= 32) { i++; continue; }
    if (c >= 48 && c <= 57) { let v = 0; while (i < n && src.charCodeAt(i) >= 48 && src.charCodeAt(i) <= 57) { v = v * 10 + src.charCodeAt(i) - 48; i++; } tipos.push(1); vals.push(v); continue; }
    if ((c >= 97 && c <= 122) || (c >= 65 && c <= 90) || c === 95) {
      const ini = i; while (i < n) { const d = src.charCodeAt(i); if ((d >= 97 && d <= 122) || (d >= 65 && d <= 90) || d === 95 || (d >= 48 && d <= 57)) i++; else break; }
      const w = src.slice(ini, i); tipos.push(PALAVRAS.has(w) ? 3 : 2); vals.push(w); continue;
    }
    const dois = src.substr(i, 2);
    if (dois === '==' || dois === '&&' || dois === '||') { tipos.push(4); vals.push(dois); i += 2; continue; }
    tipos.push(4); vals.push(src[i]); i++;
  }
  return {tipos, vals};
}
const PREC = {'||': 1, '&&': 2, '==': 3, '<': 4, '>': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6};
function parser(tk) {
  let p = 0;
  const ve = v => tk.vals[p] === v, come = v => { if (tk.vals[p] !== v) throw new Error(`esperado ${v}`); p++; };
  const primario = () => {
    const t = tk.tipos[p], v = tk.vals[p];
    if (t === 1) { p++; return {k: 'num', v}; }
    if (v === '(') { p++; const e = expressao(0); come(')'); return e; }
    if (t === 2) { p++; if (ve('(')) { p++; const args = []; while (!ve(')')) { args.push(expressao(0)); if (ve(',')) p++; } p++; return {k: 'call', f: v, args}; } return {k: 'var', v}; }
    throw new Error('expressão inválida');
  };
  const expressao = (min) => {
    let e = primario();
    for (;;) { const op = tk.vals[p], pr = PREC[op]; if (!pr || pr <= min) break; p++; e = {k: 'bin', op, a: e, b: expressao(pr)}; }
    return e;
  };
  const instrucao = () => {
    const v = tk.vals[p];
    if (v === 'let') { p++; const nome = tk.vals[p++]; come('='); const e = expressao(0); come(';'); return {k: 'let', nome, e}; }
    if (v === 'if') { p++; come('('); const c = expressao(0); come(')'); const s = bloco(); let n = null; if (ve('else')) { p++; n = bloco(); } return {k: 'if', c, s, n}; }
    if (v === 'while') { p++; come('('); const c = expressao(0); come(')'); return {k: 'while', c, s: bloco()}; }
    if (v === 'return') { p++; const e = expressao(0); come(';'); return {k: 'ret', e}; }
    const nome = tk.vals[p++]; come('='); const e = expressao(0); come(';'); return {k: 'set', nome, e};
  };
  const bloco = () => { come('{'); const l = []; while (!ve('}')) l.push(instrucao()); p++; return l; };
  const funcs = [];
  while (p < tk.vals.length) { come('fn'); const nome = tk.vals[p++]; come('('); const ps = []; while (!ve(')')) { ps.push(tk.vals[p++]); if (ve(',')) p++; } p++; funcs.push({nome, ps, corpo: bloco()}); }
  return funcs;
}
function dobrar(e) {                                                 // otimização: contas com números viram números
  if (e.k === 'bin') {
    const a = dobrar(e.a), b = dobrar(e.b);
    if (a.k === 'num' && b.k === 'num') {
      const x = a.v, y = b.v, o = e.op;
      const v = o === '+' ? x + y : o === '-' ? x - y : o === '*' ? x * y : o === '/' ? (y ? (x / y) | 0 : 0) : o === '%' ? (y ? x % y : 0) : o === '<' ? +(x < y) : o === '>' ? +(x > y) : o === '==' ? +(x === y) : o === '&&' ? +(x && y) : +(x || y);
      return {k: 'num', v: v | 0};
    }
    return {k: 'bin', op: e.op, a, b};
  }
  if (e.k === 'call') return {k: 'call', f: e.f, args: e.args.map(dobrar)};
  return e;
}
function otimizar(lista) {
  const out = [];
  for (const s of lista) {
    if (s.k === 'if') { const c = dobrar(s.c); if (c.k === 'num') { out.push(...otimizar(c.v ? s.s : s.n || [])); continue; } out.push({k: 'if', c, s: otimizar(s.s), n: s.n && otimizar(s.n)}); }
    else if (s.k === 'while') { const c = dobrar(s.c); if (c.k === 'num' && !c.v) continue; out.push({k: 'while', c, s: otimizar(s.s)}); }
    else out.push({...s, e: dobrar(s.e)});
  }
  return out;
}
const OPS = {'+': 10, '-': 11, '*': 12, '/': 13, '%': 14, '<': 15, '>': 16, '==': 17, '&&': 18, '||': 19};
function gerar(funcs) {
  const cod = [];
  let h = 2166136261;
  const emit = (...xs) => { for (const x of xs) { cod.push(x); h = Math.imul(h ^ x, 16777619) >>> 0; } };
  const nomes = new Map(funcs.map((f, i) => [f.nome, i]));
  for (const f of funcs) {
    const loc = new Map(f.ps.map((p, i) => [p, i]));
    const slot = v => { if (!loc.has(v)) loc.set(v, loc.size); return loc.get(v); };
    const ex = e => { if (e.k === 'num') emit(1, e.v); else if (e.k === 'var') emit(2, slot(e.v)); else if (e.k === 'call') { e.args.forEach(ex); emit(3, nomes.get(e.f) ?? -1, e.args.length); } else { ex(e.a); ex(e.b); emit(OPS[e.op]); } };
    const st = l => { for (const s of l) {
      if (s.k === 'let' || s.k === 'set') { ex(s.e); emit(4, slot(s.nome)); }
      else if (s.k === 'ret') { ex(s.e); emit(5); }
      else if (s.k === 'if') { ex(s.c); const j = cod.length; emit(6, 0); st(s.s); cod[j + 1] = cod.length; if (s.n) st(s.n); }
      else { const ini = cod.length; ex(s.c); const j = cod.length; emit(6, 0); st(s.s); emit(7, ini); cod[j + 1] = cod.length; }
    } };
    st(f.corpo);
  }
  return {tamanho: cod.length, hash: h};
}
// cada arquivo inclui 8 cabeçalhos do projeto (sem cabeçalho pré-compilado, cada um é lido e analisado de novo, como no C++)
const CABECALHOS = 400, POR_ARQUIVO = 8;
function compilarArquivo(i) {
  const partes = [];
  for (let h = 0; h < POR_ARQUIVO; h++) partes.push(gerarFonte(100000 + (i * 31 + h * 97) % CABECALHOS));
  partes.push(gerarFonte(i));
  const src = partes.join('\n'), tk = lexer(src), ast = parser(tk), opt = ast.map(f => ({...f, corpo: otimizar(f.corpo)})), obj = gerar(opt);
  return {linhas: src.split('\n').length, tokens: tk.vals.length, hash: obj.hash};
}

// ================================================================== um ambiente (serviço com memória própria)
function ambiente({segundos = 15, mb = 128, id = 0}, avisar) {
  const n = mb * 131072, mem = new Float64Array(n), mask = (1 << Math.floor(Math.log2(n))) - 1;
  for (let i = 0; i < n; i++) mem[i] = (i * 2654435761 % 1000) / 1000;
  const t0 = agora();
  let ops = 0, x = 12345 + id, acc = 0, ultimo = t0;
  while (agora() - t0 < segundos * 1000 && !PARAR) {
    for (let k = 0; k < 20000; k++) {                                // consultas espalhadas pela memória (banco de dados, cache)
      x = (Math.imul(x, 1103515245) + 12345) >>> 0;
      const j = x & mask; acc += mem[j]; mem[j] = acc * .5;
    }
    let s = 0; const ini = (x & mask) & ~1023;                       // uma leitura em sequência (arquivo, resposta)
    for (let j = ini; j < ini + 16384 && j < n; j++) s += mem[j];
    acc = (acc + s) % 1e6;
    ops++;
    const t = agora();
    if (t - ultimo > 400) { ultimo = t; avisar({tipo: 'andamento', ops}); }
  }
  return {tipo: 'fim', ops, segundos: (agora() - t0) / 1000, assinatura: Math.round(acc)};
}

// ================================================================== exportar fotos em JPEG (24 megapixels)
async function jpeg({segundos = 60, id = 0, total = 200, n = 1}, avisar) {
  const W = 6000, H = 4000, cv = new OffscreenCanvas(W, H), x = cv.getContext('2d');
  // foto base: céu, montanhas e um lago, com textura (cada worker uma cena um pouco diferente)
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2B3E7A'); g.addColorStop(.6, '#C9708A'); g.addColorStop(1, '#F2A86B');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const r = rng(99 + id);
  for (let i = 0; i < 2500; i++) { x.fillStyle = `hsla(${(r() * 360) | 0},40%,${20 + r() * 50}%,.35)`; x.beginPath(); x.arc(r() * W, H * .55 + r() * H * .45, 6 + r() * 80, 0, 7); x.fill(); }
  x.fillStyle = '#33284E'; x.beginPath(); x.moveTo(0, H * .7); for (let k = 0; k <= 20; k++) x.lineTo(k * W / 20, H * (.5 + .15 * Math.sin(k * 1.7 + id))); x.lineTo(W, H); x.lineTo(0, H); x.fill();
  const base = x.getImageData(0, 0, W, H), img = new ImageData(W, H), src = base.data, dst = img.data;
  const curva = new Uint8ClampedArray(768);
  const t0 = agora();
  let feitas = 0, bytes = 0;
  // exporta as 200 fotos repetidas vezes até completar o tempo (cada worker pega uma em cada `n`)
  for (let k = id; agora() - t0 < segundos * 1000 && !PARAR; k += n) {
    const foto = k % total;
    // revelação (como o Lightroom faz antes de gravar): balanço de branco, exposição, curva de tons e nitidez
    const ex = 1 + ((foto * 37) % 21 - 10) / 40, wb = ((foto * 13) % 11 - 5) / 60;
    for (let c = 0; c < 3; c++) for (let v = 0; v < 256; v++) {
      const t = Math.min(1, v / 255 * ex * (c === 0 ? 1 + wb : c === 2 ? 1 - wb : 1));
      curva[c * 256 + v] = 255 * (t < .5 ? 2 * t * t * .9 + t * .1 : 1 - 2 * (1 - t) * (1 - t) * .9 - (1 - t) * .1 + .0);
    }
    const L = W * 4;
    for (let y = 0; y < H; y++) {
      const o = y * L, cima = y ? o - L : o, baixo = y < H - 1 ? o + L : o;
      for (let i = o; i < o + L; i += 4) {
        for (let c = 0; c < 3; c++) {
          const p = src[i + c], viz = (src[cima + (i - o) + c] + src[baixo + (i - o) + c] + src[i > o ? i - 4 + c : i + c] + src[i < o + L - 4 ? i + 4 + c : i + c]) >> 2;
          dst[i + c] = curva[c * 256 + Math.max(0, Math.min(255, p + ((p - viz) >> 1)))];
        }
        dst[i + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    x.fillStyle = '#FFFFFF'; x.font = '700 160px sans-serif'; x.fillText(`IMG_${String(4100 + foto)}`, 200, H - 200);
    const b = await cv.convertToBlob({type: 'image/jpeg', quality: .92});
    bytes += b.size; feitas++;
    avisar({tipo: 'andamento', feitas, foto, mb: b.size / 1048576});
  }
  return {tipo: 'fim', feitas, segundos: (agora() - t0) / 1000, mb: bytes / 1048576};
}

// ================================================================== mensagens
const ehWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
if (ehWorker) {
  self.onmessage = async e => {
    const m = e.data;
    const avisar = (d, tr = []) => self.postMessage(d, tr);
    try {
      if (m.tipo === 'parar') { PARAR = true; return; }
      if (m.tipo === 'fea') self.postMessage(fea(m, avisar));
      else if (m.tipo === 'dgemm') self.postMessage(dgemm(m, avisar));
      else if (m.tipo === 'ambiente') self.postMessage(ambiente(m, avisar));
      else if (m.tipo === 'jpeg') self.postMessage(await jpeg(m, avisar));
      else if (m.tipo === 'compilar') {                               // um lote de arquivos
        const t0 = agora(), res = [];
        let linhas = 0, hash = 0;
        for (let i = m.de; i < m.ate; i++) { const r = compilarArquivo(i); linhas += r.linhas; hash = (hash ^ r.hash) >>> 0; res.push(i); }
        self.postMessage({tipo: 'compilado', de: m.de, ate: m.ate, ms: agora() - t0, linhas, hash});
      }
    } catch (err) {
      self.postMessage({tipo: 'erro', erro: String(err && err.stack || err)});
    }
  };
}
export {fea, dgemm, compilarArquivo, ambiente, malhaSuporte};
