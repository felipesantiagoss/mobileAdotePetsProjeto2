(function () {
  // API do PNI (Ministerio da Saude): a base e enorme e paginada de 1000 em 1000.
  // Buscamos so a 1a pagina (limit registros), o suficiente para mostrar e cachear.
  window.AdotePetsApiConfig = {
    antirrabicaPaginaTamanho: 1000
  };
})();
