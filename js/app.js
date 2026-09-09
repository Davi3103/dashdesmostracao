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
