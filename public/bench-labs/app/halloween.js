/* Enfeites do tema Abóbora (Halloween) no Início do Bench Labs.
   Só aparecem com a cor "abobora" e a opção "Mostrar enfeites animados" ligada: o inicio.html põe a classe
   "hw" no <html>. Tudo é desenho leve (SVG) com animação CSS (halloween.css), que para com "reduzir animações".
   O Raio-X, o Painel e os Blocos chamam as funções daqui enquanto desenham; HW.aplicar() põe e tira os
   enfeites de fora dos desenhos (cabeçalho, menu lateral, tela de carregamento, cantos dos cards). */
window.HW = (() => {
  const on = () => document.documentElement.classList.contains('hw');
  const MORCEGO = 'M12 9.2c-.6-1.5-1.9-2.4-3.4-2.5.6.7.8 1.5.6 2.3-1.7-1-4-1.1-6.2-.2 1.6.5 2.7 1.6 3 2.9 1.2-.7 2.8-.6 3.9.3L12 14l2.1-2c1.1-.9 2.7-1 3.9-.3.3-1.3 1.4-2.4 3-2.9-2.2-.9-4.5-.8-6.2.2-.2-.8 0-1.6.6-2.3-1.5.1-2.8 1-3.4 2.5zM11 8.4l.3-1.6.7 1 .7-1 .3 1.6z';
  const FANTASMA = 'M0 -14a9 9 0 0 1 9 9v13l-3-2-3 2-3-2-3 2-3-2-3 2V-5a9 9 0 0 1 9-9z';
  const ROSTO = 'M-11 -15l4-6 3 6zM4 -15l3-6 4 6zM-11 -8c4 5 18 5 22 0l-3.5 1.2-1.8-2.2-2.4 2.6-3-2.6-3 2.6-2.4-2.6-1.8 2.2z';
  const BRILHO = '<defs><radialGradient id="hw-brilho"><stop offset="0" stop-color="#FF7A1A" stop-opacity=".5"></stop><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"></stop></radialGradient></defs>';
  const f1 = n => n.toFixed(1);

  // teia num canto: raios + anéis; "pathLength" faz o traço ser desenhado do começo ao fim (hw-tece)
  function teia(ox, oy, a0, a1, rmax, aneis, cor = 'rgba(251,244,236,.3)') {
    const n = 5, angs = Array.from({length: n}, (_, i) => a0 + (a1 - a0) * i / (n - 1));
    const p = (a, r) => [ox + r * Math.cos(a * Math.PI / 180), oy + r * Math.sin(a * Math.PI / 180)];
    let d = angs.map(a => { const [x, y] = p(a, rmax); return `M${ox} ${oy}L${f1(x)} ${f1(y)}`; }).join('');
    for (const r of aneis) for (let i = 0; i < n - 1; i++) {
      const [x1, y1] = p(angs[i], r), [x2, y2] = p(angs[i + 1], r), [cx, cy] = p((angs[i] + angs[i + 1]) / 2, r * .82);
      d += (i === 0 ? `M${f1(x1)} ${f1(y1)}` : '') + `Q${f1(cx)} ${f1(cy)} ${f1(x2)} ${f1(y2)}`;
    }
    return `<path class="hw-tece" pathLength="1" d="${d}" stroke="${cor}" stroke-width="1" fill="none"></path>`;
  }
  // abóbora de Halloween (base em 0,0; cresce de baixo para cima com hw-brota)
  function abobora(x, y, s, d, rosto = true) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><g class="hw-brota hw-d${d}"><ellipse cx="0" cy="-13" rx="30" ry="22" fill="url(#hw-brilho)"></ellipse>
      <path d="M-1 -27c0-4 1.5-7 4.5-8.5l2 1.6c-2.2 1.3-2.9 3.5-2.8 6.9z" fill="#6B8E3A"></path><ellipse cx="0" cy="-13" rx="20" ry="14" fill="#FF7A1A"></ellipse>
      <path d="M0 -26.5c-5 3.5-5 23.5 0 27M0 -26.5c5 3.5 5 23.5 0 27M-12 -24c-6 6-6 16 0 22M12 -24c6 6 6 16 0 22" stroke="#C4520A" stroke-width="1.3" fill="none"></path>
      ${rosto ? `<path class="hw-vela" d="${ROSTO}" fill="#FFD166"></path>` : ''}</g></g>`;
  }
  // abóbora pequena (ícone 40×40), usada no cabeçalho, no modo de energia e nas barras
  const aboboraIcone = (w, extra = '') => `<svg class="hw-x" aria-hidden="true" width="${w}" height="${w}" viewBox="0 0 40 40" ${extra}><path d="M19 9c0-3 1-5 3-6l1.5 1.2C22 5.5 21.5 7 21.6 9.2z" fill="#6B8E3A"></path><ellipse cx="20" cy="23" rx="16" ry="13" fill="#FF7A1A"></ellipse><path d="M20 10.5c-4 3-4 22 0 25.5M20 10.5c4 3 4 22 0 25.5M10 13c-5 5-5 15 0 20M30 13c5 5 5 15 0 20" stroke="#C4520A" stroke-width="1.2" fill="none"></path><path class="hw-vela" d="M11 20l4-5 3 5z M22 20l3-5 4 5z M11 26c3 4 15 4 18 0l-3 1-1.5-2-2 2.3-2.5-2.3-2.5 2.3-2-2.3-1.5 2z" fill="#FFD166"></path></svg>`;
  const fantasma = (x, y, cls, olho = '#17100B') => `<g transform="translate(${x} ${y})"><g class="${cls}"><path d="${FANTASMA}" fill="#FBF4EC" opacity=".88"></path>
    <ellipse cx="-3" cy="-6" rx="1.4" ry="2" fill="${olho}"></ellipse><ellipse cx="3" cy="-6" rx="1.4" ry="2" fill="${olho}"></ellipse><ellipse cx="0" cy="-0.5" rx="1.6" ry="2.2" fill="${olho}"></ellipse></g></g>`;
  const VAMPIRO = `<path d="M-36 0L-31 -34L-15 -21V0zM36 0L31 -34L15 -21V0z" fill="#9E0F1C"></path><path d="M-16 0L-12 -10H12L16 0z" fill="#120A10"></path><path d="M-5 -10L0 0L5 -10z" fill="#E9E1EE"></path>
    <ellipse cx="0" cy="-31" rx="17" ry="21" fill="#E9E1EE"></ellipse><path d="M-18 -33C-19 -55 19 -55 18 -33L12 -41L0 -33L-12 -41z" fill="#120A10"></path>
    <path d="M-11 -37l7 2M11 -37l-7 2" stroke="#120A10" stroke-width="1.6" stroke-linecap="round"></path>
    <g class="hw-pisca"><circle cx="-6.5" cy="-30" r="2.6" fill="#D61F33"></circle><circle cx="6.5" cy="-30" r="2.6" fill="#D61F33"></circle></g>
    <path d="M-6 -17Q0 -14 6 -17" stroke="#3A0A10" stroke-width="1.4" fill="none" stroke-linecap="round"></path><path d="M-4.2 -16.4L-3 -12L-1.8 -15.9zM1.8 -15.9L3 -12L4.2 -16.4z" fill="#FFFFFF"></path>`;
  // aranha descendo por um fio de (x, y0) até y1 e balançando
  function aranha(x, y0, y1) {
    const L = y1 - y0;
    return `<line class="hw-fio" x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="rgba(251,244,236,.45)" stroke-width="1" style="transform-origin:${x}px ${y0}px;--k:${f1((L + 10) / L * 1000) / 1000}"></line>
      <g class="hw-desce"><g transform="translate(${x} ${y1 + 10})"><path d="M-5 -2l-8-5-3-6M-5 1l-10-1-4 3M-5 4l-8 5-2 6M5 -2l8-5 3-6M5 1l10-1 4 3M5 4l8 5 2 6" stroke="#E8D9C6" stroke-width="1.4" stroke-linecap="round" fill="none"></path>
      <ellipse cx="0" cy="2" rx="6" ry="7.5" fill="#E8D9C6"></ellipse><ellipse cx="0" cy="-6.5" rx="4" ry="3.5" fill="#E8D9C6"></ellipse><circle cx="-1.6" cy="-7" r="1" fill="#D61F33"></circle><circle cx="1.6" cy="-7" r="1" fill="#D61F33"></circle></g></g>`;
  }
  const olhos = (x, y) => `<g transform="translate(${x} ${y})"><ellipse rx="16" ry="8" fill="url(#hw-brilho)" opacity=".6"></ellipse><g class="hw-pisca"><ellipse cx="-5" rx="3" ry="2.2" fill="#FFB627"></ellipse><ellipse cx="5" rx="3" ry="2.2" fill="#FFB627"></ellipse></g></g>`;
  const morcegoVoando = (x, y, i) => `<g transform="translate(${x - 17} ${y - 17})"><g class="hw-voa${i}"><g class="hw-bate"><path transform="scale(1.4)" d="${MORCEGO}" fill="#2B1F16" stroke="#7A6656" stroke-width=".5"></path></g></g></g>`;
  const morcegoPendurado = (x, y, i) => `<g transform="translate(${x} ${y})"><g class="hw-pendula${i}"><path d="M-2 0v5M2 0v5" stroke="#7A6656" stroke-width="1.2" stroke-linecap="round"></path>
    <path d="M0 4c-7 0-9 8-8 14 1 6 5 10 8 12 3-2 7-6 8-12 1-6-1-14-8-14z" fill="#2B1F16" stroke="#7A6656" stroke-width=".6"></path><path d="M-3.5 28l-1.5 4.5 3.2-2zM3.5 28l1.5 4.5-3.2-2z" fill="#2B1F16"></path>
    <g class="hw-pisca"><circle cx="-2.4" cy="23.5" r="1.2" fill="#FFB627"></circle><circle cx="2.4" cy="23.5" r="1.2" fill="#FFB627"></circle></g></g></g>`;
  const morcegoSvg = (w, cor = '#3A2A1E', borda = '#7A6656') => `<svg aria-hidden="true" width="${w}" height="${w}" viewBox="0 0 24 24"><g class="hw-bate"><path d="${MORCEGO}" fill="${cor}" stroke="${borda}" stroke-width=".45"></path></g></svg>`;

  // miolo das ventoinhas (Raio-X) e dos mostradores (Painel): abóbora iluminada; gira junto com a ventoinha
  function hub(cx, cy, s = 1) {
    return `<g transform="translate(${cx} ${cy}) scale(${s})"><rect x="-1.5" y="-20" width="3" height="5" rx="1" fill="#6B8E3A"></rect><circle r="16" fill="#FF7A1A" stroke="#C4520A" stroke-width="1.5"></circle>
      <path class="hw-vela" d="M-9 -1L-6 -7L-3 -1ZM3 -1L6 -7L9 -1ZM-8 3Q0 11 8 3L5 5L3 3L1 5.5L-1 3L-3 5.5L-5 3Z" fill="#FFD166"></path></g>`;
  }

  // ---------------------------------------------------------------- Raio-X (viewBox 0 0 1000 600)
  // modelos 1 a 3: notebook; 4 e 5: gabinete de PC de mesa (morcegos saem pelas grades de cima, teia no canto da tampa da fonte)
  function raiox(m) {
    const pc = m >= 4;
    const ventos = pc ? [360, 450, 550, 640] : m === 1 ? [585, 620, 655, 690] : [300, 430, 570, 700], yv = pc ? 40 : m === 1 ? 62 : 52;
    const [ax, ay, fio] = pc ? [596, 52, 22] : m === 1 ? [450, 67, 62] : m === 3 ? [404, 88, 62] : [500, 88, 62];
    const canto = pc ? [696, 556, 180, 270] : m === 1 ? [239, 511, -90, 0] : [228, 514, -90, 0];
    let s = BRILHO + teia(0, 0, 0, 90, 80, [20, 40, 60, 78]) + teia(1000, 0, 90, 180, 80, [20, 40, 60, 78]) + teia(canto[0], canto[1], canto[2], canto[3], 58, [16, 32, 48]);
    s += ventos.map((x, i) => morcegoVoando(x, yv, i + 1)).join('');
    s += aranha(ax, ay, ay + fio);
    s += pc ? fantasma(575, 300, 'hw-sobe1') + fantasma(560, 505, 'hw-sobe2') : fantasma(450, 232, 'hw-sobe1') + fantasma(572, 234, 'hw-sobe2');
    s += abobora(78, 598, 1.25, 1) + abobora(132, 598, .8, 2) + abobora(916, 598, 1.25, 3) + abobora(862, 598, .75, 4) + abobora(pc ? 500 : 612, 598, .7, 5);
    s += `<g transform="translate(800 600)"><g class="hw-espia">${VAMPIRO}</g></g>`;
    s += olhos(70, pc ? 390 : 292) + olhos(930, 440) + olhos(745, 470);
    return `<g class="hw-x" aria-hidden="true">${s}</g>`;
  }

  // ---------------------------------------------------------------- Painel (viewBox passa a 0 -56 640 400)
  const painelAtras = () => `<g class="hw-x" aria-hidden="true">${BRILHO}${teia(0, -56, 0, 90, 118, [28, 56, 84, 114])}${teia(640, -56, 90, 180, 118, [28, 56, 84, 114])}
    <g transform="translate(320 34)"><g class="hw-espia">${VAMPIRO}</g></g></g>`;
  const painelFrente = () => `<g class="hw-x" aria-hidden="true">${morcegoPendurado(215, 11, 1)}${morcegoPendurado(428, 11, 2)}
    ${fantasma(150, 140, 'hw-sobe1')}${fantasma(490, 140, 'hw-sobe2')}${aranha(560, -56, 12)}
    ${abobora(44, 340, 1.1, 1)}${abobora(92, 340, .62, 2, false)}${abobora(596, 340, 1.1, 3)}${abobora(548, 340, .62, 4, false)}</g>`;
  // enfeite na ponta das barras do Painel (memória, armazenamento, bateria)
  function cavaleiro(id) {
    const g = id === 'p-ram' ? `<svg width="18" height="22" viewBox="-10 -15 20 24"><g class="hw-flutua"><path d="${FANTASMA}" fill="#FBF4EC"></path><ellipse cx="-3" cy="-6" rx="1.4" ry="2" fill="#17100B"></ellipse><ellipse cx="3" cy="-6" rx="1.4" ry="2" fill="#17100B"></ellipse></g></svg>`
      : id === 'p-ssd' ? morcegoSvg(26, '#2B1F16', '#A68F7A')
      : aboboraIcone(22).replace('class="hw-x" ', '');
    return `<span class="hw-cav hw-x" id="${id}-hw" aria-hidden="true">${g}</span>`;
  }

  // ---------------------------------------------------------------- Blocos
  function bento(palco) {
    const bloco = id => { const v = document.getElementById(id); return v && v.closest('.t-bloco'); };
    const cons = bloco('b-cons-v'), modo = bloco('b-modo-v');
    if (cons) cons.insertAdjacentHTML('beforeend', `<svg class="hw-x hw-fant-bloco" aria-hidden="true" width="30" height="34" viewBox="-12 -16 24 28"><g class="hw-sobe1"><path d="${FANTASMA}" fill="#FBF4EC" opacity=".88"></path><ellipse cx="-3" cy="-6" rx="1.4" ry="2" fill="#17100B"></ellipse><ellipse cx="3" cy="-6" rx="1.4" ry="2" fill="#17100B"></ellipse><ellipse cx="0" cy="-0.5" rx="1.6" ry="2.2" fill="#17100B"></ellipse></g></svg>`);
    if (modo) modo.insertAdjacentHTML('beforeend', `<svg class="hw-x hw-ab-bloco" aria-hidden="true" width="44" height="40" viewBox="-24 -36 48 40">${BRILHO}${abobora(0, 0, 1, 7).replace('translate(0 0) scale(1)', '')}</svg>`);
    const tam = [[52, 1], [32, 2, 0], [40, 3], [36, 4, 0], [56, 5], [30, 6, 0]];
    const ab = ([w, d, rosto]) => `<svg width="${w}" height="${Math.round(w * .88)}" viewBox="-24 -36 48 40">${abobora(0, 0, 1, d, rosto !== 0)}</svg>`;
    palco.insertAdjacentHTML('beforeend', `<div class="hw-x hw-chao" aria-hidden="true"><svg width="0" height="0" style="position:absolute">${BRILHO}</svg><div>${tam.slice(0, 3).map(ab).join('')}</div><div>${tam.slice(3).map(ab).join('')}</div></div>`);
  }

  // ---------------------------------------------------------------- fora dos desenhos
  function limpar() { document.querySelectorAll('.hw-x').forEach(e => e.remove()); document.querySelectorAll('.hw-card').forEach(e => e.classList.remove('hw-card')); document.querySelectorAll('.hw-laudo').forEach(e => e.classList.remove('hw-laudo')); }
  function aplicar(tema) {
    // os enfeites dentro dos desenhos (Raio-X, Painel, Blocos) são refeitos a cada desenho; aqui ficam os de fora
    ['.hw-ceu', '.hw-ab-testar', '.hw-vivo', '.hw-olhos-rail', '.hw-roda', '.hw-canto', '.hw-vamp-laudo'].forEach(s => document.querySelectorAll(s).forEach(e => e.remove()));
    document.querySelectorAll('.hw-card').forEach(e => e.classList.remove('hw-card'));
    document.querySelectorAll('.hw-laudo').forEach(e => e.classList.remove('hw-laudo'));
    if (!on()) return;
    const pag = document.querySelector('#v-inicio main.pag');
    if (pag) pag.insertAdjacentHTML('afterbegin', `<div class="hw-x hw-ceu" aria-hidden="true"><span class="hw-cruza">${morcegoSvg(40)}</span><span class="hw-cruza2">${morcegoSvg(40)}</span></div>`);
    const testar = document.getElementById('b-testar');
    if (testar) testar.insertAdjacentHTML('beforebegin', aboboraIcone(54, 'style="align-self:flex-end;flex:none"').replace('class="hw-x"', 'class="hw-x hw-ab-testar"'));
    const ponto = document.querySelector('#v-inicio header .rotulo > span.pulsa');
    if (ponto) ponto.insertAdjacentHTML('afterend', `<svg class="hw-x hw-vivo" aria-hidden="true" width="13" height="13" viewBox="0 0 40 40"><path d="M19 9c0-3 1-5 3-6l1.5 1.2C22 5.5 21.5 7 21.6 9.2z" fill="#6B8E3A"></path><ellipse cx="20" cy="23" rx="16" ry="13" fill="#FF7A1A"></ellipse></svg>`);
    const cores = document.getElementById('b-cores');
    if (cores) cores.insertAdjacentHTML('beforebegin', `<svg class="hw-x hw-olhos-rail" aria-hidden="true" width="40" height="20" viewBox="0 0 40 20"><ellipse cx="20" cy="10" rx="18" ry="9" fill="#FF7A1A" opacity=".12"></ellipse><g class="hw-pisca"><ellipse cx="14" cy="10" rx="3.2" ry="2.3" fill="#FFB627"></ellipse><ellipse cx="26" cy="10" rx="3.2" ry="2.3" fill="#FFB627"></ellipse></g></svg>`);
    const troca = document.querySelector('#trocando > div');
    if (troca) troca.insertAdjacentHTML('afterbegin', `<div class="hw-x hw-roda" aria-hidden="true"><div class="hw-anel"></div><span class="hw-orbita">${morcegoSvg(30, '#4F3A29', '#DCC9B6')}</span><span class="hw-orbita2">${morcegoSvg(22, '#4F3A29', '#DCC9B6')}</span>${aboboraIcone(64, 'style="position:relative"').replace('class="hw-x"', 'class="hw-pula"')}</div>`);
    if (tema === 'bento') {
      const card = document.getElementById('card-sens');
      if (card) {
        card.classList.add('hw-card');
        card.insertAdjacentHTML('afterbegin', `<div class="hw-x hw-canto" aria-hidden="true"><svg width="170" height="170" viewBox="0 0 140 140">${teia(140, 0, 180, 90, 135, [28, 56, 86, 122], 'rgba(251,244,236,.28)')}</svg>
          <svg class="hw-aranha-card" width="30" height="120" viewBox="0 0 30 120">${aranha(15, 0, 70)}</svg></div>`);
      }
      const grade = document.getElementById('laudo'), sec = grade && grade.parentElement;
      if (sec) {
        sec.classList.add('hw-laudo');
        sec.insertAdjacentHTML('afterbegin', `<svg class="hw-x hw-vamp-laudo" aria-hidden="true" width="80" height="64" viewBox="-40 -60 80 64"><g class="hw-espia">${VAMPIRO}</g></svg>`);
      }
    }
  }
  return {on, hub, raiox, painelAtras, painelFrente, cavaleiro, aboboraIcone, bento, aplicar, limpar};
})();
