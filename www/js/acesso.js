(function () {
  const comum = window.AdotePetsComum;

  comum.aoCarregarPagina(() => {
    const app = comum.criarAplicacaoFramework7();
    const gerenciador = new window.AdotePetsManager();
    const formularioLogin = comum.$("#formulario-login");
    const formularioInstituicao = comum.$("#formulario-instituicao");
    const statusLogin = comum.$("#status-login");

    comum.registrarFechamentoManual();

    formularioLogin.addEventListener("submit", fazerLoginSimulado);
    formularioInstituicao.addEventListener("submit", salvarInstituicao);

    comum.$("#criar-tutor-falso").addEventListener("click", () => {
      app.dialog.alert("Conta de tutor simulada. Use o login local para demonstrar o fluxo.", "Adote Pets");
    });

    comum.$("#abrir-formulario-instituicao").addEventListener("click", () => {
      formularioInstituicao.reset();
      app.popup.open("#popup-instituicao");
    });

    atualizarStatusLogin();

    function fazerLoginSimulado(evento) {
      evento.preventDefault();
      const dados = comum.dadosDoFormulario(formularioLogin);
      gerenciador.salvarUsuarioAtual(dados.login);
      atualizarStatusLogin();
      comum.mostrarToast(app, "Login simulado realizado.");
    }

    function atualizarStatusLogin() {
      const usuario = gerenciador.buscarUsuarioAtual();
      statusLogin.textContent = usuario ? `Conectado como ${usuario.login}` : "";
    }

    function salvarInstituicao(evento) {
      evento.preventDefault();
      const dados = comum.dadosDoFormulario(formularioInstituicao);

      if (dados.senha !== dados.confirmarSenha) {
        app.dialog.alert("As senhas precisam ser iguais.", "Cadastro de instituicao");
        return;
      }

      gerenciador.adicionarInstituicao(dados);
      gerenciador.salvarUsuarioAtual(dados.email);
      formularioInstituicao.reset();
      app.popup.close("#popup-instituicao");
      atualizarStatusLogin();
      comum.mostrarToast(app, "Instituicao cadastrada localmente.");
    }
  });
})();
