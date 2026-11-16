/* Ponte entre as páginas e a API única do Bench Labs.
 * A janela tem uma API só (bat_*, marks_*, rx_*, app_*). Cada página inclui este arquivo com o seu prefixo:
 *   <script src="ponte.js" data-prefixo="bat_"></script>
 * e usa BENCH_API() no lugar de window.pywebview.api. Funciona na janela principal, dentro dos iframes
 * (a API vem da janela de cima) e na janela mini. */
(function () {
  const script = document.currentScript;
  const pre = (script && script.dataset.prefixo) || '';
  const fonte = () => {
    try { if (window.parent !== window && window.parent.pywebview && window.parent.pywebview.api) return window.parent.pywebview; } catch (e) { /* outra origem */ }
    return window.pywebview;
  };
  window.BENCH_API = () => new Proxy({}, {
    get: (_, k) => {
      if (typeof k !== 'string' || k === 'then') return undefined;
      return (...a) => {
        const pv = fonte();
        const f = pv && pv.api && pv.api[pre + k];
        if (!f) return Promise.reject(new Error('Função indisponível: ' + pre + k));
        return f(...a);
      };
    },
  });
  window.BENCH_PRONTO = () => { const pv = fonte(); return !!(pv && pv.api && Object.keys(pv.api).some(k => k.startsWith(pre))); };
  // cores: a janela principal (inicio.html) guarda a escolha em <html data-cor>; as páginas de dentro copiam.
  // A janela mini (sem página de cima) pergunta ao app de tempos em tempos.
  const aplicarCor = c => { if (c && document.documentElement.dataset.cor !== c) document.documentElement.dataset.cor = c; if (!c) delete document.documentElement.dataset.cor; };
  try {
    if (window.parent !== window && window.parent.document) {
      const raiz = window.parent.document.documentElement;
      aplicarCor(raiz.dataset.cor);
      new MutationObserver(() => aplicarCor(raiz.dataset.cor)).observe(raiz, {attributes: true, attributeFilter: ['data-cor']});
    } else if (!document.getElementById('v-inicio')) {
      const perguntar = () => { const pv = window.pywebview; if (pv && pv.api && pv.api.rx_cor) pv.api.rx_cor().then(aplicarCor).catch(() => {}); };
      setTimeout(perguntar, 300); setInterval(perguntar, 4000);
    }
  } catch (e) { /* outra origem */ }
  window.BENCH_ESPERAR = fn => {
    if (window.BENCH_PRONTO()) { fn(); return; }
    const t = setInterval(() => { if (window.BENCH_PRONTO()) { clearInterval(t); fn(); } }, 60);
  };
})();
