/* Bench Marks · navegação no modelo 3D (perfil Arquitetura e Engenharia)
 *
 * Imita a janela 3D do Revit / SketchUp: um condomínio de casas completas, com paredes, esquadrias,
 * telhado, móveis, piscina e jardim (milhões de triângulos), num voo em volta, em três estilos de vista:
 *   arestas    · só as linhas (como "Linhas ocultas"/arame)
 *   sombreado  · faces coloridas com as arestas por cima (o padrão do Revit)
 *   realista   · luz do sol com sombras e suavização de bordas (MSAA 4x)
 *
 * Como no GPU Fight, desenha fora da tela em resolução fixa (Full HD), sem o limite da taxa da tela.
 */

const SHADER = /* wgsl */`
struct U { vp: mat4x4f, luz: mat4x4f, olho: vec4f, sol: vec4f, estilo: vec4f };
struct Inst { c: vec3f, cor: f32, t: vec3f, pad: f32 };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> inst: array<Inst>;

fn canto(i: u32) -> vec3f { return vec3f(f32(i & 1u), f32((i >> 1u) & 1u), f32((i >> 2u) & 1u)) - vec3f(.5); }
const FACES = array<u32, 36>(1u,3u,7u, 1u,7u,5u,  0u,4u,6u, 0u,6u,2u,  2u,6u,7u, 2u,7u,3u,
                             0u,1u,5u, 0u,5u,4u,  4u,5u,7u, 4u,7u,6u,  0u,2u,3u, 0u,3u,1u);
const ARESTAS = array<u32, 24>(0u,1u, 2u,3u, 4u,5u, 6u,7u, 0u,2u, 1u,3u, 4u,6u, 5u,7u, 0u,4u, 1u,5u, 2u,6u, 3u,7u);
const NORMAIS = array<vec3f, 6>(vec3f(1.,0.,0.), vec3f(-1.,0.,0.), vec3f(0.,1.,0.), vec3f(0.,-1.,0.), vec3f(0.,0.,1.), vec3f(0.,0.,-1.));
const CORES = array<vec3f, 16>(vec3f(.40,.56,.28), vec3f(.92,.90,.86), vec3f(.16,.16,.18), vec3f(.55,.72,.85),
  vec3f(.70,.36,.24), vec3f(.62,.44,.28), vec3f(.48,.48,.52), vec3f(.07,.07,.08), vec3f(.26,.26,.28), vec3f(.24,.45,.20),
  vec3f(.20,.62,.80), vec3f(.68,.67,.64), vec3f(1.,.82,.06), vec3f(.38,.20,.55), vec3f(.80,.72,.60), vec3f(.36,.26,.18));

struct VS { @builtin(position) p: vec4f, @location(0) n: vec3f, @location(1) cor: vec3f, @location(2) mundo: vec3f };

@vertex fn vsFace(@builtin(vertex_index) v: u32, @builtin(instance_index) i: u32) -> VS {
  let b = inst[i];
  let w = b.c + canto(FACES[v]) * b.t;
  var o: VS;
  o.p = u.vp * vec4f(w, 1.);
  o.n = NORMAIS[v / 6u];
  o.cor = CORES[u32(b.cor)];
  o.mundo = w;
  return o;
}

@vertex fn vsSombra(@builtin(vertex_index) v: u32, @builtin(instance_index) i: u32) -> @builtin(position) vec4f {
  let b = inst[i];
  return u.luz * vec4f(b.c + canto(FACES[v]) * b.t, 1.);
}

@vertex fn vsAresta(@builtin(vertex_index) v: u32, @builtin(instance_index) i: u32) -> @builtin(position) vec4f {
  let b = inst[i];
  var p = u.vp * vec4f(b.c + canto(ARESTAS[v]) * b.t, 1.);
  p.z -= .0004 * p.w;                                          // a linha fica por cima da face
  return p;
}

@fragment fn fsAresta() -> @location(0) vec4f { return vec4f(u.estilo.yyy, 1.); }

@fragment fn fsSombreado(i: VS) -> @location(0) vec4f {
  let l = normalize(u.sol.xyz);
  let d = max(dot(i.n, l), 0.);
  return vec4f(i.cor * (.45 + .55 * d) + vec3f(.02), 1.);
}

@group(1) @binding(0) var mapaSombra: texture_depth_2d;
@group(1) @binding(1) var amostraSombra: sampler_comparison;

@fragment fn fsRealista(i: VS) -> @location(0) vec4f {
  let l = normalize(u.sol.xyz);
  let lp = u.luz * vec4f(i.mundo + i.n * .05, 1.);
  let uv = vec2f(lp.x * .5 + .5, .5 - lp.y * .5);
  var luz = 0.;
  let px = 1. / 2048.;
  for (var k = 0; k < 9; k++) {                                // sombra suave: 9 amostras
    let o = vec2f(f32(k % 3) - 1., f32(k / 3) - 1.) * px * 1.5;
    luz += textureSampleCompareLevel(mapaSombra, amostraSombra, uv + o, lp.z - .0015);
  }
  luz /= 9.;
  let d = max(dot(i.n, l), 0.) * luz;
  let ceu = .5 + .5 * i.n.y;
  let v = normalize(u.olho.xyz - i.mundo);
  let esp = pow(max(dot(reflect(-l, i.n), v), 0.), 40.) * luz * select(.08, .6, i.cor.b > .8 && i.cor.r < .6);
  var c = i.cor * (d * vec3f(1.15, 1.05, .92) + ceu * vec3f(.28, .32, .40)) + vec3f(esp);
  let neb = 1. - exp(-length(u.olho.xyz - i.mundo) * .0018);
  c = mix(c, vec3f(.74, .80, .88), neb);
  c = c / (c + vec3f(.7)) * 1.55;
  return vec4f(pow(c, vec3f(.95)), 1.);
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

// ------------------------------------------------------------------ matrizes (coluna por coluna)
const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
function olharPara(o, a, cima = [0, 1, 0]) {
  let z = [o[0] - a[0], o[1] - a[1], o[2] - a[2]]; const zl = Math.hypot(...z); z = z.map(v => v / zl);
  let x = [cima[1] * z[2] - cima[2] * z[1], cima[2] * z[0] - cima[0] * z[2], cima[0] * z[1] - cima[1] * z[0]]; const xl = Math.hypot(...x); x = x.map(v => v / xl);
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  const d = v => -(v[0] * o[0] + v[1] * o[1] + v[2] * o[2]);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, d(x), d(y), d(z), 1]);
}
function perspectiva(fov, asp, perto, longe) {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (perto - longe);
  return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, longe * nf, -1, 0, 0, perto * longe * nf, 0]);
}
function orto(l, r, b, t, n, f) {
  return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, 1 / (n - f), 0, -(r + l) / (r - l), -(t + b) / (t - b), n / (n - f), 1]);
}

// ------------------------------------------------------------------ o modelo
function rng(s) { s >>>= 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/**
 * Condomínio de casas de dois andares, completas por dentro (como um projeto de arquitetura no Revit):
 * paredes com janelas e portas, lajes, escada, telhado, cozinha, sala, quartos, banheiro, piscina, deck,
 * cerca, carro e jardim. Retorna Float32Array (8 por caixa: centro, cor, tamanho, -) e o total.
 */
export function montarModelo({linhas = 24, colunas = 32} = {}) {
  const r = rng(2024), cx = [];
  const caixa = (x, y, z, sx, sy, sz, cor) => cx.push(x, y, z, cor, sx, sy, sz, 0);
  const LOTE_X = 22, LOTE_Z = 30, RUA = 10;
  const totalX = colunas * LOTE_X, totalZ = linhas * (LOTE_Z + RUA / 2);
  caixa(0, -.3, 0, totalX + 120, .5, totalZ + 120, 0);                   // gramado
  for (let l = 0; l <= linhas; l += 2) caixa(0, -.04, -totalZ / 2 + l * (LOTE_Z + RUA / 2) - RUA / 4, totalX + 120, .1, RUA, 8);   // ruas
  for (let l = 0; l < linhas; l++) for (let c = 0; c < colunas; c++) {
    const ox = -totalX / 2 + c * LOTE_X + LOTE_X / 2, oz = -totalZ / 2 + l * (LOTE_Z + RUA / 2) + LOTE_Z / 2 + RUA / 4;
    casa(ox, oz, l % 2 ? -1 : 1, r, caixa);
  }
  // árvores da rua
  const nArv = Math.max(6, Math.round(400 * linhas * colunas / 768));     // 400 no condomínio padrão; proporcional nos outros tamanhos
  for (let i = 0; i < nArv; i++) arvore((r() - .5) * (totalX + 100), (r() - .5) * (totalZ + 100), r, caixa);
  const dados = new Float32Array(cx);
  return {dados, caixas: dados.length / 8, triangulos: dados.length / 8 * 12};
}

function arvore(x, z, r, caixa) {
  const h = 3 + r() * 4;
  caixa(x, h / 2, z, .25, h, .25, 15);
  for (let k = 0; k < 7; k++) caixa(x + (r() - .5) * 2.2, h + (r() - .3) * 1.8, z + (r() - .5) * 2.2, 1.3 + r() * 1.2, 1.1 + r(), 1.3 + r() * 1.2, 9);
}

// cores: 0 grama, 1 parede, 2 esquadria, 3 vidro, 4 telha, 5 madeira, 6 tecido, 7 preto, 8 asfalto, 9 folha,
//        10 piscina, 11 concreto, 12 amarelo, 13 roxo, 14 piso, 15 tronco
function casa(ox, oz, frente, r, caixaMundo) {
  // tudo em coordenadas locais do lote (x -11..11, z -15..15; a rua fica em z negativo * frente)
  const caixa = (x, y, z, sx, sy, sz, cor) => caixaMundo(ox + x, y, oz + z * frente, sx, sy, sz, cor);
  const PD = 3, W = 12, D = 10, x0 = -6, z0 = -3;                       // casa de 12 x 10 m, 2 andares
  const destaque = r() < .3 ? 13 : r() < .5 ? 12 : 1;
  // terreno: cerca, calçada, garagem
  for (let x = -11; x <= 11; x += 1) { caixa(x, .5, -15, .08, 1, .08, 5); caixa(x, .5, 15, .08, 1, .08, 5); }
  for (let z = -15; z <= 15; z += 1) { caixa(-11, .5, z, .08, 1, .08, 5); caixa(11, .5, z, .08, 1, .08, 5); }
  for (const z of [-15, 15]) for (const y of [.3, .8]) caixa(0, y, z, 22, .06, .04, 5);
  caixa(-8.2, .02, -9, 4.5, .04, 12, 11);                                 // entrada da garagem
  caixa(1, .02, -9.5, 1.2, .04, 11, 11);                                  // caminho da porta
  // carro: carroceria, cabine, vidros, rodas
  caixa(-8.2, .65, -9, 1.8, .7, 4.3, r() < .5 ? 13 : 7); caixa(-8.2, 1.25, -9.2, 1.6, .55, 2.2, 3);
  for (const [dx, dz] of [[-.85, -1.4], [.85, -1.4], [-.85, 1.4], [.85, 1.4]]) caixa(-8.2 + dx, .33, -9 + dz, .25, .66, .66, 7);
  // fundos: piscina, borda e deck
  caixa(0, -.05, 11, 7, .12, 3.6, 10); caixa(0, .02, 11, 7.8, .06, 4.4, 11);
  for (let k = 0; k < 18; k++) caixa(-7.5 + k * .3, .06, 11, .26, .05, 4.4, 5);
  for (const dx of [-6, -4.8]) { caixa(dx, .25, 9.5, .6, .1, 1.8, 6); caixa(dx, .45, 8.7, .6, .4, .1, 6); }   // espreguiçadeiras
  for (let k = 0; k < 6; k++) caixa(-10 + k * .8, .45, 14, .7, .9, .7, 9);                                  // cerca viva
  for (let k = 0; k < 40; k++) caixa(-10.5 + (k % 20) * 1.05, .2, k < 20 ? -14.4 : 7, .3, .35, .3, k % 3 ? 9 : k % 2 ? 12 : 13);   // canteiros
  arvore(8.5, 12, r, caixa); arvore(-9, 4, r, caixa);
  // ---- paredes com janelas: parede ao longo de x (z fixo) ou de z (x fixo)
  const parede = (eixo, fixo, a, b, y, vaos, cor) => {
    let ini = a;
    const peca = (p0, p1, y0, y1) => {
      if (p1 - p0 < .01 || y1 - y0 < .01) return;
      const m = (p0 + p1) / 2, c = p1 - p0, h = y1 - y0;
      if (eixo === 'x') caixa(m, y + (y0 + y1) / 2, fixo, c, h, .2, cor); else caixa(fixo, y + (y0 + y1) / 2, m, .2, h, c, cor);
    };
    for (const v of vaos) {
      peca(ini, v.p, 0, PD);
      peca(v.p, v.p + v.l, 0, v.base); peca(v.p, v.p + v.l, v.base + v.h, PD);
      // esquadria: 4 perfis, vidro e um montante no meio
      const mid = v.p + v.l / 2, cy = y + v.base + v.h / 2;
      const perfil = (pm, py, comp, alt) => eixo === 'x' ? caixa(pm, py, fixo, comp, alt, .08, 2) : caixa(fixo, py, pm, .08, alt, comp, 2);
      perfil(mid, y + v.base + .03, v.l, .06); perfil(mid, y + v.base + v.h - .03, v.l, .06);
      perfil(v.p + .03, cy, .06, v.h); perfil(v.p + v.l - .03, cy, .06, v.h);
      if (!v.porta) { perfil(mid, cy, .05, v.h); if (eixo === 'x') caixa(mid, cy, fixo, v.l - .1, v.h - .1, .02, 3); else caixa(fixo, cy, mid, .02, v.h - .1, v.l - .1, 3); }
      else if (eixo === 'x') caixa(mid, cy, fixo, v.l - .1, v.h - .06, .05, 5); else caixa(fixo, cy, mid, .05, v.h - .06, v.l - .1, 5);
      ini = v.p + v.l;
    }
    peca(ini, b, 0, PD);
  };
  const janelas = (a, b, larg, cada) => { const v = []; for (let p = a + .8; p + larg < b - .5; p += cada) v.push({p, l: larg, base: .9, h: 1.3}); return v; };
  for (let andar = 0; andar < 2; andar++) {
    const y = andar * PD;
    caixa(0, y + .1, z0 + D / 2, W + .2, .2, D + .2, andar ? 11 : 14);   // laje / piso
    const frenteV = andar ? janelas(x0, x0 + W, 1.6, 2.6) : [{p: -4.6, l: 3.2, base: .4, h: 1.9}, {p: .5, l: 1, base: 0, h: 2.2, porta: true}, {p: 2.6, l: 1.6, base: .9, h: 1.3}];
    parede('x', z0, x0, x0 + W, y, frenteV, andar ? 1 : destaque);
    parede('x', z0 + D, x0, x0 + W, y, andar ? janelas(x0, x0 + W, 1.6, 2.8) : [{p: -4.5, l: 4.5, base: 0, h: 2.4, porta: false}, {p: 1.5, l: 2.5, base: 0, h: 2.4, porta: false}], 1);
    parede('z', x0, z0, z0 + D, y, janelas(z0, z0 + D, 1.2, 3.2), 1);
    parede('z', x0 + W, z0, z0 + D, y, janelas(z0, z0 + D, 1.2, 3.2), 1);
    // divisórias internas
    caixa(-1, y + PD / 2, z0 + 3.2, .12, PD, 6.4, 1);
    caixa(2.5, y + PD / 2, z0 + 6, 7, PD, .12, 1);
    if (andar) { caixa(-3.5, y + PD / 2, z0 + 5.5, 5, PD, .12, 1); caixa(3, y + PD / 2, z0 + 3, .12, PD, 6, 1); }
  }
  // escada (14 degraus)
  for (let k = 0; k < 14; k++) caixa(-.3, k * PD / 14 + .1, z0 + 6.6 + k * .24, 1, .2, .26, 5);
  // ---- térreo: sala, jantar, cozinha
  const fy = .2;
  caixa(-3.5, fy + .01, z0 + 3, 3.4, .02, 2.4, 6);                                     // tapete
  caixa(-3.5, fy + .25, z0 + 1.4, 3, .4, .9, 6); caixa(-3.5, fy + .65, z0 + 1, 3, .5, .2, 6);   // sofá
  caixa(-5, fy + .4, z0 + 1.4, .2, .5, .9, 6); caixa(-2, fy + .4, z0 + 1.4, .2, .5, .9, 6);
  for (let k = 0; k < 3; k++) caixa(-4.5 + k, fy + .55, z0 + 1.15, .7, .35, .15, k === 1 ? 12 : 13);
  caixa(-3.5, fy + .4, z0 + 3, 1.2, .05, .7, 5); for (const [dx, dz] of [[-.55, -.3], [.55, -.3], [-.55, .3], [.55, .3]]) caixa(-3.5 + dx, fy + .2, z0 + 3 + dz, .05, .4, .05, 7);
  caixa(-3.5, fy + .3, z0 + 5.2, 2.2, .5, .45, 5); caixa(-3.5, fy + 1.3, z0 + 5.38, 1.6, .9, .05, 7);   // rack e TV
  caixa(-3.5, fy + .76, z0 + 7.8, 2, .05, 1, 5);                                       // mesa de jantar
  for (const [dx, dz] of [[-.9, -.4], [.9, -.4], [-.9, .4], [.9, .4]]) caixa(-3.5 + dx, fy + .38, z0 + 7.8 + dz, .06, .74, .06, 5);
  for (let k = 0; k < 3; k++) for (const s of [-1, 1]) {                               // 6 cadeiras
    const cx2 = -4.2 + k * .7, cz = z0 + 7.8 + s * .75;
    caixa(cx2, fy + .45, cz, .42, .05, .42, 5); caixa(cx2, fy + .75, cz + s * .19, .42, .55, .04, 5);
    for (const [dx, dz] of [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) caixa(cx2 + dx, fy + .22, cz + dz, .04, .44, .04, 5);
  }
  for (let k = 0; k < 8; k++) {                                                         // cozinha: armários, bancada, aéreos
    caixa(1 + k * .6, fy + .45, z0 + 9.6, .58, .88, .58, 1); caixa(1 + k * .6, fy + .9, z0 + 9.6, .6, .04, .62, 11);
    caixa(1 + k * .6, fy + 1.9, z0 + 9.75, .58, .7, .35, 5); caixa(1 + k * .6 + .2, fy + .7, z0 + 9.3, .1, .03, .02, 7);
  }
  caixa(5.4, fy + .9, z0 + 9.55, .7, 1.8, .7, 11);                                      // geladeira
  caixa(2.5, fy + .45, z0 + 7.8, 2.4, .9, .9, 5); caixa(2.5, fy + .92, z0 + 7.8, 2.5, .05, 1, 11);   // ilha
  for (let k = 0; k < 3; k++) { caixa(1.7 + k * .8, fy + .65, z0 + 7.1, .35, .05, .35, 7); caixa(1.7 + k * .8, fy + .32, z0 + 7.1, .05, .64, .05, 7); }
  caixa(3.6, fy + .2, z0 + 2, .4, .4, .6, 1); caixa(4.6, fy + .45, z0 + .5, .6, .9, .45, 1);   // lavabo
  // ---- andar de cima: 3 quartos e banheiro
  const qy = PD + .2;
  for (const [bx, bz, larg] of [[-3.5, z0 + 2.5, 1.6], [-3.5, z0 + 8, 1.4], [4.5, z0 + 2, 1.2]]) {
    caixa(bx, qy + .2, bz, larg + .1, .3, 2.1, 5); caixa(bx, qy + .45, bz, larg, .22, 2, 1);          // cama
    caixa(bx, qy + .75, bz - 1.02, larg + .1, .9, .08, 5);
    for (const s of [-1, 1]) { caixa(bx + s * larg * .25, qy + .62, bz - .75, larg * .4, .12, .35, 1); caixa(bx + s * (larg / 2 + .35), qy + .25, bz - .8, .45, .5, .4, 5); caixa(bx + s * (larg / 2 + .35), qy + .65, bz - .8, .15, .3, .15, 12); }
    caixa(bx, qy + .48, bz + .4, larg + .05, .04, 1, destaque === 1 ? 13 : destaque);               // manta
    caixa(bx + (bx < 0 ? 1.8 : -1.6), qy + 1.1, bz + .2, .6, 2.2, 1.8, 5);                          // guarda-roupa
    for (let k = 0; k < 3; k++) caixa(bx + (bx < 0 ? 1.49 : -1.29), qy + 1.1, bz - .55 + k * .6, .02, 2.1, .56, 11);
  }
  caixa(1, qy + 1, z0 + 9.75, 2.4, 2, .3, 5);                                           // estante com livros
  for (let p = 0; p < 4; p++) { caixa(1, qy + .1 + p * .5, z0 + 9.75, 2.4, .03, .3, 5); for (let k = 0; k < 16; k++) caixa(-.1 + k * .14 + r() * .02, qy + .28 + p * .5, z0 + 9.75, .1, .3 + r() * .1, .22, [12, 13, 6, 2, 1, 15][(k + p) % 6]); }
  caixa(4.5, qy + .2, z0 + 8, .4, .4, .6, 1); caixa(5.4, qy + .45, z0 + 7, .6, .9, .45, 1); caixa(4.5, qy + 1, z0 + 9.7, 2, 2, .05, 3);   // banheiro
  // ---- telhado de quatro águas (camadas que vão diminuindo)
  const ty = 2 * PD + .2;
  caixa(0, ty, z0 + D / 2, W + .8, .15, D + .8, 11);
  for (let k = 0; k < 12; k++) {
    const lx = W + .8 - k * .9, lz = D + .8 - k * .78, yy = ty + .12 + k * .17;
    caixa(0, yy, z0 + D / 2, lx, .17, lz, 4);
    caixa(0, yy + .09, z0 + D / 2 - lz / 2, lx, .03, .12, 15); caixa(0, yy + .09, z0 + D / 2 + lz / 2, lx, .03, .12, 15);   // fiadas de telha
    caixa(-lx / 2, yy + .09, z0 + D / 2, .12, .03, lz, 15); caixa(lx / 2, yy + .09, z0 + D / 2, .12, .03, lz, 15);
  }
  for (let k = 0; k < 6; k++) caixa(-4 + k * 1.6, ty + .9, z0 + D * .7, 1.2, .05, 1.6, 7);         // placas solares
  caixa(3.5, ty + 1.4, z0 + 3, .7, 2.2, .7, 11);                                                   // chaminé
}

// devolve a vez para a janela sem depender da taxa da tela
const canal = new MessageChannel(); let filaRespirar = [];
canal.port1.onmessage = () => { const f = filaRespirar; filaRespirar = []; f.forEach(r => r()); };
const respirar = () => new Promise(r => { filaRespirar.push(r); canal.port2.postMessage(0); });

export class Navegacao {
  async iniciar(canvas, {largura = 1920, altura = 1080, modelo, camera = 1} = {}) {
    this.escalaCam = camera;                                           // projetos menores ou maiores: a câmera chega mais perto ou se afasta
    if (!navigator.gpu) throw new Error('Este computador não tem WebGPU disponível.');
    this.adaptador = await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
    if (!this.adaptador) throw new Error('Nenhuma placa de vídeo compatível encontrada.');
    const lim = this.adaptador.limits;
    this.modelo = modelo || montarModelo();
    this.dev = await this.adaptador.requestDevice({requiredLimits: {maxStorageBufferBindingSize: Math.min(lim.maxStorageBufferBindingSize, Math.max(this.modelo.dados.byteLength, 134217728)), maxBufferSize: Math.min(lim.maxBufferSize, Math.max(this.modelo.dados.byteLength, 268435456))}});
    this.largura = largura; this.altura = altura;
    const d = this.dev;
    this.formato = navigator.gpu.getPreferredCanvasFormat();
    this.ctx = canvas ? canvas.getContext('webgpu') : null;
    if (this.ctx) this.ctx.configure({device: d, format: this.formato, alphaMode: 'opaque'});
    const TU = GPUTextureUsage;
    this.alvo = d.createTexture({size: [largura, altura], format: 'rgba8unorm', usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING | TU.COPY_SRC});
    this.alvoMS = d.createTexture({size: [largura, altura], sampleCount: 4, format: 'rgba8unorm', usage: TU.RENDER_ATTACHMENT});
    this.prof = d.createTexture({size: [largura, altura], format: 'depth24plus', usage: TU.RENDER_ATTACHMENT});
    this.profMS = d.createTexture({size: [largura, altura], sampleCount: 4, format: 'depth24plus', usage: TU.RENDER_ATTACHMENT});
    this.sombra = d.createTexture({size: [2048, 2048], format: 'depth32float', usage: TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING});
    this.inst = d.createBuffer({size: this.modelo.dados.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    d.queue.writeBuffer(this.inst, 0, this.modelo.dados);
    this.uni = d.createBuffer({size: 256, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const mod = d.createShaderModule({code: SHADER});
    const bgl0 = d.createBindGroupLayout({entries: [
      {binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
      {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'read-only-storage'}}]});
    const bgl1 = d.createBindGroupLayout({entries: [
      {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'depth'}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'comparison'}}]});
    const lay0 = d.createPipelineLayout({bindGroupLayouts: [bgl0]}), lay1 = d.createPipelineLayout({bindGroupLayouts: [bgl0, bgl1]});
    const prof = (fmt, cmp = 'less') => ({format: fmt, depthWriteEnabled: true, depthCompare: cmp});
    const tg = [{format: 'rgba8unorm'}];
    this.pFace = d.createRenderPipeline({layout: lay0, vertex: {module: mod, entryPoint: 'vsFace'}, fragment: {module: mod, entryPoint: 'fsSombreado', targets: tg},
      primitive: {topology: 'triangle-list'}, depthStencil: prof('depth24plus')});
    this.pAresta = d.createRenderPipeline({layout: lay0, vertex: {module: mod, entryPoint: 'vsAresta'}, fragment: {module: mod, entryPoint: 'fsAresta', targets: tg},
      primitive: {topology: 'line-list'}, depthStencil: prof('depth24plus', 'less-equal')});
    this.pSombra = d.createRenderPipeline({layout: lay0, vertex: {module: mod, entryPoint: 'vsSombra'}, primitive: {topology: 'triangle-list'}, depthStencil: prof('depth32float')});
    this.pReal = d.createRenderPipeline({layout: lay1, vertex: {module: mod, entryPoint: 'vsFace'}, fragment: {module: mod, entryPoint: 'fsRealista', targets: tg},
      primitive: {topology: 'triangle-list'}, depthStencil: prof('depth24plus'), multisample: {count: 4}});
    this.bg0 = d.createBindGroup({layout: bgl0, entries: [{binding: 0, resource: {buffer: this.uni}}, {binding: 1, resource: {buffer: this.inst}}]});
    this.bg1 = d.createBindGroup({layout: bgl1, entries: [{binding: 0, resource: this.sombra.createView()},
      {binding: 1, resource: d.createSampler({compare: 'less-equal', magFilter: 'linear', minFilter: 'linear'})}]});
    const mc = d.createShaderModule({code: COPIA});
    this.pCopia = d.createRenderPipeline({layout: 'auto', vertex: {module: mc, entryPoint: 'vs'}, fragment: {module: mc, entryPoint: 'fs', targets: [{format: this.formato}]}});
    this.bgCopia = d.createBindGroup({layout: this.pCopia.getBindGroupLayout(0), entries: [
      {binding: 0, resource: this.alvo.createView()}, {binding: 1, resource: d.createSampler({magFilter: 'linear', minFilter: 'linear'})}]});
    // sol fixo: a sombra cobre o conjunto todo
    this.solDir = [.45, .8, .35];
    const sl = Math.hypot(...this.solDir);
    const so = this.solDir.map(v => v / sl * 600);
    this.luz = mul(orto(-480, 480, -460, 460, 1, 1200), olharPara(so, [0, 0, 0]));
    return this.adaptador.info || {};
  }

  _camera(quadro) {
    // voo suave em volta do condomínio, baixo o bastante para ver dentro das casas pelas janelas
    const k = this.escalaCam || 1;
    const a = quadro / 3000 * Math.PI * 2, R = (95 + 35 * Math.sin(a * 2)) * k;
    const olho = [Math.cos(a) * R * 1.25, (22 + 10 * Math.sin(a * 3)) * Math.max(k, .2), Math.sin(a) * R];
    const b = a + .35, alvo = [Math.cos(b) * R * .55, 2, Math.sin(b) * R * .4];
    const vp = mul(perspectiva(.95, this.largura / this.altura, .5 * Math.min(1, Math.max(k, .2)), 700 * Math.max(1, k)), olharPara(olho, alvo));
    const u = new Float32Array(64);
    u.set(vp, 0); u.set(this.luz, 16); u.set([...olho, 1], 32); u.set([...this.solDir, 0], 36);
    u.set([0, this.estilo === 'arestas' ? .2 : .5, 0, 0], 40);
    this.dev.queue.writeBuffer(this.uni, 0, u);
  }

  _desenhar(quadro, mostrar) {
    this._camera(quadro);
    const enc = this.dev.createCommandEncoder(), n = this.modelo.caixas;
    const fundo = this.estilo === 'arestas' ? [1, 1, 1, 1] : this.estilo === 'sombreado' ? [.86, .88, .9, 1] : [.70, .78, .88, 1];
    if (this.estilo === 'realista') {
      const s = enc.beginRenderPass({colorAttachments: [], depthStencilAttachment: {view: this.sombra.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store'}});
      s.setPipeline(this.pSombra); s.setBindGroup(0, this.bg0); s.draw(36, n); s.end();
      const p = enc.beginRenderPass({colorAttachments: [{view: this.alvoMS.createView(), resolveTarget: this.alvo.createView(), loadOp: 'clear', storeOp: 'discard', clearValue: fundo}],
        depthStencilAttachment: {view: this.profMS.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'discard'}});
      p.setPipeline(this.pReal); p.setBindGroup(0, this.bg0); p.setBindGroup(1, this.bg1); p.draw(36, n); p.end();
    } else {
      const p = enc.beginRenderPass({colorAttachments: [{view: this.alvo.createView(), loadOp: 'clear', storeOp: 'store', clearValue: fundo}],
        depthStencilAttachment: {view: this.prof.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'discard'}});
      p.setBindGroup(0, this.bg0);
      if (this.estilo === 'sombreado') { p.setPipeline(this.pFace); p.draw(36, n); }
      p.setPipeline(this.pAresta); p.draw(24, n); p.end();
    }
    if (mostrar && this.ctx) {
      const c = enc.beginRenderPass({colorAttachments: [{view: this.ctx.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1]}]});
      c.setPipeline(this.pCopia); c.setBindGroup(0, this.bgCopia); c.draw(3); c.end();
    }
    this.dev.queue.submit([enc.finish()]);
  }

  /** Roda um estilo por `segundos`. Retorna {fps, quadros, porSegundo}. */
  async rodar(estilo, segundos, aoAndar, sinal) {
    this.estilo = estilo;
    let quadro = 0, emVoo = [], ultimoMostrar = 0, ultimoAviso = 0, marco = null, qSeg = 0, tSeg = performance.now();
    const porSegundo = [], inicio = performance.now();
    while (true) {
      if (sinal && sinal.aborted) throw new Error('interrompido');
      const t = performance.now();
      if ((t - inicio) / 1000 >= segundos) break;
      if (!marco && t - inicio >= 1500) marco = {q: quadro, t: t - inicio};       // 1,5 s para a placa subir o clock
      const mostrar = t - ultimoMostrar > 33;
      if (mostrar) ultimoMostrar = t;
      this._desenhar(quadro, mostrar);
      emVoo.push(this.dev.queue.onSubmittedWorkDone().then(() => { qSeg++; }));
      quadro++;
      if (emVoo.length >= 6) await emVoo.shift();
      if (mostrar) await respirar();
      if (t - tSeg >= 1000) { porSegundo.push(qSeg * 1000 / (t - tSeg)); qSeg = 0; tSeg = t; }
      if (aoAndar && t - ultimoAviso > 250) { ultimoAviso = t; aoAndar({segundos: (t - inicio) / 1000, fpsAgora: porSegundo.at(-1) || quadro / ((t - inicio) / 1000)}); }
    }
    await Promise.all(emVoo);
    const total = performance.now() - inicio;
    const fps = marco ? (quadro - marco.q) / ((total - marco.t) / 1000) : quadro / (total / 1000);
    return {fps, quadros: quadro, porSegundo};
  }

  /** Copia a imagem atual (para a miniatura do resultado). */
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
