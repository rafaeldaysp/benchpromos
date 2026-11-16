/* The website previews the UI; native benchmarks must never run here. */
(function () {
  'use strict';
  // Escape must cross the iframe boundary to close the website's dialog.
  function forwardEscape() {
    if (window.parent !== window) window.parent.postMessage({ type: 'bench-demo:escape' }, location.origin);
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') forwardEscape();
  });
  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || !event.data || event.data.type !== 'bench-demo:escape') return;
    var child = Array.from(document.querySelectorAll('iframe')).some(function (frame) { return frame.contentWindow === event.source; });
    if (child) forwardEscape();
  });
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('button');
    if (!button) return;
    var isBattery = location.pathname.endsWith('/app/index.html');
    var blocked = ['b-rodar', 'b-rodar-p', 'b-denovo', 'b-verificar', 'b-continuar', 'b-t3-iniciar', 'b-t3-rodar', 'b-grav', 'b-gravar', 'b-restaurar', 'b-cb-localizar', 'b-salvar', 'f-salvar'];
    if (!blocked.includes(button.id) && !(isBattery && /iniciar|executar|gravar|sincronizar|localizar|restaurar|referência/i.test(button.textContent))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var notice = document.getElementById('site-demo-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'site-demo-notice';
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99999;max-width:85%;padding:14px 20px;border-radius:12px;background:#2a1f38;color:#f5f2f9;border:1px solid #ffe500;font:600 14px/1.5 system-ui;text-align:center';
      document.body.appendChild(notice);
    }
    notice.textContent = 'Demonstração com dados fictícios. Baixe o Bench Labs para testar o seu notebook.';
    notice.hidden = false;
    clearTimeout(notice.hideTimer);
    notice.hideTimer = setTimeout(function () { notice.hidden = true; }, 4500);
  }, true);
  var style = document.createElement('style');
  style.textContent = '@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}';
  document.head.appendChild(style);
})();
