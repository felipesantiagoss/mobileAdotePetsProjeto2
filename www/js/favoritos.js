(function () {
  const comum = window.AdotePetsComum;

  comum.aoCarregarPagina(() => {
    const app = comum.criarAplicacaoFramework7();
    const gerenciador = new window.AdotePetsManager();
    const listaFavoritos = comum.$("#lista-favoritos");
    const contadorFavoritos = comum.$("#contador-favoritos");
    const formularioFavorito = comum.$("#formulario-favorito");

    comum.registrarFallbackDeImagem();
    comum.registrarFechamentoManual();

    listaFavoritos.addEventListener("click", tratarCliqueLista);
    formularioFavorito.addEventListener("submit", salvarFavorito);
    comum.$("#conteudo-detalhe-favorito").addEventListener("click", tratarCliqueDetalhe);

    renderizarFavoritos();

    function renderizarFavoritos() {
      const favoritos = gerenciador.listarFavoritos();
      contadorFavoritos.textContent = favoritos.length;
      listaFavoritos.innerHTML = favoritos.length
        ? favoritos.map(criarCardFavorito).join("")
        : criarEstadoVazio("Nenhum favorito ainda. Toque no botao de favoritar na pagina de pets.");
    }

    function criarCardFavorito(pet) {
      return `
        <article class="pet-card" data-id="${pet.id}">
          <img class="pet-image" src="${comum.escapeHtml(pet.imagem)}" alt="${comum.escapeHtml(pet.nome)}" data-fallback="img/pet-placeholder.svg" />
          <div class="pet-body">
            <div class="pet-topline">
              <span class="pet-sex">${comum.escapeHtml(pet.sexo)}</span>
              <button class="icon-button favorite-on" data-action="favorite" type="button" aria-label="Remover ${comum.escapeHtml(pet.nome)} dos favoritos">Favorito</button>
            </div>
            <h3 class="pet-name">${comum.escapeHtml(pet.nome)}</h3>
            <p class="pet-location">${comum.escapeHtml(pet.localizacao)}</p>
            <div class="pet-tags">
              <span class="tag">${comum.escapeHtml(pet.especie)}</span>
              <span class="tag">${comum.escapeHtml(pet.porte)}</span>
              <span class="tag">${comum.escapeHtml(pet.idade)}</span>
              <span class="tag">${comum.escapeHtml(pet.status)}</span>
            </div>
            <p class="pet-summary">${comum.escapeHtml(pet.descricao || "Pet cadastrado para adocao responsavel.")}</p>
            <div class="pet-card-buttons">
              <button class="button button-fill app-button primary-action" data-action="adopt" type="button">Quero adotar</button>
              <button class="small-link-button" data-action="detail" type="button">Detalhes</button>
              <button class="small-link-button" data-action="edit" type="button">Editar</button>
              <button class="small-link-button danger-button" data-action="delete" type="button">Excluir</button>
            </div>
          </div>
        </article>
      `;
    }

    function tratarCliqueLista(evento) {
      const botao = evento.target.closest("[data-action]");

      if (!botao) {
        return;
      }

      const card = botao.closest("[data-id]");
      const id = card ? card.dataset.id : "";
      const acao = botao.dataset.action;

      if (acao === "favorite") {
        gerenciador.alternarFavorito(id);
        renderizarFavoritos();
      }

      if (acao === "detail") {
        abrirDetalheFavorito(id);
      }

      if (acao === "adopt") {
        confirmarAdocao(id);
      }

      if (acao === "edit") {
        abrirFormularioFavorito(gerenciador.buscarPetPorId(id));
      }

      if (acao === "delete") {
        excluirFavorito(id);
      }
    }

    function abrirDetalheFavorito(id) {
      const pet = gerenciador.buscarPetPorId(id);

      if (!pet) {
        return;
      }

      comum.$("#conteudo-detalhe-favorito").innerHTML = `
        <article class="pet-detail-hero">
          <img src="${comum.escapeHtml(pet.imagem)}" alt="${comum.escapeHtml(pet.nome)}" data-fallback="img/pet-placeholder.svg" />
          <div class="pet-detail-body">
            <span class="eyebrow">${comum.escapeHtml(pet.status)}</span>
            <h2>${comum.escapeHtml(pet.nome)}</h2>
            <p>${comum.escapeHtml(pet.descricao || "Pet cadastrado para demonstracao academica.")}</p>
            <div class="detail-grid">
              <div><span>Sexo</span><strong>${comum.escapeHtml(pet.sexo)}</strong></div>
              <div><span>Especie</span><strong>${comum.escapeHtml(pet.especie)}</strong></div>
              <div><span>Porte</span><strong>${comum.escapeHtml(pet.porte)}</strong></div>
              <div><span>Idade</span><strong>${comum.escapeHtml(pet.idade)}</strong></div>
              <div><span>Peso</span><strong>${comum.escapeHtml(pet.peso || "Nao informado")}</strong></div>
              <div><span>Raca</span><strong>${comum.escapeHtml(pet.raca)}</strong></div>
              <div><span>Vacinado</span><strong>${pet.vacinado ? "Sim" : "Nao"}</strong></div>
              <div><span>Castrado</span><strong>${pet.castrado ? "Sim" : "Nao"}</strong></div>
            </div>
            <p><strong>Local:</strong> ${comum.escapeHtml(pet.localizacao)}</p>
            <button class="button button-fill app-button primary-action" data-action="detail-adopt" data-id="${pet.id}" type="button">Quero adotar</button>
          </div>
        </article>
      `;

      app.popup.open("#popup-detalhe-favorito");
    }

    function tratarCliqueDetalhe(evento) {
      const botao = evento.target.closest("[data-action='detail-adopt']");

      if (!botao) {
        return;
      }

      confirmarAdocao(botao.dataset.id);
    }

    function confirmarAdocao(id) {
      const pet = gerenciador.buscarPetPorId(id);

      if (!pet) {
        return;
      }

      app.dialog.alert(`Interesse registrado para ${pet.nome}. A instituicao entrara em contato com o adotante.`, "Quero adotar");
    }

    function abrirFormularioFavorito(pet) {
      if (!pet) {
        return;
      }

      formularioFavorito.reset();
      comum.$("#titulo-formulario-favorito").textContent = "Editar animal";
      formularioFavorito.elements.id.value = pet.id;
      formularioFavorito.elements.nome.value = pet.nome;
      formularioFavorito.elements.especie.value = pet.especie;
      formularioFavorito.elements.sexo.value = pet.sexo;
      formularioFavorito.elements.raca.value = pet.raca;
      formularioFavorito.elements.porte.value = pet.porte;
      formularioFavorito.elements.idade.value = pet.idade;
      formularioFavorito.elements.peso.value = pet.peso;
      formularioFavorito.elements.localizacao.value = pet.localizacao;
      formularioFavorito.elements.status.value = pet.status;
      formularioFavorito.elements.imagem.value = pet.imagem.startsWith("img/") ? "" : pet.imagem;
      formularioFavorito.elements.descricao.value = pet.descricao;
      formularioFavorito.elements.vacinado.checked = pet.vacinado;
      formularioFavorito.elements.castrado.checked = pet.castrado;
      app.popup.open("#popup-formulario-favorito");
    }

    function salvarFavorito(evento) {
      evento.preventDefault();
      const dados = comum.dadosDoFormulario(formularioFavorito);
      dados.vacinado = formularioFavorito.elements.vacinado.checked;
      dados.castrado = formularioFavorito.elements.castrado.checked;
      dados.imagem = dados.imagem || "img/pet-placeholder.svg";

      gerenciador.atualizarPet(dados.id, dados);
      app.popup.close("#popup-formulario-favorito");
      renderizarFavoritos();
      comum.mostrarToast(app, "Pet atualizado.");
    }

    function excluirFavorito(id) {
      const pet = gerenciador.buscarPetPorId(id);

      if (!pet) {
        return;
      }

      app.dialog.confirm(`Excluir o cadastro de ${pet.nome}?`, "Confirmar exclusao", () => {
        gerenciador.removerPet(id);
        renderizarFavoritos();
        comum.mostrarToast(app, "Pet excluido.");
      });
    }

    function criarEstadoVazio(texto) {
      return `<div class="empty-state">${comum.escapeHtml(texto)}</div>`;
    }
  });
})();
