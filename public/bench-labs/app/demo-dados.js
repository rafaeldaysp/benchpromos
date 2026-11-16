/* Bench Labs: demonstração no navegador.
 * As telas desta pasta são as do aplicativo de verdade. No aplicativo, os dados vêm do Windows
 * (window.pywebview.api); aqui este arquivo responde no lugar, com um notebook de exemplo.
 * Para trocar o notebook de exemplo, edite NOTEBOOK e FICHA abaixo. Nada é enviado para a internet. */
(function () {
  'use strict';
  var prm = new URLSearchParams(location.search);
  var ABA = prm.get('aba') || 'inicio';                 // inicio | ficha | testes | monitor | preparo
  var agora = function () { return new Date().toISOString().slice(0, 19); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var ok = function (v) { return Promise.resolve(v); };

  /* ---------------- notebook de exemplo ---------------- */
  var NOTEBOOK = {
    notebook: 'Lenovo Legion 5i 16',
    cpu: { nome: 'Intel Core i7-14650HX', nucleos: 16, threads: 24 },
    gpu: { nome: 'NVIDIA GeForce RTX 4060 Laptop GPU', vram: 8, driver: '566.14', tgp: 140, nvidia: true },
    ram: { gb: 16, tipo: 'DDR5', mhz: 5600, canais: { modo: 'dual', texto: 'Dual channel' } },
    ssd: { gb: 1000, nome: 'SSD NVMe' },
    modelo_sugerido: 2, desktop: false, lido_em: agora()
  };
  var FICHA = {
    gerada_em: agora(), versao_ficha: 17, fabricante: 'Lenovo', modelo: 'Legion 5i 16', nome_comercial: 'Lenovo Legion 5i 16',
    processador: { nome: 'Intel Core i7-14650HX', nucleos: 16, threads: 24, cache: { l1: '1,4 MB', l2: '24 MB', l3: '30 MB' } },
    placas_video: [{ nome: 'NVIDIA GeForce RTX 4060 Laptop GPU', dedicada: true, vram_gb: 8 }, { nome: 'Intel UHD Graphics', dedicada: false }],
    gpu_nvidia: { driver: '566.14', tgp: 140 },
    memoria: { total_gb: 16, tipo: 'DDR5', mts: 5600, modulos: 2, detalhe: ['8 GB SK Hynix', '8 GB SK Hynix'], canais: 'dual-channel', slots: 2, slots_livres: 0, soldada: false },
    armazenamento: [{ nome: 'SK Hynix HFS001TEJ9X115N', interface: 'NVMe', anunciado: '1 TB' }],
    volumes: [{ letra: 'C:', nome: 'Windows-SSD', total_gb: 952, livre_gb: 612 }],
    armazenamento_livre_gb: 612, armazenamento_total_gb: 952,
    tela: { fabricante: 'BOE', modelo: 'NE160QDM-NYC', codigo: 'BOE0B38', polegadas: 16, largura_px: 2560, altura_px: 1600, hz: 165, hz_max: 165, tipo: 'IPS', brilho_max: 500,
      cores: { classe: '100% sRGB', generico: false,
        primarias: { r: [0.652, 0.335], g: [0.303, 0.622], b: [0.150, 0.055], w: [0.3127, 0.329] },
        cobertura: { srgb: { xy: 99.6 }, p3: { xy: 77.8 }, adobe: { xy: 74.9 }, area_srgb: 104 } } },
    bateria: { existe: true, wh: 80, wh_atual: 77.6, saude_pct: 97, ciclos: 41, fabricante: 'SMP' },
    conectividade: { wifi: 'Intel Wi-Fi 6E AX211', wifi_padrao: 'Wi-Fi 6E', bluetooth: true, bluetooth_versao: '5.3', ethernet: true, ethernet_nome: 'Realtek Gaming 2.5GbE',
      thunderbolt: false, usb4: false, hdmi: true, cartao: [1],
      usb_portas: { a3: 3, a2: 0, c: 2, c3: 2, internas: 3, a2_incertas: 0, duvidoso: false, portas: [] } },
    biometria: { rosto: false, digital: false }, camera: { tem: true, ir: false },
    windows: 'Windows 11 Home 24H2', bios: 'N0CN29WW', modo_windows: 'Equilibrado'
  };
  var MONITORES = [{ nome: 'LG ULTRAGEAR', ano: 2023, porta: 'HDMI', indireta: false, duplicada: false, largura: 2560, altura: 1440, hz: 60, hz_max: 165,
    res_max: [2560, 1440], principal: false, placa: 'NVIDIA GeForce RTX 4060 Laptop GPU', dedicada: true, hdr_aceita: true, hdr_ligado: false,
    bits: 8, bits_max: 10, polegadas: 27, nativa: [2560, 1440] }];
  var LAUDO = { itens: [
    { id: 'bateria', nome: 'Bateria', nivel: 'ok', status: 'Normal', detalhe: 'saúde 97% · 77,6 de 80 Wh · 41 ciclos' },
    { id: 'disco', nome: 'Armazenamento', nivel: 'ok', status: 'Normal', detalhe: '612 GB livres de 952 GB' },
    { id: 'refri', nome: 'Refrigeração', nivel: 'ok', status: 'Normal', detalhe: 'atingiu 91 °C no Stress total de 12/11' },
    { id: 'driver', nome: 'Driver de vídeo', nivel: 'ok', status: '566.14', detalhe: 'RTX 4060 Laptop GPU' },
    { id: 'memoria', nome: 'Memória', nivel: 'ok', status: 'Normal', detalhe: '16 GB · dual-channel' }] };

  /* ---------------- sensores ao vivo (simulados) ---------------- */
  var s = { cpu_uso: 9, cpu_temp: 51, cpu_watts: 14, gpu_uso: 4, gpu_temp: 44, gpu_watts: 9, t: 0 };
  var serieC = [], serieG = [];
  function sensores() {
    s.t++;
    var pico = (s.t % 34) > 24;                          // de tempos em tempos o notebook "trabalha"
    var alvo = pico ? { cu: 62, ct: 82, cw: 78, gu: 71, gt: 71, gw: 96 } : { cu: 9, ct: 51, cw: 14, gu: 4, gt: 44, gw: 9 };
    s.cpu_uso += (alvo.cu - s.cpu_uso) * .3 + rnd(-3, 3); s.cpu_temp += (alvo.ct - s.cpu_temp) * .22 + rnd(-.8, .8);
    s.cpu_watts += (alvo.cw - s.cpu_watts) * .3 + rnd(-1.5, 1.5); s.gpu_uso += (alvo.gu - s.gpu_uso) * .3 + rnd(-2, 2);
    s.gpu_temp += (alvo.gt - s.gpu_temp) * .2 + rnd(-.6, .6); s.gpu_watts += (alvo.gw - s.gpu_watts) * .3 + rnd(-1.5, 1.5);
    var lim = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    s.cpu_uso = lim(s.cpu_uso, 1, 100); s.gpu_uso = lim(s.gpu_uso, 0, 100); s.cpu_watts = lim(s.cpu_watts, 6, 160); s.gpu_watts = lim(s.gpu_watts, 4, 140);
    serieC.push(Math.round(s.cpu_temp)); serieG.push(Math.round(s.gpu_temp));
    if (serieC.length > 60) { serieC.shift(); serieG.shift(); }
    return { cpu_mhz: Math.round(pico ? 4700 + rnd(-200, 200) : 2100 + rnd(-300, 300)), cpu_uso: Math.round(s.cpu_uso), cpu_temp: Math.round(s.cpu_temp),
      cpu_watts: Math.round(s.cpu_watts), gpu_temp: Math.round(s.gpu_temp), gpu_watts: Math.round(s.gpu_watts), gpu_uso: Math.round(s.gpu_uso),
      gpu_vram: pico ? 5.9 : 1.2, gpu_vram_total: 8, serie_cpu: serieC.slice(), serie_cpu_tipo: 'temp', serie_gpu: serieG.slice(),
      ram_usada: +(pico ? 11.4 + rnd(-.2, .2) : 7.2 + rnd(-.1, .1)).toFixed(1), ram_total: 15.7, ram_instalada: 16,
      bateria: { pct: 100, tomada: true }, disco_livre: 612, disco_total: 952, modo_windows: 'Equilibrado',
      modo_marca: 'Equilibrado', modo_marca_de: 'Lenovo', hwinfo: true, fonte_cpu: 'demo', monitor_sensores: true };
  }
  for (var i = 0; i < 40; i++) sensores();

  /* ---------------- respostas da API ---------------- */
  var pref = { tema: prm.get('tema') || 'raiox', cor: prm.get('cor') || null, modelo: null };
  var monitorLigado = prm.get('monitor') !== '0';
  var api = {
    rx_versao: function () { return ok('2.20.43'); },
    rx_inicio: function () { return ok({ modo: ABA === 'testes' ? 'gpu' : 'normal', aba: ABA, basico: NOTEBOOK, modelo: pref.modelo, tema: pref.tema, cor: pref.cor, enfeites: false, ficha: FICHA, pc: { desktop: false } }); },
    rx_inicio_completo: function () { return ok(NOTEBOOK); },
    rx_agora: function () { return ok(sensores()); },
    rx_pausar: function () { return ok(true); },
    rx_ficha: function () { return ok({ fase: 'pronta', erro: '', ficha: FICHA, linhas: [], texto: FICHA.nome_comercial + ' · ficha técnica\nProcessador: ' + FICHA.processador.nome + '\nPlaca de vídeo: ' + FICHA.placas_video[0].nome + '\nMemória: 16 GB DDR5-5600\nArmazenamento: SSD NVMe 1 TB\nTela: 16" IPS 2560x1600 165 Hz' }); },
    rx_laudo: function () { return ok(LAUDO); },
    rx_antes: function () { return ok({ tomada: true, bateria: 100, modo: 'Equilibrado', hwinfo: true }); },
    rx_monitores: function () { return ok({ monitores: monitorLigado ? MONITORES : [] }); },
    rx_abrir_video: function () { MONITORES[0].hz = 165; return ok({ ok: true }); },      // na demonstração, "corrige" a taxa
    rx_salvar_cor: function (c) { pref.cor = c; return ok(true); },
    rx_salvar_tema: function (t) { pref.tema = t; return ok(true); },
    rx_salvar_modelo: function (n) { pref.modelo = n; return ok(true); },
    rx_salvar_enfeites: function () { return ok(true); },
    rx_salvar_pagina: function () { return ok({ ok: false }); },
    rx_cor: function () { return ok(pref.cor); },
    app_verificar_atualizacao: function () { return ok({ tem: false, atual: '2.20.43' }); },
    app_status_atualizacao: function () { return ok({ fase: 'parado' }); },
    app_instalar_atualizacao: function () { return ok({ ok: false }); },
    // no aplicativo, Testes abre em outro modo (placa de vídeo dedicada) e a janela recarrega; aqui a página recarrega na aba pedida
    app_trocar_modo: function (modo, aba) { prm.set('aba', aba); location.search = prm.toString(); return ok({ ok: true }); }
  };
  /* ---------------- aba Atualizações (prep_) ---------------- */
  var hoje = new Date(), dia = function (d) { var x = new Date(hoje - d * 864e5); return x.toISOString().slice(0, 10); };
  var WU_ITENS = [
    { id: 'kb1', titulo: 'Atualização cumulativa para o Windows 11, versão 25H2 (KB5068861)', mb: 412, tipo: 'windows' },
    { id: 'kb2', titulo: 'Intel - Net - 23.110.0.5 (driver de Wi-Fi)', mb: 38, tipo: 'driver' },
    { id: 'fw1', titulo: 'Lenovo - Firmware - 1.0.0.31 (BIOS)', mb: 22, tipo: 'firmware' }];
  var wu = { busca: { fase: 'parado', itens: [], erro: '' }, instalacao: {}, reinicio: false };
  var progLista = { fase: 'parado' }, progAtu = null;
  var PROGRAMAS = [
    { id: 'Google.Chrome', nome: 'Google Chrome', versao: '141.0.7390.108', nova: '142.0.7444.60', pode: true },
    { id: 'Valve.Steam', nome: 'Steam', versao: '2.10.91.91', nova: '3.0.12.4', pode: true },
    { id: 'Discord.Discord', nome: 'Discord', versao: '1.0.9214', nova: '1.0.9267', pode: true },
    { id: '7zip.7zip', nome: '7-Zip', versao: '24.09', nova: '25.01', pode: true }];
  var nv = { tem: true, placa: NOTEBOOK.gpu.nome, instalado: '566.14', versao: '572.16', data: dia(6), url: 'demo', notas: '', pagina: '', desatualizado: true };
  var nvE = { fase: 'parado' };
  var historico = [
    { quando: dia(2) + ' 21:14', texto: 'Atualização de segurança do Windows (KB5067036) instalada' },
    { quando: dia(9) + ' 19:02', texto: 'Driver NVIDIA 566.14: instalador aberto pelo Bench Labs' },
    { quando: dia(9) + ' 18:40', texto: 'Google Chrome atualizado para a versão 141.0.7390.108' },
    { quando: dia(23) + ' 10:31', texto: 'Atualização cumulativa do Windows (KB5065789) instalada' }];
  var guiaMarcados = { veio: { como: 'feito', quando: dia(3) + ' 20:10' }, tela: { como: 'feito', quando: dia(3) + ' 20:18' } };
  var guiaHz = 60;
  function anotar(t) { var d = new Date(); historico.unshift({ quando: d.toISOString().slice(0, 10) + ' ' + d.toTimeString().slice(0, 5), texto: t }); }
  Object.assign(api, {
    prep_inicio: function () { return ok({ versao: '2.20.43', nome: NOTEBOOK.notebook, marca: 'lenovo', marca_nome: 'Lenovo', apps_marca: ['Legion Space'],
      loja_marca: '', app_marca_nome: 'Legion Space', maquina: { fabricante: 'LENOVO', modelo: '83DG' }, estado: { passos: {} }, reinicio: false }); },
    prep_buscar_atualizacoes: function () {
      if (wu.busca.fase === 'buscando') return ok(true);
      var feitas = wu._feitas || {};
      wu.busca = { fase: 'buscando', itens: [], erro: '' };
      setTimeout(function () { wu.busca = { fase: 'pronto', itens: WU_ITENS.filter(function (u) { return !feitas[u.id]; }), erro: '', quando: new Date().toTimeString().slice(0, 5) }; }, 2600);
      return ok(true); },
    prep_atualizacoes_status: function () { return ok(JSON.parse(JSON.stringify({ busca: wu.busca, instalacao: wu.instalacao, reinicio: wu.reinicio }))); },
    prep_instalar_atualizacoes: function (ids) {
      var lista = WU_ITENS.filter(function (u) { return ids.indexOf(u.id) >= 0; }), i = 0;
      wu.instalacao = { fase: 'baixando', total: lista.length, feitos: 0, atual: lista[0].titulo, quando: Date.now() / 1000 };
      var t = setInterval(function () {
        if (wu.instalacao.fase === 'baixando') { wu.instalacao.fase = 'instalando'; return; }
        wu._feitas = wu._feitas || {}; wu._feitas[lista[i].id] = true; anotar(lista[i].titulo + ' instalada'); i++;
        if (i >= lista.length) { clearInterval(t); wu.instalacao = { fase: 'concluido', total: lista.length, feitos: lista.length, resultados: lista.map(function (u) { return { id: u.id, ok: true }; }), quando: Date.now() / 1000 }; return; }
        wu.instalacao = { fase: 'baixando', total: lista.length, feitos: i, atual: lista[i].titulo, quando: Date.now() / 1000 };
      }, 2600);
      return ok({ ok: true, erro: '' }); },
    prep_reiniciar: function () { return ok(true); },
    prep_versoes: function () { return ok({ bios: 'N0CN29WW', bios_data: '2026-08-14', windows: 'Microsoft Windows 11 Home', build: '26200', windows_versao: '25H2', windows_build: '26200.6899',
      video: [{ nome: NOTEBOOK.gpu.nome, versao: '32.0.15.6614', data: '2026-10-02' }, { nome: 'Intel(R) UHD Graphics', versao: '32.0.101.6078', data: '2026-07-21' }], nvidia: nv.instalado,
      suporte: { nivel: 'ok', status: 'Em dia', versao: '25H2', fim: '2027-10-12', texto: 'A versão 25H2 recebe atualizações de segurança até outubro de 2027.' } }); },
    prep_nvidia_consultar: function () { return new Promise(function (r) { setTimeout(function () { r(Object.assign({}, nv)); }, 1400); }); },
    prep_nvidia_instalar: function () {
      nvE = { fase: 'baixando', progresso: 0 };
      var t = setInterval(function () {
        nvE.progresso += 0.12;
        if (nvE.progresso >= 1) { clearInterval(t); nvE = { fase: 'instalando', progresso: 1 }; nv.instalado = nv.versao; nv.desatualizado = false; anotar('Driver NVIDIA ' + nv.versao + ': instalador aberto pelo Bench Labs'); }
      }, 700);
      return ok({ ok: true }); },
    prep_nvidia_status: function () { return ok(Object.assign({}, nvE)); },
    prep_dispositivos: function () { return ok({ total: 148, problemas: [] }); },
    prep_drivers_lista: function () { return ok({ itens: [
      { grupo: 'Vídeo', nome: NOTEBOOK.gpu.nome, fornecedor: 'NVIDIA', versao: '32.0.15.6614', data: '2026-10-02', assinado: true },
      { grupo: 'Vídeo', nome: 'Intel(R) UHD Graphics', fornecedor: 'Intel Corporation', versao: '32.0.101.6078', data: '2026-07-21', assinado: true },
      { grupo: 'Rede', nome: 'Intel(R) Wi-Fi 6E AX211 160MHz', fornecedor: 'Intel Corporation', versao: '23.100.0.4', data: '2026-06-18', assinado: true },
      { grupo: 'Rede', nome: 'Realtek Gaming 2.5GbE Family Controller', fornecedor: 'Realtek', versao: '10.72.524.2025', data: '2026-05-24', assinado: true },
      { grupo: 'Áudio', nome: 'Realtek(R) Audio', fornecedor: 'Realtek Semiconductor Corp.', versao: '6.0.9712.1', data: '2026-07-02', assinado: true },
      { grupo: 'Bluetooth', nome: 'Intel(R) Wireless Bluetooth(R)', fornecedor: 'Intel Corporation', versao: '23.100.1.1', data: '2026-06-11', assinado: true }] }); },
    prep_historico: function () { return ok({ itens: historico.slice(0, 10) }); },
    prep_programas_buscar: function () {
      if (progLista.fase === 'buscando') return ok(true);
      progLista = { fase: 'buscando' };
      setTimeout(function () { progLista = { fase: 'pronto', itens: PROGRAMAS.slice(), quando: new Date().toTimeString().slice(0, 5) }; }, 3400);
      return ok(true); },
    prep_programas_status: function () { return ok(JSON.parse(JSON.stringify({ lista: progLista, atualizacao: progAtu }))); },
    prep_programas_atualizar: function (itens) {
      var i = 0; progAtu = { fase: 'atualizando', total: itens.length, feitos: 0, atual: itens[0].nome, resultados: [] };
      var t = setInterval(function () {
        var x = itens[i]; progAtu.resultados.push({ id: x.id, ok: true }); anotar(x.nome + ' atualizado');
        PROGRAMAS = PROGRAMAS.filter(function (p) { return p.id !== x.id; }); i++;
        if (i >= itens.length) { clearInterval(t); progAtu.fase = 'concluido'; progAtu.feitos = i; return; }
        progAtu.feitos = i; progAtu.atual = itens[i].nome;
      }, 2400);
      return ok({ ok: true }); },
    prep_bench_versoes: function () { return ok({ labs: '2.20.43', monitor: '0.4.75', monitor_embutida: '0.4.75', labs_nova: '', labs_tem: false, labs_erro: '', monitor_tem: false }); },
    prep_suporte_modelo: function () { return ok({ direto: true }); },
    prep_guia_estado: function () { return ok({ linha: { linha: 'Legion e LOQ', app: 'Legion Space', limite: 'Legion Space › Bateria › Modo de conservação (nos modelos mais antigos, pelo Lenovo Vantage)', conferir: true },
      ficha: 'i7-14650HX · RTX 4060 8 GB · 16 GB DDR5 · SSD 1 TB · tela 16" 2560×1600 165 Hz', ficha_lida: true, marcados: JSON.parse(JSON.stringify(guiaMarcados)),
      bateria: { saude: 97, ciclos: 41 }, ssd_ok: true, stress: { data: '12/11/2026', estavel: true, motivo: '', minutos: 10, tmax: 91 },
      hz: guiaHz, hz_max: 165, limite_ligado: false, programas_teste: [] }); },
    prep_guia_marcar: function (passo, como) { if (como) guiaMarcados[passo] = { como: como, quando: agora().replace('T', ' ').slice(0, 16) }; else delete guiaMarcados[passo]; return ok(JSON.parse(JSON.stringify(guiaMarcados))); },
    prep_guia_taxa_tela: function (hz) { guiaHz = hz; return ok({ ok: true }); },
    prep_drivers_backup: function () { return ok({ ok: false, erro: 'Na demonstração, o backup dos drivers não é feito.' }); },
    prep_drivers_procurar: function () { return ok({ ok: false, erro: 'Na demonstração, a busca de drivers não é feita.' }); },
    prep_drivers_status: function () { return ok({ fase: 'parado' }); },
    prep_abrir_app_marca: function () { return ok({ ok: false, erro: 'Na demonstração, o aplicativo da marca não é aberto.' }); },
    prep_abrir_loja_marca: function () { return ok({ ok: false }); }
  });

  /* ---------------- aba Monitor (mon_) ---------------- */
  var bench = function (d, hora, jogo, fps, low, ct, gt, cw, gw) { var x = new Date(hoje - d * 864e5), p = function (n) { return String(n).padStart(2, '0'); };
    var data = p(x.getDate()) + '/' + p(x.getMonth() + 1) + '/' + x.getFullYear() + ' ' + hora;
    return { data: data, notebook: NOTEBOOK.notebook, jogo: jogo, api: 'DX12', resolucao: '2560x1600', duracao: 300, fps: fps, low1: low, low01: Math.round(low * .82),
      cpuTemp: ct, gpuTemp: gt, cpuW: cw, gpuW: gw, wh: null, pasta: x.toISOString().slice(0, 10) + '_' + hora.replace(':', '-') + '-00_' + jogo.replace(/\W+/g, ''), relatorio: false }; };
  var BENCHS = [bench(1, '21:42', 'Cyberpunk 2077', 78.4, 61.2, 84, 76, 62, 118), bench(1, '20:55', 'Counter-Strike 2', 241.7, 148.3, 81, 72, 58, 96),
    bench(4, '22:10', 'Forza Horizon 5', 112.9, 91.5, 79, 74, 48, 112), bench(6, '19:30', 'Red Dead Redemption 2', 86.2, 68.9, 83, 77, 55, 121)];
  Object.assign(api, {
    mon_estado: function () { return ok({ instalado: true, versao: '0.4.75', rodando: true, iniciaComWindows: true,
      preset: { id: 'bateria', nome: 'Bateria & Média', descricao: 'CPU + RAM, GPU + VRAM e bateria', embutido: true },
      presets: [{ id: 'bateria', nome: 'Bateria & Média', descricao: 'CPU + RAM, GPU + VRAM e bateria', embutido: true }, { id: 'simples', nome: 'Simples & Média', descricao: 'CPU + GPU integrada, GPU + VRAM e RAM', embutido: true }],
      teclas: { iniciar: 'Num −', encerrar: 'Num +', mostrar: '\\' }, somenteEmJogo: true, tema: 'bench', resultados: 'Documentos\\Bench Monitor', painelJogo: { ativo: true, suporta: true } }); },
    mon_benchmarks: function () { return ok({ pasta: 'Documentos\\Bench Monitor', lista: BENCHS, total: BENCHS.length }); },
    mon_verificar: function () { return ok({ nova: '0.4.75', url: '', local: true, notas: '', atual: '0.4.75', instalado: true, tem: false }); },
    mon_relatorio: function () { return ok({ ok: false, erro: 'Na demonstração, o relatório não está disponível.' }); },
    mon_abrir: function () { return ok({ ok: false, erro: 'Na demonstração, o Bench Monitor não é aberto.' }); },
    mon_abrir_pasta: function () { return ok({ ok: false, erro: 'Na demonstração, a pasta não é aberta.' }); },
    mon_painel_jogo: function () { return ok({ ok: false, erro: 'Na demonstração, o painel do jogo não é aberto.' }); },
    mon_instalar: function () { return ok({ ok: false, erro: 'Na demonstração, nada é instalado.' }); },
    mon_status_instalacao: function () { return ok({ fase: 'parado' }); }
  });

  /* ---------------- aba Testes (marks_) ---------------- */
  Object.assign(api, {
    marks_inicio: function () { return ok({ gpu: Object.assign({ resolucao_recomendada: 'qhd', vram_livre: 7.2 }, NOTEBOOK.gpu), notebook: NOTEBOOK.notebook,
      cpu: { nome: NOTEBOOK.cpu.nome, nucleos: 16, threads: 24, mhz_base: 2200 }, ram: { gb: 16, pentes: [], tipo: 'DDR5', mhz: 5600, slots: 2, canais: { modo: 'dual', texto: 'Dual channel' } },
      bios: 'N0CN29WW', ssd: { nome: 'SK Hynix HFS001TEJ9X115N', barramento: 'NVMe', tipo: 'SSD', gb: 1000 }, gpu_limites: {}, versao: '2.20.43',
      placas: [{ nome: NOTEBOOK.gpu.nome, driver: '32.0.15.6614' }, { nome: 'Intel(R) UHD Graphics', driver: '32.0.101.6078' }],
      parada: { cpu: 100, gpu: 95, bateria: 30 }, modo_notebook: { windows: 'Melhor desempenho' }, carregador: { tomada: true, pct: 100 }, preferencias: {},
      sensores: { hwinfo: true, clock: true, monitor: true }, ultimos: {} }); },
    marks_modo_agora: function () { return ok({ windows: 'Melhor desempenho' }); },
    marks_carregar_sessao: function () { return ok(null); },
    marks_historico: function () { return ok([]); },
    marks_tela_info: function () { return ok({}); },
    marks_rx_cor: function () { return ok(pref.cor); }
  });

  /* opções do bloco, pela URL:  ?aba=ficha  &fixo=1 (menu lateral visível, mas sem trocar de área)  &trilho=0 (sem menu lateral) */
  document.addEventListener('DOMContentLoaded', function () {
    var css = '';
    if (prm.get('trilho') === '0') css += 'nav.rail{display:none!important}';
    else if (prm.get('fixo') === '1') css += 'nav.rail{pointer-events:none}';
    if (css) { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
  });

  var faltando = {};
  window.BENCH_DEMO = { api: api, faltando: faltando, NOTEBOOK: NOTEBOOK, FICHA: FICHA, MONITORES: MONITORES };
  window.pywebview = { api: new Proxy(api, {
    get: function (alvo, k) {
      if (typeof k !== 'string') return undefined;
      if (k in alvo) return alvo[k];
      return function () { faltando[k] = (faltando[k] || 0) + 1; return ok({}); };      // função ainda sem resposta de exemplo
    }
  }) };
})();
