(function () {
  const comum = window.AdotePetsComum;

  comum.aoCarregarPagina(() => {
    comum.criarAplicacaoFramework7();
    const gerenciador = new window.AdotePetsManager();

    comum.$("#contador-home-pets").textContent = gerenciador.listarPets().length;
    comum.$("#contador-home-historias").textContent = gerenciador.listarHistorias().length;
    comum.$("#contador-home-clinicas").textContent = gerenciador.listarClinicas().length;
  });
})();
