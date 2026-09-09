// mock-data.js — DEMO (09/09/2026): "elenco" fictício compartilhado por todo o site de
// demonstração. Nenhum nome/CPF/CNPJ aqui é real — tudo inventado só pra preencher a UI com
// dado plausível enquanto não existe backend (ver mock-api.js, que intercepta window.fetch
// nas 9 páginas que ainda esperam a API Laravel real). Mantido num arquivo só pra os mesmos
// contribuintes/operadores reaparecerem em páginas diferentes (index.html, cobrança,
// certidões, protestos etc.) em vez de cada página inventar um elenco novo.
(function (global) {
  "use strict";

  // ---- PRNG determinístico (mulberry32) — mesmos números a cada carregamento da página,
  // pra não ficar tudo pulando de valor toda vez que o Davi dá F5 no meio de uma demonstração. ----
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32(20260909);
  function rand() { return rng(); }
  function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
  function pickN(arr, n) {
    var copy = arr.slice();
    var out = [];
    n = Math.min(n, copy.length);
    for (var i = 0; i < n; i++) out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
    return out;
  }

  // ---- elenco de contribuintes fictícios (Pessoa Física + Pessoa Jurídica) ----
  // Mantém o padrão de CPF/CNPJ já usado nas 2 linhas de exemplo de index.html (João Fictício
  // da Silva / Empresa Falsa LTDA) — dígitos não passam validação de checksum real, só têm a
  // cara do formato.
  var CONTRIBUINTES = [
    { id: 1, tipo: "F", nome: "João Fictício da Silva", doc: "123.456.789-00", crc: 100234, endereco: "Rua Fictícia, 123, Centro", bairro: "Centro", telefone: "(19) 3255-1120", celular: "(19) 99811-2233", email: "joao.silva@exemplo.com" },
    { id: 2, tipo: "F", nome: "Maria Aparecida Nogueira", doc: "234.567.890-11", crc: 100235, endereco: "Rua das Acácias, 45, Jardim das Flores", bairro: "Jardim das Flores", telefone: "(19) 3255-2231", celular: "(19) 99822-3344", email: "maria.nogueira@exemplo.com" },
    { id: 3, tipo: "F", nome: "Carlos Eduardo Ferraz", doc: "345.678.901-22", crc: 100236, endereco: "Rua dos Ipês, 78, Bela Vista", bairro: "Bela Vista", telefone: "(19) 3255-3342", celular: "(19) 99833-4455", email: "carlos.ferraz@exemplo.com" },
    { id: 4, tipo: "F", nome: "Fernanda Beatriz Camargo", doc: "456.789.012-33", crc: 100237, endereco: "Av. Serra Verde, 210, Alto da Serra", bairro: "Alto da Serra", telefone: "(19) 3255-4453", celular: "(19) 99844-5566", email: "fernanda.camargo@exemplo.com" },
    { id: 5, tipo: "F", nome: "Ricardo Antunes Vale", doc: "567.890.123-44", crc: 100238, endereco: "Rua Modelo, 33, Vila Serra Clara", bairro: "Vila Serra Clara", telefone: "(19) 3255-5564", celular: "(19) 99855-6677", email: "ricardo.vale@exemplo.com" },
    { id: 6, tipo: "F", nome: "Juliana Marques Pontes", doc: "678.901.234-55", crc: 100239, endereco: "Rua Exemplo, 90, Parque das Águas", bairro: "Parque das Águas", telefone: "(19) 3255-6675", celular: "(19) 99866-7788", email: "juliana.pontes@exemplo.com" },
    { id: 7, tipo: "F", nome: "Paulo Henrique Bezerra", doc: "789.012.345-66", crc: 100240, endereco: "Rua das Palmeiras, 15, Recanto Verde", bairro: "Recanto Verde", telefone: "(19) 3255-7786", celular: "(19) 99877-8899", email: "paulo.bezerra@exemplo.com" },
    { id: 8, tipo: "F", nome: "Aline Cristina Rezende", doc: "890.123.456-77", crc: 100241, endereco: "Rua Bela Vista Inventada, 61, Bela Vista", bairro: "Bela Vista", telefone: "(19) 3255-8897", celular: "(19) 99888-9900", email: "aline.rezende@exemplo.com" },
    { id: 9, tipo: "F", nome: "Marcelo Tavares Nunes", doc: "901.234.567-88", crc: 100242, endereco: "Rua dos Girassóis, 5, Jardim Primavera", bairro: "Jardim Primavera", telefone: "(19) 3255-9908", celular: "(19) 99899-0011", email: "marcelo.nunes@exemplo.com" },
    { id: 10, tipo: "F", nome: "Débora Lins Carvalho", doc: "012.345.678-99", crc: 100243, endereco: "Rua Nova Esperança, 172, Vila Operária", bairro: "Vila Operária", telefone: "(19) 3255-0019", celular: "(19) 99800-1122", email: "debora.carvalho@exemplo.com" },
    { id: 11, tipo: "F", nome: "Eduardo Malta Siqueira", doc: "111.222.333-44", crc: 100244, endereco: "Av. Central Fictícia, 300, Centro", bairro: "Centro", telefone: "(19) 3255-1130", celular: "(19) 99811-2244", email: "eduardo.siqueira@exemplo.com" },
    { id: 12, tipo: "F", nome: "Patrícia Gouveia Farias", doc: "222.333.444-55", crc: 100245, endereco: "Rua do Comércio, 88, Centro", bairro: "Centro", telefone: "(19) 3255-2241", celular: "(19) 99822-3355", email: "patricia.farias@exemplo.com" },
    { id: 13, tipo: "F", nome: "Rogério Bastos Amaral", doc: "333.444.555-66", crc: 100246, endereco: "Rua Fictícia, 402, Jardim das Flores", bairro: "Jardim das Flores", telefone: "(19) 3255-3352", celular: "(19) 99833-4466", email: "rogerio.amaral@exemplo.com" },
    { id: 14, tipo: "F", nome: "Vanessa Peixoto Cordeiro", doc: "444.555.666-77", crc: 100247, endereco: "Av. Inventada, 512, Distrito Industrial", bairro: "Distrito Industrial", telefone: "(19) 3255-4463", celular: "(19) 99844-5577", email: "vanessa.cordeiro@exemplo.com" },
    { id: 15, tipo: "F", nome: "Thiago Andrade Moreno", doc: "555.666.777-88", crc: 100248, endereco: "Rua Modelo, 77, Alto da Serra", bairro: "Alto da Serra", telefone: "(19) 3255-5574", celular: "(19) 99855-6688", email: "thiago.moreno@exemplo.com" },
    { id: 16, tipo: "J", nome: "Empresa Falsa LTDA", doc: "00.111.222/0001-33", crc: 200101, ccm: 300101, endereco: "Av. Inventada, 456, Distrito Industrial", bairro: "Distrito Industrial", telefone: "(19) 3266-1001", celular: "(19) 99911-0001", email: "contato@empresafalsa.exemplo.com" },
    { id: 17, tipo: "J", nome: "Comércio Fictício Serra Clara ME", doc: "11.222.333/0001-44", crc: 200102, ccm: 300102, endereco: "Rua do Comércio, 210, Centro", bairro: "Centro", telefone: "(19) 3266-1002", celular: "(19) 99911-0002", email: "contato@comerciosc.exemplo.com" },
    { id: 18, tipo: "J", nome: "Indústria Modelo Exemplar S/A", doc: "22.333.444/0001-55", crc: 200103, ccm: 300103, endereco: "Av. Central Fictícia, 900, Distrito Industrial", bairro: "Distrito Industrial", telefone: "(19) 3266-1003", celular: "(19) 99911-0003", email: "contato@industriamodelo.exemplo.com" },
    { id: 19, tipo: "J", nome: "Construtora Horizonte Inventada LTDA", doc: "33.444.555/0001-66", crc: 200104, ccm: 300104, endereco: "Rua Nova Esperança, 340, Vila Operária", bairro: "Vila Operária", telefone: "(19) 3266-1004", celular: "(19) 99911-0004", email: "contato@horizonteconstrutora.exemplo.com" },
    { id: 20, tipo: "J", nome: "Distribuidora Vale Verde EIRELI", doc: "44.555.666/0001-77", crc: 200105, ccm: 300105, endereco: "Rua Exemplo, 145, Parque das Águas", bairro: "Parque das Águas", telefone: "(19) 3266-1005", celular: "(19) 99911-0005", email: "contato@valeverde.exemplo.com" },
    { id: 21, tipo: "J", nome: "Supermercados Bom Preço Fictício LTDA", doc: "55.666.777/0001-88", crc: 200106, ccm: 300106, endereco: "Av. Serra Verde, 480, Bela Vista", bairro: "Bela Vista", telefone: "(19) 3266-1006", celular: "(19) 99911-0006", email: "contato@bomprecoficticio.exemplo.com" },
    { id: 22, tipo: "J", nome: "Farmácia Saúde Plena Exemplo LTDA", doc: "66.777.888/0001-99", crc: 200107, ccm: 300107, endereco: "Rua Fictícia, 60, Centro", bairro: "Centro", telefone: "(19) 3266-1007", celular: "(19) 99911-0007", email: "contato@saudeplena.exemplo.com" },
    { id: 23, tipo: "J", nome: "Transportadora Serra Alta LTDA", doc: "77.888.999/0001-10", crc: 200108, ccm: 300108, endereco: "Av. Inventada, 700, Distrito Industrial", bairro: "Distrito Industrial", telefone: "(19) 3266-1008", celular: "(19) 99911-0008", email: "contato@serraalta.exemplo.com" },
    { id: 24, tipo: "J", nome: "Restaurante Sabor Caseiro Fictício ME", doc: "88.999.000/0001-21", crc: 200109, ccm: 300109, endereco: "Rua das Palmeiras, 22, Recanto Verde", bairro: "Recanto Verde", telefone: "(19) 3266-1009", celular: "(19) 99911-0009", email: "contato@saborcaseiro.exemplo.com" },
    { id: 25, tipo: "J", nome: "Auto Peças Central Inventada LTDA", doc: "99.000.111/0001-32", crc: 200110, ccm: 300110, endereco: "Rua do Comércio, 315, Centro", bairro: "Centro", telefone: "(19) 3266-1010", celular: "(19) 99911-0010", email: "contato@autopecascentral.exemplo.com" },
    { id: 26, tipo: "J", nome: "Padaria Pão Dourado Exemplo ME", doc: "10.111.222/0001-43", crc: 200111, ccm: 300111, endereco: "Rua dos Girassóis, 18, Jardim Primavera", bairro: "Jardim Primavera", telefone: "(19) 3266-1011", celular: "(19) 99911-0011", email: "contato@paodourado.exemplo.com" },
    { id: 27, tipo: "J", nome: "Clínica Vida Nova Fictícia S/S LTDA", doc: "20.222.333/0001-54", crc: 200112, ccm: 300112, endereco: "Av. Serra Verde, 150, Alto da Serra", bairro: "Alto da Serra", telefone: "(19) 3266-1012", celular: "(19) 99911-0012", email: "contato@vidanova.exemplo.com" },
    { id: 28, tipo: "J", nome: "Escritório Contábil Confiança Modelo LTDA", doc: "30.333.444/0001-65", crc: 200113, ccm: 300113, endereco: "Rua Fictícia, 501, Jardim das Flores", bairro: "Jardim das Flores", telefone: "(19) 3266-1013", celular: "(19) 99911-0013", email: "contato@confiancacontabil.exemplo.com" }
  ];

  var PESSOAS_FISICAS = CONTRIBUINTES.filter(function (c) { return c.tipo === "F"; });
  var PESSOAS_JURIDICAS = CONTRIBUINTES.filter(function (c) { return c.tipo === "J"; });

  // ---- operadores/usuários fictícios (login curto tipo "NomeIniciaisSetor", mesmo estilo do
  // exemplo "CalebeAM" citado no contrato de dados de cobranca.html) ----
  var OPERADORES = ["CalebeAM", "RobertaSF", "MarceloTN", "ElianeCP", "FabioRD", "PatriciaGF", "AndreLM", "SimoneVC", "DouglasHB", "LuciaMR"];

  var TRIBUTOS_NOMES = ["IPTU", "ISS", "ITBI", "TCA", "TFE", "TFHS", "Taxas Diversas", "Contribuição de Melhoria"];

  var ANOS = [2021, 2022, 2023, 2024, 2025, 2026];

  // ---- gera série "evolução" (ano, lançado, arrecadado, aberto, inadimplência) com tendência
  // de leve alta 2021->2026 (pedido: "trending gently upward"), com uma variação aleatória
  // pequena por ano pra não ficar uma reta perfeita demais. ----
  function gerarEvolucaoAnos(lancadoBase2021, opts) {
    opts = opts || {};
    var cresc = opts.crescimentoAnual != null ? opts.crescimentoAnual : 0.09; // ~9% a.a.
    var pctArrecMin = opts.pctArrecMin != null ? opts.pctArrecMin : 0.78;
    var pctArrecMax = opts.pctArrecMax != null ? opts.pctArrecMax : 0.90;
    var pctInadMin = opts.pctInadMin != null ? opts.pctInadMin : 0.05;
    var pctInadMax = opts.pctInadMax != null ? opts.pctInadMax : 0.12;
    var anos = opts.anos || ANOS;
    var out = [];
    var lancado = lancadoBase2021;
    anos.forEach(function (ano, i) {
      if (i > 0) lancado = lancado * (1 + cresc + (rand() - 0.5) * 0.04);
      var pctArrec = pctArrecMin + rand() * (pctArrecMax - pctArrecMin);
      var arrecadado = lancado * pctArrec;
      var pctInad = pctInadMin + rand() * (pctInadMax - pctInadMin);
      var inadimplencia = lancado * pctInad;
      var aberto = Math.max(0, lancado - arrecadado);
      out.push({
        ano: ano,
        lancado: Math.round(lancado * 100) / 100,
        arrecadado: Math.round(arrecadado * 100) / 100,
        aberto: Math.round(aberto * 100) / 100,
        inadimplencia: Math.round(inadimplencia * 100) / 100
      });
    });
    return out;
  }

  function iso(ano, mes, dia) {
    mes = mes || 6; dia = dia || 15;
    return ano + "-" + String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0") + "T" + String(randInt(8, 17)).padStart(2, "0") + ":" + String(randInt(0, 59)).padStart(2, "0") + ":00";
  }

  function agora2026() { return "2026-09-09T09:00:00"; }

  global.MOCK_DATA = {
    rand: rand,
    randInt: randInt,
    pick: pick,
    pickN: pickN,
    CONTRIBUINTES: CONTRIBUINTES,
    PESSOAS_FISICAS: PESSOAS_FISICAS,
    PESSOAS_JURIDICAS: PESSOAS_JURIDICAS,
    OPERADORES: OPERADORES,
    TRIBUTOS_NOMES: TRIBUTOS_NOMES,
    ANOS: ANOS,
    gerarEvolucaoAnos: gerarEvolucaoAnos,
    iso: iso,
    agora2026: agora2026
  };
})(window);
