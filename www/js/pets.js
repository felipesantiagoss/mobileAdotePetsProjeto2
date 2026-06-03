(function () {
  const comum = window.AdotePetsComum;

  comum.aoCarregarPagina(() => {
    const app = comum.criarAplicacaoFramework7();
    const gerenciador = new window.AdotePetsManager();
    const formularioPet = comum.$("#formulario-pet");
    const formularioFiltros = comum.$("#formulario-filtros");
    const listaPets = comum.$("#lista-pets");
    const resumoFiltros = comum.$("#resumo-filtros");
    const textoContador = comum.$("#texto-contador-pets");
    const sheetFiltros = comum.criarSheet(app, "#sheet-filtros");
    let filtrosAtuais = {};

    comum.registrarFallbackDeImagem();
    comum.registrarFechamentoManual();

    comum.$("#abrir-filtros").addEventListener("click", () => sheetFiltros.open());
    comum.$("#limpar-filtros").addEventListener("click", limparFiltros);
    comum.$("#abrir-cadastro-pet").addEventListener("click", (evento) => {
      evento.preventDefault();
      abrirFormularioPet();
    });
    comum.$("#popup-formulario-pet .popup-close").addEventListener("click", () => comum.limparHash());

    formularioFiltros.addEventListener("submit", aplicarFiltros);
    formularioPet.addEventListener("submit", salvarPet);
    listaPets.addEventListener("click", tratarCliqueLista);
    comum.$("#conteudo-detalhe-pet").addEventListener("click", tratarCliqueDetalhe);
    window.addEventListener("hashchange", tratarHashDaPagina);

    renderizarPets();
    tratarHashDaPagina();

    function renderizarPets() {
      const pets = gerenciador.filtrarPets(filtrosAtuais);
      textoContador.textContent = `${pets.length} pet${pets.length === 1 ? "" : "s"} encontrado${pets.length === 1 ? "" : "s"}`;
      resumoFiltros.textContent = montarResumoFiltros();
      listaPets.innerHTML = pets.length ? pets.map(criarCardPet).join("") : criarEstadoVazio("Nenhum pet encontrado com esses filtros.");
    }

    function criarCardPet(pet) {
      const favoritoClasse = pet.favorito ? "favorite-on" : "";
      const favoritoTexto = pet.favorito ? "Favorito" : "Clique para Favoritar";

      return `
        <article class="pet-card" data-id="${pet.id}">
          <img class="pet-image" src="${comum.escapeHtml(pet.imagem)}" alt="${comum.escapeHtml(pet.nome)}" data-fallback="img/pet-placeholder.svg" />
          <div class="pet-body">
            <div class="pet-topline">
              <span class="pet-sex">${comum.escapeHtml(pet.sexo)}</span>
              <button class="icon-button ${favoritoClasse}" data-action="favorite" type="button" aria-label="Favoritar ${comum.escapeHtml(pet.nome)}">${favoritoTexto}</button>
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
        renderizarPets();
      }

      if (acao === "detail") {
        abrirDetalhePet(id);
      }

      if (acao === "adopt") {
        confirmarAdocao(id);
      }

      if (acao === "edit") {
        abrirFormularioPet(gerenciador.buscarPetPorId(id));
      }

      if (acao === "delete") {
        excluirPet(id);
      }
    }

    function abrirDetalhePet(id) {
      const pet = gerenciador.buscarPetPorId(id);

      if (!pet) {
        return;
      }

      comum.$("#conteudo-detalhe-pet").innerHTML = `
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

      app.popup.open("#popup-detalhe-pet");
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

    function abrirFormularioPet(pet) {
      formularioPet.reset();
      comum.$("#titulo-formulario-pet").textContent = pet ? "Editar animal" : "Cadastrar animal";
      formularioPet.elements.id.value = pet ? pet.id : "";

      if (pet) {
        formularioPet.elements.nome.value = pet.nome;
        formularioPet.elements.especie.value = pet.especie;
        formularioPet.elements.sexo.value = pet.sexo;
        formularioPet.elements.raca.value = pet.raca;
        formularioPet.elements.porte.value = pet.porte;
        formularioPet.elements.idade.value = pet.idade;
        formularioPet.elements.peso.value = pet.peso;
        formularioPet.elements.localizacao.value = pet.localizacao;
        formularioPet.elements.status.value = pet.status;
        formularioPet.elements.imagem.value = pet.imagem.startsWith("img/") ? "" : pet.imagem;
        formularioPet.elements.descricao.value = pet.descricao;
        formularioPet.elements.vacinado.checked = pet.vacinado;
        formularioPet.elements.castrado.checked = pet.castrado;
      }

      app.popup.open("#popup-formulario-pet");
    }

    function salvarPet(evento) {
      evento.preventDefault();
      const dados = coletarDadosPet(formularioPet);

      if (!dados.nome || !dados.especie || !dados.sexo || !dados.porte || !dados.localizacao) {
        app.dialog.alert("Preencha os campos obrigatorios do pet.", "Cadastro de animal");
        return;
      }

      if (dados.id) {
        gerenciador.atualizarPet(dados.id, dados);
        comum.mostrarToast(app, "Pet atualizado.");
      } else {
        gerenciador.adicionarPet(dados);
        comum.mostrarToast(app, "Pet cadastrado.");
      }

      app.popup.close("#popup-formulario-pet");
      renderizarPets();
      comum.limparHash();
    }

    function coletarDadosPet(form) {
      const dados = comum.dadosDoFormulario(form);
      dados.vacinado = form.elements.vacinado.checked;
      dados.castrado = form.elements.castrado.checked;
      dados.imagem = dados.imagem || "img/pet-placeholder.svg";
      return dados;
    }

    function excluirPet(id) {
      const pet = gerenciador.buscarPetPorId(id);

      if (!pet) {
        return;
      }

      app.dialog.confirm(`Excluir o cadastro de ${pet.nome}?`, "Confirmar exclusao", () => {
        gerenciador.removerPet(id);
        renderizarPets();
        comum.mostrarToast(app, "Pet excluido.");
      });
    }

    function aplicarFiltros(evento) {
      evento.preventDefault();
      filtrosAtuais = removerFiltrosVazios(comum.dadosDoFormulario(formularioFiltros));
      sheetFiltros.close();
      renderizarPets();
    }

    function limparFiltros() {
      filtrosAtuais = {};
      formularioFiltros.reset();
      sheetFiltros.close();
      renderizarPets();
    }

    function removerFiltrosVazios(filtros) {
      const resultado = {};

      Object.keys(filtros).forEach((chave) => {
        if (String(filtros[chave]).trim()) {
          resultado[chave] = String(filtros[chave]).trim();
        }
      });

      return resultado;
    }

    function montarResumoFiltros() {
      const valores = Object.values(filtrosAtuais);

      if (!valores.length) {
        return "Sem filtros aplicados";
      }

      return `Filtros: ${valores.join(", ")}`;
    }

    function tratarHashDaPagina() {
      if (window.location.hash === "#cadastro-pet") {
        abrirFormularioPet();
      }
    }

    function criarEstadoVazio(texto) {
      return `<div class="empty-state">${comum.escapeHtml(texto)}</div>`;
    }
  });
})();
