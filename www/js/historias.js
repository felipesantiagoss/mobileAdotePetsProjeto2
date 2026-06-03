(function () {
  const comum = window.AdotePetsComum;

  comum.aoCarregarPagina(() => {
    comum.criarAplicacaoFramework7();
    const gerenciador = new window.AdotePetsManager();
    const listaHistorias = comum.$("#lista-historias");
    const areaLista = comum.$("#area-lista-historias");
    const areaDetalhe = comum.$("#area-detalhe-historia");
    const conteudoHistoria = comum.$("#conteudo-historia");
    const contadorHistorias = comum.$("#contador-historias");

    comum.registrarFallbackDeImagem();

    comum.$("#voltar-historias").addEventListener("click", () => {
      comum.limparHash();
      mostrarLista();
    });

    listaHistorias.addEventListener("click", tratarCliqueHistoria);
    window.addEventListener("hashchange", atualizarPelaRota);

    renderizarHistorias();
    atualizarPelaRota();

    function renderizarHistorias() {
      const historias = gerenciador.listarHistorias();
      contadorHistorias.textContent = historias.length;
      listaHistorias.innerHTML = historias.length
        ? historias.map(criarCardHistoria).join("")
        : criarEstadoVazio("Nenhuma historia cadastrada.");
    }

    function criarCardHistoria(historia) {
      return `
        <article class="story-card" data-id="${historia.id}">
          <img src="${comum.escapeHtml(historia.imagem)}" alt="${comum.escapeHtml(historia.titulo)}" data-fallback="img/pet-placeholder.svg" />
          <div class="story-body">
            <div class="story-meta">${comum.escapeHtml(historia.categoria)} - ${comum.escapeHtml(historia.data)}</div>
            <div class="story-title">${comum.escapeHtml(historia.titulo)}</div>
            <p>${comum.escapeHtml(historia.resumo)}</p>
            <button class="button button-outline app-button" data-action="read-story" type="button">Leia mais</button>
          </div>
        </article>
      `;
    }

    function tratarCliqueHistoria(evento) {
      const botao = evento.target.closest("[data-action='read-story']");

      if (!botao) {
        return;
      }

      const card = botao.closest("[data-id]");
      window.location.hash = `historia-${card.dataset.id}`;
    }

    function atualizarPelaRota() {
      if (window.location.hash.indexOf("#historia-") !== 0) {
        mostrarLista();
        return;
      }

      const idHistoria = window.location.hash.replace("#historia-", "");
      abrirDetalhe(idHistoria);
    }

    function abrirDetalhe(idHistoria) {
      const historia = gerenciador.buscarHistoriaPorId(idHistoria);

      if (!historia) {
        mostrarLista();
        return;
      }

      conteudoHistoria.innerHTML = `
        <img src="${comum.escapeHtml(historia.imagem)}" alt="${comum.escapeHtml(historia.titulo)}" data-fallback="img/pet-placeholder.svg" />
        <div class="story-detail-body">
          <span class="eyebrow">${comum.escapeHtml(historia.categoria)} - ${comum.escapeHtml(historia.data)}</span>
          <h2>${comum.escapeHtml(historia.titulo)}</h2>
          <p>${comum.escapeHtml(historia.texto)}</p>
        </div>
      `;

      areaLista.classList.add("oculto");
      areaDetalhe.classList.remove("oculto");
      comum.$(".page-content").scrollTop = 0;
    }

    function mostrarLista() {
      areaDetalhe.classList.add("oculto");
      areaLista.classList.remove("oculto");
      comum.$(".page-content").scrollTop = 0;
    }

    function criarEstadoVazio(texto) {
      return `<div class="empty-state">${comum.escapeHtml(texto)}</div>`;
    }
  });
})();
