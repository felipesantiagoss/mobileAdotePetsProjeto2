(function () {
  const comum = window.AdotePetsComum;

  comum.aoCarregarPagina(() => {
    const app = comum.criarAplicacaoFramework7();
    const gerenciador = new window.AdotePetsManager();
    const listaClinicas = comum.$("#lista-clinicas");
    const contadorClinicas = comum.$("#contador-clinicas");
    const formularioClinica = comum.$("#formulario-clinica");

    comum.registrarFallbackDeImagem();
    comum.registrarFechamentoManual();

    comum.$("#abrir-formulario-clinica").addEventListener("click", () => {
      formularioClinica.reset();
      app.popup.open("#popup-clinica");
    });

    formularioClinica.addEventListener("submit", salvarClinica);
    listaClinicas.addEventListener("click", tratarCliqueClinica);

    renderizarClinicas();

    function renderizarClinicas() {
      const clinicas = gerenciador.listarClinicas();
      contadorClinicas.textContent = clinicas.length;
      listaClinicas.innerHTML = clinicas.length
        ? clinicas.map(criarCardClinica).join("")
        : criarEstadoVazio("Nenhuma clinica cadastrada.");
    }

    function criarCardClinica(clinica) {
      return `
        <article class="clinic-card" data-id="${clinica.id}">
          <img src="${comum.escapeHtml(clinica.imagem)}" alt="${comum.escapeHtml(clinica.nome)}" data-fallback="img/clinic-placeholder.svg" />
          <div class="clinic-body">
            <h3>${comum.escapeHtml(clinica.nome)}</h3>
            <p><strong>Local:</strong> ${comum.escapeHtml(clinica.local)}</p>
            <p><strong>Contato:</strong> ${comum.escapeHtml(clinica.contato)}</p>
            <div class="clinic-badges">
              <span class="tag">Castracao</span>
              <span class="tag">Parceira</span>
            </div>
            <button class="small-link-button danger-button" data-action="delete-clinic" type="button">Excluir</button>
          </div>
        </article>
      `;
    }

    function salvarClinica(evento) {
      evento.preventDefault();
      const dados = comum.dadosDoFormulario(formularioClinica);
      dados.imagem = dados.imagem || "img/clinic-placeholder.svg";
      gerenciador.adicionarClinica(dados);
      formularioClinica.reset();
      app.popup.close("#popup-clinica");
      renderizarClinicas();
      comum.mostrarToast(app, "Clinica cadastrada.");
    }

    function tratarCliqueClinica(evento) {
      const botao = evento.target.closest("[data-action='delete-clinic']");

      if (!botao) {
        return;
      }

      const card = botao.closest("[data-id]");
      const id = card ? card.dataset.id : "";

      app.dialog.confirm("Excluir esta clinica?", "Confirmar exclusao", () => {
        gerenciador.removerClinica(id);
        renderizarClinicas();
        comum.mostrarToast(app, "Clinica excluida.");
      });
    }

    function criarEstadoVazio(texto) {
      return `<div class="empty-state">${comum.escapeHtml(texto)}</div>`;
    }
  });
})();
