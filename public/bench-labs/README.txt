Bench Labs: blocos de demonstração para o site

São as telas reais do aplicativo (mesmos HTML/CSS/JS), com um notebook de exemplo
(dados fictícios) no lugar das leituras do Windows. Nada é instalado nem lido do
computador do visitante.

Como usar
1. Publique a pasta "app" inteira no site (ex.: /bench-labs/app/).
2. Insira cada bloco com um iframe:
   <iframe src="/bench-labs/app/inicio.html?aba=inicio&fixo=1" style="width:100%;height:820px;border:0" loading="lazy"></iframe>

Blocos (parâmetro aba)
   inicio   Início ao vivo (sensores simulados, atualizam sozinhos)
   testes   Testes de desempenho
   ficha    Ficha técnica
   monitor  Bench Monitor
   preparo  Atualizações

Parâmetros opcionais
   fixo=1     trava o menu lateral (o visitante não troca de área dentro do bloco)
   trilho=0   esconde o menu lateral
   monitor=0  esconde o cartão de monitor externo na Ficha

Observações
- Precisa ser servido por http(s), na mesma origem dos arquivos; não funciona abrindo por file://.
- A interface é de desktop: use largura mínima de ~1100 px (em celular, mostre uma imagem ou reduza com transform: scale).
- Na aba Testes, o botão Executar mostra um aviso: os testes só rodam no aplicativo.
- Os dados de exemplo ficam em app/demo-dados.js.
- exemplo.html mostra os cinco blocos juntos.
