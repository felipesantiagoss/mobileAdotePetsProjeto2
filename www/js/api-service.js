//api-service.js - Testes das APIs do Projeto 2
//Dupla: Felipe Santiago RA: 078364 e Breno Ferreira RA: 069800



(function () {
  const DOG_CEO_ENDPOINT = "https://dog.ceo/api/breeds/image/random/6";
  const ANTIRRABICA_ENDPOINT = "https://apidadosabertos.saude.gov.br/vacinacao/doses-aplicadas-pni-2023";
  // Proxy CORS publico: a API do Ministerio da Saude nao envia o header
  // Access-Control-Allow-Origin, entao o navegador bloqueia chamadas diretas
  // do front-end. O cors.eu.org reenvia a requisicao pelo servidor dele e
  // devolve a resposta com o CORS liberado. A URL alvo vai logo apos a barra.
  // (Trocamos o codetabs e o allorigins, que pararam de funcionar / ficaram instaveis.)
  const CORS_PROXY = "https://cors.eu.org/";

  function obterConfiguracao() {
    return window.AdotePetsApiConfig || {};
  }

  // Monta a URL "real" de UMA pagina da API antirrabica (offset = numero da pagina, comeca em 0).
  // Mantemos a URL original (sem proxy) para exibir no painel e nos logs.
  function montarUrlAntirrabicaPNI(numeroPagina) {
    const configuracao = obterConfiguracao();
    const tamanho = Number(configuracao.antirrabicaPaginaTamanho) || 1000;
    const parametros = new URLSearchParams({
      limit: String(tamanho),
      offset: String(numeroPagina)
    });
    return `${ANTIRRABICA_ENDPOINT}?${parametros.toString()}`;
  }

  // Envelopa a URL no proxy CORS - usar SOMENTE no momento do fetch.
  // O cors.eu.org espera a URL alvo "crua" logo apos a barra (sem encode).
  function viaProxyCors(url) {
    return `${CORS_PROXY}${url}`;
  }

  // O proxy publico as vezes responde 522 (instabilidade). Tentamos algumas
  // vezes antes de desistir - na pratica resolve quase sempre na 2a tentativa.
  async function buscarViaProxyComTentativas(urlOriginal, tentativas) {
    const total = tentativas || 3;
    let ultimoErro = null;
    for (let i = 1; i <= total; i++) {
      try {
        return await buscarJson(viaProxyCors(urlOriginal));
      } catch (erro) {
        ultimoErro = erro;
        console.warn(`[API PNI] Tentativa ${i}/${total} falhou (${erro.status || "rede"}). Tentando de novo...`);
      }
    }
    throw ultimoErro;
  }

  // A resposta do MS vem como envelope { "doses_aplicadas_pni": [...] }, mas mantemos
  // outras chaves comuns no fallback caso a API mude o nome do campo no futuro.
  function extrairListaAntirrabica(dados) {
    if (Array.isArray(dados)) return dados;
    if (!dados || typeof dados !== "object") return [];
    const candidatas = ["doses_aplicadas_pni", "doses_aplicadas", "doses", "items", "data", "results", "records", "value"];
    for (const chave of candidatas) {
      if (Array.isArray(dados[chave])) return dados[chave];
    }
    for (const valor of Object.values(dados)) {
      if (Array.isArray(valor)) return valor;
    }
    return [];
  }

  async function buscarJson(url, opcoes = {}) {
    const resposta = await fetch(url, {
      cache: "no-store",
      ...opcoes,
      headers: {
        Accept: "application/json",
        ...(opcoes.headers || {})
      }
    });

    const texto = await resposta.text();
    const dados = texto ? converterJsonSeguro(texto) : null;

    if (!resposta.ok) {
      const erro = new Error(`Falha HTTP ${resposta.status} ao consultar ${url}`);
      erro.status = resposta.status;
      erro.dados = dados || texto;
      erro.url = url;
      throw erro;
    }

    return dados;
  }

  function converterJsonSeguro(texto) {
    try {
      return JSON.parse(texto);
    } catch (erro) {
      return texto;
    }
  }

  async function buscarRacasOuImagensCachorros(forcarRefresh) {
    const CHAVE = "cache_dog_ceo";

    if (!forcarRefresh) {
      const cache = lerCache(CHAVE, 30);
      if (cache) {
        console.log("[API Dog CEO] Usando cache de", formatarHora(cache.timestamp));
        cache.dados.atualizadoEm = cache.timestamp;
        return cache.dados;
      }
    }

    try {
      const dados = await buscarJson(DOG_CEO_ENDPOINT);
      console.log("[API Dog CEO] Retorno real:", dados);
      const normalizado = normalizarDogCeo(dados);
      salvarCache(CHAVE, normalizado);
      normalizado.atualizadoEm = Date.now();
      return normalizado;
    } catch (erro) {
      console.error("[API Dog CEO] Erro na chamada:", erro);
      throw erro;
    }
  }

  // Busca a primeira pagina de doses aplicadas registradas no PNI 2023.
  // A API e enorme e paginada de 1000 em 1000, entao pegamos so a 1a pagina
  // (rapido e estavel) e mostramos os registros que vierem. O resultado fica
  // no cache, entao nas proximas visitas nem precisa chamar a API de novo.
  async function buscarDosesAntirrabicaPNI(forcarRefresh) {
    const CHAVE = "cache_antirrabica";

    if (!forcarRefresh) {
      const cache = lerCache(CHAVE, 30);
      if (cache) {
        console.log("[API PNI] Usando cache de", formatarHora(cache.timestamp));
        cache.dados.atualizadoEm = cache.timestamp;
        return cache.dados;
      }
    }

    const urlOriginal = montarUrlAntirrabicaPNI(0);

    try {
      console.log(`[API PNI] Carregando doses: ${urlOriginal}`);
      const dados = await buscarViaProxyComTentativas(urlOriginal, 3);
      const registros = extrairListaAntirrabica(dados);
      console.log(`[API PNI] Registros recebidos: ${registros.length}`);
      const normalizado = normalizarAntirrabica(registros, urlOriginal);
      salvarCache(CHAVE, normalizado);
      normalizado.atualizadoEm = Date.now();
      return normalizado;
    } catch (erro) {
      console.error("[API PNI] Erro na chamada:", erro);
      throw erro;
    }
  }

  // Converte os registros brutos em um formato amigavel para os componentes da tela.
  // Limita a 10 cards e guarda uma amostra em "bruto" (o array inteiro tem ~1.4MB
  // e nao precisa ir todo para o cache do localStorage).
  function normalizarAntirrabica(registros, endpoint) {
    const itens = registros.map((registro, indice) => ({
      id: `pni-${indice + 1}`,
      titulo: registro.descricao_vacina || "Dose registrada no PNI",
      data: registro.data_vacina || "data nao informada",
      uf: registro.uf_estabelecimento || "UF nao informada",
      municipio: registro.municipio_estabelecimento || "Municipio nao informado",
      dose: registro.codigo_dose_vacina != null && String(registro.codigo_dose_vacina) !== ""
        ? String(registro.codigo_dose_vacina)
        : "nao informada",
      idade: registro.idade_paciente != null && String(registro.idade_paciente) !== ""
        ? `${registro.idade_paciente} anos`
        : "idade nao informada"
    }));

    return {
      endpoint,
      total: itens.length,
      itens: itens.slice(0, 10),
      bruto: registros.slice(0, 50)
    };
  }

  function normalizarDogCeo(dados) {
    const imagens = Array.isArray(dados && dados.message) ? dados.message : [];

    return {
      endpoint: DOG_CEO_ENDPOINT,
      total: imagens.length,
      itens: imagens.map((url, indice) => ({
        id: `dog-${indice + 1}`,
        imagem: url,
        raca: extrairRacaDaUrl(url)
      })),
      bruto: dados
    };
  }

  function extrairRacaDaUrl(url) {
    const partes = String(url).split("/breeds/");
    const trechoRaca = partes[1] ? partes[1].split("/")[0] : "cachorro";
    return trechoRaca
      .split("-")
      .reverse()
      .join(" ")
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  }

  window.AdotePetsApiService = {
    buscarRacasOuImagensCachorros,
    buscarDosesAntirrabicaPNI,
    montarUrlAntirrabicaPNI
  };
  window.buscarRacasOuImagensCachorros = buscarRacasOuImagensCachorros;
  window.buscarDosesAntirrabicaPNI = buscarDosesAntirrabicaPNI;
})();

async function testarAPI(url, descricao, opcoes = {}) {
  try {
    console.log(`[${descricao}] Iniciando requisicao para: ${url}`);
    const resposta = await fetch(url, opcoes);
    console.log(`[${descricao}] Status HTTP: ${resposta.status} ${resposta.statusText}`);
    const dados = await resposta.json();
    console.log(`[${descricao}] Retorno completo:`, dados);
    return dados;
  } catch (erro) {
    console.error(`[${descricao}] ERRO na chamada:`, erro);
    return null;
  }
}

async function testarDogCeo() {
  const dados = await testarAPI("https://dog.ceo/api/breeds/image/random/6", "Dog CEO");

  if (!dados || !Array.isArray(dados.message)) {
    return;
  }

  console.log("[Dog CEO] Status da resposta:", dados.status);
  console.log("[Dog CEO] Total de imagens:", dados.message.length);
  dados.message.forEach((urlImagem, indice) => {
    console.log(`[Dog CEO] Imagem #${indice + 1}:`, urlImagem);
  });
}

// Teste rapido da pagina 0 do PNI: registra quantos itens vieram e mostra os 5 primeiros.
async function testarAntirrabicaPNI() {
  const urlOriginal = "https://apidadosabertos.saude.gov.br/vacinacao/doses-aplicadas-pni-2023?limit=1000&offset=0";
  // Mesmo proxy CORS (cors.eu.org) usado no fluxo principal - sem ele o navegador bloqueia a chamada.
  const url = `https://cors.eu.org/${urlOriginal}`;
  const dados = await testarAPI(url, "PNI");
  if (!dados) return;

  let lista = [];
  if (Array.isArray(dados)) {
    lista = dados;
  } else if (dados && typeof dados === "object") {
    for (const valor of Object.values(dados)) {
      if (Array.isArray(valor)) { lista = valor; break; }
    }
  }

  console.log("[PNI] Total de registros na pagina 0:", lista.length);
  lista.slice(0, 5).forEach((registro, indice) => {
    console.log(`[PNI] Registro #${indice + 1}:`, {
      data: registro.data_vacina,
      vacina: registro.descricao_vacina,
      dose: registro.codigo_dose_vacina,
      uf: registro.uf_estabelecimento,
      municipio: registro.municipio_estabelecimento,
      idade: registro.idade_paciente
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("==== Testes automaticos das APIs iniciando ====");
  testarDogCeo();
  testarAntirrabicaPNI();
});

function capturarGPS() {
  const area = document.getElementById("resultado-gps");
  if (!area) return;

  if (!navigator.geolocation) {
    area.innerHTML = "<p class=\"gps-erro\">GPS nao suportado neste dispositivo.</p>";
    return;
  }

  area.innerHTML = "<p>Capturando posicao...</p>";

  navigator.geolocation.getCurrentPosition(
    function (posicao) {
      const lat = posicao.coords.latitude;
      const lng = posicao.coords.longitude;
      const precisao = Math.round(posicao.coords.accuracy);

      if (lat === 0 && lng === 0) {
        area.innerHTML = "<p class=\"gps-erro\">A localizacao voltou 0,0. No DevTools abra Sensors > Location e escolha \"No override\" (usa sua posicao real) ou um local valido.</p>";
        return;
      }

      mostrarPosicao(lat, lng, precisao);
    },
    function (erro) {
      let msg = "Erro ao capturar GPS";
      if (erro.code === 1) msg = "Permissao negada pelo usuario.";
      if (erro.code === 2) msg = "Posicao indisponivel.";
      if (erro.code === 3) msg = "Tempo esgotado.";
      area.innerHTML = "<p class=\"gps-erro\">" + msg + "</p>";
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// Descobre cidade e bairro a partir da latitude/longitude usando o Nominatim
// (OpenStreetMap, gratuito e sem cadastro), mostra na tela e salva no localStorage.
async function mostrarPosicao(lat, lng, precisao) {
  const area = document.getElementById("resultado-gps");
  const latTxt = lat.toFixed(6);
  const lngTxt = lng.toFixed(6);

  let local = "Buscando endereco...";
  area.innerHTML = montarHtmlGps(local, latTxt, lngTxt, precisao);

  try {
    const url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=" + lat + "&lon=" + lng;
    const resposta = await fetch(url, { headers: { Accept: "application/json" } });
    const dados = await resposta.json();
    const e = dados.address || {};
    const bairro = e.suburb || e.neighbourhood || e.city_district || e.quarter || e.village || "Bairro nao identificado";
    const cidade = e.city || e.town || e.municipality || e.state_district || e.state || "Cidade nao identificada";
    local = bairro + ", " + cidade;
  } catch (erro) {
    console.error("[GPS] Erro ao buscar endereco:", erro);
    local = "Nao foi possivel obter o endereco.";
  }

  const salvo = { lat: latTxt, lng: lngTxt, precisao: precisao, local: local, timestamp: Date.now() };
  localStorage.setItem("ultima_posicao", JSON.stringify(salvo));

  area.innerHTML = montarHtmlGps(local, latTxt, lngTxt, precisao);
}

function montarHtmlGps(local, lat, lng, precisao) {
  return "<p><b>Local:</b> " + local + "</p>" +
    "<p><b>Latitude:</b> " + lat + "</p>" +
    "<p><b>Longitude:</b> " + lng + "</p>" +
    "<p><b>Precisao:</b> " + precisao + " metros</p>" +
    "<small>Capturado as " + formatarHora(Date.now()) + "</small>";
}

function mostrarUltimaPosicao() {
  const area = document.getElementById("resultado-gps");
  const salvo = localStorage.getItem("ultima_posicao");
  if (!area || !salvo) return;

  const local = JSON.parse(salvo);
  area.innerHTML =
    "<p><b>Ultima posicao salva:</b></p>" +
    "<p><b>Local:</b> " + (local.local || "-") + "</p>" +
    "<p>Lat: " + local.lat + " | Lng: " + local.lng + "</p>" +
    "<p><b>Precisao:</b> " + (local.precisao != null ? local.precisao + " metros" : "-") + "</p>" +
    "<small>Capturado as " + formatarHora(local.timestamp) + "</small>";
}



