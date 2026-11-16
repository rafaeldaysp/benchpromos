/* Website adapter. Original app screens remain in their own document. */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var demo = window.BENCH_DEMO;
  if (!demo) return;
  var api = demo.api;
  var config = {
    ciclo: { minutos: { navegador: 4, word: 2, excel: 2, video: 2 } },
    brilho_percent: 50, volume_percent: 25, modo_energia: 'equilibrado',
    teste_personalizado_min: 60, bateria_minima_para_iniciar: 95,
    cinebench: { duracao_minima_s: 600, bateria_minima: 40 },
    atividades: { navegador: true, word: true, excel: true, video: true },
    parar_em_percent: 0, semente: 42, videos_fixos: []
  };
  var ok = function (value) { return Promise.resolve(value); };
  // The supplied demo has no bat_* responses. Only UI configuration is simulated.
  Object.assign(api, {
    bat_inicio: function () { return ok({ config: config, versao: '2.20.43', sugestao_nome: demo.NOTEBOOK.notebook, historico: [], rodando: false }); },
    bat_bateria: function () { return ok({ pct: 100, carregador: true }); },
    bat_salvar_config: function (changes) { Object.assign(config, changes); return ok(config); },
    bat_historico: function () { return ok([]); },
    bat_nuvem_status: function () { return ok({ ativo: false }); },
    bat_conteudo_resumo: function () { return ok({ pacote: { existe: false }, gravacao: { fase: 'parado' } }); }
  });
  var openVideo = api.rx_abrir_video;
  api.rx_abrir_video = function () {
    return openVideo().then(function (result) {
      var refresh = document.getElementById('f-reler');
      if (refresh) refresh.click();
      return result;
    });
  };
  document.documentElement.dataset.bloco = params.get('bloco') || '';
  var style = document.createElement('style');
  style.textContent = [
    'html[data-bloco=sensores] #v-inicio main.pag>header,html[data-bloco=sensores] #v-inicio .lado{display:none!important}',
    'html[data-bloco=sensores] main.pag{padding:20px}',
    'html[data-bloco=sensores] #sel-tema{display:none}',
    'html[data-bloco=laudo] #v-inicio main.pag>header,html[data-bloco=laudo] #card-sens,html[data-bloco=laudo] .antes{display:none!important}',
    'html[data-bloco=laudo] main.pag{padding:24px}',
    'html[data-bloco=tela] #v-ficha main.pag>header,html[data-bloco=tela] #v-ficha main.pag>div:last-child{display:none!important}',
    'html[data-bloco=tela] #f-grade>.fsec:not(:has(.cores-tela)){display:none}',
    'html[data-bloco=tela] #f-grade{display:block}',
    'html[data-bloco=tela] main.pag{padding:16px}',
    '@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}'
  ].join('\n');
  document.head.appendChild(style);
})();
