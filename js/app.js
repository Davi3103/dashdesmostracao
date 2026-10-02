// app.js — comportamento genérico compartilhado por todas as páginas do
// dashboard. Cada função checa a existência dos elementos antes de mexer
// neles, então é seguro incluir este arquivo em qualquer página.
(function () {
  "use strict";

  // Relógio da ribbon (Secretaria de Finanças · Serra Clara)
  function tickClock() {
    var el = document.getElementById("ribbonClock");
    if (!el) return;
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, "0");
    var mm = String(now.getMinutes()).padStart(2, "0");
    var ss = String(now.getSeconds()).padStart(2, "0");
    el.innerHTML = '<i class="ti ti-clock"></i> ' + hh + ":" + mm + ":" + ss;
  }
  // Colunas dos gráficos com cores mais vivas (pedido do Davi, 2026-10-02):
  // plugin global do Chart.js que pega a cor sólida de cada coluna, aumenta a
  // saturação e aplica um degradê vertical (mais claro em cima). Vale pra todo
  // gráfico de barras de todas as páginas, sem mexer em cada new Chart().
  function parseCor(c) {
    if (typeof c !== "string") return null;
    var m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) { var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255, 1]; }
    m = c.match(/^rgba?\(([^)]+)\)$/i);
    if (m) { var p = m[1].split(",").map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    return null;
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }
  function hsl(h, s, l, a) {
    return "hsla(" + h.toFixed(0) + "," + Math.min(100, s).toFixed(0) + "%," + Math.max(0, Math.min(100, l)).toFixed(0) + "%," + a + ")";
  }
  function corViva(ctx, area, cor) {
    var p = parseCor(cor);
    if (!p || p[3] < 0.5) return cor;          // transparentes (fundo de gauge etc.) ficam como estão
    var x = rgbToHsl(p[0], p[1], p[2]);
    if (x[1] < 15) return cor;                 // cinzas neutros ficam como estão
    var s = Math.max(x[1] * 1.2, 85), l = Math.min(Math.max(x[2], 45), 58);
    var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, hsl(x[0], s, l + 10, p[3]));
    g.addColorStop(1, hsl(x[0], s, l - 6, p[3]));
    return g;
  }
  if (window.Chart && Chart.register) {
    Chart.register({
      id: "colunasVivas",
      afterLayout: function (chart) {
        var area = chart.chartArea;
        if (!area) return;
        var tipo = chart.config.type;
        chart.data.datasets.forEach(function (ds) {
          if ((ds.type || tipo) !== "bar") return;
          if (ds._corOriginal === undefined) ds._corOriginal = ds.backgroundColor;
          var o = ds._corOriginal;
          ds.backgroundColor = Array.isArray(o)
            ? o.map(function (c) { return corViva(chart.ctx, area, c); })
            : corViva(chart.ctx, area, o);
          if (ds.borderRadius === undefined) ds.borderRadius = 4;
        });
      }
    });
  }

  tickClock();
  setInterval(tickClock, 1000);

  // Navegação entre sub-abas (Imobiliário, Mobiliário etc.)
  window.showSubTab = function (grupo, aba, el) {
    if (el && el.parentElement) {
      var siblings = el.parentElement.querySelectorAll(".subtab");
      siblings.forEach(function (t) { t.classList.remove("active"); });
      el.classList.add("active");
    }
    document.querySelectorAll('.subsection[data-grupo="' + grupo + '"]').forEach(function (s) {
      s.classList.remove("active");
    });
    var target = document.getElementById("subtab-" + grupo + "-" + aba);
    if (target) target.classList.add("active");
  };

  // Página Contribuintes (index.html): sem API real neste site de
  // demonstração, então revela o painel com os valores zerados/placeholder
  // já presentes no HTML, em vez de ficar preso na tela de carregamento.
  var emptyState = document.getElementById("emptyState");
  var dashArea = document.getElementById("dashArea");
  if (emptyState && dashArea) {
    setTimeout(function () {
      emptyState.style.display = "none";
      dashArea.style.display = "block";
    }, 500);
  }
})();
