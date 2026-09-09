// mock-api.js — DEMO (09/09/2026): intercepta window.fetch pras 9 páginas que ainda esperam a
// API Laravel real (Outros Tributos, Cobrança, Cobrança Amigável, Ação Fiscal, Certidões
// Emitidas, Compensações, Recuperação de Débitos, Baixas Contábeis, Protestos). Cada função
// abaixo devolve o MESMO formato de JSON documentado no comentário "CONTRATO DE DADOS" (ou
// deduzido lendo renderXxx()) do <script> de cada página — a lógica de renderização em si
// NÃO é tocada, só a origem do dado. Precisa carregar DEPOIS de js/mock-data.js (usa
// window.MOCK_DATA) e ANTES do <script> inline de cada página (precisa substituir
// window.fetch antes da página chamar carregarXxx()).
(function () {
  "use strict";

  var MD = window.MOCK_DATA;
  var realFetch = window.fetch.bind(window);

  // ---- resposta "fake" com a mesma interface que o código das páginas usa (r.json()/r.blob()) ----
  function jsonResponse(payload) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: function () { return Promise.resolve(payload); },
      text: function () { return Promise.resolve(JSON.stringify(payload)); },
      blob: function () { return Promise.resolve(new Blob([JSON.stringify(payload)], { type: "application/json" })); }
    });
  }

  // Botões "Baixar Excel/PDF" — sem backend real pra gerar o arquivo de verdade, devolve um
  // blob de texto simples só pra não travar/dar erro no clique durante uma demonstração ao vivo.
  function blobResponse(nome) {
    var texto = "Exportação simulada (protótipo de demonstração — sem backend real).\nArquivo: " + nome + "\nGerado em: " + new Date().toLocaleString("pt-BR");
    var blob = new Blob([texto], { type: "text/plain" });
    return Promise.resolve({
      ok: true,
      status: 200,
      blob: function () { return Promise.resolve(blob); },
      json: function () { return Promise.reject(new Error("export endpoint returns a blob, not json")); }
    });
  }

  function round2(v) { return Math.round(v * 100) / 100; }
  function fmtDia(ano, mes, dia) { return MD.iso(ano, mes, dia); }

  // ============================================================================================
  // Outros Tributos — GET /api/outros-tributos/cache + GET /api/outros-tributos/tipos
  // ============================================================================================
  var otTiposCatalogo = [
    { chave: "taxas-diversas", nome: "Taxas Diversas", codTributo: [50, 51, 52], base: 2100000 },
    { chave: "itbi-outros", nome: "ITBI (lançamentos avulsos)", codTributo: [4], base: 1450000 },
    { chave: "multas-adm", nome: "Multas Administrativas", codTributo: [61, 62], base: 820000 },
    { chave: "contribuicao-melhoria", nome: "Contribuição de Melhoria", codTributo: [7], base: 540000 },
    { chave: "taxa-coleta-lixo", nome: "Taxa de Coleta de Lixo", codTributo: [55], base: 1180000 },
    { chave: "taxa-publicidade", nome: "Taxa de Publicidade/Anúncios", codTributo: [56], base: 310000 }
  ];
  var otTiposCache = null;
  function otTipos() {
    if (otTiposCache) return otTiposCache;
    otTiposCache = otTiposCatalogo.map(function (t) {
      var evol = MD.gerarEvolucaoAnos(t.base, { crescimentoAnual: 0.08 });
      var atual = evol[evol.length - 1];
      var anterior = evol[evol.length - 2];
      var crescMedio = (atual.lancado - anterior.lancado) / anterior.lancado;
      return {
        chave: t.chave,
        nome: t.nome,
        codTributo: t.codTributo,
        anoAtual: { ano: atual.ano, lancado: atual.lancado, qtdGuiasLancado: MD.randInt(300, 3200), arrecadado: atual.arrecadado, aberto: atual.aberto, inadimplencia: atual.inadimplencia },
        evolucaoAnos: evol,
        previsao2027: { ano: 2027, lancado: round2(atual.lancado * (1 + Math.max(0.02, crescMedio))) },
        isento: { qtd: MD.randInt(0, 40), somaFatorPercentual: MD.randInt(0, 100) / 100 },
        demorouMs: MD.randInt(600, 3400)
      };
    });
    return otTiposCache;
  }
  function otCache() {
    var evol = MD.gerarEvolucaoAnos(6500000, { crescimentoAnual: 0.085 });
    var atual = evol[evol.length - 1];
    return {
      disponivel: true,
      ano: atual.ano,
      calculadoEm: MD.agora2026(),
      lancado: atual.lancado,
      arrecadado: atual.arrecadado,
      aberto: atual.aberto,
      inadimplencia: atual.inadimplencia,
      isento: { qtd: MD.randInt(40, 160), somaFatorPercentual: MD.randInt(200, 900) / 100 },
      arrecadadoPeriodo: round2(evol.reduce(function (s, r) { return s + r.arrecadado; }, 0)),
      lancadoPeriodo: round2(evol.reduce(function (s, r) { return s + r.lancado; }, 0)),
      evolucaoAnos: evol
    };
  }

  // ============================================================================================
  // Cobrança — GET /api/cobranca/cache
  // ============================================================================================
  function cobrancaCache() {
    var lancado = 9800000 + MD.randInt(-300000, 300000);
    var arrecadado = round2(lancado * (0.62 + MD.rand() * 0.1));
    var conversaoPct = round2((arrecadado / lancado) * 100);
    var canais = [
      { canal: "Febraban (rede bancária)", qtd: MD.randInt(3800, 5200) },
      { canal: "Processo de Estorno", qtd: MD.randInt(200, 600) },
      { canal: "Mobiliário (guia avulsa)", qtd: MD.randInt(900, 1800) },
      { canal: "Processo Administrativo", qtd: MD.randInt(300, 800) },
      { canal: "Parcelamento", qtd: MD.randInt(600, 1400) }
    ];
    canais.forEach(function (c) { c.pct = 0; });
    var totalCanais = canais.reduce(function (s, c) { return s + c.qtd; }, 0);
    canais.forEach(function (c) { c.pct = round2((c.qtd / totalCanais) * 100); });

    var tributos = ["IPTU", "ISS", "ITBI", "TCA", "Taxas Diversas"];
    var porTributo = tributos.map(function (t) {
      var l = MD.randInt(600000, 2600000);
      var a = round2(l * (0.55 + MD.rand() * 0.35));
      return { chave: t, lancado: l, arrecadado: a, conversaoPct: round2((a / l) * 100) };
    });
    var porPeriodo = MD.ANOS.map(function (ano) {
      var l = MD.randInt(6000000, 11000000);
      var a = round2(l * (0.55 + MD.rand() * 0.3));
      return { chave: ano, lancado: l, arrecadado: a, conversaoPct: round2((a / l) * 100) };
    });
    var porOperador = MD.OPERADORES.map(function (op) {
      var l = MD.randInt(300000, 1800000);
      var a = round2(l * (0.5 + MD.rand() * 0.4));
      return { chave: op, lancado: l, arrecadado: a, conversaoPct: round2((a / l) * 100) };
    });

    function damPor(lista, keyField) {
      return lista.map(function (r) { return { chave: r.chave, qtd: MD.randInt(50, 900) }; });
    }
    var mesesLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    var damPorPeriodo = mesesLabels.map(function (m) { return { chave: m, qtd: MD.randInt(400, 1600) }; });

    var potencialTributos = tributos.map(function (t) {
      var vencido = MD.randInt(200000, 1400000);
      var aVencer = MD.randInt(150000, 900000);
      var quandoVence = [];
      for (var i = 0; i < 6; i++) {
        var mes = ((9 + i - 1) % 12) + 1;
        var ano = mes < 9 ? 27 : 26;
        quandoVence.push({ mesLabel: String(mes).padStart(2, "0") + "/" + ano, vencido: i === 0 ? vencido : 0, aVencer: MD.randInt(20000, 200000) });
      }
      return { tributo: t, vencido: vencido, aVencer: aVencer, quandoVence: quandoVence };
    });
    var vencidoTotal = potencialTributos.reduce(function (s, t) { return s + t.vencido; }, 0);
    var aVencerTotal = potencialTributos.reduce(function (s, t) { return s + t.aVencer; }, 0);

    var baixasPorAno = MD.ANOS.map(function (ano) { return { ano: ano, qtd: MD.randInt(800, 3200) }; });
    var resultadoMensal = mesesLabels.map(function (m) {
      var geradas = MD.randInt(700, 2200);
      return { mesLabel: m, geradas: geradas, recebidas: MD.randInt(Math.round(geradas * 0.5), geradas) };
    });
    var conversaoPorTributoTabela = porTributo.map(function (t) {
      return { tributo: t.chave, lancado: t.lancado, arrecadado: t.arrecadado, aRecuperar: round2(t.lancado - t.arrecadado), conversaoPct: t.conversaoPct };
    });

    return {
      disponivel: true,
      ano: 2026,
      calculadoEm: MD.agora2026(),
      demorouMs: MD.randInt(900, 4200),
      anosDisponiveis: MD.ANOS,
      kpis: {
        lancado: lancado,
        arrecadado: arrecadado,
        conversaoPct: conversaoPct,
        potencialRecuperar: round2(lancado - arrecadado),
        baixasProcessadas: MD.randInt(3000, 9000)
      },
      insights: [
        "Conversão geral de " + conversaoPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "% em 2026 — Febraban continua o canal com mais volume de guias pagas.",
        "IPTU concentra a maior fatia do potencial a recuperar entre os tributos acompanhados.",
        "Emissão de DAM (Documento de Arrecadação Municipal) cresceu no 2º semestre em relação ao 1º."
      ],
      canaisArrecadacao: canais,
      analiseConversao: { porTributo: porTributo, porPeriodo: porPeriodo, porOperador: porOperador },
      dam: {
        totalGeradas: MD.randInt(15000, 32000),
        insight: "Volume de DAM concentrado nos meses de vencimento de cota única (Jan/Fev) e parcelas intermediárias.",
        porTributo: damPor(porTributo),
        porPeriodo: damPorPeriodo,
        porOperador: damPor(porOperador)
      },
      potencialArrecadacao: { vencidoTotal: vencidoTotal, aVencerTotal: aVencerTotal, porTributo: potencialTributos },
      baixasPorAno: baixasPorAno,
      resultadoMensal: resultadoMensal,
      conversaoPorTributoTabela: conversaoPorTributoTabela,
      metodologia: "Dados de demonstração (protótipo) — valores fictícios gerados client-side em js/mock-api.js, sem fonte de dado real. Estrutura de campos segue o contrato documentado em cobranca.html."
    };
  }

  // ============================================================================================
  // Cobrança Amigável — GET /api/cobranca/cache-amigavel + GET /api/cobranca/amigavel-detalhe/:id
  // ============================================================================================
  var cobAmSetores = ["IPTU", "ISS", "ITBI", "TCA", "Dívida Ativa"];
  var cobAmSituacoes = ["Em andamento", "Encerrada", "Convertida em Dívida Ativa", "Cancelada"];
  var cobAmCampanhasCache = null;
  var cobAmDetalhesPorId = null;

  function ensureCobAmCampanhas() {
    if (cobAmCampanhasCache) return;
    cobAmCampanhasCache = [];
    cobAmDetalhesPorId = {};
    var anosHist = [2023, 2024, 2025, 2026];
    var id = 5001;
    anosHist.forEach(function (ano) {
      var n = ano === 2026 ? MD.randInt(10, 14) : MD.randInt(6, 12);
      for (var i = 0; i < n; i++) {
        var idc = id++;
        var setor = MD.pick(cobAmSetores);
        var situacao = ano === 2026 ? MD.pick(["Em andamento", "Em andamento", "Encerrada"]) : MD.pick(cobAmSituacoes);
        var usr = MD.pick(MD.OPERADORES);
        var mes = MD.randInt(1, 12);
        var campanha = {
          idCobrancaAmigavel: idc,
          ano: ano,
          setorOrigem: setor,
          situacao: situacao,
          usr: usr,
          dtGeracao: fmtDia(ano, mes, MD.randInt(1, 27))
        };
        cobAmCampanhasCache.push(campanha);

        // detalhe (guardado à parte, pra bater com o endpoint de drill-down)
        var notificadosN = MD.randInt(20, 220);
        var contribuintesAmostra = MD.pickN(MD.CONTRIBUINTES, Math.min(notificadosN, MD.CONTRIBUINTES.length));
        var notificados = [];
        for (var j = 0; j < notificadosN; j++) {
          var base = contribuintesAmostra[j % contribuintesAmostra.length];
          var status = MD.pick(["quitado", "quitado", "pago parcialmente", "em aberto", "em aberto"]);
          var totalDevido = MD.randInt(300, 8000);
          var totalPago = status === "quitado" ? totalDevido : (status === "pago parcialmente" ? round2(totalDevido * MD.rand() * 0.7) : 0);
          notificados.push({
            nome: base.nome,
            documento: base.doc,
            setorOrigem: setor,
            totalPago: totalPago,
            totalEmAberto: round2(totalDevido - totalPago),
            status: status
          });
        }
        var totalPagoCampanha = round2(notificados.reduce(function (s, n) { return s + n.totalPago; }, 0));
        var totalEmAbertoCampanha = round2(notificados.reduce(function (s, n) { return s + n.totalEmAberto; }, 0));
        var nomesTributoMap = {};
        nomesTributoMap[setor] = setor;
        cobAmDetalhesPorId[idc] = {
          disponivel: true,
          idCobrancaAmigavel: idc,
          setorOrigem: setor,
          usr: usr,
          dtGeracao: campanha.dtGeracao,
          situacao: situacao,
          nomesTributo: nomesTributoMap,
          qtdNotificadosTotal: notificadosN,
          qtdComGuiaEncontrada: MD.randInt(Math.round(notificadosN * 0.5), notificadosN),
          totalPagoCampanha: totalPagoCampanha,
          totalEmAbertoCampanha: totalEmAbertoCampanha,
          notificados: notificados
        };
      }
    });
  }

  function cobrancaAmigavelCache() {
    ensureCobAmCampanhas();
    var ano2026 = cobAmCampanhasCache.filter(function (c) { return c.ano === 2026; });
    var ano2025 = cobAmCampanhasCache.filter(function (c) { return c.ano === 2025; });

    function agrupar(lista, campo) {
      var mapa = {};
      lista.forEach(function (c) { var k = c[campo]; mapa[k] = (mapa[k] || 0) + 1; });
      return mapa;
    }
    var porSetorMapa = agrupar(cobAmCampanhasCache, "setorOrigem");
    var porSituacaoMapa = agrupar(cobAmCampanhasCache, "situacao");
    var porAnoMapa = agrupar(cobAmCampanhasCache, "ano");

    var totalNotificacoes = 0;
    Object.keys(cobAmDetalhesPorId).forEach(function (id) { totalNotificacoes += cobAmDetalhesPorId[id].qtdNotificadosTotal; });

    var topCampanhas = cobAmCampanhasCache.slice().sort(function (a, b) {
      return cobAmDetalhesPorId[b.idCobrancaAmigavel].qtdNotificadosTotal - cobAmDetalhesPorId[a.idCobrancaAmigavel].qtdNotificadosTotal;
    }).slice(0, 10).map(function (c) { return { idCobrancaAmigavel: c.idCobrancaAmigavel, qtdNotificados: cobAmDetalhesPorId[c.idCobrancaAmigavel].qtdNotificadosTotal }; });

    return {
      disponivel: true,
      ano: 2026,
      calculadoEm: MD.agora2026(),
      kpis: {
        totalCampanhas: cobAmCampanhasCache.length,
        campanhasAnoAtual: ano2026.length,
        campanhasAnoAnterior: ano2025.length,
        totalNotificacoes: totalNotificacoes,
        totalOrigensDistintas: cobAmSetores.length,
        qtdViraramDividaAtiva: porSituacaoMapa["Convertida em Dívida Ativa"] || 0,
        qtdAjuizadas: MD.randInt(2, Math.max(2, Math.round(cobAmCampanhasCache.length * 0.08)))
      },
      insights: [
        "IPTU e ISS concentram a maioria das campanhas de cobrança amigável em 2026.",
        "Cerca de " + Math.round(((porSituacaoMapa["Convertida em Dívida Ativa"] || 0) / cobAmCampanhasCache.length) * 100) + "% das campanhas históricas acabaram viradas em dívida ativa.",
        "Campanhas geradas por " + MD.OPERADORES[0] + " e " + MD.OPERADORES[1] + " somam a maior parte do volume notificado no exercício."
      ],
      porSetor: Object.keys(porSetorMapa).map(function (k) { return { setor: k, qtd: porSetorMapa[k] }; }),
      porTributo: Object.keys(porSetorMapa).map(function (k) { return { nome: k, qtdCampanhas: porSetorMapa[k] }; }),
      porSituacao: Object.keys(porSituacaoMapa).map(function (k) { return { situacao: k, qtd: porSituacaoMapa[k] }; }),
      campanhasPorAno: Object.keys(porAnoMapa).map(function (k) { return { ano: Number(k), qtd: porAnoMapa[k] }; }).sort(function (a, b) { return a.ano - b.ano; }),
      topCampanhasPorAlcance: topCampanhas,
      campanhasAnoAtualDetalhe: ano2026.map(function (c) { return { idCobrancaAmigavel: c.idCobrancaAmigavel, setorOrigem: c.setorOrigem, situacao: c.situacao, usr: c.usr, dtGeracao: c.dtGeracao }; }),
      metodologia: "Dados de demonstração (protótipo) — campanhas e notificados fictícios gerados client-side, sem fonte real em dbo.CobrancaAmigavel."
    };
  }

  function cobrancaAmigavelDetalhe(id) {
    ensureCobAmCampanhas();
    var idNum = Number(id);
    var det = cobAmDetalhesPorId[idNum];
    if (!det) return { disponivel: false, motivo: "Campanha #" + id + " não encontrada (id fora da faixa gerada pra esta demonstração)." };
    return det;
  }

  // ============================================================================================
  // Certidões Emitidas — GET /api/certidoes-emitidas/cache + GET /api/certidoes-emitidas/buscar
  // ============================================================================================
  var certTipos = ["Certidão Negativa de Débitos (CND)", "Certidão Positiva com Efeito de Negativa (CPEN)", "Certidão Positiva de Débitos", "Certidão de Regularidade Fiscal", "Certidão de Isenção", "Certidão de Valor Venal"];
  var certDepartamentos = [{ id: 1, nome: "Departamento de Tributação" }, { id: 2, nome: "Departamento de Fiscalização" }, { id: 3, nome: "Departamento Jurídico-Fiscal" }, { id: 4, nome: "Departamento de Atendimento ao Contribuinte" }, { id: 5, nome: "Departamento de Cadastro Imobiliário" }];
  var certSetores = ["Imobiliário", "Mobiliário", "Dívida Ativa", "Contribuinte", "Internet"];
  var certBaseCache = null;

  function ensureCertBase() {
    if (certBaseCache) return certBaseCache;
    var registros = [];
    var idc = 90001;
    for (var i = 0; i < 110; i++) {
      var contrib = MD.pick(MD.CONTRIBUINTES);
      var ano = MD.pick(MD.ANOS);
      var dep = MD.pick(certDepartamentos);
      registros.push({
        idCertidao: idc++,
        interessado: contrib.nome,
        tipo: MD.pick(certTipos),
        departamentoId: dep.id,
        departamento: dep.nome,
        setorOrigem: MD.pick(certSetores),
        usr: MD.pick(MD.OPERADORES),
        ano: ano,
        dtCertidao: fmtDia(ano, MD.randInt(1, 12), MD.randInt(1, 27))
      });
    }
    registros.sort(function (a, b) { return b.dtCertidao.localeCompare(a.dtCertidao); });
    certBaseCache = registros;
    return registros;
  }

  function agregarContagem(lista, campo) {
    var mapa = {};
    lista.forEach(function (r) { var k = r[campo]; mapa[k] = (mapa[k] || 0) + 1; });
    return mapa;
  }

  function certidoesCache() {
    var base = ensureCertBase();
    var anoAtual = 2026, anoAnterior = 2025;
    var doAno = base.filter(function (r) { return r.ano === anoAtual; }).length;
    var doAnoAnterior = base.filter(function (r) { return r.ano === anoAnterior; }).length;

    var porSetorMapa = agregarContagem(base, "setorOrigem");
    var porTipoMapa = agregarContagem(base, "tipo");
    var porUsrMapa = agregarContagem(base, "usr");
    var porAnoMapa = agregarContagem(base, "ano");
    var porDeptoMapa = {};
    base.forEach(function (r) { porDeptoMapa[r.departamentoId] = porDeptoMapa[r.departamentoId] || { idDepartamento: r.departamentoId, nome: r.departamento, qtd: 0 }; porDeptoMapa[r.departamentoId].qtd++; });

    var qtdComLancamento = MD.randInt(Math.round(base.length * 0.3), Math.round(base.length * 0.6));

    return {
      disponivel: true,
      ano: anoAtual,
      calculadoEm: MD.agora2026(),
      kpis: {
        totalHistorico: 21400 + base.length,
        totalAnoAtual: 3200 + doAno,
        totalAnoAnterior: 3050 + doAnoAnterior,
        pctInternet: round2((porSetorMapa["Internet"] || 0) / base.length * 100),
        pctComLancamento: round2(qtdComLancamento / base.length * 100),
        qtdComLancamento: qtdComLancamento
      },
      insights: [
        "Certidões via Internet representam parcela relevante do total emitido em 2026.",
        "Departamento de Tributação segue como o maior emissor de certidões no histórico.",
        "Certidão Negativa de Débitos (CND) é o tipo mais solicitado pelos contribuintes."
      ],
      porSetorOrigem: Object.keys(porSetorMapa).map(function (k) { return { setor: k, qtd: porSetorMapa[k], pctComGuia: MD.randInt(40, 92) }; }),
      porTipo: Object.keys(porTipoMapa).map(function (k) { return { nome: k, qtd: porTipoMapa[k] }; }).sort(function (a, b) { return b.qtd - a.qtd; }),
      porDepartamento: Object.keys(porDeptoMapa).map(function (k) { return porDeptoMapa[k]; }),
      topEmissores: Object.keys(porUsrMapa).map(function (k) { return { usr: k, qtd: porUsrMapa[k] }; }).sort(function (a, b) { return b.qtd - a.qtd; }),
      porAno: Object.keys(porAnoMapa).map(function (k) { return { ano: Number(k), total: porAnoMapa[k], qtdInternet: Math.round(porAnoMapa[k] * 0.35) }; }).sort(function (a, b) { return a.ano - b.ano; }),
      ultimasEmitidas: base.slice(0, 15).map(function (r) { return { idCertidao: r.idCertidao, interessado: r.interessado, tipo: r.tipo, departamento: r.departamento, setorOrigem: r.setorOrigem, usr: r.usr, dtCertidao: r.dtCertidao }; }),
      anosDisponiveis: MD.ANOS,
      metodologia: "Dados de demonstração (protótipo) — amostra de 110 certidões fictícias gerada client-side em js/mock-api.js; totais históricos exibidos nos KPIs são arredondados pra parecerem plausíveis numa base real."
    };
  }

  function certidoesBuscar(params) {
    var base = ensureCertBase();
    var departamento = params.get("departamento");
    var setor = params.get("setor");
    var ano = params.get("ano");
    var filtrados = base.filter(function (r) {
      if (departamento && String(r.departamentoId) !== String(departamento)) return false;
      if (setor && r.setorOrigem !== setor) return false;
      if (ano && String(r.ano) !== String(ano)) return false;
      return true;
    });
    var limite = 50;
    return {
      registros: filtrados.slice(0, limite).map(function (r) { return { idCertidao: r.idCertidao, interessado: r.interessado, tipo: r.tipo, departamento: r.departamento, setorOrigem: r.setorOrigem, usr: r.usr, dtCertidao: r.dtCertidao }; }),
      qtd: filtrados.length,
      limitado: filtrados.length > limite,
      limiteTela: limite
    };
  }

  // ============================================================================================
  // Baixas Contábeis — GET /api/baixa-contabil/cache + GET /api/baixa-contabil/buscar
  // ============================================================================================
  var bcTipos = [
    { id: 1, descr: "Cancelamento por Prescrição", financeira: "C" },
    { id: 2, descr: "Sentença Judicial Favorável", financeira: "S" },
    { id: 3, descr: "Parcelamento Quitado", financeira: "F" },
    { id: 4, descr: "Revisão Administrativa de Lançamento", financeira: "P" },
    { id: 5, descr: "Erro de Lançamento Identificado", financeira: "O" },
    { id: 6, descr: "Isenção Reconhecida Posteriormente", financeira: "C" },
    { id: 7, descr: "Compensação de Crédito Tributário", financeira: "F" }
  ];
  var bcDepartamentos = [{ id: 1, descr: "Departamento de Tributação" }, { id: 2, descr: "Departamento Jurídico-Fiscal" }, { id: 3, descr: "Departamento de Fiscalização" }, { id: 4, descr: "Departamento de Atendimento ao Contribuinte" }];
  var bcBaseCache = null;

  function ensureBcBase() {
    if (bcBaseCache) return bcBaseCache;
    var registros = [];
    var idb = 40001;
    for (var i = 0; i < 95; i++) {
      var contrib = MD.pick(MD.CONTRIBUINTES);
      var ano = MD.pick(MD.ANOS);
      var tipo = MD.pick(bcTipos);
      var depto = MD.pick(bcDepartamentos);
      registros.push({
        idBaixaContabil: idb++,
        dtBaixa: fmtDia(ano, MD.randInt(1, 12), MD.randInt(1, 27)),
        nroProcesso: String(MD.randInt(1000, 9999)),
        anoProcesso: ano,
        tipoId: tipo.id,
        tipo: tipo.descr,
        financeira: tipo.financeira,
        departamentoId: depto.id,
        departamento: depto.descr,
        crc: contrib.crc,
        interessado: contrib.nome,
        obs: "Baixa registrada conforme processo administrativo nº " + MD.randInt(1000, 9999) + "/" + ano + " — " + tipo.descr.toLowerCase() + "."
      });
    }
    registros.sort(function (a, b) { return b.dtBaixa.localeCompare(a.dtBaixa); });
    bcBaseCache = registros;
    return registros;
  }

  function baixaContabilCache() {
    var base = ensureBcBase();
    var anoAtual = 2026;
    var porTipoMapa = {};
    base.forEach(function (r) { porTipoMapa[r.tipo] = porTipoMapa[r.tipo] || { descr: r.tipo, qtd: 0, financeira: r.financeira }; porTipoMapa[r.tipo].qtd++; });
    var porDeptoMapa = {};
    base.forEach(function (r) { porDeptoMapa[r.departamento] = (porDeptoMapa[r.departamento] || 0) + 1; });
    var porAnoMapa = agregarContagem(base, "anoProcesso");
    var comCrc = base.filter(function (r) { return !!r.crc; }).length;

    return {
      disponivel: true,
      calculadoEm: MD.agora2026(),
      kpis: {
        totalHistorico: 8600 + base.length,
        totalAnoAtual: base.filter(function (r) { return r.anoProcesso === anoAtual; }).length + 120,
        anoAtual: anoAtual,
        comCrc: comCrc,
        pctComCrc: round2(comCrc / base.length * 100)
      },
      insights: [
        "Parcelamento Quitado é o motivo mais comum de baixa contábil no histórico.",
        "Departamento Jurídico-Fiscal concentra a maior parte das baixas por sentença judicial.",
        round2(comCrc / base.length * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "% das baixas têm CRC vinculado, permitindo cruzar com Dívida Ativa."
      ],
      porTipo: Object.keys(porTipoMapa).map(function (k) { return porTipoMapa[k]; }).sort(function (a, b) { return b.qtd - a.qtd; }),
      porDepartamento: Object.keys(porDeptoMapa).map(function (k) { return { departamento: k, qtd: porDeptoMapa[k] }; }),
      porAno: Object.keys(porAnoMapa).map(function (k) { return { ano: Number(k), qtd: porAnoMapa[k] }; }).sort(function (a, b) { return a.ano - b.ano; }),
      ultimas: base.slice(0, 15).map(function (r) { return { idBaixaContabil: r.idBaixaContabil, dtBaixa: r.dtBaixa, nroProcesso: r.nroProcesso, anoProcesso: r.anoProcesso, tipo: r.tipo, departamento: r.departamento, crc: r.crc, interessado: r.interessado, obs: r.obs }; }),
      anosDisponiveis: MD.ANOS,
      tiposDisponiveis: bcTipos.map(function (t) { return { id: t.id, descr: t.descr }; }),
      departamentosDisponiveis: bcDepartamentos,
      metodologia: "Dados de demonstração (protótipo) — amostra de 95 baixas contábeis fictícias gerada client-side em js/mock-api.js."
    };
  }

  function baixaContabilBuscar(params) {
    var base = ensureBcBase();
    var ano = params.get("ano");
    var tipo = params.get("tipo");
    var departamento = params.get("departamento");
    var crc = params.get("crc");
    var texto = (params.get("texto") || "").toLowerCase();
    var filtrados = base.filter(function (r) {
      if (ano && String(r.anoProcesso) !== String(ano)) return false;
      if (tipo && String(r.tipoId) !== String(tipo)) return false;
      if (departamento && String(r.departamentoId) !== String(departamento)) return false;
      if (crc && String(r.crc).indexOf(crc) === -1) return false;
      if (texto && r.interessado.toLowerCase().indexOf(texto) === -1) return false;
      return true;
    });
    var limite = 50;
    return {
      registros: filtrados.slice(0, limite),
      qtd: filtrados.length,
      limitado: filtrados.length > limite,
      limiteTela: limite
    };
  }

  // ============================================================================================
  // Protestos — GET /api/protestos/cache + GET /api/protestos/buscar
  // ============================================================================================
  var ptStatusList = [{ codigo: 1, descr: "Protestado" }, { codigo: 2, descr: "Pago antes do protesto" }, { codigo: 3, descr: "Cancelado" }, { codigo: 4, descr: "Sustado judicialmente" }, { codigo: 5, descr: "Aguardando remessa ao cartório" }];
  var ptCartorios = [{ codigo: 1, descr: "1º Tabelionato de Protesto de Serra Clara" }, { codigo: 2, descr: "2º Tabelionato de Protesto de Serra Clara" }, { codigo: 3, descr: "Tabelionato Central de Protesto" }];
  var ptBaseCache = null;

  function ensurePtBase() {
    if (ptBaseCache) return ptBaseCache;
    var registros = [];
    var idp = 60001;
    for (var i = 0; i < 90; i++) {
      var contrib = MD.pick(MD.CONTRIBUINTES);
      var ano = MD.pick(MD.ANOS);
      var status = MD.pick(ptStatusList);
      var cartorio = MD.pick(ptCartorios);
      var dtProtesto = fmtDia(ano, MD.randInt(1, 12), MD.randInt(1, 27));
      var semRetorno = status.codigo === 5 || status.codigo === 1;
      var diasSemRetorno = semRetorno ? MD.randInt(30, 210) : 0;
      registros.push({
        idProtesto: idp++,
        dtProtesto: dtProtesto,
        ano: ano,
        crc: contrib.crc,
        contribuinte: contrib.nome,
        valor: MD.randInt(400, 18000),
        statusCodigo: status.codigo,
        status: status.descr,
        cartorio: cartorio.codigo,
        nroProtocolo: "PRT-" + ano + "-" + String(MD.randInt(1000, 9999)),
        dtProtocolo: dtProtesto,
        diasSemRetorno: diasSemRetorno,
        qtdCertidoes: MD.randInt(1, 6),
        obs: "Protesto referente a certidão de dívida ativa nº " + MD.randInt(1000, 9999) + "/" + ano + "."
      });
    }
    registros.sort(function (a, b) { return b.dtProtesto.localeCompare(a.dtProtesto); });
    ptBaseCache = registros;
    return registros;
  }

  function protestosCache() {
    var base = ensurePtBase();
    var anoAtual = 2026;
    var qtdProtestado = base.filter(function (r) { return r.statusCodigo === 1; }).length;
    var valorProtestado = base.filter(function (r) { return r.statusCodigo === 1; }).reduce(function (s, r) { return s + r.valor; }, 0);
    var comCrc = base.filter(function (r) { return !!r.crc; }).length;
    var crcDistintos = Array.from(new Set(base.map(function (r) { return r.crc; }))).length;
    var semRetornoLista = base.filter(function (r) { return r.diasSemRetorno >= 30; }).sort(function (a, b) { return b.diasSemRetorno - a.diasSemRetorno; }).slice(0, 30);
    var qtdSemRetorno = semRetornoLista.length;
    var valorSemRetorno = semRetornoLista.reduce(function (s, r) { return s + r.valor; }, 0);

    var porStatusMapa = {};
    base.forEach(function (r) { porStatusMapa[r.status] = (porStatusMapa[r.status] || 0) + 1; });
    var porCartorioMapa = {};
    base.forEach(function (r) { porCartorioMapa[r.cartorio] = (porCartorioMapa[r.cartorio] || 0) + 1; });
    var porAnoMapa = agregarContagem(base, "ano");

    return {
      disponivel: true,
      calculadoEm: MD.agora2026(),
      kpis: {
        total: base.length + 4200,
        valorTotal: round2(base.reduce(function (s, r) { return s + r.valor; }, 0) + 5200000),
        totalAnoAtual: base.filter(function (r) { return r.ano === anoAtual; }).length + 60,
        anoAtual: anoAtual,
        qtdProtestado: qtdProtestado,
        valorProtestado: round2(valorProtestado),
        comCrc: comCrc,
        pctComCrc: round2(comCrc / base.length * 100),
        crcDistintos: crcDistintos,
        qtdSemRetorno: qtdSemRetorno,
        valorSemRetorno: round2(valorSemRetorno),
        semRetornoDias: 30
      },
      insights: [
        "Maior parte dos protestos segue concentrada no cartório central de Serra Clara.",
        qtdSemRetorno + " protesto(s) seguem sem retorno do cartório há 30+ dias, somando " + round2(valorSemRetorno).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + ".",
        "Percentual com CRC vinculado permite cruzamento direto com a base de Dívida Ativa."
      ],
      semRetorno: semRetornoLista.map(function (r) { return { idProtesto: r.idProtesto, dtProtesto: r.dtProtesto, crc: r.crc, contribuinte: r.contribuinte, valor: r.valor, nroProtocolo: r.nroProtocolo, dtProtocolo: r.dtProtocolo, diasSemRetorno: r.diasSemRetorno, qtdCertidoes: r.qtdCertidoes }; }),
      porStatus: Object.keys(porStatusMapa).map(function (k) { return { descr: k, qtd: porStatusMapa[k] }; }),
      porCartorio: Object.keys(porCartorioMapa).map(function (k) { return { codigo: Number(k), qtd: porCartorioMapa[k] }; }),
      porAno: Object.keys(porAnoMapa).map(function (k) { return { ano: Number(k), qtd: porAnoMapa[k] }; }).sort(function (a, b) { return a.ano - b.ano; }),
      ultimas: base.slice(0, 15).map(function (r) { return { idProtesto: r.idProtesto, dtProtesto: r.dtProtesto, crc: r.crc, contribuinte: r.contribuinte, valor: r.valor, status: r.status, cartorio: r.cartorio, nroProtocolo: r.nroProtocolo, qtdCertidoes: r.qtdCertidoes, obs: r.obs }; }),
      anosDisponiveis: MD.ANOS,
      statusDisponiveis: ptStatusList,
      cartoriosDisponiveis: ptCartorios,
      metodologia: "Dados de demonstração (protótipo) — amostra de 90 protestos fictícios gerada client-side em js/mock-api.js."
    };
  }

  function protestosBuscar(params) {
    var base = ensurePtBase();
    var ano = params.get("ano");
    var status = params.get("status");
    var cartorio = params.get("cartorio");
    var crc = params.get("crc");
    var texto = (params.get("texto") || "").toLowerCase();
    var filtrados = base.filter(function (r) {
      if (ano && String(r.ano) !== String(ano)) return false;
      if (status && String(r.statusCodigo) !== String(status)) return false;
      if (cartorio && String(r.cartorio) !== String(cartorio)) return false;
      if (crc && String(r.crc).indexOf(crc) === -1) return false;
      if (texto && r.contribuinte.toLowerCase().indexOf(texto) === -1) return false;
      return true;
    });
    var limite = 50;
    return {
      registros: filtrados.slice(0, limite).map(function (r) { return { idProtesto: r.idProtesto, dtProtesto: r.dtProtesto, crc: r.crc, contribuinte: r.contribuinte, valor: r.valor, status: r.status, cartorio: r.cartorio, nroProtocolo: r.nroProtocolo, qtdCertidoes: r.qtdCertidoes, obs: r.obs }; }),
      qtd: filtrados.length,
      limitado: filtrados.length > limite,
      limiteTela: limite
    };
  }

  // ============================================================================================
  // Compensações — GET /api/compensacoes/cache + GET /api/compensacoes/buscar
  // ============================================================================================
  var compSituacoes = ["Deferida", "Indeferida", "Em Análise", "Cancelada"];
  var compSetores = ["Imobiliário", "Mobiliário", "Dívida Ativa", "Contribuinte"];
  var compBaseCache = null;

  function ensureCompBase() {
    if (compBaseCache) return compBaseCache;
    var registros = [];
    var idc = 70001;
    for (var i = 0; i < 85; i++) {
      var contrib = MD.pick(MD.CONTRIBUINTES);
      var ano = MD.pick(MD.ANOS);
      registros.push({
        idCompensacao: idc++,
        nroProcesso: String(MD.randInt(1000, 9999)) + "/" + ano,
        setorOrigem: MD.pick(compSetores),
        situacao: MD.pick(compSituacoes),
        usr: MD.pick(MD.OPERADORES),
        ano: ano,
        dtFicha: fmtDia(ano, MD.randInt(1, 12), MD.randInt(1, 27)),
        vlrDeposito: MD.randInt(0, 1) ? MD.randInt(500, 15000) : 0,
        vlrResgate: MD.randInt(0, 1) ? MD.randInt(500, 15000) : 0,
        interessado: contrib.nome,
        obs: "Compensação de crédito tributário referente ao processo administrativo do exercício " + ano + "."
      });
    }
    registros.sort(function (a, b) { return b.dtFicha.localeCompare(a.dtFicha); });
    compBaseCache = registros;
    return registros;
  }

  function compensacoesCache() {
    var base = ensureCompBase();
    var anoAtual = 2026, anoAnterior = 2025;
    var comDeposito = base.filter(function (r) { return r.vlrDeposito > 0; });
    var comResgate = base.filter(function (r) { return r.vlrResgate > 0; });
    var porSetorMapa = {};
    base.forEach(function (r) { porSetorMapa[r.setorOrigem] = (porSetorMapa[r.setorOrigem] || 0) + 1; });
    var porSituacaoMapa = agregarContagem(base, "situacao");
    var porUsrMapa = agregarContagem(base, "usr");
    var porAnoMapa = agregarContagem(base, "ano");

    return {
      disponivel: true,
      ano: anoAtual,
      calculadoEm: MD.agora2026(),
      kpis: {
        totalHistorico: 2100 + base.length,
        totalAnoAtual: base.filter(function (r) { return r.ano === anoAtual; }).length + 40,
        totalAnoAnterior: base.filter(function (r) { return r.ano === anoAnterior; }).length + 38,
        somaVlrDeposito: round2(comDeposito.reduce(function (s, r) { return s + r.vlrDeposito; }, 0)),
        qtdVlrDeposito: comDeposito.length,
        somaVlrResgate: round2(comResgate.reduce(function (s, r) { return s + r.vlrResgate; }, 0)),
        qtdVlrResgate: comResgate.length
      },
      insights: [
        "Setor Imobiliário concentra a maior parte dos processos de compensação registrados.",
        "Maioria das compensações do exercício corrente está com situação Deferida.",
        "Volume de depósitos segue próximo ao de resgates no acumulado do ano."
      ],
      porSetorOrigem: Object.keys(porSetorMapa).map(function (k) { return { setor: k, qtd: porSetorMapa[k], pctComGuia: MD.randInt(50, 95) }; }),
      porSituacao: Object.keys(porSituacaoMapa).map(function (k) { return { situacao: k, qtd: porSituacaoMapa[k] }; }),
      topUsr: Object.keys(porUsrMapa).map(function (k) { return { usr: k, qtd: porUsrMapa[k] }; }).sort(function (a, b) { return b.qtd - a.qtd; }),
      porAno: Object.keys(porAnoMapa).map(function (k) { return { ano: Number(k), qtd: porAnoMapa[k] }; }).sort(function (a, b) { return a.ano - b.ano; }),
      ultimas: base.slice(0, 15).map(function (r) { return { idCompensacao: r.idCompensacao, nroProcesso: r.nroProcesso, setorOrigem: r.setorOrigem, situacao: r.situacao, usr: r.usr, dtFicha: r.dtFicha, obs: r.obs }; }),
      anosDisponiveis: MD.ANOS,
      metodologia: "Dados de demonstração (protótipo) — amostra de 85 compensações fictícias gerada client-side em js/mock-api.js."
    };
  }

  function compensacoesBuscar(params) {
    var base = ensureCompBase();
    var ano = params.get("ano");
    var situacao = params.get("situacao");
    var usr = params.get("usr");
    var filtrados = base.filter(function (r) {
      if (ano && String(r.ano) !== String(ano)) return false;
      if (situacao && r.situacao !== situacao) return false;
      if (usr && r.usr !== usr) return false;
      return true;
    });
    var limite = 50;
    return {
      registros: filtrados.slice(0, limite).map(function (r) { return { idCompensacao: r.idCompensacao, nroProcesso: r.nroProcesso, setorOrigem: r.setorOrigem, situacao: r.situacao, usr: r.usr, dtFicha: r.dtFicha, obs: r.obs }; }),
      qtd: filtrados.length,
      limitado: filtrados.length > limite,
      limiteTela: limite
    };
  }

  // ============================================================================================
  // Recuperação de Débitos — GET /api/recuperacao-debitos/cache
  // ============================================================================================
  var RATINGS = [
    { rating: "A", label: "Baixo risco" },
    { rating: "B", label: "Risco moderado" },
    { rating: "C", label: "Risco alto" },
    { rating: "D", label: "Risco crítico" }
  ];
  var FAIXAS_IDADE = ["0-1 ano", "1-3 anos", "3-5 anos", "5-10 anos", "10+ anos"];
  var SITUACOES_DA = ["Administrativa", "Ajuizada", "Em Ajuizamento"];

  function recuperacaoDebitosCache() {
    var maioresCreditos = MD.CONTRIBUINTES.map(function (c, i) {
      var idadeAnos = round2(MD.rand() * 12 + 0.2);
      var rating = idadeAnos > 8 ? "D" : idadeAnos > 5 ? "C" : idadeAnos > 2 ? "B" : "A";
      var anoInscricao = 2026 - Math.floor(idadeAnos);
      return {
        certidao: "CDA-" + anoInscricao + "-" + String(10000 + i),
        nome: c.nome,
        cgcCpf: c.doc,
        dtInscricao: fmtDia(Math.max(anoInscricao, 2015), MD.randInt(1, 12), MD.randInt(1, 27)),
        idadeAnos: idadeAnos,
        situacao: MD.pick(SITUACOES_DA),
        rating: rating,
        saldoAtual: MD.randInt(1200, 180000)
      };
    }).sort(function (a, b) { return b.saldoAtual - a.saldoAtual; });

    var totalSaldo = round2(maioresCreditos.reduce(function (s, c) { return s + c.saldoAtual; }, 0));
    var porRating = RATINGS.map(function (r) {
      var doRating = maioresCreditos.filter(function (c) { return c.rating === r.rating; });
      var saldo = round2(doRating.reduce(function (s, c) { return s + c.saldoAtual; }, 0));
      return { rating: r.rating, label: r.label, qtd: doRating.length, saldo: saldo, pctSaldo: totalSaldo ? round2(saldo / totalSaldo * 100) : 0 };
    });

    var porIdadeSituacao = [];
    FAIXAS_IDADE.forEach(function (faixa) {
      SITUACOES_DA.forEach(function (sit) {
        porIdadeSituacao.push({ faixaIdade: faixa, situacao: sit, rating: MD.pick(["A", "B", "C", "D"]), saldo: MD.randInt(20000, 900000) });
      });
    });

    return {
      disponivel: true,
      calculadoEm: MD.agora2026(),
      kpis: { totalCertidoes: maioresCreditos.length + 1180, totalSaldo: round2(totalSaldo + 4200000) },
      porRating: porRating,
      insights: [
        "Créditos Rating A concentram a maior chance de recuperação no curto prazo.",
        "Créditos Rating D (10+ anos) representam risco elevado de prescrição — candidatos a ação judicial prioritária.",
        "Faixa de 5 a 10 anos concentra parte relevante do saldo em situação Ajuizada."
      ],
      blindagemJuridica: "Créditos com mais de 5 anos sem movimentação processual passam por triagem jurídica trimestral pra avaliar risco de prescrição intercorrente, priorizando o ajuizamento dos Ratings C/D.",
      porIdadeSituacao: porIdadeSituacao,
      maioresCreditos: maioresCreditos,
      metodologia: "Dados de demonstração (protótipo) — rating calculado de forma fictícia a partir da idade simulada da dívida (client-side, js/mock-api.js), sem fonte real."
    };
  }

  // ============================================================================================
  // Ação Fiscal — GET /api/acao-fiscal/cache
  // ============================================================================================
  var afFases = ["Notificação", "Auto de Infração", "Impugnação", "Recurso", "Inscrição em Dívida Ativa", "Arquivamento"];
  var afServicos = ["Fiscalização de ISS", "Fiscalização de IPTU", "Fiscalização de Taxas", "Fiscalização de Alvará", "Fiscalização de Obras"];
  var afSituacoes = ["EmAberto", "Finalizada", "Cancelada"];

  function acaoFiscalCache() {
    var todasAcoes = [];
    var nro = 1;
    var exercicios = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    MD.CONTRIBUINTES.forEach(function (c) {
      var n = MD.randInt(1, 6);
      for (var i = 0; i < n; i++) {
        var exercicio = MD.pick(exercicios);
        var situacao = MD.pick(["EmAberto", "EmAberto", "Finalizada", "Finalizada", "Finalizada", "Cancelada"]);
        var vlrLancado = MD.randInt(800, 45000);
        var vlrBaixado = situacao === "Finalizada" ? round2(vlrLancado * (0.6 + MD.rand() * 0.4))
          : situacao === "Cancelada" ? 0
          : round2(vlrLancado * MD.rand() * 0.3);
        todasAcoes.push({
          nroAcaoFiscal: "AF-" + exercicio + "-" + String(nro++).padStart(4, "0"),
          exercicio: exercicio,
          dtAcaoFiscal: fmtDia(exercicio, MD.randInt(1, 12), MD.randInt(1, 27)),
          nome: c.nome,
          cgcCpf: c.doc,
          crc: c.crc,
          ccm: c.ccm || null,
          situacao: situacao,
          fase: situacao === "Finalizada" ? MD.pick(["Arquivamento", "Inscrição em Dívida Ativa"]) : situacao === "Cancelada" ? "Arquivamento" : MD.pick(afFases.slice(0, 4)),
          tpServico: MD.pick(afServicos),
          vlrLancado: vlrLancado,
          vlrBaixado: vlrBaixado,
          endereco: c.endereco,
          telefone: c.telefone,
          celular: c.celular,
          email: c.email
        });
      }
    });

    var porSituacaoMapa = {};
    todasAcoes.forEach(function (a) { porSituacaoMapa[a.situacao] = (porSituacaoMapa[a.situacao] || 0) + 1; });
    var porExercicioMapa = {};
    todasAcoes.forEach(function (a) {
      var e = porExercicioMapa[a.exercicio] = porExercicioMapa[a.exercicio] || { exercicio: a.exercicio, qtdAcoes: 0, totalLancado: 0, totalBaixado: 0 };
      e.qtdAcoes++; e.totalLancado += a.vlrLancado; e.totalBaixado += a.vlrBaixado;
    });
    var porExercicio = Object.keys(porExercicioMapa).map(function (k) {
      var e = porExercicioMapa[k];
      e.totalLancado = round2(e.totalLancado); e.totalBaixado = round2(e.totalBaixado);
      e.taxaRecuperacao = e.totalLancado ? round2(e.totalBaixado / e.totalLancado * 100) : 0;
      return e;
    });
    var porTpServicoMapa = agregarContagem(todasAcoes, "tpServico");
    var porFaseMapa = agregarContagem(todasAcoes, "fase");

    var porContribMapa = {};
    todasAcoes.forEach(function (a) {
      var k = a.cgcCpf;
      var e = porContribMapa[k] = porContribMapa[k] || { nome: a.nome, cgcCpf: a.cgcCpf, ccm: a.ccm, qtdAcoes: 0, totalLancado: 0, totalBaixado: 0 };
      e.qtdAcoes++; e.totalLancado += a.vlrLancado; e.totalBaixado += a.vlrBaixado;
    });
    var maioresContribuintes = Object.keys(porContribMapa).map(function (k) {
      var e = porContribMapa[k]; e.totalLancado = round2(e.totalLancado); e.totalBaixado = round2(e.totalBaixado); return e;
    }).sort(function (a, b) { return b.totalLancado - a.totalLancado; });

    var emAbertoMapa = {};
    todasAcoes.filter(function (a) { return a.situacao === "EmAberto"; }).forEach(function (a) {
      var k = a.crc;
      var e = emAbertoMapa[k] = emAbertoMapa[k] || {
        nome: a.nome, cgcCpf: a.cgcCpf, crc: a.crc, ccm: a.ccm, qtdAcoes: 0, totalLancado: 0, totalBaixado: 0,
        endereco: a.endereco, telefone: a.telefone, celular: a.celular, email: a.email, acoes: []
      };
      e.qtdAcoes++; e.totalLancado += a.vlrLancado; e.totalBaixado += a.vlrBaixado;
      e.acoes.push({ nroAcaoFiscal: a.nroAcaoFiscal, exercicio: a.exercicio, dtAcaoFiscal: a.dtAcaoFiscal, fase: a.fase, tpServico: a.tpServico, vlrLancado: a.vlrLancado, vlrBaixado: a.vlrBaixado });
    });
    var emAberto = Object.keys(emAbertoMapa).map(function (k) { var e = emAbertoMapa[k]; e.totalLancado = round2(e.totalLancado); e.totalBaixado = round2(e.totalBaixado); return e; })
      .sort(function (a, b) { return b.totalLancado - a.totalLancado; });

    return {
      disponivel: true,
      calculadoEm: MD.agora2026(),
      totalLancado: round2(todasAcoes.reduce(function (s, a) { return s + a.vlrLancado; }, 0)),
      todasAcoes: todasAcoes,
      porSituacao: Object.keys(porSituacaoMapa).map(function (k) { return { situacao: k, qtd: porSituacaoMapa[k] }; }),
      porExercicio: porExercicio,
      porTpServico: Object.keys(porTpServicoMapa).map(function (k) { return { tpServico: k, qtd: porTpServicoMapa[k] }; }),
      porFase: Object.keys(porFaseMapa).map(function (k) { return { fase: k, qtd: porFaseMapa[k] }; }),
      maioresContribuintes: maioresContribuintes,
      emAberto: emAberto,
      metodologia: "Dados de demonstração (protótipo) — ações fiscais fictícias geradas client-side em js/mock-api.js a partir do elenco de contribuintes de js/mock-data.js."
    };
  }

  // ============================================================================================
  // Roteamento de /api/* — casamento por pathname (ignorando querystring) ou por padrão
  // (endpoints com segmento dinâmico, tipo /amigavel-detalhe/:id).
  // ============================================================================================
  var HANDLERS = {
    "/api/outros-tributos/cache": function () { return otCache(); },
    "/api/outros-tributos/tipos": function () { return { disponivel: true, calculadoEm: MD.agora2026(), tipos: otTipos() }; },
    "/api/cobranca/cache": function () { return cobrancaCache(); },
    "/api/cobranca/cache-amigavel": function () { return cobrancaAmigavelCache(); },
    "/api/certidoes-emitidas/cache": function () { return certidoesCache(); },
    "/api/certidoes-emitidas/buscar": function (params) { return certidoesBuscar(params); },
    "/api/baixa-contabil/cache": function () { return baixaContabilCache(); },
    "/api/baixa-contabil/buscar": function (params) { return baixaContabilBuscar(params); },
    "/api/protestos/cache": function () { return protestosCache(); },
    "/api/protestos/buscar": function (params) { return protestosBuscar(params); },
    "/api/compensacoes/cache": function () { return compensacoesCache(); },
    "/api/compensacoes/buscar": function (params) { return compensacoesBuscar(params); },
    "/api/recuperacao-debitos/cache": function () { return recuperacaoDebitosCache(); },
    "/api/acao-fiscal/cache": function () { return acaoFiscalCache(); },

    // Cards da página Início (inicio.html) — resumo de 1 KPI por aba. index.html,
    // imobiliario.html, mobiliario.html e divida-ativa.html são páginas estáticas (sem fetch,
    // números fixos no próprio HTML/script da página), então esses 4 endpoints não existiam
    // ainda; valores abaixo aproximam o que aparece hoje em cada página (não são recalculados
    // ao vivo a partir delas, só mantidos na mesma ordem de grandeza).
    "/api/dashboard-data/resumo": function () {
      return { disponivel: true, calculadoEm: MD.agora2026(), qtdContribuintes: 1452 };
    },
    "/api/iptu/lancado-cache": function () {
      return { disponivel: true, calculadoEm: MD.agora2026(), totalLancado: 56211071.84 };
    },
    "/api/mobiliario/cadastro/kpis-cache": function () {
      return { disponivel: true, calculadoEm: MD.agora2026(), totalAtivas: 26412 };
    },
    "/api/divida-ativa/cache": function () {
      return { disponivel: true, calculadoEm: MD.agora2026(), totalGeral: 38659000 };
    }
  };

  var PATTERNS = [
    { re: /^\/api\/cobranca\/amigavel-detalhe\/(.+)$/, fn: function (m) { return cobrancaAmigavelDetalhe(decodeURIComponent(m[1])); } }
  ];

  window.fetch = function (input, init) {
    var urlStr = typeof input === "string" ? input : (input && input.url) || "";
    var urlObj;
    try { urlObj = new URL(urlStr, window.location.href); } catch (e) { urlObj = null; }

    if (urlObj && urlObj.pathname.indexOf("/api/") === 0) {
      var pathname = urlObj.pathname;

      // Botões "Baixar Excel/PDF" — sem backend real, devolve um blob simulado.
      if (/\/exportar-(excel|pdf)(\/)?$/.test(pathname)) {
        return blobResponse(pathname.split("/").pop());
      }

      if (HANDLERS[pathname]) {
        return jsonResponse(HANDLERS[pathname](urlObj.searchParams));
      }
      for (var i = 0; i < PATTERNS.length; i++) {
        var m = pathname.match(PATTERNS[i].re);
        if (m) return jsonResponse(PATTERNS[i].fn(m));
      }
    }

    // qualquer outra URL (ou endpoint /api/ não reconhecido) — segue pro fetch real.
    return realFetch(input, init);
  };
})();
