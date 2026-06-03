(function () {
  const comum = window.AdotePetsComum;
  const apiService = window.AdotePetsApiService;

  comum.aoCarregarPagina(() => {
    const app = comum.criarAplicacaoFramework7();
    const areaLoading = comum.$("#loading-apis");
    const painelDogCeo = comum.$("#resultado-dog-ceo");
    const painelAntirrabica = comum.$("#resultado-antirrabica");
    const botaoAtualizar = comum.$("#atualizar-apis");
    const botaoGps = comum.$("#capturar-gps");

    comum.registrarFallbackDeImagem();

    botaoAtualizar.addEventListener("click", () => carregarApis(true));
    if (botaoGps) {
      botaoGps.addEventListener("click", capturarGPS);
    }
    mostrarUltimaPosicao();
    carregarApis(false);

    async function carregarApis(forcarRefresh) {
      mostrarLoading();
      painelDogCeo.innerHTML = "";
      painelAntirrabica.innerHTML = "";

      const [resultadoDogCeo, resultadoAntirrabica] = await Promise.allSettled([
        apiService.buscarRacasOuImagensCachorros(forcarRefresh),
        apiService.buscarDosesAntirrabicaPNI(forcarRefresh)
      ]);

      if (resultadoDogCeo.status === "fulfilled") {
        console.log("[Tela APIs] Dados normalizados Dog CEO:", resultadoDogCeo.value);
        renderizarDogCeo(resultadoDogCeo.value);
      } else {
        renderizarErro(painelDogCeo, "Nao foi possivel carregar as imagens da Dog CEO API.", resultadoDogCeo.reason);
      }

      if (resultadoAntirrabica.status === "fulfilled") {
        console.log("[Tela APIs] Dados normalizados Antirrabica PNI:", resultadoAntirrabica.value);
        renderizarAntirrabica(resultadoAntirrabica.value);
      } else {
        renderizarErro(painelAntirrabica, "Nao foi possivel carregar as doses do PNI.", resultadoAntirrabica.reason);
      }

      ocultarLoading();
    }

    function mostrarLoading() {
      botaoAtualizar.disabled = true;
      areaLoading.classList.remove("oculto");
    }

    function ocultarLoading() {
      botaoAtualizar.disabled = false;
      areaLoading.classList.add("oculto");
    }

    function renderizarDogCeo(resultado) {
      painelDogCeo.innerHTML = `
        <div class="api-result-header">
          <span class="api-status sucesso">Conectado</span>
          <small>${comum.escapeHtml(resultado.endpoint)}</small>
          <small>Atualizado as ${formatarHora(resultado.atualizadoEm)}</small>
        </div>
        <div class="dog-grid">
          ${resultado.itens.map(criarItemDogCeo).join("")}
        </div>
      `;
    }

    function criarItemDogCeo(item) {
      return `
        <article class="dog-card">
          <img src="${comum.escapeHtml(item.imagem)}" alt="Imagem de ${comum.escapeHtml(item.raca)}" data-fallback="img/pet-placeholder.svg" />
          <div>
            <h3>${comum.escapeHtml(item.raca)}</h3>
            <p>Imagem real retornada pela API publica Dog CEO.</p>
          </div>
        </article>
      `;
    }

    // Renderiza o painel da API antirrabica reutilizando as classes ja existentes no CSS.
    function renderizarAntirrabica(resultado) {
      const itens = resultado.itens;

      painelAntirrabica.innerHTML = `
        <div class="api-result-header">
          <span class="api-status sucesso">Conectado</span>
          <small>${comum.escapeHtml(resultado.endpoint)}</small>
          <small>Atualizado as ${formatarHora(resultado.atualizadoEm)}</small>
        </div>
        ${itens.length ? itens.map(criarItemAntirrabica).join("") : criarEstadoVazio("A API respondeu, mas nao retornou registros nesta consulta.")}
      `;
    }

    function criarItemAntirrabica(item) {
      return `
        <article class="api-data-card">
          <h3>${comum.escapeHtml(item.titulo)}</h3>
          <p>${comum.escapeHtml(item.municipio)} - ${comum.escapeHtml(item.uf)}</p>
          <div class="api-meta">
            <span>Data: ${comum.escapeHtml(item.data)}</span>
            <span>Dose: ${comum.escapeHtml(item.dose)}</span>
            <span>Idade: ${comum.escapeHtml(item.idade)}</span>
          </div>
        </article>
      `;
    }

    function renderizarErro(container, mensagem, erro) {
      console.error("[Tela APIs] Erro tratado:", erro);
      container.innerHTML = `
        <div class="api-error">
          <strong>${comum.escapeHtml(mensagem)}</strong>
          <p>Tente novamente em alguns instantes e confira o console do navegador para detalhes tecnicos.</p>
        </div>
      `;
    }

    function criarEstadoVazio(texto) {
      return `<div class="empty-state">${comum.escapeHtml(texto)}</div>`;
    }
  });
})();
