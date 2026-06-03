(function () {
  let fallbackImagemRegistrado = false;
  let fechamentoManualRegistrado = false;

  function $(selector) {
    return document.querySelector(selector);
  }

  function aoCarregarPagina(callback) {
    let executado = false;

    function iniciar() {
      if (executado) {
        return;
      }

      executado = true;
      callback();
    }

    document.addEventListener("deviceready", iniciar, false);
    document.addEventListener("DOMContentLoaded", iniciar);
    window.addEventListener("load", iniciar);

    if (document.readyState !== "loading") {
      iniciar();
    }
  }

  function criarAplicacaoFramework7() {
    try {
      if (window.Framework7 && $("#app")) {
        return new Framework7({
          el: "#app",
          name: "Adote Pets",
          theme: "auto",
          view: {
            browserHistory: false,
            router: false
          }
        });
      }
    } catch (erro) {
      return criarFramework7Fallback();
    }

    return criarFramework7Fallback();
  }

  function criarSheet(app, seletor) {
    if (app.sheet && typeof app.sheet.create === "function") {
      try {
        const existente = typeof app.sheet.get === "function" ? app.sheet.get(seletor) : null;
        if (existente) return existente;
        return app.sheet.create({
          el: seletor,
          closeByBackdropClick: true,
          backdrop: true
        });
      } catch (erro) {
        // fallback manual
      }
    }

    const sheet = $(seletor);

    return {
      open() {
        if (sheet) {
          sheet.classList.add("manual-open");
        }
      },
      close() {
        if (sheet) {
          sheet.classList.remove("manual-open");
        }
      }
    };
  }

  function registrarFallbackDeImagem() {
    if (fallbackImagemRegistrado) {
      return;
    }

    fallbackImagemRegistrado = true;
    document.addEventListener("error", trocarImagemQueFalhou, true);
  }

  function registrarFechamentoManual() {
    if (fechamentoManualRegistrado) {
      return;
    }

    fechamentoManualRegistrado = true;

    document.addEventListener(
      "click",
      (evento) => {
        const fecharPopup = evento.target.closest(".popup-close");
        const fecharSheet = evento.target.closest(".sheet-close");

        if (fecharPopup) {
          const popup = fecharPopup.closest(".popup");
          if (popup && popup.classList.contains("manual-open")) {
            evento.preventDefault();
            popup.classList.remove("manual-open");
          }
        }

        if (fecharSheet) {
          const sheet = fecharSheet.closest(".sheet-modal");
          if (sheet && sheet.classList.contains("manual-open")) {
            evento.preventDefault();
            sheet.classList.remove("manual-open");
          }
        }
      },
      true
    );
  }

  function dadosDoFormulario(form) {
    const dados = {};
    const formData = new FormData(form);

    formData.forEach((valor, chave) => {
      dados[chave] = valor;
    });

    return dados;
  }

  function mostrarToast(app, texto) {
    app.toast
      .create({
        text: texto,
        closeTimeout: 1800
      })
      .open();
  }

  function limparHash() {
    const urlSemHash = window.location.pathname + window.location.search;
    window.history.replaceState(null, "", urlSemHash);
  }

  function trocarImagemQueFalhou(evento) {
    const imagem = evento.target;

    if (!imagem || imagem.tagName !== "IMG" || !imagem.dataset.fallback) {
      return;
    }

    imagem.src = imagem.dataset.fallback;
    imagem.removeAttribute("data-fallback");
  }

  function escapeHtml(valor) {
    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function criarFramework7Fallback() {
    return {
      sheet: null,
      popup: {
        open(seletor) {
          const popup = $(seletor);
          if (popup) {
            popup.classList.add("manual-open");
          }
        },
        close(seletor) {
          const popup = $(seletor);
          if (popup) {
            popup.classList.remove("manual-open");
          }
        }
      },
      dialog: {
        alert(mensagem) {
          window.alert(mensagem);
        },
        confirm(mensagem, titulo, aoConfirmar) {
          if (window.confirm(mensagem)) {
            aoConfirmar();
          }
        }
      },
      toast: {
        create(opcoes) {
          return {
            open() {
              const aviso = document.createElement("div");
              aviso.className = "manual-toast";
              aviso.textContent = opcoes.text;
              document.body.appendChild(aviso);
              setTimeout(() => aviso.remove(), opcoes.closeTimeout || 1800);
            }
          };
        }
      }
    };
  }

  window.AdotePetsComum = {
    $,
    aoCarregarPagina,
    criarAplicacaoFramework7,
    criarSheet,
    registrarFallbackDeImagem,
    registrarFechamentoManual,
    dadosDoFormulario,
    mostrarToast,
    limparHash,
    escapeHtml
  };
})();
